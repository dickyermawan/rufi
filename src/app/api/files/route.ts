import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createS3Client, listObjects } from '@/lib/s3';
import { FULL_PERMISSIONS, Permission } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bucketId = searchParams.get('bucketId');
    const path = searchParams.get('path') || '/';

    if (!bucketId) {
      return NextResponse.json({ error: 'Bucket ID required' }, { status: 400 });
    }

    // Get bucket
    const bucket = await prisma.bucket.findUnique({
      where: { id: bucketId },
    });

    if (!bucket) {
      return NextResponse.json({ error: 'Bucket not found' }, { status: 404 });
    }

    // Check permissions
    let permissions: Permission = FULL_PERMISSIONS;
    let homeDir = '/';

    if (!user.isRoot) {
      const access = await prisma.bucketAccess.findUnique({
        where: {
          userId_bucketId: {
            userId: user.id,
            bucketId,
          },
        },
      });

      if (!access || !access.canList) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      permissions = {
        canList: access.canList,
        canUpload: access.canUpload,
        canDownload: access.canDownload,
        canDelete: access.canDelete,
        canRename: access.canRename,
        canCopy: access.canCopy,
        canCreateFolder: access.canCreateFolder,
        canEdit: access.canEdit,
        canShare: access.canShare,
      };
      homeDir = access.homeDir;
    }

    // Ensure user stays within their home directory
    const normalizedPath = path.startsWith('/') ? path : '/' + path;
    const effectivePath = homeDir === '/'
      ? normalizedPath
      : homeDir + normalizedPath.replace(/^\//, '');

    // Create S3 client
    const client = createS3Client({
      endpoint: bucket.endpoint,
      accessKey: bucket.accessKey,
      secretKey: bucket.secretKey,
      region: bucket.region,
      bucket: bucket.name,
    });

    // List objects
    const prefix = effectivePath === '/' ? '' : effectivePath.replace(/^\//, '');
    const { files, folders } = await listObjects(client, bucket.name, prefix);

    // Combine and sort
    const allFiles = [
      ...folders.map(f => ({ ...f, type: 'folder' as const })),
      ...files.map(f => ({ ...f, type: 'file' as const })),
    ].sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      success: true,
      files: allFiles,
      permissions,
      currentPath: normalizedPath,
    });
  } catch (error) {
    console.error('List files error:', error);
    return NextResponse.json(
      { error: 'Failed to list files' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bucketId, keys } = await request.json();

    if (!bucketId || !keys || !Array.isArray(keys)) {
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

      if (!access || !access.canDelete) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Create S3 client
    const { createS3Client, deleteObjects, deleteFolderRecursive } = await import('@/lib/s3');
    const client = createS3Client({
      endpoint: bucket.endpoint,
      accessKey: bucket.accessKey,
      secretKey: bucket.secretKey,
      region: bucket.region,
      bucket: bucket.name,
    });

    // Delete each key
    for (const key of keys) {
      if (key.endsWith('/')) {
        // It's a folder
        await deleteFolderRecursive(client, bucket.name, key);
      } else {
        await deleteObjects(client, bucket.name, [key]);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete files error:', error);
    return NextResponse.json(
      { error: 'Failed to delete files' },
      { status: 500 }
    );
  }
}
