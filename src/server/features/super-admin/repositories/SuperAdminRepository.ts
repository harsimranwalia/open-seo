import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { session, user } from "@/db/schema";

export type SuperAdminUserRow = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  emailVerified: boolean;
};

async function listUsers(): Promise<SuperAdminUserRow[]> {
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      emailVerified: user.emailVerified,
    })
    .from(user)
    .orderBy(desc(user.createdAt));
}

async function getUserById(userId: string): Promise<SuperAdminUserRow | null> {
  const [row] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      emailVerified: user.emailVerified,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return row ?? null;
}

async function createSession(input: {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  activeOrganizationId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
}) {
  const now = new Date();
  await db.insert(session).values({
    id: input.id,
    token: input.token,
    userId: input.userId,
    expiresAt: input.expiresAt,
    createdAt: now,
    updatedAt: now,
    activeOrganizationId: input.activeOrganizationId,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });
}

async function deleteSessionByToken(token: string) {
  await db.delete(session).where(eq(session.token, token));
}

export const SuperAdminRepository = {
  listUsers,
  getUserById,
  createSession,
  deleteSessionByToken,
} as const;
