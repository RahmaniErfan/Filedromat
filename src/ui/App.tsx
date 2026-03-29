import React, { useState, useEffect } from 'react';
import { Box, Text, useApp } from 'ink';
import SelectInput from 'ink-select-input';
import Spinner from 'ink-spinner';
import { resolve } from 'node:path';
import { scanDirectory } from '../core/fs/scanner.js';
import { proposeOrganization, fetchLiveModels } from '../core/ai/provider.js';
import { executePlan } from '../core/fs/executor.js';
import { loadConfig, saveConfig, DEFAULT_MODEL } from '../config/index.js';
import { Header } from './components/Header.js';
import { FileSelection } from './components/FileSelection.js';
import { ActionPlanView } from './components/ActionPlanView.js';
import { SettingsView } from './components/SettingsView.js';
import type { ActionPlan, FileMetadata } from '../types/index.js';

type Mode = 
  | 'MAIN_MENU' 
  | 'ORGANIZE_INPUT_PATH' 
  | 'ORGANIZE_SCANNING'
  | 'ORGANIZE_PROPOSING'
  | 'ORGANIZE_CONFIRM'
  | 'ORGANIZE_EXECUTING'
  | 'SETTINGS_MENU'
  | 'SETTINGS_API_KEY'
  | 'SETTINGS_MODEL_LOADING'
  | 'SETTINGS_MODEL_SELECT'
  | 'DONE';

