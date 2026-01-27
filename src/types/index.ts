export interface User {
  id: string;
  username: string;
  isRoot: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BucketAccess {
  id: string;
  userId: string;
  bucketId: string;
  homeDir: string;
  canList: boolean;
  canUpload: boolean;
  canDownload: boolean;
  canDelete: boolean;
  canRename: boolean;
  canCopy: boolean;
  canCreateFolder: boolean;
  canEdit: boolean;
  canShare: boolean;
}

export interface Bucket {
  id: string;
  name: string;
  endpoint: string;
  region: string;
  isDefault: boolean;
}

export interface SharedLink {
  id: string;
  userId: string;
  bucketId: string;
  path: string;
  token: string;
  expiresAt: Date | null;
  password: string | null;
  createdAt: Date;
}

export interface FileItem {
  key: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  lastModified?: Date;
  contentType?: string;
}

export interface Permission {
  canList: boolean;
  canUpload: boolean;
  canDownload: boolean;
  canDelete: boolean;
  canRename: boolean;
  canCopy: boolean;
  canCreateFolder: boolean;
  canEdit: boolean;
  canShare: boolean;
}

export const DEFAULT_PERMISSIONS: Permission = {
  canList: true,
  canUpload: false,
  canDownload: true,
  canDelete: false,
  canRename: false,
  canCopy: false,
  canCreateFolder: false,
  canEdit: false,
  canShare: false,
};

export const FULL_PERMISSIONS: Permission = {
  canList: true,
  canUpload: true,
  canDownload: true,
  canDelete: true,
  canRename: true,
  canCopy: true,
  canCreateFolder: true,
  canEdit: true,
  canShare: true,
};

export interface SessionPayload {
  userId: string;
  sessionId: string;
  exp: number;
  [key: string]: unknown;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
