import React from 'react';
import { Box, Text } from 'ink';

export function Header({ mode, config }: { mode: string, config?: any }) {
  const isSettings = mode.startsWith('SETTINGS');
  const isOrganize = mode.startsWith('ORGANIZE') || mode === 'DONE';
  const isDashboard = mode === 'MAIN_MENU';

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box borderStyle="single" borderColor="cyan" paddingX={1} justifyContent="space-between">
        <Box>
          <Text color="cyan">🧺 Filedromat</Text>
          <Text color="gray">  |  </Text>
          <Text color={isDashboard ? "cyan" : "gray"} bold={isDashboard}>
            {isDashboard ? "▶ Dashboard" : "Dashboard"}
          </Text>
          <Text color="gray">  |  </Text>
          <Text color={isOrganize ? "cyan" : "gray"} bold={isOrganize}>
            {isOrganize ? "▶ Organize" : "Organize"}
          </Text>
          <Text color="gray">  |  </Text>
          <Text color={isSettings ? "cyan" : "gray"} bold={isSettings}>
            {isSettings ? "▶ Settings" : "Settings"}
          </Text>
        </Box>

        {!isDashboard && config && (
          <Box>
            <Text color="gray">[ Model: </Text>
            <Text color="cyan">{config.geminiModel || 'None'}</Text>
            <Text color="gray"> | Key: </Text>
            <Text color={config.geminiApiKey ? 'green' : 'red'}>{config.geminiApiKey ? 'OK' : 'Missing'}</Text>
            <Text color="gray"> ]</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}
