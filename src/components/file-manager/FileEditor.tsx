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
  TextArea,
} from '@adobe/react-spectrum';
import { useTranslations } from 'next-intl';
import { FileItem } from '@/types';

interface FileEditorProps {
  file: FileItem;
  bucketId: string;
  onClose: () => void;
  onSave: () => void;
}

export function FileEditor({ file, bucketId, onClose, onSave }: FileEditorProps) {
  const t = useTranslations('files');
  const tCommon = useTranslations('common');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/files/content?bucketId=${bucketId}&key=${encodeURIComponent(file.key)}`
        );
        if (!response.ok) throw new Error('Failed to load file');
        const data = await response.json();
        setContent(data.content);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load file');
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [file, bucketId]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/files/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucketId,
          key: file.key,
          content,
        }),
      });

      if (!response.ok) throw new Error('Failed to save file');
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save file');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DialogContainer onDismiss={onClose}>
      <Dialog size="L">
        <Heading>{t('edit')}: {file.name}</Heading>
        <Divider />
        <Content>
          {isLoading ? (
            <View minHeight="size-3000" UNSAFE_style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ProgressCircle aria-label="Loading..." isIndeterminate />
            </View>
          ) : error ? (
            <Text UNSAFE_style={{ color: 'var(--spectrum-global-color-red-600)' }}>{error}</Text>
          ) : (
            <TextArea
              width="100%"
              height="size-6000"
              value={content}
              onChange={setContent}
              UNSAFE_className="code-editor"
              aria-label="File content"
            />
          )}
        </Content>
        <ButtonGroup>
          <Button variant="secondary" onPress={onClose}>
            {tCommon('cancel')}
          </Button>
          <Button variant="accent" onPress={handleSave} isPending={isSaving} isDisabled={isLoading}>
            {tCommon('save')}
          </Button>
        </ButtonGroup>
      </Dialog>
    </DialogContainer>
  );
}
