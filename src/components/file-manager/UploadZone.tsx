'use client';

import { useState, useCallback } from 'react';
import { View, Text, ProgressBar, Flex, Button } from '@adobe/react-spectrum';
import { useTranslations } from 'next-intl';
import { useDropzone } from 'react-dropzone';

interface UploadZoneProps {
  bucketId: string;
  path: string;
  onComplete: () => void;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
}

export function UploadZone({ bucketId, path, onComplete }: UploadZoneProps) {
  const t = useTranslations('files');
  const [uploads, setUploads] = useState<UploadingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploads(
      acceptedFiles.map((file) => ({
        file,
        progress: 0,
        status: 'pending',
      }))
    );
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  const uploadFile = async (uploadingFile: UploadingFile, index: number) => {
    const { file } = uploadingFile;

    try {
      // Get presigned URL for upload
      const response = await fetch('/api/files/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucketId,
          key: path + file.name,
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
  };

  const startUpload = async () => {
    setIsUploading(true);

    for (let i = 0; i < uploads.length; i++) {
      if (uploads[i].status === 'pending') {
        await uploadFile(uploads[i], i);
      }
    }

    setIsUploading(false);

    // Check if all uploads completed successfully
    const allComplete = uploads.every((u) => u.status === 'complete');
    if (allComplete) {
      setTimeout(onComplete, 500);
    }
  };

  return (
    <View>
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''}`}
        style={{ marginBottom: '16px' }}
      >
        <input {...getInputProps()} />
        <Text>{t('dropFilesHere')}</Text>
      </div>

      {uploads.length > 0 && (
        <View>
          <Flex direction="column" gap="size-100" marginBottom="size-200">
            {uploads.map((upload, index) => (
              <View key={index} padding="size-100" backgroundColor="gray-100" borderRadius="regular">
                <Flex alignItems="center" gap="size-100">
                  <Text flex={1}>{upload.file.name}</Text>
                  {upload.status === 'error' ? (
                    <Text UNSAFE_style={{ color: 'var(--spectrum-global-color-red-600)' }}>
                      {upload.error}
                    </Text>
                  ) : (
                    <ProgressBar
                      value={upload.progress}
                      width="size-2000"
                      label={`${Math.round(upload.progress)}%`}
                      aria-label={`Uploading ${upload.file.name}`}
                    />
                  )}
                </Flex>
              </View>
            ))}
          </Flex>

          <Button
            variant="accent"
            onPress={startUpload}
            isDisabled={isUploading || uploads.every((u) => u.status !== 'pending')}
          >
            {isUploading ? t('uploadProgress', { filename: '' }) : t('upload')}
          </Button>
        </View>
      )}
    </View>
  );
}
