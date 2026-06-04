import { z } from 'zod';
import { Persona } from '@prisma/client';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';

function getStartDate(timeRange: string) {
  const days = timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 7;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export const analyticsRouter = createTRPCRouter({
  getUserAnalytics: protectedProcedure
    .input(z.object({ timeRange: z.string().default('7d') }))
    .query(async ({ ctx, input }) => {
      const since = getStartDate(input.timeRange);
      const conversations = await ctx.prisma.conversation.findMany({
        where: { userId: ctx.dbUser.id, createdAt: { gte: since } },
        include: { messages: true, metrics: true },
      });

      const personaCounts = conversations.reduce<Record<string, number>>((acc, conversation) => {
        acc[conversation.persona] = (acc[conversation.persona] ?? 0) + 1;
        return acc;
      }, {});
      const favoritePersona = Object.entries(personaCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as Persona | undefined;
      const messageCounts = conversations.map((conversation) => conversation.messages.length);
      const totalMessages = messageCounts.reduce((sum, count) => sum + count, 0);

      return {
        totalConversations: conversations.length,
        totalMessages,
        avgSessionDuration: 0,
        favoritePersona,
        personaDistribution: Object.entries(personaCounts).map(([persona, count]) => ({ persona, count })),
        hourlyDistribution: Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 })),
        weeklyDistribution: Array.from({ length: 7 }, (_, day) => ({ day, count: 0 })),
      };
    }),

  getConversationStats: protectedProcedure
    .input(z.object({ timeRange: z.string().default('7d') }))
    .query(async ({ ctx, input }) => {
      const since = getStartDate(input.timeRange);
      const conversations = await ctx.prisma.conversation.findMany({
        where: { userId: ctx.dbUser.id, createdAt: { gte: since } },
        include: { messages: true, metrics: true },
        orderBy: { createdAt: 'asc' },
      });

      return conversations.map((conversation) => ({
        id: conversation.id,
        title: conversation.title,
        persona: conversation.persona,
        messageCount: conversation.messages.length,
        userSatisfaction: conversation.metrics?.userSatisfaction ?? null,
        createdAt: conversation.createdAt,
      }));
    }),

  getTopicAnalytics: protectedProcedure
    .input(z.object({ timeRange: z.string().default('7d') }))
    .query(async ({ ctx }) => {
      const analytics = await ctx.prisma.userAnalytics.findUnique({
        where: { userId: ctx.dbUser.id },
        select: { topTopics: true },
      });

      if (!Array.isArray(analytics?.topTopics)) return [];
      return analytics.topTopics.map((topic, index) => ({
        topic: String(topic),
        count: 1,
        rank: index + 1,
      }));
    }),
});
