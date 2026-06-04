import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { Persona } from '@prisma/client';
import { observable } from '@trpc/server/observable';
import { EventEmitter } from 'events';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { ChatService } from '@/server/services/chat.service';

const chatService = new ChatService();
const ee = new EventEmitter();

export const chatRouter = createTRPCRouter({
  createConversation: protectedProcedure
    .input(z.object({ persona: z.nativeEnum(Persona) }))
    .mutation(async ({ ctx, input }) => {
      return chatService.createConversation(ctx.dbUser.id, input.persona);
    }),

  sendMessage: protectedProcedure
    .input(z.object({
      conversationId: z.string().cuid(),
      message: z.string().trim().min(1).max(5000),
      persona: z.nativeEnum(Persona).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.rateLimit(`chat:${ctx.dbUser.id}`, 10, 60_000).success) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Please slow down. Maximum 10 messages per minute.',
        });
      }

      const conversation = await ctx.prisma.conversation.findFirst({
        where: { id: input.conversationId, userId: ctx.dbUser.id, status: 'ACTIVE' },
      });

      if (!conversation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' });
      }

      const response = await chatService.processMessage({
        userId: ctx.dbUser.id,
        conversationId: input.conversationId,
        message: input.message,
        persona: input.persona ?? conversation.persona,
      });

      ee.emit(`conversation:${input.conversationId}`, response);
      return response;
    }),

  streamMessages: protectedProcedure
    .input(z.object({ conversationId: z.string().cuid() }))
    .subscription(async ({ ctx, input }) => {
      const conversation = await ctx.prisma.conversation.findFirst({
        where: { id: input.conversationId, userId: ctx.dbUser.id, status: 'ACTIVE' },
        select: { id: true },
      });

      if (!conversation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' });
      }

      return observable((emit) => {
        const handler = (data: unknown) => emit.next(data);
        ee.on(`conversation:${input.conversationId}`, handler);
        return () => ee.off(`conversation:${input.conversationId}`, handler);
      });
    }),

  getConversation: protectedProcedure
    .input(z.object({ conversationId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      return chatService.getConversationHistory(ctx.dbUser.id, input.conversationId);
    }),

  getConversations: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      cursor: z.string().cuid().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const conversations = await ctx.prisma.conversation.findMany({
        where: { userId: ctx.dbUser.id, status: 'ACTIVE' },
        include: {
          messages: { take: 1, orderBy: { createdAt: 'desc' } },
          metrics: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
      });

      let nextCursor: string | undefined;
      if (conversations.length > input.limit) {
        nextCursor = conversations.pop()!.id;
      }

      return { conversations, nextCursor };
    }),

  exportConversation: protectedProcedure
    .input(z.object({
      conversationId: z.string().cuid(),
      format: z.enum(['PDF', 'TXT', 'JSON']),
    }))
    .mutation(async ({ ctx, input }) => {
      const url = await chatService.exportConversation(ctx.dbUser.id, input.conversationId, input.format);
      return { url };
    }),

  deleteConversation: protectedProcedure
    .input(z.object({ conversationId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.prisma.conversation.updateMany({
        where: { id: input.conversationId, userId: ctx.dbUser.id, status: 'ACTIVE' },
        data: { status: 'ARCHIVED' },
      });

      if (result.count === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' });
      }

      return { success: true };
    }),

  checkDrugInteractions: protectedProcedure
    .input(z.object({ drugs: z.array(z.string().trim().min(1).max(100)).min(2).max(10) }))
    .query(async ({ ctx, input }) => {
      const { PerplexityService } = await import('@/server/services/perplexity.service');
      const perplexityService = new PerplexityService();
      const result = await perplexityService.checkDrugInteractions(input.drugs, ctx.dbUser.id);

      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.dbUser.id,
          action: 'drug_interaction_check',
          entityType: 'drug_interaction',
          entityId: 'redacted-drug-list',
          metadata: { drugCount: input.drugs.length, timestamp: new Date().toISOString() },
        },
      });

      return result;
    }),

  getSymptomInfo: protectedProcedure
    .input(z.object({
      symptom: z.string().trim().min(1).max(200),
      context: z.object({
        age: z.number().min(0).max(130).optional(),
        gender: z.string().max(50).optional(),
        medications: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
      }).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { PerplexityService } = await import('@/server/services/perplexity.service');
      const perplexityService = new PerplexityService();
      return perplexityService.getSymptomInfo(input.symptom, input.context, ctx.dbUser.id);
    }),

  rateConversation: protectedProcedure
    .input(z.object({
      conversationId: z.string().cuid(),
      rating: z.number().int().min(1).max(5),
      feedback: z.string().trim().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const conversation = await ctx.prisma.conversation.findFirst({
        where: { id: input.conversationId, userId: ctx.dbUser.id, status: 'ACTIVE' },
        select: { id: true },
      });

      if (!conversation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' });
      }

      await ctx.prisma.conversationMetrics.upsert({
        where: { conversationId: input.conversationId },
        create: {
          conversationId: input.conversationId,
          userSatisfaction: input.rating,
        },
        update: {
          userSatisfaction: input.rating,
        },
      });

      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.dbUser.id,
          action: 'conversation_rated',
          entityType: 'conversation',
          entityId: input.conversationId,
          metadata: { rating: input.rating, hasFeedback: Boolean(input.feedback) },
        },
      });

      return { success: true };
    }),
});
