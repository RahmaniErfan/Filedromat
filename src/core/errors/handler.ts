import { outro, note } from '@clack/prompts';
import { FiledromatError } from './base.js';

/**
 * Handles errors globally across the Filedromat CLI.
 * Consistent output using @clack/prompts.
 */
export function handleGlobalError(error: unknown, spinner?: any, shouldExitOverride?: boolean) {
  // If a spinner was provided, stop it first
  if (spinner && typeof spinner.stop === 'function') {
    spinner.stop('Operation Failed');
  }

  let title = 'An error occurred';
  let message = 'An unexpected error has occurred. Please check the logs or try again.';
  let exitProcess = true;

  if (error instanceof FiledromatError) {
    title = error.name;
    message = error.message;
    exitProcess = error.shouldExit;
  } else if (error instanceof Error) {
    message = error.message;
    // Map some common errors to more user-friendly messages if needed
    if (message.includes('quota')) {
      title = 'Quota Exceeded';
      message = 'Gemini API Quota exceeded. Please try again later or check your plan.';
    } else if (message.includes('API key')) {
      title = 'API Key Error';
      message = 'Invalid Gemini API Key. Please check your configuration.';
    }
  }

  // Use the override if provided
  if (shouldExitOverride !== undefined) {
    exitProcess = shouldExitOverride;
  }

  note(message, title);
  
  if (exitProcess) {
    outro('Filedromat has stopped due to an error.');
    process.exit(1);
  }
}
