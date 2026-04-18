import { executePlan } from '../src/core/fs/executor.ts';
import { mkdir, writeFile, rm, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';

async function test() {
  const testDir = join(tmpdir(), 'filedromat-exec-test-' + Date.now());
  await mkdir(testDir);
  
  const file1 = join(testDir, 'exists.txt');
  const file2 = join(testDir, 'missing.txt');
  
  await writeFile(file1, 'content');
  // file2 is never created
  
  const plan = {
    actions: [
      {
        sourcePath: file1,
        targetPath: join(testDir, 'dest', 'exists_moved.txt'),
        reason: 'test success'
      },
      {
        sourcePath: file2,
        targetPath: join(testDir, 'dest', 'missing_moved.txt'),
        reason: 'test failure'
      }
    ]
  };

  console.log('--- Executing Plan with 1 success and 1 missing file ---');
  const results = await executePlan(plan);
  
  console.log('\nResults Summary:');
  console.log(`Success: ${results.successCount}`);
  console.log(`Errors: ${results.errorCount}`);
  results.errors.forEach(e => console.log(`- Error at ${e.path}: ${e.message}`));

  if (results.successCount === 1 && results.errorCount === 1) {
    console.log('✅ Passed Partial Failure Test');
  } else {
    console.log('❌ Failed Partial Failure Test');
  }

  // Verify file1 was actually moved
  try {
    await access(join(testDir, 'dest', 'exists_moved.txt'));
    console.log('✅ File 1 is at target');
  } catch (e) {
    console.log('❌ File 1 is NOT at target');
  }

  await rm(testDir, { recursive: true, force: true });
}

test().catch(console.error);
