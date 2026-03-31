import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

const CONFIG_DIR = join(homedir(), '.filedromat');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export interface AppConfig {
  geminiApiKey: string;
  geminiModel?: string;
  parallelCalls?: number;
}

export const DEFAULT_MODEL = 'gemini-2.5-flash';

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
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Saves the application configuration.
 */
export async function saveConfig(config: AppConfig) {
  await ensureConfigDir();
  await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}
