'use client';

import { useState, useCallback, useRef } from 'react';
import { View, Text, ProgressBar, Flex } from '@adobe/react-spectrum';
import { useTranslations } from 'next-intl';

interface DropZoneWrapperProps {
  bucketId: string;
  path: string;
  canUpload: boolean;
  onUploadComplete: () => void;
  children: React.ReactNode;
}

interface UploadingFile {
  file: File;
  relativePath: string;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
}

// Helper to get all files from a directory entry recursively
async function getFilesFromEntry(entry: FileSystemEntry, path: string = ''): Promise<{ file: File; relativePath: string }[]> {
  const results: { file: File; relativePath: string }[] = [];
  
  if (entry.isFile) {
    const fileEntry = entry as FileSystemFileEntry;
    const file = await new Promise<File>((resolve) => {
      fileEntry.file(resolve);
    });
    results.push({ file, relativePath: path + file.name });
  } else if (entry.isDirectory) {
    const dirEntry = entry as FileSystemDirectoryEntry;
    const reader = dirEntry.createReader();
    const entries = await new Promise<FileSystemEntry[]>((resolve) => {
      reader.readEntries(resolve);
    });
    for (const childEntry of entries) {
      const childResults = await getFilesFromEntry(childEntry, path + entry.name + '/');
      results.push(...childResults);
    }
  }
  
  return results;
}

export function DropZoneWrapper({ bucketId, path, canUpload, onUploadComplete, children }: DropZoneWrapperProps) {
  const t = useTranslations('files');
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const dragCounter = useRef(0);

  const uploadFile = useCallback(async (uploadingFile: UploadingFile, index: number) => {
    const { file, relativePath } = uploadingFile;

    try {
      // Get presigned URL for upload
      const response = await fetch('/api/files/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucketId,
          key: path + relativePath,
          contentType: file.type || 'application/octet-stream',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { url } = await response.json();

      // Upload directly to S3
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          setUploads((prev) =>
            prev.map((u, i) => (i === index ? { ...u, progress, status: 'uploading' } : u))
          );
        }
      });

      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploads((prev) =>
              prev.map((u, i) => (i === index ? { ...u, progress: 100, status: 'complete' } : u))
            );
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));

        xhr.open('PUT', url);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.send(file);
      });
    } catch (error) {
      setUploads((prev) =>
        prev.map((u, i) =>
          i === index
            ? { ...u, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' }
            : u
        )
      );
    }
  }, [bucketId, path]);

  const startUpload = useCallback(async (filesToUpload: UploadingFile[]) => {
    setIsUploading(true);

    for (let i = 0; i < filesToUpload.length; i++) {
      if (filesToUpload[i].status === 'pending') {
        await uploadFile(filesToUpload[i], i);
      }
    }

    setIsUploading(false);

    // Wait a moment then clear and refresh
    setTimeout(() => {
      setUploads([]);
      onUploadComplete();
    }, 1000);
  }, [onUploadComplete, uploadFile]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (!canUpload) return;

    const items = e.dataTransfer.items;
    const allFiles: { file: File; relativePath: string }[] = [];

    // Process all dropped items
    const entries: FileSystemEntry[] = [];
    for (let i = 0; i < items.length; i++) {
      const entry = items[i].webkitGetAsEntry();
      if (entry) {
        entries.push(entry);
      }
    }

    // Get all files from entries (including folder contents)
    for (const entry of entries) {
      const files = await getFilesFromEntry(entry);
      allFiles.push(...files);
    }

    if (allFiles.length === 0) {
      // Fallback to regular files
      const files = Array.from(e.dataTransfer.files);
      for (const file of files) {
        allFiles.push({ file, relativePath: file.name });
      }
    }

    if (allFiles.length > 0) {
      const uploadingFiles: UploadingFile[] = allFiles.map(({ file, relativePath }) => ({
        file,
        relativePath,
        progress: 0,
        status: 'pending',
      }));
      setUploads(uploadingFiles);
      startUpload(uploadingFiles);
    }
  }, [canUpload, startUpload]);

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>

      {/* Drag overlay */}
      {isDragging && canUpload && (
        <div
          style={{
            position: 'absolute',
            top: '-16px', // Compensate for parent padding if needed, or stick to 0 if relative works
            left: '-16px',
            right: '-16px',
            bottom: '-16px',
            backgroundColor: 'rgba(0, 120, 212, 0.1)',
            border: '3px dashed var(--spectrum-global-color-blue-500)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            pointerEvents: 'none',
          }}
        >
          <View backgroundColor="gray-50" padding="size-400" borderRadius="medium">
            <Text UNSAFE_style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--spectrum-global-color-blue-600)' }}>
              {t('dropFilesHere')}
            </Text>
          </View>
        </div>
      )}

      {/* Upload progress overlay */}
      {uploads.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '350px',
            maxHeight: '300px',
            overflowY: 'auto',
            zIndex: 1000,
          }}
        >
          <View
            backgroundColor="gray-50"
            padding="size-200"
            borderRadius="medium"
            UNSAFE_style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
          >
            <Text UNSAFE_style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
              {isUploading ? t('uploadProgress', { filename: '' }) : t('uploadComplete')}
            </Text>
            <Flex direction="column" gap="size-100">
              {uploads.slice(0, 5).map((upload, index) => (
                <View key={index} padding="size-50">
                  <Flex alignItems="center" gap="size-100">
                    <Text flex={1} UNSAFE_style={{ fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {upload.relativePath}
                    </Text>
                    {upload.status === 'error' ? (
                      <Text UNSAFE_style={{ color: 'var(--spectrum-global-color-red-600)', fontSize: '0.8rem' }}>
                        Error
                      </Text>
                    ) : (
                      <ProgressBar
                        value={upload.progress}
                        width="size-1200"
                        size="S"
                        aria-label={`Uploading ${upload.relativePath}`}
                      />
                    )}
                  </Flex>
                </View>
              ))}
              {uploads.length > 5 && (
                <Text UNSAFE_style={{ fontSize: '0.8rem', color: 'var(--spectrum-global-color-gray-600)' }}>
                  +{uploads.length - 5} more files...
                </Text>
              )}
            </Flex>
          </View>
        </div>
      )}
    </div>
  );
}
