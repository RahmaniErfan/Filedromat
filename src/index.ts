import { intro, outro, text, password, select, confirm, spinner, note } from '@clack/prompts';
import { scanDirectory } from './core/fs/scanner.js';
import { proposeOrganization, fetchLiveModels } from './core/ai/provider.js';
import { executePlan } from './core/fs/executor.js';
import { loadConfig, saveConfig, DEFAULT_MODEL } from './config/index.js';
import { handleGlobalError } from './core/errors/handler.js';
import { resolve } from 'node:path';
import 'dotenv/config';

async function main() {
  intro('Filedromat - Your AI File Organizer');

  // Initial config load
  let config = await loadConfig();
  
  while (true) {
    const action = await select({
      message: 'Select an action:',
      options: [
        { value: 'organize', label: 'Organize Directory', hint: 'Scan and reorganize files using AI' },
        { value: 'settings', label: 'Settings', hint: 'Manage API keys and providers' },
        { value: 'exit', label: 'Exit', hint: 'Close the application' }
      ]
    });

    if (action === 'exit' || typeof action !== 'string') {
      outro('Goodbye! See you next time.');
      process.exit(0);
    }

    if (action === 'settings') {
      await handleSettings(config);
      // Reload config after settings change
      config = await loadConfig();
      continue;
    }

    if (action === 'organize') {
      const apiKey = config?.geminiApiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      
      // Check for API Key before organizing
      if (!apiKey) {
        note('You need a Gemini API Key to use Filedromat. Please set it in Settings.', 'API Key Missing');
        continue;
      }

      // Use the API key and model from config
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey;
      const modelId = config?.geminiModel || DEFAULT_MODEL;

      const targetDir = await text({
        message: 'What directory should I organize?',
        placeholder: './',
        initialValue: process.cwd(),
        validate: (value) => value.length === 0 ? 'Directory is required' : undefined
      });

      if (typeof targetDir !== 'string') continue;

      const s = spinner();
      
      try {
        s.start('Scanning files...');
        const files = await scanDirectory(resolve(targetDir));
        s.stop(`Scanned ${files.length} files.`);

        if (files.length === 0) {
          note('No files found to organize.', 'Scan Results');
          continue;
        }

        s.start(`AI (${modelId}) is proposing a folder structure...`);
        const plan = await proposeOrganization(files, resolve(targetDir), modelId);
        s.stop('Proposed a new structure!');

        // Show the plan
        note(
          plan.actions.map((a: any) => `${a.sourcePath.split('/').pop()} -> ${a.targetPath.replace(resolve(targetDir) + '/', '')}`).join('\n'),
          'Proposed Actions'
        );

        const approved = await confirm({
          message: 'Apply this organization plan?',
          initialValue: true
        });

        if (approved === true) {
          s.start('Executing reorganization...');
          await executePlan(plan);
          s.stop('Successfully organized!');
        } else {
          note('Organization cancelled by user.', 'Process Info');
        }
      } catch (error: unknown) {
        // Handle error but DON'T exit, so the user can fix settings
        handleGlobalError(error, s, false);
      }
    }
  }
}

async function handleSettings(config: any) {
  const choice = await select({
    message: 'Settings:',
    options: [
      { value: 'update_key', label: 'Update Gemini API Key', hint: 'Paste a new key from Google AI Studio' },
      { value: 'change_model', label: 'Change Gemini Model', hint: `Current: ${config?.geminiModel || DEFAULT_MODEL}` },
      { value: 'back', label: 'Back to Main Menu' }
    ]
  });

  if (choice === 'update_key') {
    const apiKey = await password({
      message: 'Enter your Gemini API Key:',
      validate: (value) => value.length === 0 ? 'API Key is required' : undefined
    });

    if (typeof apiKey === 'string') {
      await saveConfig({ ...config, geminiApiKey: apiKey });
      note('Gemini API Key saved successfully!', 'Settings Updated');
    }
  }

  if (choice === 'change_model') {
    const apiKey = config?.geminiApiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      note('Please set an API Key before changing models.', 'API Key Not Found');
      return;
    }

    const s = spinner();
    s.start('Fetching available models...');
    try {
      const models = await fetchLiveModels('google', apiKey);
      s.stop(`Found ${models.length} compatible models.`);

      const modelId = await select({
        message: 'Select a Gemini model:',
        options: models.map((m: any) => ({
          value: m.id,
          label: m.name,
          hint: m.id
        }))
      });

      if (typeof modelId === 'string') {
        await saveConfig({ ...config, geminiModel: modelId });
        note(`Default model set to ${modelId}`, 'Settings Updated');
      }
    } catch (error: any) {
      s.stop('Failed to fetch models');
      handleGlobalError(error, undefined, false);
    }
  }
}

main().catch((err) => {
  handleGlobalError(err);
});
