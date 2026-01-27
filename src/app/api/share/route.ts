import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

const createShareSchema = z.object({
  bucketId: z.string(),
  path: z.string(),
  expiresAt: z.string().datetime().optional().nullable(),
  password: z.string().optional().nullable(),
});

// GET user's shared links
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bucketId = searchParams.get('bucketId');

    const where: Record<string, unknown> = { userId: user.id };
    if (bucketId) where.bucketId = bucketId;

    const links = await prisma.sharedLink.findMany({
      where,
      include: {
        bucket: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, links });
  } catch (error) {
    console.error('Get shared links error:', error);
    return NextResponse.json({ error: 'Failed to get shared links' }, { status: 500 });
  }
}

// POST create shared link
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createShareSchema.parse(body);

    // Check if user has share permission
    if (!user.isRoot) {
      const access = await prisma.bucketAccess.findUnique({
        where: {
          userId_bucketId: {
            userId: user.id,
            bucketId: data.bucketId,
          },
        },
      });

      if (!access || !access.canShare) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Generate unique token
    const token = crypto.randomUUID();

    const link = await prisma.sharedLink.create({
      data: {
        userId: user.id,
        bucketId: data.bucketId,
        path: data.path,
        token,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        password: data.password || null,
      },
    });

    const shareUrl = `${process.env.APP_URL || 'http://localhost:3000'}/share/${token}`;

    return NextResponse.json({
      success: true,
      link: {
        ...link,
        url: shareUrl,
      },
    });
  } catch (error) {
    console.error('Create shared link error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create shared link' }, { status: 500 });
  }
}

// DELETE shared link
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get('id');

    if (!linkId) {
      return NextResponse.json({ error: 'Link ID required' }, { status: 400 });
    }

    // Check ownership
    const link = await prisma.sharedLink.findUnique({
      where: { id: linkId },
    });

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    if (link.userId !== user.id && !user.isRoot) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await prisma.sharedLink.delete({
      where: { id: linkId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete shared link error:', error);
    return NextResponse.json({ error: 'Failed to delete shared link' }, { status: 500 });
  }
}
