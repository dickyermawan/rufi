'use client';

import { useEffect, useRef, useState } from 'react';
import { View, Text, Flex, TextField } from '@adobe/react-spectrum';
import { useTranslations } from 'next-intl';
import Download from '@spectrum-icons/workflow/Download';
import Delete from '@spectrum-icons/workflow/Delete';
import Edit from '@spectrum-icons/workflow/Edit';
import Preview from '@spectrum-icons/workflow/Preview';
import Copy from '@spectrum-icons/workflow/Copy';
import Share from '@spectrum-icons/workflow/Share';
import Rename from '@spectrum-icons/workflow/Rename';
import { FileItem, Permission } from '@/types';

interface ContextMenuProps {
  x: number;
  y: number;
  file: FileItem;
  permissions: Permission | null;
  bucketId: string;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onPreview: () => void;
  onRefresh: () => void;
}

export function ContextMenu({
  x,
  y,
  file,
  permissions,
  bucketId,
  onClose,
  onDelete,
  onEdit,
  onPreview,
  onRefresh,
}: ContextMenuProps) {
  const t = useTranslations('files');
  const menuRef = useRef<HTMLDivElement>(null);
  const [showRename, setShowRename] = useState(false);
  const [newName, setNewName] = useState(file.name);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleDownload = async () => {
    try {
      const response = await fetch(
        `/api/files/download-url?bucketId=${bucketId}&key=${encodeURIComponent(file.key)}`
      );
      if (response.ok) {
        const data = await response.json();
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
    onClose();
  };

  const handleRename = async () => {
    if (!newName || newName === file.name) {
      setShowRename(false);
      return;
    }

    try {
      const response = await fetch('/api/files/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucketId,
          oldKey: file.key,
          newName,
        }),
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error('Rename failed:', error);
    }
    onClose();
  };

  const handleCopy = async () => {
    const newKey = prompt('Enter destination path:', file.key);
    if (!newKey || newKey === file.key) {
      onClose();
      return;
    }

    try {
      const response = await fetch('/api/files/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucketId,
          sourceKey: file.key,
          destinationKey: newKey,
        }),
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error('Copy failed:', error);
    }
    onClose();
  };

  const isTextFile = () => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    return ['txt', 'md', 'json', 'xml', 'yaml', 'yml', 'js', 'ts', 'jsx', 'tsx', 'css', 'html', 'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'h', 'cs', 'php', 'sh', 'bash', 'log', 'ini', 'cfg', 'conf', 'toml'].includes(ext);
  };

  const menuItems = [
    {
      icon: <Preview size="S" />,
      label: t('preview'),
      action: () => { onPreview(); onClose(); },
      show: file.type === 'file',
    },
    {
      icon: <Download size="S" />,
      label: t('download'),
      action: handleDownload,
      show: file.type === 'file' && permissions?.canDownload,
    },
    {
      icon: <Edit size="S" />,
      label: t('edit'),
      action: () => { onEdit(); onClose(); },
      show: file.type === 'file' && permissions?.canEdit && isTextFile(),
    },
    {
      icon: <Rename size="S" />,
      label: t('rename'),
      action: () => setShowRename(true),
      show: permissions?.canRename,
    },
    {
      icon: <Copy size="S" />,
      label: t('copy'),
      action: handleCopy,
      show: permissions?.canCopy,
    },
    {
      icon: <Share size="S" />,
      label: t('share'),
      action: () => { /* TODO: Implement share */ onClose(); },
      show: file.type === 'file' && permissions?.canShare,
    },
    {
      icon: <Delete size="S" />,
      label: t('delete'),
      action: () => { onDelete(); onClose(); },
      show: permissions?.canDelete,
      danger: true,
    },
  ];

  // Adjust position to stay within viewport
  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - 300);

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ left: adjustedX, top: adjustedY }}
    >
      {showRename ? (
        <View padding="size-100">
          <TextField
            label={t('newName')}
            value={newName}
            onChange={setNewName}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') setShowRename(false);
            }}
          />
          <Flex gap="size-100" marginTop="size-100">
            <button onClick={() => setShowRename(false)}>Cancel</button>
            <button onClick={handleRename}>Rename</button>
          </Flex>
        </View>
      ) : (
        menuItems
          .filter((item) => item.show)
          .map((item, index) => (
            <div
              key={index}
              className="context-menu-item"
              onClick={item.action}
              style={item.danger ? { color: 'var(--spectrum-global-color-red-600)' } : {}}
            >
              {item.icon}
              <Text>{item.label}</Text>
            </div>
          ))
      )}
    </div>
  );
}
