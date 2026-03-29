import React from 'react';
import { Box, Text } from 'ink';
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
}

export function SettingsView({
  mode,
  config,
  apiKeyInput,
  setApiKeyInput,
  submitApiKey,
  models,
  handleSettingsMenu,
  handleSelectModel
}: SettingsViewProps) {
  return (
    <Box flexDirection="column">
      {mode === 'SETTINGS_MENU' && (
        <React.Fragment>
          <Text>Settings:</Text>
          <SelectInput
            items={[
              { value: 'update_key', label: 'Update Gemini API Key' },
              { value: 'change_model', label: `Change Gemini Model (Current: ${config?.geminiModel || DEFAULT_MODEL})` },
              { value: 'back', label: 'Back to Main Menu' }
            ]}
            onSelect={handleSettingsMenu}
          />
        </React.Fragment>
      )}

      {mode === 'SETTINGS_API_KEY' && (
        <React.Fragment>
          <Text>Enter your Gemini API Key:</Text>
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
    </Box>
  );
}
