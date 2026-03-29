import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';

interface RefineInputProps {
  onRefineSubmit: (feedback: string) => void;
  onCancel: () => void;
}

export function RefineInput({ onRefineSubmit, onCancel }: RefineInputProps) {
  const [input, setInput] = useState('');

  useInput((_, key) => {
    if (key.escape) {
      onCancel();
    }
  });

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="yellow" padding={1}>
      <Text color="yellow" bold>Adjust with AI</Text>
      <Text>What would you like to change? (E.g., "Put all images in an 'Inspiration' folder")</Text>
      <Text dimColor>(Press ESC to cancel)</Text>
      <Box marginTop={1}>
        <Text color="green">{'> '} </Text>
        <TextInput 
          value={input} 
          onChange={setInput} 
          onSubmit={(val) => {
            if(val.trim() !== '') onRefineSubmit(val);
          }} 
        />
      </Box>
    </Box>
  );
}
