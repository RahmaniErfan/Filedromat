import { FiledromatError } from './base.js';

export class AIError extends FiledromatError {
  constructor(message: string, code: string = 'AI_ERROR') {
    super(message, code, true);
  }
}

export class ConfigError extends FiledromatError {
  constructor(message: string) {
    super(message, 'CONFIG_ERROR', true);
  }
}
