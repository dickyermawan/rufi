import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createS3Client, getPresignedUploadUrl } from '@/lib/s3';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bucketId, key, contentType } = await request.json();

    if (!bucketId || !key) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Get bucket
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

      if (!access || !access.canUpload) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Create S3 client
    const client = createS3Client({
      endpoint: bucket.endpoint,
      accessKey: bucket.accessKey,
      secretKey: bucket.secretKey,
      region: bucket.region,
      bucket: bucket.name,
    });

    // Get presigned URL
    const normalizedKey = key.startsWith('/') ? key.slice(1) : key;
    const url = await getPresignedUploadUrl(
      client,
      bucket.name,
      normalizedKey,
      contentType || 'application/octet-stream',
      3600
    );

    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error('Get upload URL error:', error);
    return NextResponse.json(
      { error: 'Failed to get upload URL' },
      { status: 500 }
    );
  }
}
