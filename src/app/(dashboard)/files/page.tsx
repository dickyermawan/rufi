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
  SearchField,
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [permissions, setPermissions] = useState<Permission | null>(null);
  
  // Load view mode from local storage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('rufi_view_mode');
    if (savedViewMode === 'list' || savedViewMode === 'grid') {
      setViewMode(savedViewMode);
    }
  }, []);

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('rufi_view_mode', mode);
  };
  
  // Pagination state
  const [hasMore, setHasMore] = useState(false);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const PAGE_SIZE = 50;

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

  const loadFiles = useCallback(async (append = false, token?: string, search?: string) => {
    if (!selectedBucket) return;

    // Use current state searchQuery if search param is not provided
    const query = search !== undefined ? search : searchQuery;

    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setFiles([]);
      setNextToken(null);
      setHasMore(false);
    }
    
    try {
      const params = new URLSearchParams({
        bucketId: selectedBucket,
        path: currentPath,
        pageSize: PAGE_SIZE.toString(),
      });
      
      if (query) {
        params.set('search', query);
      }
      
      if (token) {
        params.set('continuationToken', token);
      }
      
      const response = await fetch(`/api/files?${params}`);
      const data = await response.json();

      if (data.success) {
        if (append) {
          setFiles(prev => [...prev, ...data.files]);
        } else {
          setFiles(data.files);
        }
        setPermissions(data.permissions);
        setHasMore(data.pagination?.hasMore || false);
        setNextToken(data.pagination?.nextToken || null);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [selectedBucket, currentPath, searchQuery]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    // Debounce handled by SearchField onClear/onSubmit or useEffect if live search needed
    // For native S3 search, it's better to trigger on submit or with delay
  };

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only reload if not initial load (handled by other useEffect)
      if (selectedBucket) {
        loadFiles(false, undefined, searchQuery);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]); // Remove loadFiles from dependency to avoid loop, rely on searchQuery change

  const refreshFiles = () => {
    loadFiles(false);
  };

  const loadMore = () => {
    if (nextToken && !isLoadingMore) {
      loadFiles(true, nextToken);
    }
  };

  // Initial load effect - remove loadFiles dependency to prevent double loading with search effect
  useEffect(() => {
    // Only load if search is empty, otherwise search effect will handle it
    if (!searchQuery) {
      loadFiles();
    }
  }, [currentPath, selectedBucket]); // Reload when path or bucket changes

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
      // Download files one by one using fetch + blob to force download
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
          // Fetch the file as blob and force download
          const fileResponse = await fetch(data.url);
          const blob = await fileResponse.blob();
          const blobUrl = URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = file.name;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up blob URL
          URL.revokeObjectURL(blobUrl);
          
          // Small delay between downloads
          await new Promise(resolve => setTimeout(resolve, 500));
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
      onUploadComplete={refreshFiles}
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
        <Breadcrumb path={currentPath} onNavigate={(path) => {
          setSearchQuery(''); // Clear search when navigating
          handleNavigate(path);
        }} />

        <Flex gap="size-100" alignItems="center" wrap="wrap">
          <SearchField
            aria-label={t('search')}
            placeholder={t('search')}
            value={searchQuery}
            onChange={handleSearch}
            width={isMobile ? "100%" : "size-2400"}
            onClear={() => setSearchQuery('')}
          />

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
            <ActionButton onPress={refreshFiles} aria-label={t('refresh')}>
              <Refresh />
            </ActionButton>
            <Tooltip>{t('refresh')}</Tooltip>
          </TooltipTrigger>

          <TooltipTrigger>
            <ActionButton
              isQuiet
              onPress={() => handleViewModeChange(viewMode === 'grid' ? 'list' : 'grid')}
              aria-label={viewMode === 'grid' ? t('listView') : t('gridView')}
            >
              {viewMode === 'grid' ? <ViewList /> : <ViewGrid />}
            </ActionButton>
            <Tooltip>{viewMode === 'grid' ? t('listView') : t('gridView')}</Tooltip>
          </TooltipTrigger>
        </Flex>
      </Flex>

      {/* File Browser */}
      <View flex={1} UNSAFE_style={{ display: 'flex', flexDirection: 'column' }}>
        {isLoading ? (
          <Flex alignItems="center" justifyContent="center" height="size-3000">
            <ProgressCircle aria-label="Loading..." isIndeterminate />
          </Flex>
        ) : files.length === 0 ? (
          <View padding="size-500" UNSAFE_style={{ textAlign: 'center' }}>
            <Text>{t('emptyFolder')}</Text>
          </View>
        ) : (
          <View>
            {viewMode === 'grid' ? (
              <FileGrid
                files={files}
                selectedFiles={selectedFiles}
                bucketId={selectedBucket}
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
            
            {/* Load More Button */}
            {hasMore && (
              <Flex 
                justifyContent="center" 
                marginTop="size-200" 
                UNSAFE_style={{ 
                  marginBottom: selectedCount > 0 ? '160px' : '32px' 
                }}
              >
                <Button 
                  variant="secondary" 
                  onPress={loadMore} 
                  isPending={isLoadingMore}
                  width="size-2000"
                >
                  <Text>Load More</Text>
                </Button>
              </Flex>
            )}

            {/* Padding for floating action bar */}
            {!hasMore && selectedCount > 0 && (
              <View UNSAFE_style={{ height: '160px' }} />
            )}
          </View>
        )}
      </View>

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
          onRefresh={refreshFiles}
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
            refreshFiles();
          }}
        />
      )}
    </View>

    {/* Floating Selection Action Bar */}
    {selectedCount > 0 && (
      <div
        style={{
          position: 'fixed',
          bottom: isMobile ? '70px' : '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          width: isMobile ? 'calc(100% - 32px)' : 'auto',
          maxWidth: '600px',
        }}
      >
        <View
          padding="size-150"
          borderRadius="large"
          UNSAFE_style={{
            backgroundColor: 'var(--spectrum-global-color-gray-900)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          }}
        >
          <Flex 
            alignItems="center" 
            justifyContent="space-between"
            gap="size-200"
          >
            <Flex alignItems="center" gap="size-100">
              <ActionButton 
                isQuiet 
                onPress={clearSelection} 
                aria-label={t('clearSelection')}
                UNSAFE_style={{ color: 'white' }}
              >
                <Close size="S" />
              </ActionButton>
              <Text UNSAFE_style={{ fontWeight: 'bold', color: 'white', whiteSpace: 'nowrap' }}>
                {selectedCount} {t('selected')}
              </Text>
            </Flex>

            <Flex gap="size-100">
              {/* Download button - only for files, not folders */}
              {permissions?.canDownload && selectedFileCount > 0 && (
                <Button
                  variant="accent"
                  onPress={handleBulkDownload}
                  isPending={isDownloading}
                  UNSAFE_style={{ 
                    minWidth: 'auto',
                    backgroundColor: '#0ea5e9',
                    borderColor: '#0ea5e9',
                  }}
                >
                  <Download size="S" />
                  {!isMobile && <Text>{t('download')}</Text>}
                </Button>
              )}

              {/* Delete button */}
              {permissions?.canDelete && (
                <DialogTrigger>
                  <Button variant="negative" UNSAFE_style={{ minWidth: 'auto' }}>
                    <Delete size="S" />
                    {!isMobile && <Text>{t('delete')}</Text>}
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
      </div>
    )}
    </DropZoneWrapper>
  );
}
