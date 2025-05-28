import { Persona, MessageRole } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { PerplexityService } from './perplexity.service';
import { getPersonaConfig, RED_FLAG_KEYWORDS } from '@/lib/personas/base';
import { ChatMessage, RedFlag } from '@/types/chat.types';
import { PIIFilter } from '@/lib/safety/pii-filter';
import { ContentModerator } from '@/lib/safety/content-moderator';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export class ChatService {
  private perplexity: PerplexityService;
  private piiFilter: PIIFilter;
  private contentModerator: ContentModerator;
  private model: any;

  constructor() {
    this.perplexity = new PerplexityService();
    this.piiFilter = new PIIFilter();
    this.contentModerator = new ContentModerator();
    
    // Initialize Gemini Pro model (free tier)
    this.model = genAI.getGenerativeModel({ 
      model: 'gemini-pro',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1000,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
      ],
    });
  }
  }

  /**
   * Process a chat message
   */
  async processMessage({
    userId,
    conversationId,
    message,
    persona,
  }: {
    userId: string;
    conversationId: string;
    message: string;
    persona: Persona;
  }): Promise<ChatMessage> {
    try {
      // 1. Safety checks
      const redFlag = this.checkRedFlags(message);
      if (redFlag) {
        return this.createEmergencyResponse(conversationId, redFlag);
      }

      // 2. Filter PII
      const filteredMessage = await this.piiFilter.filter(message);

      // 3. Content moderation
      const moderationResult = await this.contentModerator.moderate(filteredMessage);
      if (moderationResult.blocked) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Message contains inappropriate content',
        });
      }

      // 4. Get conversation context
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!conversation || conversation.userId !== userId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Conversation not found',
        });
      }

      // 5. Save user message
      const userMessage = await prisma.message.create({
        data: {
          conversationId,
          role: MessageRole.USER,
          content: filteredMessage,
          flagged: moderationResult.flagged,
          flagReason: moderationResult.reason,
        },
      });

      // 6. Search for medical information
      const searchQuery = this.constructSearchQuery(filteredMessage, persona);
      const searchResults = await this.perplexity.searchMedical(searchQuery);

      // 7. Construct AI prompt
      const systemPrompt = this.constructSystemPrompt(persona, searchResults);
      const conversationHistory = this.constructConversationHistory(conversation.messages, filteredMessage);

      // 8. Get AI response using Gemini
      const startTime = Date.now();
      
      try {
        // Combine system prompt and conversation into a single prompt for Gemini
        const fullPrompt = `${systemPrompt}\n\nConversation History:\n${conversationHistory}\n\nPlease provide a helpful, empathetic response following the guidelines above.`;
        
        const result = await this.model.generateContent(fullPrompt);
        const response = await result.response;
        const responseContent = response.text();
        const processingTime = Date.now() - startTime;

        // 9. Save AI response with citations
        const aiMessage = await prisma.message.create({
          data: {
            conversationId,
            role: MessageRole.ASSISTANT,
            content: responseContent,
            processingTime,
            citations: {
              create: searchResults.citations.map(citation => ({
                title: citation.title,
                url: citation.url,
                snippet: citation.snippet,
                relevanceScore: citation.relevanceScore,
                source: citation.source,
              })),
            },
          },
          include: {
            citations: true,
          },
        });

        // 10. Update conversation metrics
        await this.updateConversationMetrics(conversationId, responseContent.length);

        // 11. Log for audit
        await this.logConversation(userId, conversationId, 'message_sent');

        return {
          id: aiMessage.id,
          role: aiMessage.role,
          content: aiMessage.content,
          citations: aiMessage.citations,
          timestamp: aiMessage.createdAt,
        };
      } catch (error: any) {
        // Handle Gemini-specific errors
        if (error.message?.includes('SAFETY')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Your message was blocked by safety filters. Please rephrase your question.',
          });
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate response. Please try again.',
        });
      }

    } catch (error) {
      console.error('Chat processing error:', error);
      
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to process message',
      });
    }
  }

  /**
   * Check for red flag keywords
   */
  private checkRedFlags(message: string): RedFlag | null {
    const lowerMessage = message.toLowerCase();
    
    // Emergency keywords
    const emergencyKeywords = [
      'suicide', 'kill myself', 'end my life',
      'chest pain', 'heart attack', 'stroke',
      'can\'t breathe', 'severe bleeding',
    ];
    
    for (const keyword of emergencyKeywords) {
      if (lowerMessage.includes(keyword)) {
        return {
          id: 'emergency',
          patterns: [keyword],
          severity: 'emergency',
          message: 'This seems like an emergency situation. Please call emergency services immediately.',
          action: 'alert',
          phoneNumbers: ['911 (US)', '999 (UK)', '112 (EU)'],
        };
      }
    }
    
    // High urgency keywords
    const urgentKeywords = [
      'severe pain', 'unconscious', 'seizure',
      'allergic reaction', 'anaphylaxis',
    ];
    
    for (const keyword of urgentKeywords) {
      if (lowerMessage.includes(keyword)) {
        return {
          id: 'urgent',
          patterns: [keyword],
          severity: 'urgent',
          message: 'This sounds like an urgent medical situation. Please seek immediate medical care.',
          action: 'alert',
        };
      }
    }
    
    return null;
  }

  /**
   * Create emergency response
   */
  private async createEmergencyResponse(
    conversationId: string,
    redFlag: RedFlag
  ): Promise<ChatMessage> {
    const emergencyContent = `
⚠️ **IMPORTANT SAFETY ALERT** ⚠️

${redFlag.message}

**Emergency Contacts:**
${redFlag.phoneNumbers?.map(num => `• ${num}`).join('\n') || '• Call your local emergency number'}

**What to do right now:**
1. If you're in immediate danger, call emergency services
2. If possible, have someone stay with you
3. Go to the nearest emergency room if you can't call

**Remember:** This AI cannot provide emergency medical care. Please get help from real medical professionals immediately.
    `.trim();

    const message = await prisma.message.create({
      data: {
        conversationId,
        role: MessageRole.ASSISTANT,
        content: emergencyContent,
        flagged: true,
        flagReason: `Red flag detected: ${redFlag.severity}`,
      },
    });

    return {
      id: message.id,
      role: message.role,
      content: message.content,
      timestamp: message.createdAt,
      flagged: true,
    };
  }

  /**
   * Construct search query for Perplexity
   */
  private constructSearchQuery(message: string, persona: Persona): string {
    const personaConfig = getPersonaConfig(persona);
    const specialtyContext = personaConfig.specialties.join(', ');
    
    return `${message} (context: ${personaConfig.title} specializing in ${specialtyContext})`;
  }

  /**
   * Construct system prompt with citations
   */
  private constructSystemPrompt(persona: Persona, searchResults: any): string {
    const personaConfig = getPersonaConfig(persona);
    
    return `
${personaConfig.systemPrompt}

CITATIONS AND SOURCES:
You have access to the following medical information from reputable sources. 
Please incorporate this information into your response and reference it appropriately:

${searchResults.content}

IMPORTANT INSTRUCTIONS:
1. Base your response on the provided citations
2. Mention specific sources when making medical claims
3. If the citations don't cover something, acknowledge the limitation
4. Always maintain the safety guidelines in your persona prompt
    `.trim();
  }

  /**
   * Construct conversation history for Gemini
   */
  private constructConversationHistory(
    messages: any[],
    currentMessage: string
  ): string {
    const history = messages
      .reverse()
      .slice(0, 5) // Last 5 messages for context
      .map(msg => {
        const role = msg.role === MessageRole.USER ? 'User' : 'Assistant';
        return `${role}: ${msg.content}`;
      })
      .join('\n\n');
    
    return `${history}\n\nUser: ${currentMessage}`;
  }

  /**
   * Update conversation metrics
   */
  private async updateConversationMetrics(conversationId: string, tokens: number) {
    await prisma.conversationMetrics.upsert({
      where: { conversationId },
      create: {
        conversationId,
        messageCount: 1,
        totalTokens: tokens,
      },
      update: {
        messageCount: { increment: 1 },
        totalTokens: { increment: tokens },
      },
    });
  }

  /**
   * Log conversation for audit
   */
  private async logConversation(userId: string, conversationId: string, action: string) {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType: 'conversation',
        entityId: conversationId,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      },
    });
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(userId: string, conversationId: string) {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
      include: {
        messages: {
          include: {
            citations: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Conversation not found',
      });
    }

    return conversation;
  }

  /**
   * Create a new conversation
   */
  async createConversation(userId: string, persona: Persona) {
    const personaConfig = getPersonaConfig(persona);
    
    const conversation = await prisma.conversation.create({
      data: {
        userId,
        persona,
        title: `Chat with ${personaConfig.name}`,
        messages: {
          create: {
            role: MessageRole.ASSISTANT,
            content: personaConfig.greeting,
          },
        },
      },
      include: {
        messages: true,
      },
    });

    return conversation;
  }

  /**
   * Export conversation as PDF
   */
  async exportConversation(userId: string, conversationId: string, format: 'PDF' | 'TXT' | 'JSON') {
    const conversation = await this.getConversationHistory(userId, conversationId);
    
    // Generate export based on format
    // This would integrate with a PDF generation service
    
    const exportRecord = await prisma.export.create({
      data: {
        conversationId,
        format,
        url: 'https://example.com/export.pdf', // Replace with actual URL
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    return exportRecord.url;
  }
}