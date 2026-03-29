import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { join, resolve } from 'node:path';
import type { FileMetadata, ActionPlan, AIModel } from '../../types/index.js';
import { generateOrganizationPrompt } from './prompts.js';
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
  modelId: string = 'gemini-2.5-flash'
): Promise<ActionPlan> {
  const prompt = generateOrganizationPrompt(files, targetDir);

  let result;
  try {
    result = await generateObject({
      model: google(modelId),
      schema: z.object({
        actions: z.array(z.object({
          fileName: z.string().describe('The name of the file being moved'),
          targetPath: z.string().describe('The relative target path from the target directory'),
          reason: z.string().describe('Short reason for the categorization')
        }))
      }),
      prompt: prompt,
    });
  } catch (error: any) {
    if (error.message?.includes('quota')) {
      throw new AIError('Gemini API Quota exceeded. Please try again later or check your plan.', 'QUOTA_EXCEEDED');
    }
    if (error.message?.includes('API key')) {
      throw new ConfigError('Invalid Gemini API Key. Please check your config.');
    }
    throw new AIError(`AI Analysis Failed: ${error.message}`);
  }

  const { object } = result;

  // Map the relative paths to absolute paths for the ActionPlan
  const absoluteActions = object.actions.map(action => {
    // Find the original file to get its absolute source path
    const originalFile = files.find(f => f.name === action.fileName);
    const sourcePath = originalFile ? originalFile.path : join(targetDir, action.fileName);
    
    // Ensure targetPath is absolute
    const absoluteTargetPath = resolve(targetDir, action.targetPath);

    return {
      sourcePath,
      targetPath: absoluteTargetPath,
      reason: action.reason
    };
  });

  return {
    id: Math.random().toString(36).substring(7),
    createdAt: new Date(),
    status: 'pending',
    actions: absoluteActions,
    targetFolder: targetDir
  };
}
