import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createS3Client, copyObject } from '@/lib/s3';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bucketId, sourceKey, destinationKey } = await request.json();

    if (!bucketId || !sourceKey || !destinationKey) {
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

      if (!access || !access.canCopy) {
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

    await copyObject(client, bucket.name, sourceKey, destinationKey);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Copy error:', error);
    return NextResponse.json(
      { error: 'Failed to copy file' },
      { status: 500 }
    );
  }
}
