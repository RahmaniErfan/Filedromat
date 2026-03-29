import { readdir, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import type { FileMetadata } from '../../types/index.js';
import { FileSystemError } from '../errors/fs.js';

/**
 * Scans a directory for files and returns their metadata.
 * Performs a shallow scan (one level deep).
 */
export async function scanDirectory(dirPath: string): Promise<FileMetadata[]> {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    
    const fileMetadataPromises = entries
      .filter(entry => entry.isFile())
      .map(async (entry) => {
        const filePath = join(dirPath, entry.name);
        try {
          const stats = await stat(filePath);
          
          return {
            path: filePath,
            name: entry.name,
            extension: extname(entry.name).slice(1), // Remove the dot
            size: stats.size,
            lastModified: stats.mtime
          } as FileMetadata;
        } catch (error: any) {
          throw new FileSystemError(`Failed to get stats for file: ${entry.name}. ${error.message}`);
        }
      });

    return await Promise.all(fileMetadataPromises);
  } catch (error: any) {
    if (error instanceof FileSystemError) throw error;
    throw new FileSystemError(`Error scanning directory ${dirPath}: ${error.message}`);
  }
}
