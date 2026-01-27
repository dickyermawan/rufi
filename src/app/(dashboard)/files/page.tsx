'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  View,
  Flex,
  ActionButton,
  Button,
  Text,
  ProgressCircle,
  DialogTrigger,
  Dialog,
  Heading,
  Content,
  ButtonGroup,
  TextField,
  Divider,
  Tooltip,
  TooltipTrigger,
  AlertDialog,
} from '@adobe/react-spectrum';
import FolderAdd from '@spectrum-icons/workflow/FolderAdd';
import UploadToCloud from '@spectrum-icons/workflow/UploadToCloud';
import Refresh from '@spectrum-icons/workflow/Refresh';
import ViewGrid from '@spectrum-icons/workflow/ViewGrid';
import ViewList from '@spectrum-icons/workflow/ViewList';
import Delete from '@spectrum-icons/workflow/Delete';
import Download from '@spectrum-icons/workflow/Download';
import Close from '@spectrum-icons/workflow/Close';
import { useDashboard } from '../DashboardLayoutClient';
import { FileGrid } from '@/components/file-manager/FileGrid';
import { FileList } from '@/components/file-manager/FileList';
import { Breadcrumb } from '@/components/file-manager/Breadcrumb';
import { UploadZone } from '@/components/file-manager/UploadZone';
import { FilePreview } from '@/components/file-manager/FilePreview';
import { FileEditor } from '@/components/file-manager/FileEditor';
import { ContextMenu } from '@/components/file-manager/ContextMenu';
import { DropZoneWrapper } from '@/components/file-manager/DropZoneWrapper';
import { FileItem, Permission } from '@/types';

