import { readdir, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { open, readFile } from 'node:fs/promises';
import type { FileMetadata } from '../../types/index.js';
import { FileSystemError } from '../errors/fs.js';

const SAFE_EXTENSIONS = new Set(['txt', 'md', 'csv', 'json', 'ts', 'js', 'html', 'jsx', 'tsx', 'css', 'pdf']);
const BATCH_SIZE = 50;

/**
 * Scans a directory for files and returns their metadata.
 * Optionally performs a deepWash (reading file contents) and recurses up to maxDepth.
 */
export async function scanDirectory(
  dirPath: string, 
  deepWash: boolean = false, 
  maxDepth: number = 1, 
  currentDepth: number = 0
): Promise<FileMetadata[]> {
  const allFiles: FileMetadata[] = [];
  
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue; // skip hidden files

      const entryPath = join(dirPath, entry.name);

      if (entry.isDirectory()) {
        if (currentDepth < maxDepth) {
          const subFiles = await scanDirectory(entryPath, deepWash, maxDepth, currentDepth + 1);
          allFiles.push(...subFiles);
        }
      } else if (entry.isFile()) {
        try {
          const stats = await stat(entryPath);
          const ext = extname(entry.name).slice(1).toLowerCase();
          
          const fileMeta: FileMetadata = {
            path: entryPath,
            name: entry.name,
            extension: ext,
            size: stats.size,
            lastModified: stats.mtime
          };

          allFiles.push(fileMeta);
        } catch (error: any) {
          console.warn(`[Warning] Failed to get stats for file: ${entry.name}. ${error.message}`);
        }
      }
    }
  } catch (error: any) {
    if (error instanceof FileSystemError) throw error;
    throw new FileSystemError(`Error scanning directory ${dirPath}: ${error.message}`);
  }

  // If in root call and deepWash is enabled, process safe files in batches
  if (currentDepth === 0 && deepWash) {
    for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
      const batch = allFiles.slice(i, i + BATCH_SIZE);
      
      const operations = batch.map(async (file) => {
        if (!SAFE_EXTENSIONS.has(file.extension) || file.size === 0) {
          return;
        }

        try {
          if (file.extension === 'pdf') {
            // @ts-ignore
            const pdfParse = (await import('pdf-parse')).default || await import('pdf-parse');
            // If it's a namespace import, pdfParse might be the namespace object, but since it's CJS,
            // default is standard or the module itself is standard.
            const parseFn = typeof pdfParse === 'function' ? pdfParse : (pdfParse as any).default;
            const dataBuffer = await readFile(file.path);
            const pdfData = await parseFn(dataBuffer, { max: 1 });
            const text = pdfData.text.trim();
            if (text.length > 0) {
              file.contentSample = text.substring(0, 1000);
            }
          } else {
            let fileHandle = null;
            try {
              fileHandle = await open(file.path, 'r');
              const buffer = Buffer.alloc(1000);
              const { bytesRead } = await fileHandle.read(buffer, 0, 1000, 0);
              if (bytesRead > 0) {
                file.contentSample = buffer.toString('utf8', 0, bytesRead);
              }
            } finally {
              if (fileHandle) {
                await fileHandle.close();
              }
            }
          }
        } catch (err) {
          // gracefully ignore read errors
        }
      });

      await Promise.allSettled(operations);
    }
  }

  return allFiles;
}
