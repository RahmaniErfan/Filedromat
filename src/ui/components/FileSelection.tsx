import React from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

interface FileSelectionProps {
  targetPath: string;
  setTargetPath: (val: string) => void;
  submitPath: (val: string) => void;
}

export function FileSelection({ targetPath, setTargetPath, submitPath }: FileSelectionProps) {
  return (
    <Box flexDirection="column">
      <Text>What directory should I organize?</Text>
      <Box>
        <Text color="green">{'> '} </Text>
        <TextInput value={targetPath} onChange={setTargetPath} onSubmit={submitPath} />
      </Box>
    </Box>
  );
}
