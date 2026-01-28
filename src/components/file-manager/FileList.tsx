'use client';

import { useState, useEffect, useRef } from 'react';
import { View, Text, Flex, Checkbox, ActionButton } from '@adobe/react-spectrum';
import FolderOpen from '@spectrum-icons/workflow/FolderOpen';
import Document from '@spectrum-icons/workflow/Document';
import ChevronRight from '@spectrum-icons/workflow/ChevronRight';
import { FileItem } from '@/types';
import { useTranslations } from 'next-intl';

interface FileListProps {
  files: FileItem[];
  selectedFiles: Set<string>;
  bucketId?: string;
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
  bucketId,
  onFileClick,
  onFileDoubleClick,
  onContextMenu,
  onSelectAll,
}: FileListProps) {
  const t = useTranslations('common');
  const [isMobile, setIsMobile] = useState(false);
  const lastTapRef = useRef<{ time: number; key: string }>({ time: 0, key: '' });
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleClick = (file: FileItem, e: React.MouseEvent) => {
    if (isMobile) {
      const now = Date.now();
      const lastTap = lastTapRef.current;
      
      // Double-tap detection for mobile (within 300ms)
      if (lastTap.key === file.key && now - lastTap.time < 300) {
        onFileDoubleClick(file);
        lastTapRef.current = { time: 0, key: '' };
        return;
      }
      
      lastTapRef.current = { time: now, key: file.key };
      onFileClick(file, e);
    } else {
      onFileClick(file, e);
    }
  };

  const handleOpenFolder = (file: FileItem) => {
    onFileDoubleClick(file);
  };
  
  const allSelected = files.length > 0 && files.every((f) => selectedFiles.has(f.key));
  const someSelected = files.some((f) => selectedFiles.has(f.key)) && !allSelected;

  // Mobile card view
  if (isMobile) {
    return (
      <View>
        {/* Select All */}
        <Flex alignItems="center" marginBottom="size-200" UNSAFE_style={{ paddingLeft: '8px' }}>
          <Checkbox
            isSelected={allSelected}
            isIndeterminate={someSelected}
            onChange={(checked) => onSelectAll(checked)}
          >
            {allSelected ? 'Deselect All' : 'Select All'} ({selectedFiles.size}/{files.length})
          </Checkbox>
        </Flex>

        {/* Mobile List */}
        <Flex direction="column" gap="size-100">
          {files.map((file) => (
            <View
              key={file.key}
              padding="size-150"
              borderRadius="medium"
              UNSAFE_style={{
                backgroundColor: selectedFiles.has(file.key) 
                  ? 'var(--spectrum-global-color-blue-100)' 
                  : 'var(--spectrum-global-color-gray-75)',
                border: selectedFiles.has(file.key) 
                  ? '2px solid var(--spectrum-global-color-blue-500)' 
                  : '1px solid var(--spectrum-global-color-gray-300)',
              }}
            >
              <Flex alignItems="center" gap="size-150">
                {/* Checkbox */}
                <Checkbox
                  isSelected={selectedFiles.has(file.key)}
                  onChange={() => {
                    const fakeEvent = { ctrlKey: true } as React.MouseEvent;
                    onFileClick(file, fakeEvent);
                  }}
                  aria-label={`Select ${file.name}`}
                />

                {/* File info */}
                <div 
                  style={{ 
                    flex: 1, 
                    display: 'flex',
                    alignItems: 'center', 
                    gap: '8px',
                    cursor: 'pointer',
                  }}
                  onClick={(e) => handleClick(file, e)}
                  onContextMenu={(e) => onContextMenu(e, file)}
                >
                  {file.type === 'folder' ? <FolderOpen size="M" /> : <Document size="M" />}
                  <Flex direction="column" flex={1}>
                    <Text UNSAFE_style={{ fontWeight: 500, fontSize: '14px' }}>{file.name}</Text>
                    <Text UNSAFE_style={{ fontSize: '12px', color: 'var(--spectrum-global-color-gray-600)' }}>
                      {file.type === 'folder' ? 'Folder' : formatFileSize(file.size)}
                    </Text>
                  </Flex>
                </div>

                {/* Open button for folders */}
                {file.type === 'folder' && (
                  <ActionButton
                    isQuiet
                    onPress={() => handleOpenFolder(file)}
                    aria-label="Open folder"
                  >
                    <ChevronRight />
                  </ActionButton>
                )}
              </Flex>
            </View>
          ))}
        </Flex>
      </View>
    );
  }

  // Desktop table view
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
