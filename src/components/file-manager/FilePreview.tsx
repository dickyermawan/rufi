'use client';

import { useState, useEffect } from 'react';
import {
  DialogContainer,
  Dialog,
  Heading,
  Divider,
  Content,
  ButtonGroup,
  Button,
  View,
  ProgressCircle,
  Text,
} from '@adobe/react-spectrum';
import { useTranslations } from 'next-intl';
import { FileItem } from '@/types';

interface FilePreviewProps {
  file: FileItem;
  bucketId: string;
  onClose: () => void;
}

function getFileType(filename: string): 'image' | 'video' | 'audio' | 'text' | 'pdf' | 'unknown' {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) {
    return 'image';
  }
  if (['mp4', 'webm', 'mov', 'ogg'].includes(ext)) {
    return 'video';
  }
  if (['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(ext)) {
    return 'audio';
  }
  if (['txt', 'md', 'json', 'xml', 'yaml', 'yml', 'js', 'ts', 'jsx', 'tsx', 'css', 'html', 'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'h', 'cs', 'php', 'sh', 'bash', 'log', 'ini', 'cfg', 'conf', 'toml'].includes(ext)) {
    return 'text';
  }
  if (ext === 'pdf') {
    return 'pdf';
  }

  return 'unknown';
}

export function FilePreview({ file, bucketId, onClose }: FilePreviewProps) {
  const t = useTranslations('files');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fileType = getFileType(file.name);

  useEffect(() => {
    const loadPreview = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (fileType === 'text') {
          const response = await fetch(`/api/files/content?bucketId=${bucketId}&key=${encodeURIComponent(file.key)}`);
          if (!response.ok) throw new Error('Failed to load file');
          const data = await response.json();
          setTextContent(data.content);
        } else {
          const response = await fetch(`/api/files/download-url?bucketId=${bucketId}&key=${encodeURIComponent(file.key)}`);
          if (!response.ok) throw new Error('Failed to get download URL');
          const data = await response.json();
          setPreviewUrl(data.url);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load preview');
      } finally {
        setIsLoading(false);
      }
    };

    loadPreview();
  }, [file, bucketId, fileType]);

  const handleDownload = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  return (
    <DialogContainer onDismiss={onClose}>
      <Dialog size="L">
        <Heading>{file.name}</Heading>
        <Divider />
        <Content>
          <View minHeight="size-3000" UNSAFE_style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isLoading ? (
              <ProgressCircle aria-label="Loading..." isIndeterminate />
            ) : error ? (
              <Text UNSAFE_style={{ color: 'var(--spectrum-global-color-red-600)' }}>{error}</Text>
            ) : fileType === 'image' && previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt={file.name} className="preview-image" />
            ) : fileType === 'video' && previewUrl ? (
              <video src={previewUrl} controls style={{ maxWidth: '100%', maxHeight: '60vh' }} />
            ) : fileType === 'audio' && previewUrl ? (
              <audio src={previewUrl} controls />
            ) : fileType === 'pdf' && previewUrl ? (
              <iframe src={previewUrl} style={{ width: '100%', height: '60vh', border: 'none' }} />
            ) : fileType === 'text' && textContent !== null ? (
              <View
                width="100%"
                padding="size-200"
                backgroundColor="gray-100"
                borderRadius="regular"
                UNSAFE_style={{ overflow: 'auto', maxHeight: '60vh' }}
              >
                <pre className="code-editor" style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {textContent}
                </pre>
              </View>
            ) : (
              <Text>{t('preview')} not available for this file type</Text>
            )}
          </View>
        </Content>
        <ButtonGroup>
          <Button variant="secondary" onPress={onClose}>
            {t('close')}
          </Button>
          {previewUrl && (
            <Button variant="accent" onPress={handleDownload}>
              {t('download')}
            </Button>
          )}
        </ButtonGroup>
      </Dialog>
    </DialogContainer>
  );
}
