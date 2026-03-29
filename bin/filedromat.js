#!/usr/bin/env node

/**
 * CLI entry point for Filedromat.
 * This script will run our TypeScript code using tsx during development,
 * or the compiled code in production.
 */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// If we are in development, run using 'tsx'
// If we are in production, run 'dist/index.js'
const devPath = join(__dirname, '../src/index.ts');
const prodPath = join(__dirname, '../dist/index.js');

// For now, let's just log a message since we are initializing
console.log('🧺 Filedromat - Your AI File Organizer');
console.log('Scanning files...');

// This will eventually spawn the actual logic
/*
spawn('npx', ['tsx', devPath, ...process.argv.slice(2)], {
  stdio: 'inherit',
});
*/
