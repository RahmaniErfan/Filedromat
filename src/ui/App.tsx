import React, { useState, useEffect } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import Spinner from 'ink-spinner';
import { resolve } from 'node:path';
import { scanDirectory } from '../core/fs/scanner.js';
import { proposeOrganization, refineOrganization, fetchLiveModels } from '../core/ai/provider.js';
import { executePlan } from '../core/fs/executor.js';
import { loadConfig, saveConfig, DEFAULT_MODEL } from '../config/index.js';
import { Header } from './components/Header.js';
import { FileSelection } from './components/FileSelection.js';
import { ActionPlanView } from './components/ActionPlanView.js';
import { SettingsView } from './components/SettingsView.js';
import { InstructionInput } from './components/InstructionInput.js';
import { RefineInput } from './components/RefineInput.js';
import { ScanOptions } from './components/ScanOptions.js';
import type { ActionPlan, FileMetadata } from '../types/index.js';

type Mode = 
  | 'MAIN_MENU' 
  | 'ORGANIZE_INPUT_PATH' 
  | 'ORGANIZE_OPTIONS'
  | 'ORGANIZE_SCANNING'
  | 'ORGANIZE_INSTRUCTIONS'
  | 'ORGANIZE_PROPOSING'
  | 'ORGANIZE_CONFIRM'
  | 'ORGANIZE_REFINE_INPUT'
  | 'ORGANIZE_REFINING'
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
  const [deepWash, setDeepWash] = useState(false);
  const [maxDepth, setMaxDepth] = useState(1);
  const [scannedFiles, setScannedFiles] = useState<FileMetadata[]>([]);
  const [promptInstructions, setPromptInstructions] = useState('');
  const [plan, setPlan] = useState<ActionPlan | null>(null);
  const [organizeResult, setOrganizeResult] = useState<string | null>(null);

  // Settings state
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [models, setModels] = useState<any[]>([]);

  const handleGlobalHotkey = (input: string) => {
    if (input === 'q') exit();
    if (input === 's') setMode('SETTINGS_MENU');
    if (input === 'd') setMode('MAIN_MENU');
    if (input === 'o') handleMainMenu({ value: 'organize' });
  };

  useInput((input, key) => {
    // Basic global hotkeys (be careful not to override TextInput controls)
    const textInputModes: Mode[] = ['SETTINGS_API_KEY', 'ORGANIZE_INPUT_PATH', 'ORGANIZE_OPTIONS', 'ORGANIZE_INSTRUCTIONS', 'ORGANIZE_REFINE_INPUT'];
    if (!textInputModes.includes(mode)) {
      handleGlobalHotkey(input);
      if (key.escape) setMode('MAIN_MENU');
    }
  });

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
    setMode('ORGANIZE_OPTIONS');
  };

  const submitScan = async (options: { deepWash: boolean; maxDepth: number }) => {
    setDeepWash(options.deepWash);
    setMaxDepth(options.maxDepth);
    setMode('ORGANIZE_SCANNING');
    try {
      const files = await scanDirectory(resolve(targetPath), options.deepWash, options.maxDepth);
      setScannedFiles(files);
      if (files.length === 0) {
        setError('No files found to organize.');
        setMode('MAIN_MENU');
        return;
      }
      setMode('ORGANIZE_INSTRUCTIONS');
    } catch (e: any) {
      setError(`Scan failed: ${e.message}`);
      setMode('MAIN_MENU');
    }
  };

  const handleInstructionsSubmit = (instructions: string) => {
    setPromptInstructions(instructions);
    setMode('ORGANIZE_PROPOSING');
  };

  const handleRefineSubmit = async (feedback: string) => {
    setMode('ORGANIZE_REFINING');
    try {
      const modelId = config?.geminiModel || DEFAULT_MODEL;
      const apiKey = config?.geminiApiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey;
      
      const newPlan = await refineOrganization(scannedFiles, resolve(targetPath), plan!, feedback, modelId);
      setPlan(newPlan);
      setMode('ORGANIZE_CONFIRM');
    } catch (e: any) {
      setError(`AI Refinement failed: ${e.message}`);
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
          
          const p = await proposeOrganization(scannedFiles, resolve(targetPath), modelId, promptInstructions);
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
    } else if (item.value === 'refine') {
      setMode('ORGANIZE_REFINE_INPUT');
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
      <Header mode={mode} config={config} />
      
      {error && (
        <Box marginBottom={1} borderStyle="round" borderColor="red" paddingX={1}>
          <Text color="red">{error}</Text>
        </Box>
      )}

      <Box flexDirection={mode === 'MAIN_MENU' ? 'row' : 'column'} flexGrow={1}>
        {mode === 'MAIN_MENU' && (
          <Box width="45%" borderStyle="single" borderColor="cyan" padding={1} flexDirection="column" marginRight={2}>
            <Box marginLeft={2} marginBottom={1}><Text color="cyan" bold>Statistics</Text></Box>
            <Box flexDirection="column" marginLeft={1}>
              <Box marginBottom={1}>
                <Text color="gray">🔮 Model:      </Text>
                <Text color={config?.geminiModel ? 'cyan' : 'red'}>{config?.geminiModel || 'Not chosen'}</Text>
              </Box>
              <Box marginBottom={1}>
                <Text color="gray">🔑 API Key:    </Text>
                <Text color={config?.geminiApiKey ? 'green' : 'red'}>{config?.geminiApiKey ? 'Connected' : 'Missing'}</Text>
              </Box>
              <Box marginBottom={1}>
                <Text color="gray">📂 Last Path:  </Text>
                <Text color="cyan">{targetPath === process.cwd() ? './' : targetPath}</Text>
              </Box>
            </Box>
          </Box>
        )}

        <Box width={mode === 'MAIN_MENU' ? "55%" : "100%"} borderStyle="single" borderColor="cyan" padding={1} flexDirection="column">
          <Box marginLeft={2} marginBottom={1}><Text color="cyan" bold>{mode === 'MAIN_MENU' ? 'Quick Actions' : 'Action Panel'}</Text></Box>
          
          <Box marginLeft={1} flexDirection="column">
            {mode === 'MAIN_MENU' && (
              <Box flexDirection="column">
                <SelectInput
                  items={[
                    { value: 'organize', label: '[o] Organize Directory' },
                    { value: 'settings', label: '[s] Settings' },
                    { value: 'exit', label: '[q] Quit' }
                  ]}
                  onSelect={handleMainMenu}
                />
              </Box>
            )}

            {mode === 'ORGANIZE_INPUT_PATH' && (
              <FileSelection 
                targetPath={targetPath} 
                setTargetPath={setTargetPath} 
                submitPath={submitPath} 
                onCancel={() => setMode('MAIN_MENU')}
                onGlobalHotkey={handleGlobalHotkey}
              />
            )}

            {mode === 'ORGANIZE_OPTIONS' && (
              <ScanOptions 
                onComplete={submitScan}
                onCancel={() => setMode('ORGANIZE_INPUT_PATH')}
                onGlobalHotkey={handleGlobalHotkey}
              />
            )}

            {mode === 'ORGANIZE_SCANNING' && (
              <Box>
                <Text color="cyan"><Spinner type="dots" /> Scanning files in {targetPath}...</Text>
              </Box>
            )}

            {mode === 'ORGANIZE_INSTRUCTIONS' && (
              <InstructionInput 
                files={scannedFiles}
                deepWashEnabled={deepWash}
                onInstructionsSubmit={handleInstructionsSubmit}
                onCancel={() => setMode('ORGANIZE_OPTIONS')}
                onGlobalHotkey={handleGlobalHotkey}
              />
            )}

            {mode === 'ORGANIZE_PROPOSING' && (
              <Box>
                <Text color="yellow"><Spinner type="dots" /> AI is proposing a folder structure for {scannedFiles.length} files...</Text>
              </Box>
            )}

            {mode === 'ORGANIZE_CONFIRM' && plan && (
              <ActionPlanView plan={plan} targetPath={targetPath} onConfirm={handleConfirmPlan} />
            )}

            {mode === 'ORGANIZE_REFINE_INPUT' && (
              <RefineInput 
                onRefineSubmit={handleRefineSubmit}
                onCancel={() => setMode('ORGANIZE_CONFIRM')}
              />
            )}

            {mode === 'ORGANIZE_REFINING' && (
              <Box>
                <Text color="yellow"><Spinner type="dots" /> AI is refining the folder structure based on your feedback...</Text>
              </Box>
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
        </Box>
      </Box>

      <Box marginTop={1} paddingX={1} borderStyle="single" borderColor="cyan">
        <Text color="cyan" bold>o:</Text><Text color="gray"> organize  </Text>
        <Text color="cyan" bold>d:</Text><Text color="gray"> dashboard  </Text>
        <Text color="cyan" bold>s:</Text><Text color="gray"> settings  </Text>
        <Text color="cyan" bold>ESC:</Text><Text color="gray"> back  </Text>
        <Text color="cyan" bold>q:</Text><Text color="gray"> quit  </Text>
      </Box>
    </Box>
  );
}
