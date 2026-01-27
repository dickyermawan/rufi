import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { createS3Client, getPresignedDownloadUrl } from '@/lib/s3';
import bcrypt from 'bcryptjs';

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    const link = await prisma.sharedLink.findUnique({
      where: { token },
      include: {
        bucket: true,
      },
    });

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    // Check expiration
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Link has expired' }, { status: 410 });
    }

    // Check password if required
    if (link.password) {
      const { searchParams } = new URL(request.url);
      const password = searchParams.get('password');
      
      if (!password) {
        return NextResponse.json({ 
          success: false, 
          requiresPassword: true,
          fileName: link.path.split('/').pop(),
        }, { status: 401 });
      }

      const isValid = await bcrypt.compare(password, link.password);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }
    }

    // Create S3 client and get presigned URL
    const client = createS3Client({
      endpoint: link.bucket.endpoint,
      accessKey: link.bucket.accessKey,
      secretKey: link.bucket.secretKey,
      region: link.bucket.region,
      bucket: link.bucket.name,
    });

    const downloadUrl = await getPresignedDownloadUrl(client, link.bucket.name, link.path, 3600);

    return NextResponse.json({
      success: true,
      fileName: link.path.split('/').pop(),
      downloadUrl,
    });
  } catch (error) {
    console.error('Get shared file error:', error);
    return NextResponse.json({ error: 'Failed to get shared file' }, { status: 500 });
  }
}
