import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createS3Client, moveObject } from '@/lib/s3';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bucketId, oldKey, newName } = await request.json();

    if (!bucketId || !oldKey || !newName) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const bucket = await prisma.bucket.findUnique({
      where: { id: bucketId },
    });

    if (!bucket) {
      return NextResponse.json({ error: 'Bucket not found' }, { status: 404 });
    }

    // Check permissions
    if (!user.isRoot) {
      const access = await prisma.bucketAccess.findUnique({
        where: {
          userId_bucketId: {
            userId: user.id,
            bucketId,
          },
        },
      });

      if (!access || !access.canRename) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const client = createS3Client({
      endpoint: bucket.endpoint,
      accessKey: bucket.accessKey,
      secretKey: bucket.secretKey,
      region: bucket.region,
      bucket: bucket.name,
    });

    // Calculate new key
    const parts = oldKey.split('/');
    parts[parts.length - 1] = newName;
    const newKey = parts.join('/');

    await moveObject(client, bucket.name, oldKey, newKey);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Rename error:', error);
    return NextResponse.json(
      { error: 'Failed to rename file' },
      { status: 500 }
    );
  }
}
