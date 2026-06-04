import { initTRPC, TRPCError } from '@trpc/server';
import { getAuth } from '@clerk/nextjs/server';
import superjson from 'superjson';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ensureDatabaseUser } from '@/lib/auth/current-user';
import { checkInMemoryRateLimit } from '@/lib/server/rate-limit';

type CreateContextOptions = { req: NextRequest };

export async function createTRPCContext({ req }: CreateContextOptions) {
  const auth = getAuth(req);
  const dbUser = auth.userId ? await ensureDatabaseUser(auth.userId) : null;

  return {
    req,
    auth,
    dbUser,
    prisma,
    rateLimit: checkInMemoryRateLimit,
  };
}

const t = initTRPC.context<Awaited<ReturnType<typeof createTRPCContext>>>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.auth.userId || !ctx.dbUser) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
  }

  return next({
    ctx: {
      ...ctx,
      auth: { ...ctx.auth, userId: ctx.auth.userId },
      dbUser: ctx.dbUser,
    },
  });
});
