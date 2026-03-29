import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import type { FileMetadata } from '../../types/index.js';

interface InstructionInputProps {
  files: FileMetadata[];
  onInstructionsSubmit: (instructions: string) => void;
  onCancel: () => void;
  onGlobalHotkey?: (input: string) => void;
}

export function InstructionInput({ files, onInstructionsSubmit, onCancel, onGlobalHotkey }: InstructionInputProps) {
  const [showRaw, setShowRaw] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customInput, setCustomInput] = useState('');

  const numFiles = files.length;
  const numTypes = new Set(files.map(f => f.extension)).size;

  useInput((input, key) => {
    if (key.escape) {
      if (customMode) {
        setCustomMode(false);
      } else {
        onCancel();
      }
    } else if (!customMode && onGlobalHotkey) {
      onGlobalHotkey(input);
    }
  });

  const handleSelect = (item: any) => {
    if (item.value === '__custom__') {
        setCustomMode(true);
    } else if (item.value === '__toggle_raw__') {
        setShowRaw(!showRaw);
    } else if (item.value === '__back__') {
        onCancel();
    } else {
        onInstructionsSubmit(item.value);
    }
  };

  const presets = [
    { label: '[s] Smart Organization (Default)', value: '' },
    { label: '[w] The Workspace Reset (Move installers, archives, screenshots)', value: 'Move installers (.exe, .dmg), archives (.zip), and screenshots into a Cleanup/[Date] folder, keep documents organized by project name.' },
    { label: '[m] Media Sort (Group by Camera/Resolution/Date)', value: 'Group images and videos by Camera Model or Resolution (if available in metadata) or just Year/Month.' },
    { label: '[d] Developer Mode (Group code projects, configs)', value: 'Identify code projects (folders with package.json or .git) and move them to a Developer directory, while putting loose config files into config_backups.' },
    { label: '[c] Custom Prompt...', value: '__custom__' },
    { label: `[v] ${showRaw ? 'Hide' : 'View'} Raw Metadata Payload`, value: '__toggle_raw__' },
    { label: '[b] Back', value: '__back__' }
  ];

  if (customMode) {
    return (
      <Box flexDirection="column" borderStyle="round" borderColor="cyan" padding={1}>
        <Text color="yellow">🧺 Loading the Machine...</Text>
        <Text>Enter your custom rules for organizing these {numFiles} files:</Text>
        <Text dimColor>(Press ESC to go back to presets)</Text>
        <Box marginTop={1}>
          <Text color="green">{'> '} </Text>
          <TextInput 
            value={customInput} 
            onChange={setCustomInput} 
            onSubmit={(val) => onInstructionsSubmit(val)} 
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" padding={1}>
      <Text color="yellow" bold>🧺 Loading the Machine:</Text>
      <Text italic>We're sending {numFiles} filenames, {numTypes} file types, and timestamp data to the AI.</Text>
      <Text dimColor>No file contents will be read.</Text>
      
      {showRaw && (
        <Box marginTop={1} padding={1} borderStyle="single" borderColor="gray">
          <Text dimColor>
            {JSON.stringify(files.slice(0, 3).map(f => ({ name: f.name, ext: f.extension, size: f.size })), null, 2)}
            {files.length > 3 ? '\n... (truncated)' : ''}
          </Text>
        </Box>
      )}

      <Box marginTop={1} flexDirection="column">
        <Text bold>How would you like to organize?</Text>
        <SelectInput items={presets} onSelect={handleSelect} />
      </Box>
    </Box>
  );
}
