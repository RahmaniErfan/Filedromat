import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import { DirectoryBrowser } from './DirectoryBrowser.js';

interface FileSelectionProps {
  targetPath: string;
  setTargetPath: (val: string) => void;
  submitPath: (val: string) => void;
  onCancel?: () => void;
  onGlobalHotkey?: (input: string) => void;
}

type Step = 'CHOOSE_METHOD' | 'MANUAL' | 'BROWSE';

export function FileSelection({ targetPath, setTargetPath, submitPath, onCancel, onGlobalHotkey }: FileSelectionProps) {
  const [step, setStep] = useState<Step>('CHOOSE_METHOD');

  useInput((input, key) => {
    if ((step === 'MANUAL' || step === 'BROWSE') && key.escape) {
      setStep('CHOOSE_METHOD');
    } else if (step === 'CHOOSE_METHOD' && key.escape && onCancel) {
      onCancel();
    } else if (step !== 'MANUAL' && onGlobalHotkey) {
      // Pass along standard string inputs like 's', 'q', 'd', 'o'
      onGlobalHotkey(input);
    }
  });

  const handleMethodSelect = (item: any) => {
    if (item.value === '__back__') {
      if (onCancel) onCancel();
    } else if (item.value === 'current') {
      submitPath(process.cwd());
    } else if (item.value === 'browse') {
      setStep('BROWSE');
    } else if (item.value === 'manual') {
      setStep('MANUAL');
    }
  };

  if (step === 'CHOOSE_METHOD') {
    return (
      <Box flexDirection="column">
        <Text>Where would you like to organize files?</Text>
        <SelectInput
          items={[
            { label: '[c] Current Directory (./)', value: 'current' },
            { label: '[i] Browse interactively...', value: 'browse' },
            { label: '[m] Type Path manually', value: 'manual' },
            { label: '[b] Back to Main Menu', value: '__back__' }
          ]}
          onSelect={handleMethodSelect}
        />
      </Box>
    );
  }

  if (step === 'BROWSE') {
    return (
      <DirectoryBrowser
        initialPath={process.cwd()}
        onSelect={(path) => submitPath(path)}
        onCancel={() => setStep('CHOOSE_METHOD')}
      />
    );
  }

  return (
    <Box flexDirection="column">
      <Text>What directory should I organize? <Text dimColor>(Press ESC to go back)</Text></Text>
      <Box>
        <Text color="green">{'> '} </Text>
        <TextInput value={targetPath} onChange={setTargetPath} onSubmit={submitPath} />
      </Box>
    </Box>
  );
}