export default function FilesPage() {
  const t = useTranslations('files');
  const { selectedBucket, buckets } = useDashboard();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [permissions, setPermissions] = useState<Permission | null>(null);

  // Modal states
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [editFile, setEditFile] = useState<FileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Context menu
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    file: FileItem;
  } | null>(null);

  const loadFiles = useCallback(async () => {
    if (!selectedBucket) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        bucketId: selectedBucket,
        path: currentPath,
      });
      const response = await fetch(`/api/files?${params}`);
      const data = await response.json();

      if (data.success) {
        setFiles(data.files);
        setPermissions(data.permissions);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBucket, currentPath]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    setSelectedFiles(new Set());
  };

  const handleFileClick = (file: FileItem, event: React.MouseEvent) => {
    // Ctrl+click for multi-select
    if (event.ctrlKey || event.metaKey) {
      setSelectedFiles((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(file.key)) {
          newSet.delete(file.key);
        } else {
          newSet.add(file.key);
        }
        return newSet;
      });
    } else {
      // Single click just selects
      setSelectedFiles(new Set([file.key]));
    }
  };

  const handleFileDoubleClick = (file: FileItem) => {
    if (file.type === 'folder') {
      handleNavigate(file.key);
    } else {
      setPreviewFile(file);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, file: FileItem) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, file });
    setSelectedFiles(new Set([file.key]));
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !selectedBucket) return;

    try {
      const response = await fetch('/api/files/folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucketId: selectedBucket,
          path: currentPath + newFolderName,
        }),
      });

      if (response.ok) {
        setNewFolderName('');
        setIsNewFolderOpen(false);
        loadFiles();
      }
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleDelete = async (keys: string[]) => {
    if (!selectedBucket) return;

    setIsDeleting(true);
    try {
      const response = await fetch('/api/files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucketId: selectedBucket,
          keys,
        }),
      });

      if (response.ok) {
        setSelectedFiles(new Set());
        loadFiles();
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    const keys = Array.from(selectedFiles);
    if (keys.length === 0) return;
    await handleDelete(keys);
  };

  const handleBulkDownload = async () => {
    if (!selectedBucket) return;
    
    const keys = Array.from(selectedFiles);
    // Filter out folders - only download files
    const fileKeys = keys.filter(key => {
      const file = files.find(f => f.key === key);
      return file && file.type !== 'folder';
    });

    if (fileKeys.length === 0) return;

    setIsDownloading(true);
    try {
      // Download files one by one
      for (const key of fileKeys) {
        const file = files.find(f => f.key === key);
        if (!file) continue;

        const params = new URLSearchParams({
          bucketId: selectedBucket,
          key: file.key,
        });
        const response = await fetch(`/api/files/download-url?${params}`);
        const data = await response.json();

        if (data.url) {
          // Create a temporary link and click it
          const link = document.createElement('a');
          link.href = data.url;
          link.download = file.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Small delay between downloads
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    } catch (error) {
      console.error('Failed to download:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFiles(new Set());
  };

  // Get selected items info
  const selectedCount = selectedFiles.size;
  const selectedFileCount = Array.from(selectedFiles).filter(key => {
    const file = files.find(f => f.key === key);
    return file && file.type !== 'folder';
  }).length;

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedFiles(new Set(files.map((f) => f.key)));
    } else {
      setSelectedFiles(new Set());
    }
  };

  if (!selectedBucket || buckets.length === 0) {
    return (
      <View padding="size-500">
        <Text>{t('noBuckets')}</Text>
      </View>
    );
  }

  return (
    <DropZoneWrapper
      bucketId={selectedBucket}
      path={currentPath}
      canUpload={permissions?.canUpload ?? false}
      onUploadComplete={loadFiles}
    >
      <View height="100%">
      {/* Toolbar */}
      <Flex 
        alignItems="center" 
        justifyContent="space-between" 
        marginBottom="size-200"
        wrap={isMobile ? 'wrap' : 'nowrap'}
        gap="size-100"
      >
        <Breadcrumb path={currentPath} onNavigate={handleNavigate} />

        <Flex gap="size-100" alignItems="center">
          {permissions?.canCreateFolder && (
            <DialogTrigger isOpen={isNewFolderOpen} onOpenChange={setIsNewFolderOpen}>
              {isMobile ? (
                <TooltipTrigger>
                  <ActionButton aria-label={t('newFolder')}>
                    <FolderAdd />
                  </ActionButton>
                  <Tooltip>{t('newFolder')}</Tooltip>
                </TooltipTrigger>
              ) : (
                <ActionButton>
                  <FolderAdd />
                  <Text>{t('newFolder')}</Text>
                </ActionButton>
              )}
              <Dialog>
                <Heading>{t('newFolder')}</Heading>
                <Divider />
                <Content>
                  <TextField
                    label={t('folderName')}
                    value={newFolderName}
                    onChange={setNewFolderName}
                    autoFocus
                  />
                </Content>
                <ButtonGroup>
                  <Button variant="secondary" onPress={() => setIsNewFolderOpen(false)}>
                    {t('cancel')}
                  </Button>
                  <Button variant="accent" onPress={handleCreateFolder}>
                    {t('create')}
                  </Button>
                </ButtonGroup>
              </Dialog>
            </DialogTrigger>
          )}

          {permissions?.canUpload && (
            <DialogTrigger isOpen={isUploadOpen} onOpenChange={setIsUploadOpen}>
              {isMobile ? (
                <TooltipTrigger>
                  <ActionButton aria-label={t('upload')}>
                    <UploadToCloud />
                  </ActionButton>
                  <Tooltip>{t('upload')}</Tooltip>
                </TooltipTrigger>
              ) : (
                <ActionButton>
                  <UploadToCloud />
                  <Text>{t('upload')}</Text>
                </ActionButton>
              )}
              <Dialog size="L">
                <Heading>{t('upload')}</Heading>
                <Divider />
                <Content>
                  <UploadZone
                    bucketId={selectedBucket}
                    path={currentPath}
                    onComplete={() => {
                      setIsUploadOpen(false);
                      loadFiles();
                    }}
                  />
                </Content>
              </Dialog>
            </DialogTrigger>
          )}

          <TooltipTrigger>
            <ActionButton onPress={loadFiles} aria-label={t('refresh')}>
              <Refresh />
            </ActionButton>
            <Tooltip>{t('refresh')}</Tooltip>
          </TooltipTrigger>

          <TooltipTrigger>
            <ActionButton
              isQuiet
              onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              aria-label={viewMode === 'grid' ? t('listView') : t('gridView')}
            >
              {viewMode === 'grid' ? <ViewList /> : <ViewGrid />}
            </ActionButton>
            <Tooltip>{viewMode === 'grid' ? t('listView') : t('gridView')}</Tooltip>
          </TooltipTrigger>
        </Flex>
      </Flex>

      {/* Selection Action Bar */}
      {selectedCount > 0 && (
        <View
          padding="size-150"
          borderRadius="medium"
          marginBottom="size-200"
          UNSAFE_style={{
            backgroundColor: 'var(--spectrum-global-color-blue-100)',
            border: '1px solid var(--spectrum-global-color-blue-400)',
          }}
        >
          <Flex 
            alignItems="center" 
            justifyContent="space-between"
            wrap="wrap"
            gap="size-100"
          >
            <Flex alignItems="center" gap="size-100">
              <Text UNSAFE_style={{ fontWeight: 'bold' }}>
                {selectedCount} {t('selected')}
              </Text>
              <ActionButton isQuiet onPress={clearSelection} aria-label={t('clearSelection')}>
                <Close size="S" />
              </ActionButton>
            </Flex>

            <Flex gap="size-100">
              {/* Download button - only for files, not folders */}
              {permissions?.canDownload && selectedFileCount > 0 && (
                <Button
                  variant="secondary"
                  onPress={handleBulkDownload}
                  isPending={isDownloading}
                >
                  <Download size="S" />
                  <Text>{t('download')} ({selectedFileCount})</Text>
                </Button>
              )}

              {/* Delete button */}
              {permissions?.canDelete && (
                <DialogTrigger>
                  <Button variant="negative">
                    <Delete size="S" />
                    <Text>{t('delete')} ({selectedCount})</Text>
                  </Button>
                  <AlertDialog
                    variant="destructive"
                    title={t('deleteConfirmTitle')}
                    primaryActionLabel={t('delete')}
                    cancelLabel={t('cancel')}
                    onPrimaryAction={handleBulkDelete}
                    isPrimaryActionDisabled={isDeleting}
                  >
                    {t('deleteMultipleConfirm', { count: selectedCount })}
                  </AlertDialog>
                </DialogTrigger>
              )}
            </Flex>
          </Flex>
        </View>
      )}

      {/* File Browser */}
      {isLoading ? (
        <Flex alignItems="center" justifyContent="center" height="size-3000">
          <ProgressCircle aria-label="Loading..." isIndeterminate />
        </Flex>
      ) : files.length === 0 ? (
        <View padding="size-500" UNSAFE_style={{ textAlign: 'center' }}>
          <Text>{t('emptyFolder')}</Text>
        </View>
      ) : viewMode === 'grid' ? (
        <FileGrid
          files={files}
          selectedFiles={selectedFiles}
          onFileClick={handleFileClick}
          onFileDoubleClick={handleFileDoubleClick}
          onContextMenu={handleContextMenu}
          onSelectAll={handleSelectAll}
        />
      ) : (
        <FileList
          files={files}
          selectedFiles={selectedFiles}
          onFileClick={handleFileClick}
          onFileDoubleClick={handleFileDoubleClick}
          onContextMenu={handleContextMenu}
          onSelectAll={handleSelectAll}
        />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          file={contextMenu.file}
          permissions={permissions}
          bucketId={selectedBucket}
          onClose={() => setContextMenu(null)}
          onDelete={() => handleDelete([contextMenu.file.key])}
          onEdit={() => setEditFile(contextMenu.file)}
          onPreview={() => setPreviewFile(contextMenu.file)}
          onRefresh={loadFiles}
        />
      )}

      {/* Preview Modal */}
      {previewFile && (
        <FilePreview
          file={previewFile}
          bucketId={selectedBucket}
          onClose={() => setPreviewFile(null)}
        />
      )}

      {/* Editor Modal */}
      {editFile && (
        <FileEditor
          file={editFile}
          bucketId={selectedBucket}
          onClose={() => setEditFile(null)}
          onSave={() => {
            setEditFile(null);
            loadFiles();
          }}
        />
      )}
    </View>
    </DropZoneWrapper>
  );
}
