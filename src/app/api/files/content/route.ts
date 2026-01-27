import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createS3Client, getObjectAsText, putObject } from '@/lib/s3';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bucketId = searchParams.get('bucketId');
    const key = searchParams.get('key');

    if (!bucketId || !key) {
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

      if (!access || !access.canDownload) {
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

    const content = await getObjectAsText(client, bucket.name, key);

    return NextResponse.json({ success: true, content });
  } catch (error) {
    console.error('Get content error:', error);
    return NextResponse.json(
      { error: 'Failed to get file content' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bucketId, key, content } = await request.json();

    if (!bucketId || !key || content === undefined) {
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

      if (!access || !access.canEdit) {
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

    // Determine content type from file extension
    const ext = key.split('.').pop()?.toLowerCase() || '';
    const contentTypeMap: Record<string, string> = {
      txt: 'text/plain',
      md: 'text/markdown',
      json: 'application/json',
      xml: 'application/xml',
      html: 'text/html',
      css: 'text/css',
      js: 'application/javascript',
      ts: 'application/typescript',
      py: 'text/x-python',
      sh: 'application/x-sh',
    };
    const contentType = contentTypeMap[ext] || 'text/plain';

    await putObject(client, bucket.name, key, content, contentType);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save content error:', error);
    return NextResponse.json(
      { error: 'Failed to save file' },
      { status: 500 }
    );
  }
}
