import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

const CONFIG_DIR = join(homedir(), '.filedromat');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export interface AppConfig {
  geminiApiKey: string;
  geminiModel?: string;
  anthropicApiKey?: string;
  anthropicModel?: string;
  fallbackModelId?: string;
  parallelCalls?: number;
  defaultThinkingIntensity?: 'none' | 'low' | 'medium' | 'high';
}

export const DEFAULT_MODEL = 'gemini-2.0-flash';

export const DEFAULT_PARALLEL_CALLS = 3;

/**
 * Ensures the config directory exists.
 */
export async function ensureConfigDir() {
  await mkdir(CONFIG_DIR, { recursive: true });
}

/**
 * Loads the application configuration.
 */
export async function loadConfig(): Promise<AppConfig | null> {
  try {
    const data = await readFile(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(data);
    return {
      parallelCalls: DEFAULT_PARALLEL_CALLS,
      ...config
    };
  } catch {
    return { parallelCalls: DEFAULT_PARALLEL_CALLS } as AppConfig;
  }
}

/**
 * Saves the application configuration.
 */
export async function saveConfig(config: AppConfig) {
  await ensureConfigDir();
  await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}