export function App() {
  const { exit } = useApp();
  const [config, setConfig] = useState<any>(null);
  const [mode, setMode] = useState<Mode>('MAIN_MENU');
  
  const [error, setError] = useState<string | null>(null);
  
  // Organize state
  const [targetPath, setTargetPath] = useState(process.cwd());
  const [scannedFiles, setScannedFiles] = useState<FileMetadata[]>([]);
  const [plan, setPlan] = useState<ActionPlan | null>(null);
  const [organizeResult, setOrganizeResult] = useState<string | null>(null);

  // Settings state
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [models, setModels] = useState<any[]>([]);

  useEffect(() => {
    loadConfig().then(c => setConfig(c)).catch(e => setError(e.message));
  }, []);

  const handleMainMenu = (item: any) => {
    setError(null);
    if (item.value === 'organize') {
      const apiKey = config?.geminiApiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      if (!apiKey) {
        setError('You need a Gemini API Key to use Filedromat. Please set it in Settings.');
        return;
      }
      setMode('ORGANIZE_INPUT_PATH');
    } else if (item.value === 'settings') {
      setMode('SETTINGS_MENU');
    } else if (item.value === 'exit') {
      exit();
    }
  };

  const submitPath = async (val: string) => {
    const path = val || process.cwd();
    setTargetPath(path);
    setMode('ORGANIZE_SCANNING');
    try {
      const files = await scanDirectory(resolve(path));
      setScannedFiles(files);
      if (files.length === 0) {
        setError('No files found to organize.');
        setMode('MAIN_MENU');
        return;
      }
      setMode('ORGANIZE_PROPOSING');
    } catch (e: any) {
      setError(`Scan failed: ${e.message}`);
      setMode('MAIN_MENU');
    }
  };

  useEffect(() => {
    if (mode === 'ORGANIZE_PROPOSING') {
      const doPropose = async () => {
        try {
          const modelId = config?.geminiModel || DEFAULT_MODEL;
          const apiKey = config?.geminiApiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
          process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey;
          
          const p = await proposeOrganization(scannedFiles, resolve(targetPath), modelId);
          setPlan(p);
          setMode('ORGANIZE_CONFIRM');
        } catch (e: any) {
          setError(`AI Proposal failed: ${e.message}`);
          setMode('MAIN_MENU');
        }
      };
      doPropose();
    }
  }, [mode]);

  const handleConfirmPlan = async (item: any) => {
    if (item.value === 'yes') {
      setMode('ORGANIZE_EXECUTING');
      try {
        if (plan) {
          await executePlan(plan);
          setOrganizeResult('Successfully organized!');
        }
        setMode('DONE');
      } catch (e: any) {
        setError(`Execution failed: ${e.message}`);
        setMode('MAIN_MENU');
      }
    } else {
      setError('Organization cancelled by user.');
      setMode('MAIN_MENU');
    }
  };

  const handleSettingsMenu = (item: any) => {
    setError(null);
    if (item.value === 'update_key') {
      setApiKeyInput('');
      setMode('SETTINGS_API_KEY');
    } else if (item.value === 'change_model') {
      const apiKey = config?.geminiApiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      if (!apiKey) {
        setError('Please set an API Key before changing models.');
        return;
      }
      setMode('SETTINGS_MODEL_LOADING');
    } else if (item.value === 'back') {
      setMode('MAIN_MENU');
    }
  };

  const submitApiKey = async (val: string) => {
    if (val.trim() === '') {
      setError('API Key is required.');
      setMode('SETTINGS_MENU');
      return;
    }
    const newConfig = { ...config, geminiApiKey: val };
    await saveConfig(newConfig);
    setConfig(newConfig);
    setError('Gemini API Key saved successfully!');
    setMode('SETTINGS_MENU');
  };

  useEffect(() => {
    if (mode === 'SETTINGS_MODEL_LOADING') {
      const loadModels = async () => {
        try {
          const apiKey = config?.geminiApiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
          const m = await fetchLiveModels('google', apiKey);
          setModels(m);
          setMode('SETTINGS_MODEL_SELECT');
        } catch (e: any) {
          setError(`Failed to fetch models: ${e.message}`);
          setMode('SETTINGS_MENU');
        }
      };
      loadModels();
    }
  }, [mode]);

  const handleSelectModel = async (item: any) => {
    const newConfig = { ...config, geminiModel: item.value };
    await saveConfig(newConfig);
    setConfig(newConfig);
    setError(`Default model set to ${item.value}`);
    setMode('SETTINGS_MENU');
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Header />
      
      {error && (
        <Box marginBottom={1} borderStyle="round" borderColor="red" paddingX={1}>
          <Text color="red">{error}</Text>
        </Box>
      )}

      {mode === 'MAIN_MENU' && (
        <Box flexDirection="column">
          <Text>Select an action:</Text>
          <SelectInput
            items={[
              { value: 'organize', label: 'Organize Directory' },
              { value: 'settings', label: 'Settings' },
              { value: 'exit', label: 'Exit' }
            ]}
            onSelect={handleMainMenu}
          />
        </Box>
      )}

      {mode === 'ORGANIZE_INPUT_PATH' && (
        <FileSelection targetPath={targetPath} setTargetPath={setTargetPath} submitPath={submitPath} />
      )}

      {mode === 'ORGANIZE_SCANNING' && (
        <Box>
          <Text color="green"><Spinner type="dots" /> Scanning files in {targetPath}...</Text>
        </Box>
      )}

      {mode === 'ORGANIZE_PROPOSING' && (
        <Box>
          <Text color="yellow"><Spinner type="dots" /> AI is proposing a folder structure for {scannedFiles.length} files...</Text>
        </Box>
      )}

      {mode === 'ORGANIZE_CONFIRM' && plan && (
        <ActionPlanView plan={plan} targetPath={targetPath} onConfirm={handleConfirmPlan} />
      )}

      {mode === 'ORGANIZE_EXECUTING' && (
        <Box>
          <Text color="green"><Spinner type="dots" /> Executing reorganization...</Text>
        </Box>
      )}

      {mode === 'DONE' && (
        <Box flexDirection="column">
          <Text color="green" bold>{organizeResult}</Text>
          <Box marginTop={1}>
            <Text>Press Enter to return to Main Menu.</Text>
          </Box>
          <SelectInput items={[{value: 'back', label: 'Back to Main Menu'}]} onSelect={() => setMode('MAIN_MENU')} />
        </Box>
      )}

      {mode.startsWith('SETTINGS_') && (
        <SettingsView
          mode={mode}
          config={config}
          apiKeyInput={apiKeyInput}
          setApiKeyInput={setApiKeyInput}
          submitApiKey={submitApiKey}
          models={models}
          handleSettingsMenu={handleSettingsMenu}
          handleSelectModel={handleSelectModel}
        />
      )}
    </Box>
  );
}
