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

  useEffect(() => {
    try {
      const dirContents = readdirSync(currentPath);
      const dirs = dirContents.filter(name => {
        try {
          return statSync(join(currentPath, name)).isDirectory() && !name.startsWith('.');
        } catch {
          return false;
        }
      });
      
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
    <Box flexDirection="column">
      <Text color="cyan" bold>Browsing: {currentPath}</Text>
      {error && <Text color="red">{error}</Text>}
      {items.length > 0 && (
        <SelectInput items={items} onSelect={handleSelect} />
      )}
    </Box>
  );
}
