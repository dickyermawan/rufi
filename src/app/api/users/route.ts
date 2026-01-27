import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { z } from 'zod';

const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  isRoot: z.boolean().optional(),
});

const updateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  password: z.string().min(6).optional(),
  isRoot: z.boolean().optional(),
});

// GET all users (root only)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isRoot) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        isRoot: true,
        createdAt: true,
        updatedAt: true,
        bucketAccess: {
          include: {
            bucket: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: 'Failed to get users' }, { status: 500 });
  }
}

// POST create user (root only)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isRoot) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { username, password, isRoot } = createUserSchema.parse(body);

    // Check if username exists
    const existing = await prisma.user.findUnique({
      where: { username },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        isRoot: isRoot || false,
      },
      select: {
        id: true,
        username: true,
        isRoot: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error) {
    console.error('Create user error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

// PUT update user (root only)
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isRoot) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const body = await request.json();
    const { username, password, isRoot } = updateUserSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (username) updateData.username = username;
    if (password) updateData.password = await hashPassword(password);
    if (isRoot !== undefined) updateData.isRoot = isRoot;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        isRoot: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE user (root only)
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isRoot) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Prevent deleting self
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot delete yourself' },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
