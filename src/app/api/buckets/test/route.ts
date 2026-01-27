import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isRoot) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { endpoint, accessKey, secretKey, region, bucketName } = await request.json();

    if (!endpoint || !accessKey || !secretKey) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create temporary S3 client
    const client = new S3Client({
      endpoint,
      region: region || 'auto',
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      forcePathStyle: true,
    });

    try {
      // Try to list objects in the bucket (or list buckets if no bucket specified)
      if (bucketName) {
        const { listObjects } = await import('@/lib/s3');
        await listObjects(client, bucketName, '', '/');
      } else {
        await client.send(new ListBucketsCommand({}));
      }

      return NextResponse.json({ success: true, message: 'Connection successful' });
    } catch (s3Error) {
      console.error('S3 connection test failed:', s3Error);
      return NextResponse.json(
        { error: 'Connection failed. Check your credentials and endpoint.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Test connection error:', error);
    return NextResponse.json({ error: 'Failed to test connection' }, { status: 500 });
  }
}
