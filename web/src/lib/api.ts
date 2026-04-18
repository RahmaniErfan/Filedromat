import type { ActionPlan, FileMetadata, AIModel, HistoryItem } from '../../../src/types/index.js';

async function handleResponse(res: Response) {
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

/**
 * Fetches the current application configuration from the backend.
 */
export async function fetchConfig() {
  const res = await fetch('/api/config');
  return handleResponse(res);
}

/**
 * Saves the application configuration to the backend.
 * @param config - The new AppConfig object.
 */
export async function saveConfig(config: any) {
  const res = await fetch('/api/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  return handleResponse(res);
}

/**
 * Fetches available AI models for the given provider and API key.
 */
export async function fetchModels(apiKey: string, provider: 'google' | 'anthropic' = 'google'): Promise<AIModel[]> {
  const res = await fetch(`/api/models?apiKey=${encodeURIComponent(apiKey)}&provider=${provider}`);
  return handleResponse(res);
}

/**
 * Initiates a directory scan. PROGRESS is streamed via Server-Sent Events (SSE).
 * 
 * @param path - The absolute path to scan.
 * @param deepWash - Whether to perform deep content analysis.
 * @param maxDepth - Maximum recursion depth.
 * @param onProgress - Callback for progress updates.
 * @returns A promise that resolves when the scan is complete.
 */
export function scanDirectory(
  path: string,
  deepWash: boolean,
  maxDepth: number,
  onProgress: (count: number) => void
): Promise<FileMetadata[]> {
  return new Promise((resolve, reject) => {
    const eventSource = new EventSource(
      `/api/scan?path=${encodeURIComponent(path)}&deepWash=${deepWash}&maxDepth=${maxDepth}`
    );

    eventSource.addEventListener('progress', (e) => {
      const { count } = JSON.parse(e.data);
      onProgress(count);
    });

    eventSource.addEventListener('done', (e) => {
      const { files } = JSON.parse(e.data);
      eventSource.close();
      resolve(files);
    });

    eventSource.addEventListener('error', (e: any) => {
      const data = JSON.parse(e.data || '{}');
      eventSource.close();
      reject(new Error(data.error || 'Scan failed'));
    });

    eventSource.onerror = () => {
      eventSource.close();
      reject(new Error('Connection failed'));
    };
  });
}

/**
 * Requests the AI to propose an organization plan.
 */
export async function proposeOrganization(
  files: FileMetadata[],
  targetDir: string,
  modelId: string,
  instructions: string
): Promise<ActionPlan> {
  const res = await fetch('/api/propose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files, targetDir, modelId, instructions }),
  });
  return handleResponse(res);
}

/**
 * Refines a proposal based on user feedback.
 */
export async function refineOrganization(
  files: FileMetadata[],
  targetDir: string,
  previousPlan: ActionPlan,
  feedback: string,
  modelId: string,
  history: HistoryItem[]
): Promise<ActionPlan> {
  const res = await fetch('/api/refine', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files, targetDir, previousPlan, feedback, modelId, history }),
  });
  return handleResponse(res);
}

/**
 * Executes the approved organization plan on the local filesystem.
 */
export async function executePlan(plan: ActionPlan) {
  const res = await fetch('/api/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(plan),
  });
  return handleResponse(res);
}

export async function exportPlan(plan: ActionPlan, format: 'json' | 'bash') {
  const res = await fetch('/api/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan, format }),
  });
  if (format === 'bash') {
    if (!res.ok) throw new Error('Failed to export bash script');
    return res.text();
  }
  return handleResponse(res);
}

export async function fetchSuggestions(path: string): Promise<string[]> {
  const res = await fetch(`/api/suggestions?path=${encodeURIComponent(path)}`);
  return handleResponse(res);
}
