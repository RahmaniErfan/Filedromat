import { FiledromatError } from './base.js';

export class FileSystemError extends FiledromatError {
  constructor(message: string, code: string = 'FS_ERROR') {
    super(message, code, true);
  }
}
