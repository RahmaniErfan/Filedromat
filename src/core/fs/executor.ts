import { rename, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { ActionPlan } from '../../types/index.js';
import { FileSystemError } from '../errors/fs.js';

/**
 * Executes an approved action plan by moving files to their target paths.
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
