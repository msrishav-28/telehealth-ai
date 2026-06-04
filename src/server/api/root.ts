import { createTRPCRouter } from '@/server/api/trpc';
import { chatRouter } from '@/server/api/routers/chat';
import { analyticsRouter } from '@/server/api/routers/analytics';

export const appRouter = createTRPCRouter({
  chat: chatRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;
