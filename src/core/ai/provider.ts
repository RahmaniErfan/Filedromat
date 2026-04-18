import { generateObject, generateText, type ModelMessage } from 'ai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { join, resolve } from 'node:path';
import type { FileMetadata, ActionPlan, AIModel, HistoryItem } from '../../types/index.js';
import { generateOrganizationPrompt, generateRefinementSystemPrompt } from './prompts.js';
import { AIError, ConfigError } from '../errors/ai.js';

/**
 * Fetches available AI models from a provider that support content generation.
 * 
 * @param provider - The AI provider to fetch models from ('google' or 'anthropic').
 * @param apiKey - The API key for the specified provider.
 * @returns A promise that resolves to an array of supported AI models.
 * @throws {AIError} If the fetch request fails or is denied.
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
      
      // Keywords used to filter out models that are not suitable for general text tasks
      const forbiddenTerms = [
        'banana',      // Image generation
        'lyria',       // Music generation
        'veo',         // Video generation
        'imagen',      // Image generation
        'vision',      // Vision-only specialized models
        'embedding',   // Similarity/Vector models
        'robotics',    // Specialized hardware models
        'gemma',       // Lightweight/Research models
        'research',    // Deep Research or experimental agents
        'live',        // Real-time audio/multimodal models
        'tts'          // Text-to-speech
      ];

      // Filter for models that support generateContent and exclude noise
      const filteredModels = data.models
        .filter(m => {
          const id = m.name.toLowerCase();
          const displayName = m.displayName.toLowerCase();
          
          // 1. Ensure the model supports generating text content
          const supportsText = m.supportedGenerationMethods.includes('generateContent');
          
          // 2. Exclude specialized or experimental models based on keywords
          const isForbidden = forbiddenTerms.some(term => 
            id.includes(term) || displayName.includes(term)
          );

          // 3. Hide legacy versioned developer aliases (e.g., -001, -002) for a cleaner UI
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

  if (provider === 'anthropic') {
    try {
      const client = new Anthropic({ apiKey });
      const response = await client.models.list();
      
      return response.data
        .filter(m => m.type === 'model')
        .map(m => ({
          id: m.id,
          name: m.display_name || m.id,
          provider: 'anthropic' as const
        }))
        .sort((a, b) => {
          // Put newer models first if possible, otherwise alphabetical
          return b.id.localeCompare(a.id);
        });
    } catch (error: any) {
      throw new AIError(`Failed to fetch Live Models (Anthropic): ${error.message}`);
    }
  }

  return [];
}

/**
 * Returns the appropriate AI model instance based on the model ID.
 */
function getModel(modelId: string) {
  if (modelId.startsWith('claude-')) {
    return anthropic(modelId);
  }
  return google(modelId);
}

/**
 * Legacy wrapper for fetchLiveModels (Google).
 */
export async function listModels(apiKey: string): Promise<{ name: string; displayName: string }[]> {
  const models = await fetchLiveModels('google', apiKey);
  return models.map(m => ({ name: m.id, displayName: m.name }));
}

/**
 * Proposes an initial organization plan for a list of files.
 * Uses a sliding batch system to handle large directories within context limits.
 * 
 * @param files - Metadata of files to be organized.
 * @param targetDir - The root directory where organization will happen.
 * @param modelId - The AI model to use for analysis.
 * @param instructions - Optional user-provided custom organization rules.
 * @param parallelCalls - Number of batches to process concurrently.
 * @param fallbackModelId - Optional fallback model if the primary fails.
 * @returns A promise resolving to the final ActionPlan.
 * @throws {AIError} If processing fails or quota is exceeded.
 */
export async function proposeOrganization(
  files: FileMetadata[], 
  targetDir: string,
  modelId: string = 'gemini-2.0-flash',
  instructions: string = '',
  parallelCalls: number = 3,
  fallbackModelId?: string
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
          const runTask = async (id: string) => {
            return await generateObject({
              model: getModel(id),
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
          };

          try {
            const result = await runTask(modelId);
            return { chunk, result };
          } catch (error: any) {
            if (fallbackModelId && fallbackModelId !== modelId) {
              const result = await runTask(fallbackModelId);
              return { chunk, result };
            }
            throw error;
          }
        } catch (error: any) {
          if (error.message?.includes('quota')) {
            throw new AIError('AI API Quota exceeded. Please try again later or check your plan.', 'QUOTA_EXCEEDED');
          }
          if (error.message?.includes('API key')) {
            throw new ConfigError('Invalid AI API Key. Please check your config.');
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
 * Refines an existing organization plan based on user feedback.
 * 
 * @param files - Metadata of files in the current context.
 * @param targetDir - The root directory of the organization.
 * @param previousPlan - The plan currently being reviewed.
 * @param feedback - Natural language feedback from the user.
 * @param modelId - The AI model to use for refinement.
 * @param history - Conversation history for multi-turn refinement.
 * @param parallelCalls - Number of batches to process concurrently.
 * @param fallbackModelId - Optional fallback model if the primary fails.
 * @returns A promise resolving to the updated ActionPlan.
 */
export async function refineOrganization(
  files: FileMetadata[],
  targetDir: string,
  previousPlan: ActionPlan,
  feedback: string,
  modelId: string = 'gemini-2.0-flash',
  history: HistoryItem[] = [],
  parallelCalls: number = 3,
  fallbackModelId?: string
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
  const historyMessages: ModelMessage[] = recentHistory.map(h => ({
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
 
        const messages: ModelMessage[] = [
          ...historyMessages,
          {
            role: 'user',
            content: `File List:\n${JSON.stringify(fileContext)}\n\nCurrent Plan:\n${JSON.stringify(previousActionsRelative)}\n\nUser Feedback: ${feedback}\n\nPlease update the organization plan based strictly on this feedback.`
          }
        ];
 
        try {
          const runRefinement = async (id: string) => {
            return await generateObject({
              model: getModel(id),
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
          };

          try {
            const result = await runRefinement(modelId);
            return { chunk, result };
          } catch (error: any) {
            if (fallbackModelId && fallbackModelId !== modelId) {
              const result = await runRefinement(fallbackModelId);
              return { chunk, result };
            }
            throw error;
          }
        } catch (error: any) {
          if (error.message?.includes('quota')) {
            throw new AIError('AI API Quota exceeded. Please try again later or check your plan.', 'QUOTA_EXCEEDED');
          }
          if (error.message?.includes('API key')) {
            throw new ConfigError('Invalid AI API Key. Please check your config.');
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
