import { MessageRole, Persona } from '@prisma/client';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { TRPCError } from '@trpc/server';
import { prisma } from '@/lib/db/prisma';
import { getPersonaConfig } from '@/lib/personas/base';
import { PerplexityService } from './perplexity.service';
import { ChatMessage, RedFlag } from '@/types/chat.types';
import { PIIFilter } from '@/lib/safety/pii-filter';
import { ContentModerator } from '@/lib/safety/content-moderator';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

const emergencyKeywords = [
  'chest pain',
  'difficulty breathing',
  'shortness of breath',
  'suicide',
  'kill myself',
  'stroke',
  'seizure',
  'unconscious',
  'anaphylaxis',
];

export class ChatService {
  private perplexity: PerplexityService;
  private piiFilter: PIIFilter;
  private contentModerator: ContentModerator;
  private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;

  constructor() {
    this.perplexity = new PerplexityService();
    this.piiFilter = new PIIFilter();
    this.contentModerator = new ContentModerator();
    this.model = genAI.getGenerativeModel({
      model: 'gemini-pro',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1000,
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
    });
  }

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
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId, status: 'ACTIVE' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!conversation) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' });
    }

    const redFlag = this.checkRedFlags(message);
    if (redFlag) {
      await this.saveUserMessage(conversationId, message, true, `Red flag detected: ${redFlag.severity}`);
      await this.logConversation(userId, conversationId, 'red_flag_detected', { severity: redFlag.severity });
      return this.createEmergencyResponse(conversationId, redFlag);
    }

    const filteredMessage = await this.piiFilter.filter(message);
    const moderationResult = await this.contentModerator.moderate(filteredMessage);

    if (moderationResult.blocked) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Message contains content that cannot be processed safely.',
      });
    }

    await this.saveUserMessage(
      conversationId,
      filteredMessage,
      moderationResult.flagged,
      moderationResult.reason,
    );

    const searchQuery = this.constructSearchQuery(filteredMessage, persona);
    const searchResults = await this.getSearchResults(searchQuery, userId);
    const systemPrompt = this.constructSystemPrompt(persona, searchResults);
    const conversationHistory = this.constructConversationHistory(conversation.messages, filteredMessage);
    const startTime = Date.now();

    try {
      const fullPrompt = `${systemPrompt}\n\nConversation History:\n${conversationHistory}\n\nPlease provide a helpful, empathetic response following the guidelines above.`;
      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const responseContent = response.text();
      const processingTime = Date.now() - startTime;

      const aiMessage = await prisma.message.create({
        data: {
          conversationId,
          role: MessageRole.ASSISTANT,
          content: responseContent,
          processingTime,
          citations: {
            create: searchResults.citations.map((citation) => ({
              title: citation.title,
              url: citation.url,
              snippet: citation.snippet,
              relevanceScore: citation.relevanceScore,
              source: citation.source,
            })),
          },
        },
        include: { citations: true },
      });

      await this.updateConversationMetrics(conversationId, responseContent.length);
      await this.logConversation(userId, conversationId, 'message_sent');

      return {
        id: aiMessage.id,
        role: aiMessage.role,
        content: aiMessage.content,
        citations: aiMessage.citations,
        timestamp: aiMessage.createdAt,
      };
    } catch (error: any) {
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
  }

  async getConversationHistory(userId: string, conversationId: string) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId, status: 'ACTIVE' },
      include: {
        messages: {
          include: { citations: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' });
    }

    return conversation;
  }

  async createConversation(userId: string, persona: Persona) {
    const personaConfig = getPersonaConfig(persona);

    return prisma.conversation.create({
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
        metrics: {
          create: {
            messageCount: 1,
            totalTokens: personaConfig.greeting.length,
          },
        },
      },
      include: { messages: true, metrics: true },
    });
  }

  async exportConversation(userId: string, conversationId: string, _format: 'PDF' | 'TXT' | 'JSON') {
    await this.getConversationHistory(userId, conversationId);

    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'Conversation export is not implemented yet.',
    });
  }

  async persistAssistantMessage({
    userId,
    conversationId,
    content,
    citations,
    processingTime,
  }: {
    userId: string;
    conversationId: string;
    content: string;
    citations: Array<{ title: string; url: string; snippet: string; relevanceScore?: number; source?: string }>;
    processingTime?: number;
  }) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId, status: 'ACTIVE' },
      select: { id: true },
    });

    if (!conversation) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' });
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        role: MessageRole.ASSISTANT,
        content,
        processingTime,
        citations: {
          create: citations.map((citation) => ({
            title: citation.title,
            url: citation.url,
            snippet: citation.snippet,
            relevanceScore: citation.relevanceScore ?? 0.8,
            source: citation.source ?? 'Medical Source',
          })),
        },
      },
      include: { citations: true },
    });

    await this.updateConversationMetrics(conversationId, content.length);
    await this.logConversation(userId, conversationId, 'stream_message_sent');

    return message;
  }

  async saveUserMessage(
    conversationId: string,
    content: string,
    flagged = false,
    flagReason?: string,
  ) {
    return prisma.message.create({
      data: {
        conversationId,
        role: MessageRole.USER,
        content,
        flagged,
        flagReason,
      },
    });
  }

  checkRedFlags(message: string): RedFlag | null {
    const lowerMessage = message.toLowerCase();

    for (const keyword of emergencyKeywords) {
      if (lowerMessage.includes(keyword)) {
        return {
          id: 'emergency',
          patterns: [keyword],
          severity: 'emergency',
          message: 'This may be an emergency. Please contact emergency services or seek urgent in-person medical care now.',
          action: 'alert',
          phoneNumbers: ['911 (US)', '999 (UK)', '112 (EU)'],
        };
      }
    }

    return null;
  }

  private async createEmergencyResponse(conversationId: string, redFlag: RedFlag): Promise<ChatMessage> {
    const emergencyContent = `⚠️ **IMPORTANT SAFETY ALERT** ⚠️\n\n${redFlag.message}\n\n**Emergency Contacts:**\n${redFlag.phoneNumbers?.map((num) => `• ${num}`).join('\n') ?? '• Call your local emergency number'}\n\nThis AI cannot provide emergency medical care. Please get help from real medical professionals immediately.`;

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

  private async getSearchResults(query: string, userId: string) {
    try {
      return await this.perplexity.searchMedical(query, {}, userId);
    } catch {
      return {
        content: 'No external citations were available for this response. The assistant should clearly state this limitation.',
        citations: [],
      };
    }
  }

  private constructSearchQuery(message: string, persona: Persona): string {
    const personaConfig = getPersonaConfig(persona);
    const specialtyContext = personaConfig.specialties.join(', ');
    return `${message} (context: ${personaConfig.title} specializing in ${specialtyContext})`;
  }

  private constructSystemPrompt(persona: Persona, searchResults: { content: string }): string {
    const personaConfig = getPersonaConfig(persona);

    return `${personaConfig.systemPrompt}\n\nCITATIONS AND SOURCES:\n${searchResults.content}\n\nIMPORTANT INSTRUCTIONS:\n1. Base medical claims on the provided citations when available.\n2. If citations are unavailable or incomplete, acknowledge the limitation.\n3. Always recommend appropriate professional care and emergency escalation when needed.`;
  }

  private constructConversationHistory(messages: Array<{ role: MessageRole; content: string }>, currentMessage: string): string {
    const history = [...messages]
      .reverse()
      .slice(0, 5)
      .map((msg) => `${msg.role === MessageRole.USER ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');

    return `${history}\n\nUser: ${currentMessage}`;
  }

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

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
  }

  private async logConversation(userId: string, conversationId: string, action: string, metadata?: Record<string, unknown>) {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType: 'conversation',
        entityId: conversationId,
        metadata: {
          timestamp: new Date().toISOString(),
          ...metadata,
        },
      },
    });
  }
}
