import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  CopyObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { FileItem } from '@/types';
import { decrypt } from '@/lib/auth/crypto';

export interface S3Config {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  region: string;
  bucket: string;
}

export function createS3Client(config: S3Config, decryptSecret = true): S3Client {
  return new S3Client({
    endpoint: config.endpoint,
    region: config.region || 'auto',
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: decryptSecret ? decrypt(config.secretKey) : config.secretKey,
    },
    forcePathStyle: true,
  });
}

export interface ListObjectsOptions {
  maxKeys?: number;
  continuationToken?: string;
}

export interface ListObjectsResult {
  files: FileItem[];
  folders: FileItem[];
  nextContinuationToken?: string;
  isTruncated: boolean;
  totalCount: number;
}

export async function listObjects(
  client: S3Client,
  bucket: string,
  prefix: string = '',
  delimiter: string = '/',
  options: ListObjectsOptions = {}
): Promise<ListObjectsResult> {
  const { maxKeys = 100, continuationToken } = options;
  
  const command = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: prefix,
    Delimiter: delimiter,
    MaxKeys: maxKeys,
    ContinuationToken: continuationToken,
  });

  const response = await client.send(command);
  
  const files: FileItem[] = (response.Contents || [])
    .filter(obj => obj.Key && obj.Key !== prefix)
    .map(obj => ({
      key: obj.Key!,
      name: obj.Key!.replace(prefix, '').replace(/\/$/, ''),
      type: 'file' as const,
      size: obj.Size,
      lastModified: obj.LastModified,
    }));

  const folders: FileItem[] = (response.CommonPrefixes || [])
    .filter(p => p.Prefix)
    .map(p => ({
      key: p.Prefix!,
      name: p.Prefix!.replace(p.Prefix!.split('/').slice(0, -2).join('/') + '/', '').replace(/\/$/, ''),
      type: 'folder' as const,
    }));

  return { 
    files, 
    folders,
    nextContinuationToken: response.NextContinuationToken,
    isTruncated: response.IsTruncated || false,
    totalCount: (response.KeyCount || 0) + (response.CommonPrefixes?.length || 0),
  };
}

export async function getObject(
  client: S3Client,
  bucket: string,
  key: string
): Promise<{ body: ReadableStream | null; contentType: string; contentLength: number }> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const response = await client.send(command);
  
  return {
    body: response.Body?.transformToWebStream() || null,
    contentType: response.ContentType || 'application/octet-stream',
    contentLength: response.ContentLength || 0,
  };
}

export async function getObjectMetadata(
  client: S3Client,
  bucket: string,
  key: string
) {
  const command = new HeadObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return client.send(command);
}

export async function putObject(
  client: S3Client,
  bucket: string,
  key: string,
  body: Buffer | Uint8Array | string,
  contentType?: string
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await client.send(command);
}

export async function deleteObject(
  client: S3Client,
  bucket: string,
  key: string
): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await client.send(command);
}

export async function deleteObjects(
  client: S3Client,
  bucket: string,
  keys: string[]
): Promise<void> {
  const command = new DeleteObjectsCommand({
    Bucket: bucket,
    Delete: {
      Objects: keys.map(key => ({ Key: key })),
    },
  });

  await client.send(command);
}

export async function copyObject(
  client: S3Client,
  bucket: string,
  sourceKey: string,
  destinationKey: string
): Promise<void> {
  const command = new CopyObjectCommand({
    Bucket: bucket,
    CopySource: `${bucket}/${sourceKey}`,
    Key: destinationKey,
  });

  await client.send(command);
}

export async function moveObject(
  client: S3Client,
  bucket: string,
  sourceKey: string,
  destinationKey: string
): Promise<void> {
  await copyObject(client, bucket, sourceKey, destinationKey);
  await deleteObject(client, bucket, sourceKey);
}

export async function createFolder(
  client: S3Client,
  bucket: string,
  path: string
): Promise<void> {
  const folderKey = path.endsWith('/') ? path : `${path}/`;
  
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: folderKey,
    Body: '',
  });

  await client.send(command);
}

export async function getPresignedDownloadUrl(
  client: S3Client,
  bucket: string,
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
}

export async function getPresignedUploadUrl(
  client: S3Client,
  bucket: string,
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn });
}

// Multipart upload functions for large files
export async function initiateMultipartUpload(
  client: S3Client,
  bucket: string,
  key: string,
  contentType: string
): Promise<string> {
  const command = new CreateMultipartUploadCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const response = await client.send(command);
  return response.UploadId!;
}

export async function uploadPart(
  client: S3Client,
  bucket: string,
  key: string,
  uploadId: string,
  partNumber: number,
  body: Buffer | Uint8Array
): Promise<{ ETag: string; PartNumber: number }> {
  const command = new UploadPartCommand({
    Bucket: bucket,
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
    Body: body,
  });

  const response = await client.send(command);
  return {
    ETag: response.ETag!,
    PartNumber: partNumber,
  };
}

export async function completeMultipartUpload(
  client: S3Client,
  bucket: string,
  key: string,
  uploadId: string,
  parts: { ETag: string; PartNumber: number }[]
): Promise<void> {
  const command = new CompleteMultipartUploadCommand({
    Bucket: bucket,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: parts.sort((a, b) => a.PartNumber - b.PartNumber),
    },
  });

  await client.send(command);
}

export async function abortMultipartUpload(
  client: S3Client,
  bucket: string,
  key: string,
  uploadId: string
): Promise<void> {
  const command = new AbortMultipartUploadCommand({
    Bucket: bucket,
    Key: key,
    UploadId: uploadId,
  });

  await client.send(command);
}

// High-level upload using @aws-sdk/lib-storage
export async function uploadLargeFile(
  client: S3Client,
  bucket: string,
  key: string,
  body: Buffer | Uint8Array | ReadableStream,
  contentType: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  const upload = new Upload({
    client,
    params: {
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    },
    queueSize: 4,
    partSize: 10 * 1024 * 1024, // 10MB parts
    leavePartsOnError: false,
  });

  upload.on('httpUploadProgress', (progress) => {
    if (progress.loaded && progress.total && onProgress) {
      onProgress((progress.loaded / progress.total) * 100);
    }
  });

  await upload.done();
}

// Delete folder and all contents recursively
export async function deleteFolderRecursive(
  client: S3Client,
  bucket: string,
  prefix: string
): Promise<void> {
  const folderPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
  
  let continuationToken: string | undefined;
  
  do {
    const listCommand = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: folderPrefix,
      ContinuationToken: continuationToken,
    });

    const response = await client.send(listCommand);
    
    if (response.Contents && response.Contents.length > 0) {
      const keys = response.Contents.map(obj => obj.Key!);
      await deleteObjects(client, bucket, keys);
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);
}

// Get file content as text
export async function getObjectAsText(
  client: S3Client,
  bucket: string,
  key: string
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const response = await client.send(command);
  return response.Body?.transformToString() || '';
}
