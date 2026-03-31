import { generateObject, generateText, type CoreMessage } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { join, resolve } from 'node:path';
import type { FileMetadata, ActionPlan, AIModel, HistoryItem } from '../../types/index.js';
import { generateOrganizationPrompt, generateRefinementSystemPrompt } from './prompts.js';
import { AIError, ConfigError } from '../errors/ai.js';

/**
 * Fetches available AI models from a provider that support content generation.
 */
export async function fetchLiveModels(provider: 'google' | 'openai' | 'anthropic', apiKey: string): Promise<AIModel[]> {
  if (provider === 'google') {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AIError(errorData.error?.message || `Failed to fetch models: ${response.statusText}`, 'FETCH_MODELS_FAILED');
      }

      const data = (await response.json()) as { models: any[] };
      
      const forbiddenTerms = [
        'banana',      // Image models
        'lyria',       // Music models
        'veo',         // Video models
        'imagen',      // Older image models
        'vision',      // Vision-only models
        'embedding',   // Vector models
        'robotics',    // Hardware models
        'gemma',       // Open models (usually too heavy/specific)
        'research',    // Deep Research / specialized agents
        'live',        // Real-time audio models
        'tts'          // Text-to-speech
      ];

      // Filter for models that support generateContent and exclude noise
      const filteredModels = data.models
        .filter(m => {
          const id = m.name.toLowerCase();
          const displayName = m.displayName.toLowerCase();
          
          // 1. Must support generating text content
          const supportsText = m.supportedGenerationMethods.includes('generateContent');
          
          // 2. MUST NOT contain any of our forbidden terms in the ID or Display Name
          const isForbidden = forbiddenTerms.some(term => 
            id.includes(term) || displayName.includes(term)
          );

          // 3. Hide the versioned developer aliases (e.g., -001, -002)
          const isVersioned = /-\d{3}$/.test(id);

          return supportsText && !isForbidden && !isVersioned;
        })
        .map(m => ({
          id: m.name.replace('models/', ''),
          name: m.displayName,
          provider: 'google' as const
        }));

      // Sort: Latest version first, with "Flash" preferred within the same version
      return filteredModels.sort((a, b) => {
        // Helper to extract version number (e.g., "gemini-1.5-flash" -> 1.5, "gemini-3-pro" -> 3)
        const getVersion = (id: string) => {
          const match = id.match(/(\d+(?:\.\d+)?)/);
          return match ? parseFloat(match[1]) : 0;
        };

        const versionA = getVersion(a.id);
        const versionB = getVersion(b.id);

        // 1. Sort by version (descending)
        if (versionA !== versionB) {
          return versionB - versionA;
        }

        // 2. If versions are same, put "Flash" first
        const aIsFlash = a.id.toLowerCase().includes('flash');
        const bIsFlash = b.id.toLowerCase().includes('flash');
        
        if (aIsFlash && !bIsFlash) return -1;
        if (!aIsFlash && bIsFlash) return 1;
        
        return 0;
      });
    } catch (error: any) {
      if (error instanceof AIError) throw error;
      throw new AIError(`Failed to fetch Live Models (Google): ${error.message}`);
    }
  }

  // Placeholder for other providers
  return [];
}

/**
 * Legacy wrapper for fetchLiveModels (Google).
 */
export async function listModels(apiKey: string): Promise<{ name: string; displayName: string }[]> {
  const models = await fetchLiveModels('google', apiKey);
  return models.map(m => ({ name: m.id, displayName: m.name }));
}

/**
 * Proposes an organization plan using a specified Gemini model.
 */
export async function proposeOrganization(
  files: FileMetadata[], 
  targetDir: string,
  modelId: string = 'gemini-2.5-flash',
  instructions: string = '',
  parallelCalls: number = 3
): Promise<ActionPlan> {
  const BATCH_SIZE = 50;
  const chunkedFiles: FileMetadata[][] = [];
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    chunkedFiles.push(files.slice(i, i + BATCH_SIZE));
  }
 
  const allAbsoluteActions: any[] = [];
  const planSummaries: string[] = [];
 
  // Process in parallel batches of size `parallelCalls`
  for (let i = 0; i < chunkedFiles.length; i += parallelCalls) {
    const currentBatch = chunkedFiles.slice(i, i + parallelCalls);
 
    const results = await Promise.all(
      currentBatch.map(async (chunk) => {
        const prompt = generateOrganizationPrompt(chunk, targetDir, instructions);
 
        try {
          const result = await generateObject({
            model: google(modelId),
            schema: z.object({
              planSummary: z.string().describe('A brief 1-sentence summary of the folder structures you created.'),
              actions: z.array(z.object({
                fileName: z.string().describe('The name of the file being moved'),
                targetPath: z.string().describe('The relative destination FOLDER path from the target directory (e.g. "Documents/PDFs")'),
                reason: z.string().describe('Short reason for the categorization')
              }))
            }),
            prompt: prompt,
          });
          return { chunk, result };
        } catch (error: any) {
          if (error.message?.includes('quota')) {
            throw new AIError('Gemini API Quota exceeded. Please try again later or check your plan.', 'QUOTA_EXCEEDED');
          }
          if (error.message?.includes('API key')) {
            throw new ConfigError('Invalid Gemini API Key. Please check your config.');
          }
          throw new AIError(`AI Analysis Failed: ${error.message}`);
        }
      })
    );
 
    for (const { chunk, result } of results) {
      const { object } = result;
 
      const absoluteActions = object.actions.map(action => {
        const originalFile = chunk.find(f => f.name === action.fileName);
        const sourcePath = originalFile ? originalFile.path : join(targetDir, action.fileName);
        const absoluteTargetPath = join(resolve(targetDir), action.targetPath, action.fileName);
 
        return {
          sourcePath,
          targetPath: absoluteTargetPath,
          reason: action.reason
        };
      });
 
      planSummaries.push(object.planSummary);
      allAbsoluteActions.push(...absoluteActions);
    }
  }

  allAbsoluteActions.sort((a, b) => a.targetPath.localeCompare(b.targetPath));

  let finalSummary = planSummaries.join(' ');
  if (planSummaries.length > 1) {
    try {
      const { text } = await generateText({
        model: google(modelId),
        prompt: `You are an AI assistant helping to organize files. A large directory was processed in batches. Here are the summaries of what happened in each batch:\n${planSummaries.map(s => `- ${s}`).join('\n')}\nSynthesize these into a single, concise 1-sentence executive summary describing the overall organization strategy.`
      });
      finalSummary = text.trim();
    } catch (e) {
      // fallback to joined summaries
    }
  }

  return {
    id: Math.random().toString(36).substring(7),
    createdAt: new Date(),
    status: 'pending',
    actions: allAbsoluteActions,
    targetFolder: targetDir,
    summary: finalSummary
  };
}

