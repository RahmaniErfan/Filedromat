import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';

interface ScanOptionsProps {
  onComplete: (options: { 
    deepWash: boolean; 
    enforceBoundaries: boolean; 
    maxDepth: number;
  }) => void;
  onCancel: () => void;
  onGlobalHotkey?: (input: string) => void;
}

export function ScanOptions({ onComplete, onCancel, onGlobalHotkey }: ScanOptionsProps) {
  const [step, setStep] = useState(0); // 0: deepWash, 1: enforceBoundaries, 2: maxDepth
  const [deepWash, setDeepWash] = useState(false);
  const [enforceBoundaries, setEnforceBoundaries] = useState(true);
  const [maxDepthInput, setMaxDepthInput] = useState('1');

  useInput((input, key) => {
    if (key.escape) {
      if (step > 0) {
        setStep(step - 1);
      } else {
        onCancel();
      }
    } else if (step === 0 && onGlobalHotkey) {
      onGlobalHotkey(input);
    }
  });

  if (step === 0) {
    return (
      <Box flexDirection="column">
        <Text bold>Enable Deep Wash?</Text>
        <Text color="gray">Extracts file text for high-accuracy sorting & summaries</Text>
        <Box marginTop={1}>
          <SelectInput 
            items={[
              { label: 'No (Faster, relies on filename)', value: 'no' },
              { label: 'Yes (Reads safe file contents)', value: 'yes' },
              { label: 'Cancel', value: 'cancel' }
            ]} 
            onSelect={(item) => {
              if (item.value === 'cancel') {
                onCancel();
              } else {
                setDeepWash(item.value === 'yes');
                setStep(1);
              }
            }} 
          />
        </Box>
      </Box>
    );
  }

  if (step === 1) {
    return (
      <Box flexDirection="column">
        <Text bold>Enforce Folder Boundaries?</Text>
        <Text color="gray">Prevents AI from moving files out of their current top-level folders</Text>
        <Box marginTop={1}>
          <SelectInput 
            items={[
              { label: 'Yes (Lock subfolders - SAFER)', value: 'yes' },
              { label: 'No (Allow full reorganization)', value: 'no' }
            ]} 
            onSelect={(item) => {
              setEnforceBoundaries(item.value === 'yes');
              setStep(2);
            }} 
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text bold>Max Folder Depth?</Text>
      <Text color="gray">(e.g. 1 = current folder only, 2 = 1 level deep)</Text>
      <Text dimColor>Press ESC to go back</Text>
      <Box marginTop={1}>
        <Text color="green">{'> '} </Text>
        <TextInput 
          value={maxDepthInput} 
          onChange={setMaxDepthInput} 
          onSubmit={(val) => {
            const parsed = parseInt(val, 10);
            onComplete({
              deepWash,
              enforceBoundaries,
              maxDepth: isNaN(parsed) ? 1 : Math.max(0, parsed)
            });
          }} 
        />
      </Box>
    </Box>
  );
}
