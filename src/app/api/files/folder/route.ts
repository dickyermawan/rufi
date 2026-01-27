import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createS3Client, createFolder } from '@/lib/s3';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bucketId, path } = await request.json();

    if (!bucketId || !path) {
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

      if (!access || !access.canCreateFolder) {
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

    // Create folder
    const folderPath = path.startsWith('/') ? path.slice(1) : path;
    await createFolder(client, bucket.name, folderPath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Create folder error:', error);
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    );
  }
}
