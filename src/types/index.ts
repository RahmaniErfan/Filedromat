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

export interface AIModel {
  id: string;      // e.g., 'gemini-1.5-flash'
  name: string;    // e.g., 'Gemini 1.5 Flash'
  provider: 'google' | 'openai' | 'anthropic';
}
