import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

const accessSchema = z.object({
  userId: z.string(),
  bucketId: z.string(),
  homeDir: z.string().default('/'),
  canList: z.boolean().default(true),
  canUpload: z.boolean().default(false),
  canDownload: z.boolean().default(true),
  canDelete: z.boolean().default(false),
  canRename: z.boolean().default(false),
  canCopy: z.boolean().default(false),
  canCreateFolder: z.boolean().default(false),
  canEdit: z.boolean().default(false),
  canShare: z.boolean().default(false),
});

// GET user's bucket access
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isRoot) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const access = await prisma.bucketAccess.findMany({
      where: { userId },
      include: {
        bucket: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ success: true, access });
  } catch (error) {
    console.error('Get access error:', error);
    return NextResponse.json({ error: 'Failed to get access' }, { status: 500 });
  }
}

// POST create/update bucket access
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isRoot) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const data = accessSchema.parse(body);

    const access = await prisma.bucketAccess.upsert({
      where: {
        userId_bucketId: {
          userId: data.userId,
          bucketId: data.bucketId,
        },
      },
      update: {
        homeDir: data.homeDir,
        canList: data.canList,
        canUpload: data.canUpload,
        canDownload: data.canDownload,
        canDelete: data.canDelete,
        canRename: data.canRename,
        canCopy: data.canCopy,
        canCreateFolder: data.canCreateFolder,
        canEdit: data.canEdit,
        canShare: data.canShare,
      },
      create: data,
    });

    return NextResponse.json({ success: true, access });
  } catch (error) {
    console.error('Set access error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to set access' }, { status: 500 });
  }
}

// DELETE bucket access
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isRoot) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const bucketId = searchParams.get('bucketId');

    if (!userId || !bucketId) {
      return NextResponse.json({ error: 'User ID and Bucket ID required' }, { status: 400 });
    }

    await prisma.bucketAccess.delete({
      where: {
        userId_bucketId: {
          userId,
          bucketId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete access error:', error);
    return NextResponse.json({ error: 'Failed to delete access' }, { status: 500 });
  }
}
