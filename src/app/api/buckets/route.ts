import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { encrypt } from '@/lib/auth/crypto';
// S3 client imported when needed
import { z } from 'zod';

const bucketSchema = z.object({
  name: z.string().min(1).max(100),
  endpoint: z.string().url(),
  accessKey: z.string().min(1),
  secretKey: z.string().min(1),
  region: z.string().default('auto'),
  isDefault: z.boolean().default(false),
});

// GET all buckets (root only)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isRoot) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const buckets = await prisma.bucket.findMany({
      select: {
        id: true,
        name: true,
        endpoint: true,
        region: true,
        isDefault: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, buckets });
  } catch (error) {
    console.error('Get buckets error:', error);
    return NextResponse.json({ error: 'Failed to get buckets' }, { status: 500 });
  }
}

// POST create bucket (root only)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isRoot) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const data = bucketSchema.parse(body);

    // Check if name exists
    const existing = await prisma.bucket.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Bucket name already exists' },
        { status: 400 }
      );
    }

    // If this is set as default, unset other defaults
    if (data.isDefault) {
      await prisma.bucket.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const bucket = await prisma.bucket.create({
      data: {
        name: data.name,
        endpoint: data.endpoint,
        accessKey: data.accessKey,
        secretKey: encrypt(data.secretKey),
        region: data.region,
        isDefault: data.isDefault,
      },
      select: {
        id: true,
        name: true,
        endpoint: true,
        region: true,
        isDefault: true,
      },
    });

    return NextResponse.json({ success: true, bucket });
  } catch (error) {
    console.error('Create bucket error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create bucket' }, { status: 500 });
  }
}

// PUT update bucket (root only)
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isRoot) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const bucketId = searchParams.get('id');

    if (!bucketId) {
      return NextResponse.json({ error: 'Bucket ID required' }, { status: 400 });
    }

    const body = await request.json();
    const data = bucketSchema.partial().parse(body);

    const updateData: Record<string, unknown> = {};
    if (data.name) updateData.name = data.name;
    if (data.endpoint) updateData.endpoint = data.endpoint;
    if (data.accessKey) updateData.accessKey = data.accessKey;
    if (data.secretKey) updateData.secretKey = encrypt(data.secretKey);
    if (data.region) updateData.region = data.region;
    if (data.isDefault !== undefined) {
      if (data.isDefault) {
        await prisma.bucket.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }
      updateData.isDefault = data.isDefault;
    }

    const bucket = await prisma.bucket.update({
      where: { id: bucketId },
      data: updateData,
      select: {
        id: true,
        name: true,
        endpoint: true,
        region: true,
        isDefault: true,
      },
    });

    return NextResponse.json({ success: true, bucket });
  } catch (error) {
    console.error('Update bucket error:', error);
    return NextResponse.json({ error: 'Failed to update bucket' }, { status: 500 });
  }
}

// DELETE bucket (root only)
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isRoot) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const bucketId = searchParams.get('id');

    if (!bucketId) {
      return NextResponse.json({ error: 'Bucket ID required' }, { status: 400 });
    }

    await prisma.bucket.delete({
      where: { id: bucketId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete bucket error:', error);
    return NextResponse.json({ error: 'Failed to delete bucket' }, { status: 500 });
  }
}
