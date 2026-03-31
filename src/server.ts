import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { streamSSE } from 'hono/streaming';
import { serveStatic } from '@hono/node-server/serve-static';
import { resolve, dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { existsSync } from 'node:fs';
import { scanDirectory } from './core/fs/scanner.js';
import { proposeOrganization, refineOrganization, fetchLiveModels } from './core/ai/provider.js';
import { executePlan } from './core/fs/executor.js';
import { loadConfig, saveConfig } from './config/index.js';

const app = new Hono();

function expandPath(p: string) {
  if (p.startsWith('~')) {
    return join(homedir(), p.slice(1));
  }
  return resolve(p);
}

// Enable CORS for frontend development
app.use('/api/*', cors());

// API Endpoints
app.get('/api/config', async (c) => {
  const config = await loadConfig();
  return c.json(config || {});
});

app.post('/api/config', async (c) => {
  const config = await c.req.json();
  await saveConfig(config);
  return c.json({ success: true });
});

app.get('/api/models', async (c) => {
  const apiKey = c.req.query('apiKey');
  if (!apiKey) return c.json({ error: 'API Key is required' }, 400);
  try {
    const models = await fetchLiveModels('google', apiKey);
    return c.json(models);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.get('/api/scan', async (c) => {
  const rawPath = c.req.query('path');
  const deepWash = c.req.query('deepWash') === 'true';
  const maxDepth = parseInt(c.req.query('maxDepth') || '1');

  if (!rawPath) return c.json({ error: 'Path is required' }, 400);

  const path = expandPath(rawPath);
  
  if (!existsSync(path)) {
    return c.json({ error: `Directory not found: ${path}` }, 404);
  }

  return streamSSE(c, async (stream) => {
    try {
      const files = await scanDirectory(resolve(path), deepWash, maxDepth, 0, (count) => {
        stream.writeSSE({
          data: JSON.stringify({ status: 'scanning', count }),
          event: 'progress'
        });
      });

      await stream.writeSSE({
        data: JSON.stringify({ status: 'complete', files }),
        event: 'done'
      });
    } catch (error: any) {
      await stream.writeSSE({
        data: JSON.stringify({ error: error.message }),
        event: 'error'
      });
    }
  });
});

app.post('/api/propose', async (c) => {
  const { files, targetDir, modelId, instructions } = await c.req.json();
  try {
    const config = await loadConfig();
    if (config?.geminiApiKey) {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = config.geminiApiKey;
    }
    
    const plan = await proposeOrganization(files, resolve(targetDir), modelId, instructions);
    return c.json(plan);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.post('/api/refine', async (c) => {
  const { files, targetDir, previousPlan, feedback, modelId } = await c.req.json();
  try {
    const config = await loadConfig();
    if (config?.geminiApiKey) {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = config.geminiApiKey;
    }

    const plan = await refineOrganization(files, resolve(targetDir), previousPlan, feedback, modelId);
    return c.json(plan);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.post('/api/execute', async (c) => {
  const plan = await c.req.json();
  try {
    await executePlan(plan);
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.post('/api/export', async (c) => {
  const { plan, format } = await c.req.json();
  if (format === 'json') {
    return c.json(plan);
  } else if (format === 'bash') {
    let script = '#!/bin/bash\n\n';
    for (const action of plan.actions) {
      script += `mkdir -p "$(dirname "${action.targetPath}")"\n`;
      script += `mv "${action.sourcePath}" "${action.targetPath}"\n`;
    }
    return c.text(script);
  }
  return c.json({ error: 'Invalid format' }, 400);
});

// Serve frontend in production
const distPath = resolve('./web/dist');
if (existsSync(distPath)) {
  app.use('/*', serveStatic({ root: './web/dist' }));
}

const port = parseInt(process.env.PORT || '3000');

try {
  const server = serve({
    fetch: app.fetch,
    port
  });
  
  server.on('error', (e: any) => {
    if (e.code === 'EADDRINUSE') {
      console.error(`\n❌ Error: Port ${port} is already in use.`);
      console.error(`   Try running: fuser -k ${port}/tcp`);
      console.error(`   Or run with a different port: PORT=${port + 1} npm run dev:all\n`);
      process.exit(1);
    }
  });

  console.log(`🚀 Filedromat Server is running on http://localhost:${port}`);
} catch (e: any) {
  console.error(`Failed to start server: ${e.message}`);
  process.exit(1);
}
