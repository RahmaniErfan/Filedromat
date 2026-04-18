import { rename, mkdir, access } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { ActionPlan, ExecutionSummary } from '../../types/index.js';
import { FileSystemError } from '../errors/fs.js';

/**
 * Executes an approved organization plan by physically moving files.
 * Creates target directories recursively if they don't exist.
 * 
 * @param plan - The ActionPlan containing the list of source and target paths.
 * @returns A promise that resolves to an ExecutionSummary.
 */
export async function executePlan(plan: ActionPlan): Promise<ExecutionSummary> {
  const summary: ExecutionSummary = {
    successCount: 0,
    errorCount: 0,
    errors: []
  };

  for (const action of plan.actions) {
    try {
      // 1. Verify source existence
      try {
        await access(action.sourcePath);
      } catch (e) {
        throw new Error('File missing or inaccessible');
      }

      // 2. Ensure the target directory exists
      await mkdir(dirname(action.targetPath), { recursive: true });
      
      // 3. Move the file
      await rename(action.sourcePath, action.targetPath);
      
      action.status = 'success';
      summary.successCount++;
      console.log(`Moved: ${action.sourcePath} -> ${action.targetPath}`);
    } catch (error: any) {
      action.status = 'error';
      action.error = error.message;
      summary.errorCount++;
      summary.errors.push({
        path: action.sourcePath,
        message: error.message
      });
      console.error(`Failed: ${action.sourcePath}. Reason: ${error.message}`);
    }
  }

  return summary;
}
