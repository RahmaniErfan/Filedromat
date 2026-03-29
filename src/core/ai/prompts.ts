import type { FileMetadata } from '../../types/index.js';

/**
 * Generates the prompt for Gemini to categorize files.
 */
export function generateOrganizationPrompt(files: FileMetadata[], targetDir: string): string {
  const fileContext = files.map(f => ({
    name: f.name,
    ext: f.extension,
    size: f.size,
    lastModified: f.lastModified.toISOString()
  }));

  return `
    You are Filedromat, an AI file system organizer.
    You will be provided with a list of files in ${targetDir}.
    Your task is to propose a modern, logical folder structure to organize these files.

    Rules:
    - Group by type (e.g., Photos, Documents, Code, Archives).
    - If there are many related files, create sub-folders (e.g., Photos/2024, Photos/Vacation).
    - Be concise in your naming.
    - Return a list of actions with 'fileName' and 'targetPath'.
    - 'targetPath' must be relative to ${targetDir}.

    Data:
    Files: ${JSON.stringify(fileContext)}
  `;
}
