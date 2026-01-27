'use client';

import { View, Text, Flex, Checkbox } from '@adobe/react-spectrum';
import FolderOpen from '@spectrum-icons/workflow/FolderOpen';
import Document from '@spectrum-icons/workflow/Document';
import { FileItem } from '@/types';
import { useTranslations } from 'next-intl';

interface FileListProps {
  files: FileItem[];
  selectedFiles: Set<string>;
  onFileClick: (file: FileItem, event: React.MouseEvent) => void;
  onFileDoubleClick: (file: FileItem) => void;
  onContextMenu: (e: React.MouseEvent, file: FileItem) => void;
  onSelectAll: (selected: boolean) => void;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '-';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  let size = bytes;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function formatDate(date?: Date): string {
  if (!date) return '-';
  return new Date(date).toLocaleString();
}

export function FileList({
  files,
  selectedFiles,
  onFileClick,
  onFileDoubleClick,
  onContextMenu,
  onSelectAll,
}: FileListProps) {
  const t = useTranslations('common');
  
  const allSelected = files.length > 0 && files.every((f) => selectedFiles.has(f.key));
  const someSelected = files.some((f) => selectedFiles.has(f.key)) && !allSelected;

  return (
    <View>
      {/* Header */}
      <View
        UNSAFE_style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '8px 16px',
          borderBottom: '1px solid var(--spectrum-global-color-gray-300)',
          fontWeight: 'bold',
        }}
      >
        <View width="size-400">
          <Checkbox
            isSelected={allSelected}
            isIndeterminate={someSelected}
            onChange={(checked) => onSelectAll(checked)}
            aria-label="Select all"
          />
        </View>
        <View width="40%">
          <Text>{t('name')}</Text>
        </View>
        <View width="15%">
          <Text>{t('size')}</Text>
        </View>
        <View width="25%">
          <Text>{t('date')}</Text>
        </View>
        <View width="20%">
          <Text>{t('type')}</Text>
        </View>
      </View>

      {/* Files */}
      {files.map((file) => (
        <View
          key={file.key}
          UNSAFE_className="file-item"
          UNSAFE_style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '8px 16px',
            cursor: 'pointer',
            borderBottom: '1px solid var(--spectrum-global-color-gray-200)',
            backgroundColor: selectedFiles.has(file.key) ? 'var(--spectrum-global-color-blue-100)' : 'transparent',
          }}
        >
          <div style={{ width: '32px' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <Checkbox
              isSelected={selectedFiles.has(file.key)}
              onChange={() => {
                // Toggle this file's selection
                const fakeEvent = { ctrlKey: true } as React.MouseEvent;
                onFileClick(file, fakeEvent);
              }}
              aria-label={`Select ${file.name}`}
            />
          </div>
          <div
            onClick={(e) => onFileClick(file, e)}
            onDoubleClick={() => onFileDoubleClick(file)}
            onContextMenu={(e) => onContextMenu(e, file)}
            style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '16px' }}
          >
            <View width="40%">
              <Flex alignItems="center" gap="size-100">
                {file.type === 'folder' ? <FolderOpen size="S" /> : <Document size="S" />}
                <Text>{file.name}</Text>
              </Flex>
            </View>
            <View width="15%">
              <Text>{formatFileSize(file.size)}</Text>
            </View>
            <View width="25%">
              <Text>{formatDate(file.lastModified)}</Text>
            </View>
            <View width="20%">
              <Text>{file.type === 'folder' ? 'Folder' : file.name.split('.').pop()?.toUpperCase() || 'File'}</Text>
            </View>
          </div>
        </View>
      ))}
    </View>
  );
}
