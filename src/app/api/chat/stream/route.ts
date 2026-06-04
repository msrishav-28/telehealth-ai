import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { MessageRole } from '@prisma/client';
import { generateStreamingText, isGeminiAvailable } from '@/lib/api/gemini';
import { prisma } from '@/lib/db/prisma';
import { ensureDatabaseUser } from '@/lib/auth/current-user';
import { getPersonaConfig } from '@/lib/personas/base';
import { PIIFilter } from '@/lib/safety/pii-filter';
import { ContentModerator } from '@/lib/safety/content-moderator';
import { checkInMemoryRateLimit } from '@/lib/server/rate-limit';
import { PerplexityService } from '@/server/services/perplexity.service';
import { ChatService } from '@/server/services/chat.service';

const streamRequestSchema = z.object({
  message: z.string().trim().min(1).max(5000),
  persona: z.enum(['PSYCHIATRIST', 'ALLERGIST', 'GERIATRICIAN', 'DERMATOLOGIST', 'PSYCHOLOGIST']),
  conversationId: z.string().cuid(),
});

const encoder = new TextEncoder();

function sse(payload: unknown) {
  return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
}

export async function POST(req: NextRequest) {
  const auth = getAuth(req);
  if (!auth.userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (!isGeminiAvailable()) {
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 });
  }

  const parseResult = streamRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parseResult.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const dbUser = await ensureDatabaseUser(auth.userId);
  const { message, persona, conversationId } = parseResult.data;

  if (!checkInMemoryRateLimit(`chat-stream:${dbUser.id}`, 10, 60_000).success) {
    return NextResponse.json({ error: 'Please slow down. Maximum 10 messages per minute.' }, { status: 429 });
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId: dbUser.id, status: 'ACTIVE' },
    include: { messages: { orderBy: { createdAt: 'desc' }, take: 10 } },
  });

  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const chatService = new ChatService();
      const piiFilter = new PIIFilter();
      const contentModerator = new ContentModerator();
      const startedAt = Date.now();

      try {
        const redFlag = chatService.checkRedFlags(message);
        if (redFlag) {
          const emergency = await chatService.processMessage({
            userId: dbUser.id,
            conversationId,
            message,
            persona,
          });
          controller.enqueue(sse({ type: 'content', content: emergency.content }));
          controller.enqueue(sse({ type: 'done', messageId: emergency.id }));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
          return;
        }

        const filteredMessage = await piiFilter.filter(message);
        const moderationResult = await contentModerator.moderate(filteredMessage);
        if (moderationResult.blocked) {
          controller.enqueue(sse({ type: 'error', error: 'Message contains content that cannot be processed safely.' }));
          controller.close();
          return;
        }

        await chatService.saveUserMessage(
          conversationId,
          filteredMessage,
          moderationResult.flagged,
          moderationResult.reason,
        );

        const personaConfig = getPersonaConfig(persona);
        const perplexity = new PerplexityService();
        let searchResults: Awaited<ReturnType<PerplexityService['searchMedical']>> = {
          content: 'No external citations were available for this response. The assistant should acknowledge this limitation.',
          citations: [],
        };

        try {
          searchResults = await perplexity.searchMedical(
            `${filteredMessage} (context: ${personaConfig.title})`,
            {},
            dbUser.id,
          );
        } catch {
          // Streaming should remain available when citation search is degraded.
        }

        const history = [...conversation.messages]
          .reverse()
          .slice(0, 5)
          .map((item) => `${item.role === MessageRole.USER ? 'User' : 'Assistant'}: ${item.content}`)
          .join('\n\n');

        const prompt = `${personaConfig.systemPrompt}\n\nCITATIONS AND SOURCES:\n${searchResults.content}\n\nConversation History:\n${history}\n\nUser: ${filteredMessage}\n\nRespond with educational, safety-aware guidance. If citations are unavailable, say so clearly.`;
        let responseContent = '';

        controller.enqueue(sse({ type: 'citations', citations: searchResults.citations }));

        await generateStreamingText(prompt, async (chunk) => {
          responseContent += chunk;
          controller.enqueue(sse({ type: 'content', content: chunk }));
        });

        const assistantMessage = await chatService.persistAssistantMessage({
          userId: dbUser.id,
          conversationId,
          content: responseContent,
          citations: searchResults.citations,
          processingTime: Date.now() - startedAt,
        });

        controller.enqueue(sse({ type: 'done', messageId: assistantMessage.id }));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch {
        controller.enqueue(sse({ type: 'error', error: 'Failed to generate response. Please try again.' }));
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Connection: 'keep-alive',
    },
  });
}
