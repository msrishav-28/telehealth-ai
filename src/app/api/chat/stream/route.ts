import { NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { generateStreamingText, formatMedicalPrompt, isGeminiAvailable } from '@/lib/api/gemini';
import { PerplexityService } from '@/server/services/perplexity.service';
import { getPersonaConfig } from '@/lib/personas/base';
import { Persona } from '@prisma/client';

// Request schema
const StreamChatSchema = z.object({
  message: z.string().min(1).max(5000),
  persona: z.nativeEnum(Persona),
  conversationId: z.string(),
  includeCitations: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = getAuth(request);
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Check if Gemini is available
    if (!isGeminiAvailable()) {
      return new Response('Gemini API not configured', { status: 503 });
    }

    // Parse request body
    const body = await request.json();
    const { message, persona, conversationId, includeCitations } = StreamChatSchema.parse(body);

    // Get persona configuration
    const personaConfig = getPersonaConfig(persona);

    // Search for medical information if citations are requested
    let searchResults = { content: '', citations: [] };
    if (includeCitations) {
      const perplexityService = new PerplexityService();
      searchResults = await perplexityService.searchMedical(message);
    }

    // Format the prompt
    const prompt = formatMedicalPrompt(
      personaConfig.systemPrompt,
      message,
      searchResults.content
    );

    // Create a TransformStream for streaming
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start streaming in the background
    (async () => {
      try {
        // Send initial metadata
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'start',
              conversationId,
              persona,
            })}\n\n`
          )
        );

        // Stream the response
        await generateStreamingText(prompt, async (chunk) => {
          await writer.write(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'content',
                content: chunk,
              })}\n\n`
            )
          );
        });

        // Send citations if available
        if (searchResults.citations.length > 0) {
          await writer.write(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'citations',
                citations: searchResults.citations,
              })}\n\n`
            )
          );
        }

        // Send completion signal
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'done',
            })}\n\n`
          )
        );

        await writer.write(encoder.encode('data: [DONE]\n\n'));
      } catch (error: any) {
        // Send error
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'error',
              error: error.message || 'An error occurred',
            })}\n\n`
          )
        );
      } finally {
        await writer.close();
      }
    })();

    // Return SSE response
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Streaming chat error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}