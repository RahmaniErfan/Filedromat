#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { App } from './ui/App.js';
import 'dotenv/config';
import { handleGlobalError } from './core/errors/handler.js';

async function main() {
  const { waitUntilExit } = render(<App />, { alternateBuffer: true });
  await waitUntilExit();
}

main().catch((err) => {
  handleGlobalError(err);
});
