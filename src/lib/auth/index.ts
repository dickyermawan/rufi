import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import { SessionPayload } from '@/types';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-change-in-production'
);

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  const session = await prisma.session.create({
    data: {
      userId,
      token: crypto.randomUUID(),
      expiresAt,
    },
  });

  const token = await new SignJWT({
    userId,
    sessionId: session.id,
  } as SessionPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(expiresAt)
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });

  return token;
}

export async function verifySession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const sessionPayload = payload as unknown as SessionPayload;

    const session = await prisma.session.findUnique({
      where: { id: sessionPayload.sessionId },
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return sessionPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await verifySession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      username: true,
      isRoot: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}

export async function destroySession(): Promise<void> {
  const session = await verifySession();
  
  if (session) {
    await prisma.session.delete({
      where: { id: session.sessionId },
    }).catch(() => {});
  }

  const cookieStore = await cookies();
  cookieStore.delete('session');
}

export async function initRootUser(): Promise<void> {
  const rootUsername = process.env.ROOT_USERNAME || 'admin';
  const rootPassword = process.env.ROOT_PASSWORD || 'admin123';

  const existingRoot = await prisma.user.findFirst({
    where: { isRoot: true },
  });

  if (!existingRoot) {
    const hashedPassword = await hashPassword(rootPassword);
    await prisma.user.create({
      data: {
        username: rootUsername,
        password: hashedPassword,
        isRoot: true,
      },
    });
    console.log(`Root user "${rootUsername}" created.`);
  }
}
