import { useState, useEffect } from 'react';
import { Lobby } from './components/Lobby';
import { DirectorySelector } from './components/DirectorySelector';
import { ScanConfig } from './components/ScanConfig';
import { Scanner } from './components/Scanner';
import { InstructionPhase } from './components/InstructionPhase';
import { SplitView } from './components/SplitView';
import { SettingsDialog } from './components/SettingsDialog';
import { SuccessView } from './components/SuccessView';
import { 
  fetchConfig, 
  saveConfig, 
  scanDirectory, 
  proposeOrganization, 
  refineOrganization, 
  executePlan, 
  exportPlan 
} from './lib/api';
import type { ActionPlan, FileMetadata } from '../../src/types/index.js';

type Phase = 
  | 'LOBBY' 
  | 'DIRECTORY_SELECT' 
  | 'SCAN_CONFIG' 
  | 'SCANNING' 
  | 'INSTRUCTIONS' 
  | 'PROPOSING' 
  | 'REFINEMENT' 
  | 'DONE';

function App() {
  const [phase, setPhase] = useState<Phase>('LOBBY');
  const [config, setConfig] = useState<any>({});
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [targetPath, setTargetPath] = useState('');
  const [scanFiles, setScanFiles] = useState<FileMetadata[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [plan, setPlan] = useState<ActionPlan | null>(null);
  const [isRefining, setIsRefining] = useState(false);

  useEffect(() => {
    fetchConfig().then(setConfig);
  }, []);

  const handleStart = () => setPhase('DIRECTORY_SELECT');
  
  const handleDirectorySelect = (path: string) => {
    setTargetPath(path);
    setPhase('SCAN_CONFIG');
  };

  const handleScanStart = async (options: { deepWash: boolean; maxDepth: number }) => {
    setPhase('SCANNING');
    setScanProgress(0);
    try {
      const files = await scanDirectory(targetPath, options.deepWash, options.maxDepth, setScanProgress);
      setScanFiles(files);
      setPhase('INSTRUCTIONS');
    } catch (e: any) {
      alert(`Scan failed: ${e.message}`);
      setPhase('DIRECTORY_SELECT');
    }
  };

  const handleInstructionsSubmit = async (instructions: string) => {
    setPhase('PROPOSING');
    try {
      const p = await proposeOrganization(scanFiles, targetPath, config.geminiModel || 'gemini-2.5-flash', instructions);
      setPlan(p);
      setPhase('REFINEMENT');
    } catch (e: any) {
      alert(`Proposal failed: ${e.message}`);
      setPhase('INSTRUCTIONS');
    }
  };

  const handleRefine = async (feedback: string) => {
    if (!plan) return;
    setIsRefining(true);
    try {
      const p = await refineOrganization(scanFiles, targetPath, plan, feedback, config.geminiModel || 'gemini-2.5-flash');
      setPlan(p);
    } catch (e: any) {
      alert(`Refinement failed: ${e.message}`);
    } finally {
      setIsRefining(false);
    }
  };

  const handleExecute = async () => {
    if (!plan) return;
    try {
      await executePlan(plan);
      setPhase('DONE');
    } catch (e: any) {
      alert(`Execution failed: ${e.message}`);
    }
  };

  const handleExport = async (format: 'json' | 'bash') => {
    if (!plan) return;
    const result = await exportPlan(plan, format);
    if (format === 'bash') {
      const blob = new Blob([result as string], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'filedromat-organize.sh';
      a.click();
    } else {
      console.log('Exported JSON:', result);
      alert('Plan exported to console (JSON). Use Bash export to download a script.');
    }
  };

  const handleConfigSave = async (newConfig: any) => {
    await handleConfigSaveLogic(newConfig);
  };

  const handleConfigSaveLogic = async (newConfig: any) => {
    await saveConfig(newConfig);
    setConfig(newConfig);
  };

  return (
    <div className="container mx-auto max-w-6xl py-8 min-h-screen relative overflow-x-hidden">
      {/* Wash Cycle Phases */}
      <div className="w-full h-full min-h-[80vh]">
        {phase === 'LOBBY' && (
          <Lobby 
            config={config} 
            onStart={handleStart} 
            onSettings={() => setIsSettingsOpen(true)} 
          />
        )}
        
        {phase === 'DIRECTORY_SELECT' && (
          <DirectorySelector 
            onSelect={handleDirectorySelect} 
            onBack={() => setPhase('LOBBY')} 
          />
        )}

        {phase === 'SCAN_CONFIG' && (
          <ScanConfig 
            onScan={handleScanStart} 
            onBack={() => setPhase('DIRECTORY_SELECT')} 
          />
        )}

        {phase === 'SCANNING' && (
          <Scanner progress={scanProgress} path={targetPath} />
        )}

        {phase === 'INSTRUCTIONS' && (
          <InstructionPhase 
            filesCount={scanFiles.length} 
            onContinue={handleInstructionsSubmit} 
            onBack={() => setPhase('SCAN_CONFIG')} 
          />
        )}

        {phase === 'PROPOSING' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 page-enter">
            <div className="relative">
               <div className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
               <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary via-accent to-primary animate-pulse" />
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-bold tracking-tight bg-linear-to-br from-primary to-accent bg-clip-text text-transparent">
                AI is Folding your Load...
              </h1>
              <p className="text-muted-foreground animate-pulse leading-relaxed max-w-sm">
                Analyzing file contents and predicting the optimal closet arrangement.
              </p>
            </div>
          </div>
        )}

        {phase === 'REFINEMENT' && plan && (
          <SplitView 
            plan={plan} 
            onRefine={handleRefine} 
            onExecute={handleExecute} 
            onExport={handleExport}
            isRefining={isRefining}
          />
        )}

        {phase === 'DONE' && (
          <SuccessView 
            onReset={() => setPhase('LOBBY')} 
            summary={plan?.summary} 
            count={plan?.actions.length} 
          />
        )}
      </div>

      {/* Settings Modal Overlay */}
      {isSettingsOpen && (
        <SettingsDialog 
          config={config} 
          onSave={handleConfigSave} 
          onClose={() => setIsSettingsOpen(false)} 
        />
      )}
      
      {/* Decorative Bubbles Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-[-1] opacity-20">
         <div className="bubble w-12 h-12 left-[10%] bottom-[-50px]" style={{ animationDelay: '0s', animationDuration: '8s' }} />
         <div className="bubble w-8 h-8 left-[30%] bottom-[-50px]" style={{ animationDelay: '2s', animationDuration: '6s' }} />
         <div className="bubble w-16 h-16 left-[60%] bottom-[-50px]" style={{ animationDelay: '4s', animationDuration: '10s' }} />
         <div className="bubble w-10 h-10 left-[85%] bottom-[-50px]" style={{ animationDelay: '1s', animationDuration: '7s' }} />
      </div>
    </div>
  );
}

export default App;
