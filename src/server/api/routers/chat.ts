import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { Persona } from '@prisma/client';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { ChatService } from '@/server/services/chat.service';
import { observable } from '@trpc/server/observable';
import { EventEmitter } from 'events';

const chatService = new ChatService();
const ee = new EventEmitter();

export const chatRouter = createTRPCRouter({
  /**
   * Create a new conversation
   */
  createConversation: protectedProcedure
    .input(z.object({
      persona: z.nativeEnum(Persona),
    }))
    .mutation(async ({ ctx, input }) => {
      const conversation = await chatService.createConversation(
        ctx.auth.userId,
        input.persona
      );
      
      return conversation;
    }),

  /**
   * Send a message in a conversation
   */
  sendMessage: protectedProcedure
    .input(z.object({
      conversationId: z.string(),
      message: z.string().min(1).max(5000),
      persona: z.nativeEnum(Persona).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Rate limiting check
      const rateLimitKey = `chat:${ctx.auth.userId}`;
      const requests = await ctx.redis.incr(rateLimitKey);
      
      if (requests === 1) {
        await ctx.redis.expire(rateLimitKey, 60); // 1 minute window
      }
      
      if (requests > 10) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Please slow down. Maximum 10 messages per minute.',
        });
      }

      // Get conversation to determine persona
      const conversation = await ctx.prisma.conversation.findFirst({
        where: {
          id: input.conversationId,
          userId: ctx.auth.userId,
        },
      });

      if (!conversation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Conversation not found',
        });
      }

      const response = await chatService.processMessage({
        userId: ctx.auth.userId,
        conversationId: input.conversationId,
        message: input.message,
        persona: input.persona || conversation.persona,
      });

      // Emit event for real-time updates
      ee.emit(`conversation:${input.conversationId}`, response);

      return response;
    }),

  /**
   * Stream messages (SSE)
   */
  streamMessages: protectedProcedure
    .input(z.object({
      conversationId: z.string(),
    }))
    .subscription(({ ctx, input }) => {
      return observable((emit) => {
        const handler = (data: any) => {
          emit.next(data);
        };

        ee.on(`conversation:${input.conversationId}`, handler);

        return () => {
          ee.off(`conversation:${input.conversationId}`, handler);
        };
      });
    }),

  /**
   * Get conversation history
   */
  getConversation: protectedProcedure
    .input(z.object({
      conversationId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      return await chatService.getConversationHistory(
        ctx.auth.userId,
        input.conversationId
      );
    }),

  /**
   * Get all conversations for user
   */
  getConversations: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const conversations = await ctx.prisma.conversation.findMany({
        where: {
          userId: ctx.auth.userId,
          status: 'ACTIVE',
        },
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
          metrics: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
      });

      let nextCursor: string | undefined = undefined;
      if (conversations.length > input.limit) {
        const nextItem = conversations.pop();
        nextCursor = nextItem!.id;
      }

      return {
        conversations,
        nextCursor,
      };
    }),

  /**
   * Export conversation
   */
  exportConversation: protectedProcedure
    .input(z.object({
      conversationId: z.string(),
      format: z.enum(['PDF', 'TXT', 'JSON']),
    }))
    .mutation(async ({ ctx, input }) => {
      const url = await chatService.exportConversation(
        ctx.auth.userId,
        input.conversationId,
        input.format
      );
      
      return { url };
    }),

  /**
   * Delete conversation
   */
  deleteConversation: protectedProcedure
    .input(z.object({
      conversationId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const conversation = await ctx.prisma.conversation.findFirst({
        where: {
          id: input.conversationId,
          userId: ctx.auth.userId,
        },
      });

      if (!conversation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Conversation not found',
        });
      }

      await ctx.prisma.conversation.update({
        where: { id: input.conversationId },
        data: { status: 'ARCHIVED' },
      });

      return { success: true };
    }),

  /**
   * Check drug interactions
   */
  checkDrugInteractions: protectedProcedure
    .input(z.object({
      drugs: z.array(z.string()).min(2).max(10),
    }))
    .query(async ({ ctx, input }) => {
      const perplexityService = new (await import('@/server/services/perplexity.service')).PerplexityService();
      
      const result = await perplexityService.checkDrugInteractions(input.drugs);
      
      // Log the interaction check
      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.auth.userId,
          action: 'drug_interaction_check',
          entityType: 'drug_interaction',
          entityId: input.drugs.join(','),
          metadata: {
            drugs: input.drugs,
            timestamp: new Date().toISOString(),
          },
        },
      });

      return result;
    }),

  /**
   * Get symptom information
   */
  getSymptomInfo: protectedProcedure
    .input(z.object({
      symptom: z.string().min(1).max(200),
      context: z.object({
        age: z.number().optional(),
        gender: z.string().optional(),
        medications: z.array(z.string()).optional(),
      }).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const perplexityService = new (await import('@/server/services/perplexity.service')).PerplexityService();
      
      const result = await perplexityService.getSymptomInfo(
        input.symptom,
        input.context
      );
      
      return result;
    }),

  /**
   * Rate conversation
   */
  rateConversation: protectedProcedure
    .input(z.object({
      conversationId: z.string(),
      rating: z.number().min(1).max(5),
      feedback: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const conversation = await ctx.prisma.conversation.findFirst({
        where: {
          id: input.conversationId,
          userId: ctx.auth.userId,
        },
      });

      if (!conversation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Conversation not found',
        });
      }

      await ctx.prisma.conversationMetrics.update({
        where: { conversationId: input.conversationId },
        data: { userSatisfaction: input.rating },
      });

      // Log feedback if provided
      if (input.feedback) {
        await ctx.prisma.auditLog.create({
          data: {
            userId: ctx.auth.userId,
            action: 'conversation_feedback',
            entityType: 'conversation',
            entityId: input.conversationId,
            metadata: {
              rating: input.rating,
              feedback: input.feedback,
            },
          },
        });
      }

      return { success: true };
    }),
});