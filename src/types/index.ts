export interface HistoryItem {
  id: string;
  role: 'user' | 'assistant';
  content: string; // The prompt or the summary
  planId?: string; // Links to an ActionPlan if applicable
  timestamp: string;
}

export interface FileMetadata {
  path: string;
  name: string;
  extension: string;
  size: number;
  lastModified: Date;
  contentSample?: string;
  mimeType?: string;
  hash?: string;
}

export interface FileAction {
  sourcePath: string;
  targetPath: string;
  reason: string;
  status?: 'pending' | 'success' | 'error';
  error?: string;
}

export interface ExecutionSummary {
  successCount: number;
  errorCount: number;
  errors: { path: string; message: string }[];
}

export interface ActionPlan {
  id: string;
  createdAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  actions: FileAction[];
  targetFolder?: string;
  summary?: string;
  result?: ExecutionSummary;
}

export interface AIModel {
  id: string;      // e.g., 'gemini-1.5-flash'
  name: string;    // e.g., 'Gemini 1.5 Flash'
  provider: 'google' | 'openai' | 'anthropic';
}
