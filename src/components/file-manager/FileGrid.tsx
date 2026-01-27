'use client';

import { useState, useEffect, useRef } from 'react';
import { View, Text, Checkbox, Flex, ActionButton } from '@adobe/react-spectrum';
import FolderOpen from '@spectrum-icons/workflow/FolderOpen';
import Document from '@spectrum-icons/workflow/Document';
import Image from '@spectrum-icons/workflow/Image';
import FileCode from '@spectrum-icons/workflow/FileCode';
import FileTxt from '@spectrum-icons/workflow/FileTxt';
import FileZip from '@spectrum-icons/workflow/FileZip';
import VideoFilled from '@spectrum-icons/workflow/VideoFilled';
import ChevronRight from '@spectrum-icons/workflow/ChevronRight';
import { FileItem } from '@/types';

interface FileGridProps {
  files: FileItem[];
  selectedFiles: Set<string>;
  onFileClick: (file: FileItem, event: React.MouseEvent) => void;
  onFileDoubleClick: (file: FileItem) => void;
  onContextMenu: (e: React.MouseEvent, file: FileItem) => void;
  onSelectAll: (selected: boolean) => void;
}

function getFileIcon(file: FileItem, size: 'L' | 'XXL' = 'XXL') {
  if (file.type === 'folder') {
    return <FolderOpen size={size} />;
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) {
    return <Image size={size} aria-label="Image file" />;
  }
  if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) {
    return <VideoFilled size={size} />;
  }
  if (['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(ext)) {
    return <Document size={size} />;
  }
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'h', 'cs', 'php'].includes(ext)) {
    return <FileCode size={size} />;
  }
  if (['txt', 'md', 'json', 'xml', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf', 'log'].includes(ext)) {
    return <FileTxt size={size} />;
  }
  if (['zip', 'tar', 'gz', 'rar', '7z', 'bz2'].includes(ext)) {
    return <FileZip size={size} />;
  }

  return <Document size={size} />;
}

export function FileGrid({
  files,
  selectedFiles,
  onFileClick,
  onFileDoubleClick,
  onContextMenu,
  onSelectAll,
}: FileGridProps) {
  const [isMobile, setIsMobile] = useState(false);
  const lastTapRef = useRef<{ time: number; key: string }>({ time: 0, key: '' });

  useEffect(() => {
    const checkMobile = () => {
      // Check if touch device or small screen
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

  const handleOpenFolder = (file: FileItem, e: React.MouseEvent) => {
    e.stopPropagation();
    onFileDoubleClick(file);
  };

  const allSelected = files.length > 0 && files.every((f) => selectedFiles.has(f.key));
  const someSelected = files.some((f) => selectedFiles.has(f.key)) && !allSelected;

  return (
    <View>
      {/* Select All Checkbox */}
      <Flex alignItems="center" marginBottom="size-200" UNSAFE_style={{ paddingLeft: '8px', paddingRight: '8px' }}>
        <Checkbox
          isSelected={allSelected}
          isIndeterminate={someSelected}
          onChange={(checked) => onSelectAll(checked)}
        >
          {allSelected ? 'Deselect All' : 'Select All'} ({selectedFiles.size}/{files.length})
        </Checkbox>
      </Flex>

      <div className="file-grid">
        {files.map((file) => (
          <View
            key={file.key}
            padding="size-200"
            borderRadius="medium"
            borderWidth="thin"
            borderColor={selectedFiles.has(file.key) ? 'blue-500' : 'transparent'}
            UNSAFE_className="file-item"
            UNSAFE_style={{
              cursor: 'pointer',
              backgroundColor: selectedFiles.has(file.key) ? 'var(--spectrum-global-color-blue-100)' : 'transparent',
              position: 'relative',
            }}
          >
            <div
              onClick={(e) => handleClick(file, e)}
              onDoubleClick={() => !isMobile && onFileDoubleClick(file)}
              onContextMenu={(e) => onContextMenu(e, file)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {getFileIcon(file)}
              <Text
                UNSAFE_style={{
                  textAlign: 'center',
                  wordBreak: 'break-word',
                  fontSize: '0.85rem',
                  lineHeight: '1.2',
                  maxWidth: '100%',
                }}
              >
                {file.name}
              </Text>
              
              {/* Mobile: Show open button for folders */}
              {isMobile && file.type === 'folder' && (
                <ActionButton
                  isQuiet
                  onPress={(e) => handleOpenFolder(file, e as unknown as React.MouseEvent)}
                  UNSAFE_style={{
                    marginTop: '4px',
                    backgroundColor: 'var(--spectrum-global-color-blue-100)',
                    borderRadius: '16px',
                  }}
                >
                  <ChevronRight size="S" />
                  <Text>Buka</Text>
                </ActionButton>
              )}
            </div>
          </View>
        ))}
      </div>
    </View>
  );
}
