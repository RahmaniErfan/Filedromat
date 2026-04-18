import { rename, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { ActionPlan } from '../../types/index.js';
import { FileSystemError } from '../errors/fs.js';

/**
 * Executes an approved organization plan by physically moving files.
 * Creates target directories recursively if they don't exist.
 * 
 * @param plan - The ActionPlan containing the list of source and target paths.
 * @returns A promise that resolves when all file operations are complete.
 * @throws {FileSystemError} If a directory cannot be created or a file cannot be moved.
 */
export async function executePlan(plan: ActionPlan): Promise<void> {
  for (const action of plan.actions) {
    try {
      // Ensure the target directory exists
      await mkdir(dirname(action.targetPath), { recursive: true });
      
      // Move the file
      await rename(action.sourcePath, action.targetPath);
      console.log(`Moved: ${action.sourcePath} -> ${action.targetPath}`);
    } catch (error: any) {
      throw new FileSystemError(`Failed to move ${action.sourcePath} to ${action.targetPath}: ${error.message}`);
    }
  }
}