/**
 * Refines an organization plan based on user feedback.
 */
export async function refineOrganization(
  files: FileMetadata[],
  targetDir: string,
  previousPlan: ActionPlan,
  feedback: string,
  modelId: string = 'gemini-2.5-flash',
  history: HistoryItem[] = [],
  parallelCalls: number = 3
): Promise<ActionPlan> {
  const systemPrompt = generateRefinementSystemPrompt(targetDir);
 
  const BATCH_SIZE = 50;
  const chunkedFiles: FileMetadata[][] = [];
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    chunkedFiles.push(files.slice(i, i + BATCH_SIZE));
  }
 
  const allAbsoluteActions: any[] = [];
  const planSummaries: string[] = [];
 
  // Sliding window: last 4 items (2 turns of user/assistant)
  const recentHistory = history.slice(-4);
  const historyMessages: CoreMessage[] = recentHistory.map(h => ({
    role: h.role,
    content: h.content
  }));
 
  // Process in parallel batches of size `parallelCalls`
  for (let i = 0; i < chunkedFiles.length; i += parallelCalls) {
    const currentBatch = chunkedFiles.slice(i, i + parallelCalls);
 
    const results = await Promise.all(
      currentBatch.map(async (chunk) => {
        // Filter previous actions specific to this chunk's files
        const previousActionsRelative = previousPlan.actions
          .filter(action => chunk.some(f => f.path === action.sourcePath))
          .map(action => ({
            fileName: action.sourcePath.split('/').pop(),
            targetPath: action.targetPath.replace(resolve(targetDir) + '/', ''),
            reason: action.reason
          }));
 
        const fileContext = chunk.map(f => ({
          name: f.name,
          ext: f.extension,
          size: f.size,
          lastModified: typeof f.lastModified === 'string' ? f.lastModified : f.lastModified.toISOString(),
          ...(f.contentSample ? { contentSample: f.contentSample } : {})
        }));
 
        const messages: CoreMessage[] = [
          ...historyMessages,
          {
            role: 'user',
            content: `File List:\n${JSON.stringify(fileContext)}\n\nCurrent Plan:\n${JSON.stringify(previousActionsRelative)}\n\nUser Feedback: ${feedback}\n\nPlease update the organization plan based strictly on this feedback.`
          }
        ];
 
        try {
          const result = await generateObject({
            model: google(modelId),
            schema: z.object({
              planSummary: z.string().describe('A brief 1-sentence summary of the folder structures you created.'),
              actions: z.array(z.object({
                fileName: z.string().describe('The name of the file being moved'),
                targetPath: z.string().describe('The relative destination FOLDER path from the target directory (e.g. "Documents/PDFs")'),
                reason: z.string().describe('Short reason for the categorization')
              }))
            }),
            system: systemPrompt,
            messages: messages,
          });
          return { chunk, result };
        } catch (error: any) {
          if (error.message?.includes('quota')) {
            throw new AIError('Gemini API Quota exceeded. Please try again later or check your plan.', 'QUOTA_EXCEEDED');
          }
          if (error.message?.includes('API key')) {
            throw new ConfigError('Invalid Gemini API Key. Please check your config.');
          }
          throw new AIError(`AI Refinement Failed: ${error.message}`);
        }
      })
    );
 
    for (const { chunk, result } of results) {
      const { object } = result;
 
      const absoluteActions = object.actions.map(action => {
        const originalFile = chunk.find(f => f.name === action.fileName);
        const sourcePath = originalFile ? originalFile.path : join(targetDir, action.fileName);
        const absoluteTargetPath = join(resolve(targetDir), action.targetPath, action.fileName);
 
        return {
          sourcePath,
          targetPath: absoluteTargetPath,
          reason: action.reason
        };
      });
 
      planSummaries.push(object.planSummary);
      allAbsoluteActions.push(...absoluteActions);
    }
  }

  allAbsoluteActions.sort((a, b) => a.targetPath.localeCompare(b.targetPath));

  let finalSummary = planSummaries.join(' ');
  if (planSummaries.length > 1) {
    try {
      const { text } = await generateText({
        model: google(modelId),
        prompt: `You are an AI assistant helping to organize files. A large directory was processed in batches. Here are the summaries of what happened in each batch:\n${planSummaries.map(s => `- ${s}`).join('\n')}\nSynthesize these into a single, concise 1-sentence executive summary describing the overall organization strategy.`
      });
      finalSummary = text.trim();
    } catch (e) {
      // fallback to joined summaries
    }
  }

  return {
    id: Math.random().toString(36).substring(7),
    createdAt: new Date(),
    status: 'pending',
    actions: allAbsoluteActions,
    targetFolder: targetDir,
    summary: finalSummary
  };
}
