import { clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';

export async function ensureDatabaseUser(clerkUserId: string) {
  const existing = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
  if (existing) return existing;

  let email = `${clerkUserId}@placeholder.telehealth.local`;
  let name: string | undefined;
  let imageUrl: string | undefined;

  try {
    const clerkUser = await clerkClient.users.getUser(clerkUserId);
    email = clerkUser.emailAddresses.find((item) => item.id === clerkUser.primaryEmailAddressId)?.emailAddress ?? email;
    name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || undefined;
    imageUrl = clerkUser.imageUrl || undefined;
  } catch {
    // Clerk profile lookup can fail in tests or degraded environments. Auth still
    // succeeded, so create a placeholder profile that can be reconciled later.
  }

  return prisma.user.upsert({
    where: { clerkId: clerkUserId },
    update: { email, name, imageUrl },
    create: {
      clerkId: clerkUserId,
      email,
      name,
      imageUrl,
      settings: { create: {} },
      analytics: { create: {} },
    },
  });
}
