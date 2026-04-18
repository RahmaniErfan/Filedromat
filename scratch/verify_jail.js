import { join, resolve, relative } from 'node:path';

function getJailPath(relPath) {
  if (!relPath) return '/';
  const parts = relPath.split(/[/\\]/);
  if (parts.length <= 1) return '/';
  return parts[0];
}

function test() {
  const targetDir = '/home/erfan/Downloads';
  const testCases = [
    { name: 'Root File', path: 'file.txt', expectedJail: '/' },
    { name: 'File in Subdir', path: 'Applications/file.apk', expectedJail: 'Applications' },
    { name: 'File in Deep Subdir', path: 'Photos/2024/Jan/img.jpg', expectedJail: 'Photos' },
  ];

  console.log('--- Testing Jail Identification ---');
  testCases.forEach(tc => {
    const jail = getJailPath(tc.path);
    console.log(`${tc.name}: ${tc.path} -> Jail: ${jail} ${jail === tc.expectedJail ? '✅' : '❌'}`);
  });

  console.log('\n--- Testing Guardrail Logic ---');
  const guardrailTests = [
    { 
      jail: 'Applications', 
      proposed: 'Applications/Software/app.apk', 
      shouldPass: true 
    },
    { 
      jail: 'Applications', 
      proposed: 'Games/app.apk', 
      shouldPass: false 
    },
    { 
      jail: 'Applications', 
      proposed: 'Applications_Old/app.apk', // String prefix attack
      shouldPass: false 
    },
    { 
      jail: '/', 
      proposed: 'Anything/file.txt', 
      shouldPass: true 
    }
  ];

  guardrailTests.forEach(gt => {
    const resolvedTarget = resolve(targetDir);
    const absoluteTargetPath = join(resolvedTarget, gt.proposed);
    let passed = false;

    if (gt.jail === '/') {
      passed = true; // Root jail allows anything
    } else {
      const resolvedJail = join(resolvedTarget, gt.jail);
      const relativeToJail = relative(resolvedJail, absoluteTargetPath);
      const isOut = relativeToJail.startsWith('..') || relativeToJail.startsWith('/') || relativeToJail.startsWith('\\');
      passed = !isOut;
    }

    console.log(`Jail [${gt.jail}] -> Proposed [${gt.proposed}]: ${passed ? 'ALLOWED' : 'BLOCKED'} ${passed === gt.shouldPass ? '✅' : '❌'}`);
  });
}

test();
