import { scanDirectory } from '../src/core/fs/scanner.ts';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

async function test() {
  const testDir = join(tmpdir(), 'filedromat-test-' + Date.now());
  await mkdir(testDir);
  await writeFile(join(testDir, 'root.txt'), 'root content');
  
  const subDir = join(testDir, 'subdir');
  await mkdir(subDir);
  await writeFile(join(subDir, 'sub.txt'), 'sub content');

  const subSubDir = join(subDir, 'subsubdir');
  await mkdir(subSubDir);
  await writeFile(join(subSubDir, 'subsub.txt'), 'subsub content');

  console.log('--- Testing Depth 0 (Root Only) ---');
  const files0 = await scanDirectory(testDir, false, 0);
  console.log('Found files:', files0.map(f => f.name));
  if (files0.length === 1 && files0[0].name === 'root.txt') {
    console.log('✅ Passed Depth 0');
  } else {
    console.log('❌ Failed Depth 0');
  }

  console.log('\n--- Testing Depth 1 (Root + Children) ---');
  const files1 = await scanDirectory(testDir, false, 1);
  console.log('Found files:', files1.map(f => f.name));
  if (files1.length === 2 && files1.some(f => f.name === 'root.txt') && files1.some(f => f.name === 'sub.txt')) {
    console.log('✅ Passed Depth 1');
  } else {
    console.log('❌ Failed Depth 1');
  }

  await rm(testDir, { recursive: true, force: true });
}

test().catch(console.error);
