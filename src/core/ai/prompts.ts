import type { FileMetadata } from '../../types/index.js';

/**
 * Generates the prompt for Gemini to categorize files.
 */
export function generateOrganizationPrompt(files: FileMetadata[], targetDir: string, customInstructions?: string): string {
  const fileContext = files.map(f => ({
    name: f.name,
    ext: f.extension,
    size: f.size,
    lastModified: typeof f.lastModified === 'string' ? f.lastModified : f.lastModified.toISOString(),
    ...(f.contentSample ? { contentSample: f.contentSample } : {})
  }));

  const defaultInstructions = `
    - Group by type (e.g., Photos, Documents, Code, Archives).
    - If there are many related files, create sub-folders (e.g., Photos/2024, Photos/Vacation).
    - Be concise in your naming.
  `.trim();

  const activeInstructions = customInstructions && customInstructions.trim() !== '' 
    ? customInstructions 
    : defaultInstructions;

  // Prompt Sandwich Architecture
  
  const systemRules = `You are Filedromat, an AI file system organizer. You must return valid JSON. You must not delete or rename files. Your target paths must be the relative FOLDER path (excluding filename) from ${targetDir}. Return a list of actions with 'fileName', 'targetPath', and 'reason'.`;
  
  // The Meat (User Intent)
  const userIntent = `User Request:\nOrganize the provided files according to these instructions:\n${activeInstructions}`;
  
  // Bottom Bun (Data)
  const dataPayload = `File List:\n${JSON.stringify(fileContext)}`;

  return `${systemRules}\n\n${userIntent}\n\n${dataPayload}`;
}

/**
 * Generates the system prompt for refining an organization plan.
 */
export function generateRefinementSystemPrompt(targetDir: string): string {
  return `You are Filedromat, an AI file system organizer. You must return valid JSON. You must not delete or rename files. Your target paths must be the relative FOLDER path (excluding filename) from ${targetDir}. Return a list of actions with 'fileName', 'targetPath', and 'reason'.

If the user provides feedback on a previous plan, prioritize their specific corrections over your original logic. Only change the paths mentioned or affected by the feedback. Keep the rest of the plan as similar as possible.`;
}
