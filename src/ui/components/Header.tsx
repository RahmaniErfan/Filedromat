import React from 'react';
import { Box, Text } from 'ink';

export function Header() {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color="cyan" bold>
        Filedromat - Your AI File Organizer
      </Text>
      <Text color="gray">
        Powered by Google Gemini
      </Text>
    </Box>
  );
}
