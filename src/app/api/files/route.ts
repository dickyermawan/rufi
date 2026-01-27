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
    const search = searchParams.get('search') || '';
    const continuationToken = searchParams.get('continuationToken') || undefined;
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

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

    // List objects with pagination
    let prefix = effectivePath === '/' ? '' : effectivePath.replace(/^\//, '');
    
    // Append search term to prefix if provided
    // Ensure prefix ends with / if it's a directory, unless we are searching
    if (!prefix.endsWith('/') && prefix !== '') {
        prefix += '/';
    }
    
    if (search) {
        prefix += search;
    }

    const result = await listObjects(client, bucket.name, prefix, '/', {
      maxKeys: pageSize,
      continuationToken,
    });

    // Combine and sort
    const allFiles = [
      ...result.folders.map(f => ({ ...f, type: 'folder' as const })),
      ...result.files.map(f => ({ ...f, type: 'file' as const })),
    ].sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    // If searching, names might include the search prefix, we need to extract just the filename relative to current folder
    if (search) {
        // Since we are searching in the current folder, the keys returned will start with the prefix (folder + search)
        // We want to display them relative to the current folder.
        // The listObjects function already handles stripping the prefix from the name, 
        // BUT if we modified the prefix by appending search, listObjects will strip 'folder/searchterm' from the name.
        // This would result in 'remainder_of_filename' instead of 'searchterm_remainder'.
        // So we need to be careful.
        
        // Actually, listObjects implementation:
        // name: obj.Key!.replace(prefix, '').replace(/\/$/, '')
        
        // If prefix is 'folder/lap', and key is 'folder/laporan.pdf'
        // name becomes 'oran.pdf'. This is WRONG for display.
        // We want 'laporan.pdf'.
        
        // So we should NOT rely on listObjects name parsing if we use search prefix.
        // We should fix listObjects or handle it here.
        // Let's modify listObjects to be smarter or fix names here.
        
        // Let's re-map the names correctly relative to the current folder path
        const folderPrefix = effectivePath === '/' ? '' : effectivePath.replace(/^\//, '');
        const folderPrefixWithSlash = (folderPrefix && !folderPrefix.endsWith('/')) ? folderPrefix + '/' : folderPrefix;

        allFiles.forEach(f => {
            f.name = f.key.replace(folderPrefixWithSlash, '').replace(/\/$/, '');
        });
    }

    return NextResponse.json({
      success: true,
      files: allFiles,
      permissions,
      currentPath: normalizedPath,
      pagination: {
        hasMore: result.isTruncated,
        nextToken: result.nextContinuationToken,
        pageSize,
      },
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
