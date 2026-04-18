#!/usr/bin/env node

/**
 * CLI entry point for Filedromat.
 * This script will run our TypeScript code using tsx during development,
 * or the compiled code in production.
 */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const devPath = join(__dirname, '../src/index.tsx');
const prodPath = join(__dirname, '../dist/index.js');

let targetPath = prodPath;
let useTsx = false;

// If we are in a development environment (src exists and no dist), use tsx
if (existsSync(devPath) && !existsSync(prodPath)) {
  targetPath = devPath;
  useTsx = true;
}

const args = useTsx 
  ? ['tsx', targetPath, ...process.argv.slice(2)] 
  : [targetPath, ...process.argv.slice(2)];

const command = useTsx ? 'npx' : 'node';

const child = spawn(command, args, {
  stdio: 'inherit',
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
