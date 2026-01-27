'use client';

import { useState, useEffect, useRef } from 'react';
import { View, Text, Checkbox, Flex } from '@adobe/react-spectrum';
import FolderOpen from '@spectrum-icons/workflow/FolderOpen';
import Document from '@spectrum-icons/workflow/Document';
import Image from '@spectrum-icons/workflow/Image';
import FileCode from '@spectrum-icons/workflow/FileCode';
import FileTxt from '@spectrum-icons/workflow/FileTxt';
import FileZip from '@spectrum-icons/workflow/FileZip';
import VideoFilled from '@spectrum-icons/workflow/VideoFilled';
import { FileItem } from '@/types';

interface FileGridProps {
  files: FileItem[];
  selectedFiles: Set<string>;
  onFileClick: (file: FileItem, event: React.MouseEvent) => void;
  onFileDoubleClick: (file: FileItem) => void;
  onContextMenu: (e: React.MouseEvent, file: FileItem) => void;
  onSelectAll: (selected: boolean) => void;
}

function getFileIcon(file: FileItem) {
  if (file.type === 'folder') {
    return <FolderOpen size="XXL" />;
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) {
    return <Image size="XXL" aria-label="Image file" />;
  }
  if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) {
    return <VideoFilled size="XXL" />;
  }
  if (['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(ext)) {
    return <Document size="XXL" />;
  }
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'h', 'cs', 'php'].includes(ext)) {
    return <FileCode size="XXL" />;
  }
  if (['txt', 'md', 'json', 'xml', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf', 'log'].includes(ext)) {
    return <FileTxt size="XXL" />;
  }
  if (['zip', 'tar', 'gz', 'rar', '7z', 'bz2'].includes(ext)) {
    return <FileZip size="XXL" />;
  }

  return <Document size="XXL" />;
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
      // On mobile: single tap on folder opens it, single tap on file selects it
      if (file.type === 'folder') {
        onFileDoubleClick(file);
        return;
      }
      
      // For files: double-tap detection (within 300ms) to preview
      const now = Date.now();
      const lastTap = lastTapRef.current;
      
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
            </div>
          </View>
        ))}
      </div>
    </View>
  );
}
