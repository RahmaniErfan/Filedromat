import React from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import { DEFAULT_MODEL } from '../../config/index.js';

interface SettingsViewProps {
  mode: string;
  config: any;
  apiKeyInput: string;
  setApiKeyInput: (val: string) => void;
  submitApiKey: (val: string) => void;
  models: any[];
  handleSettingsMenu: (item: any) => void;
  handleSelectModel: (item: any) => void;
  handleSelectThinking: (item: any) => void;
}

export function SettingsView({
  mode,
  config,
  apiKeyInput,
  setApiKeyInput,
  submitApiKey,
  models,
  handleSettingsMenu,
  handleSelectModel,
  handleSelectThinking
}: SettingsViewProps) {
  useInput((input, key) => {
    const escapableModes = ['SETTINGS_API_KEY', 'SETTINGS_THINKING_SELECT'];
    if (escapableModes.includes(mode) && key.escape) {
      handleSettingsMenu({ value: 'back' });
    }
  });

  return (
    <Box flexDirection="column">
      {mode === 'SETTINGS_MENU' && (
        <React.Fragment>
          <Text>Settings:</Text>
            <SelectInput
              items={[
                { value: 'update_key', label: '[k] Update Gemini API Key' },
                { value: 'change_model', label: `[m] Change Gemini Model (Current: ${config?.geminiModel || DEFAULT_MODEL})` },
                ...(config?.geminiModel?.startsWith('gemini-') ? [
                  { value: 'change_thinking', label: `[t] Change Thinking Power (Current: ${config?.defaultThinkingIntensity || 'none'})` }
                ] : []),
                { value: 'back', label: '[b] Back to Main Menu' }
              ]}
              onSelect={handleSettingsMenu}
            />
        </React.Fragment>
      )}

      {mode === 'SETTINGS_API_KEY' && (
        <React.Fragment>
          <Text>Enter your Gemini API Key: <Text dimColor>(Press ESC to go back)</Text></Text>
          <Box>
            <Text color="green">{'> '} </Text>
            <TextInput value={apiKeyInput} onChange={setApiKeyInput} onSubmit={submitApiKey} mask="*" />
          </Box>
        </React.Fragment>
      )}

      {mode === 'SETTINGS_MODEL_LOADING' && (
        <Box>
          <Text color="yellow"><Spinner type="dots" /> Fetching available models...</Text>
        </Box>
      )}

      {mode === 'SETTINGS_MODEL_SELECT' && (
        <React.Fragment>
          <Text>Select a Gemini model:</Text>
          <SelectInput
            items={models.map(m => ({ value: m.id, label: m.name }))}
            onSelect={handleSelectModel}
          />
        </React.Fragment>
      )}

      {mode === 'SETTINGS_THINKING_SELECT' && (
        <React.Fragment>
          <Text>Select Default AI Thinking Power:</Text>
          <Text color="gray">High power improves accuracy but adds significant latency.</Text>
          <Box marginTop={1}>
            <SelectInput
              items={[
                { value: 'none', label: 'None (Fast, direct patterns)' },
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High (Maximum reasoning)' }
              ]}
              onSelect={handleSelectThinking}
            />
          </Box>
        </React.Fragment>
      )}
    </Box>
  );
}
