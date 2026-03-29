import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import { resolve, join, basename } from 'node:path';
import { readdirSync, statSync } from 'node:fs';

interface DirectoryBrowserProps {
  initialPath?: string;
  onSelect: (path: string) => void;
  onCancel: () => void;
}

export function DirectoryBrowser({ initialPath = process.cwd(), onSelect, onCancel }: DirectoryBrowserProps) {
  const [currentPath, setCurrentPath] = useState(resolve(initialPath));
  const [items, setItems] = useState<{label: string, value: string}[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fileCount, setFileCount] = useState(0);

  useEffect(() => {
    try {
      const dirContents = readdirSync(currentPath);
      let fCount = 0;
      const dirs = dirContents.filter(name => {
        try {
          if (name.startsWith('.')) return false; // skip hidden files
          const stat = statSync(join(currentPath, name));
          if (stat.isDirectory()) return true;
          if (stat.isFile()) fCount++;
          return false;
        } catch {
          return false;
        }
      });
      
      setFileCount(fCount);
      
      const selectItems = [
        { label: '📁 [Organize this directory]', value: '.' },
        { label: '⬅️  [Go Up / Parent Directory]', value: '..' },
        ...dirs.sort().map(d => ({ label: `📁 ${d}`, value: d })),
        { label: '❌ [Cancel]', value: '__cancel__' }
      ];
      setItems(selectItems);
      setError(null);
    } catch (e: any) {
      setError(`Cannot read directory: ${e.message}`);
    }
  }, [currentPath]);

  const handleSelect = (item: {value: string}) => {
    if (item.value === '__cancel__') {
      onCancel();
    } else if (item.value === '.') {
      onSelect(currentPath);
    } else if (item.value === '..') {
      setCurrentPath(resolve(currentPath, '..'));
    } else {
      setCurrentPath(resolve(currentPath, item.value));
    }
  };

  return (
    <Box flexDirection="column" paddingBottom={1}>
      <Text color="cyan" bold>Browsing: {currentPath}</Text>
      <Text dimColor>↳ Contains {fileCount} file{fileCount === 1 ? '' : 's'}</Text>
      
      {error && <Box marginTop={1}><Text color="red">{error}</Text></Box>}
      {items.length > 0 && (
        <SelectInput items={items} onSelect={handleSelect} />
      )}
    </Box>
  );
}
