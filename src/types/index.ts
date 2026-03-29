export interface FileMetadata {
  path: string;
  name: string;
  extension: string;
  size: number;
  lastModified: Date;
  mimeType?: string;
  hash?: string;
}

export interface FileAction {
  sourcePath: string;
  targetPath: string;
  reason: string;
}

export interface ActionPlan {
  id: string;
  createdAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  actions: FileAction[];
  targetFolder?: string;
}
