import { useState, useEffect } from 'react';
import { Binary } from 'lucide-react';
import { Lobby } from './components/Lobby';
import { DirectorySelector } from './components/DirectorySelector';
import { ScanConfig } from './components/ScanConfig';
import { Scanner } from './components/Scanner';
import { InstructionPhase } from './components/InstructionPhase';
import { SplitView } from './components/SplitView';
import { SettingsDialog } from './components/SettingsDialog';
import { SuccessView } from './components/SuccessView';
import { Header } from './components/Header';
import { 
  fetchConfig, 
  saveConfig, 
  scanDirectory, 
  proposeOrganization, 
  refineOrganization, 
  executePlan, 
  exportPlan 
} from './lib/api';
import type { ActionPlan, FileMetadata, HistoryItem } from '../../src/types/index.js';

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
  const [settingsTab, setSettingsTab] = useState<'connection' | 'intelligence' | 'performance'>('connection');
  
  const [targetPath, setTargetPath] = useState('');
  const [scanFiles, setScanFiles] = useState<FileMetadata[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [plan, setPlan] = useState<ActionPlan | null>(null);
  const [enforceBoundaries, setEnforceBoundaries] = useState(true);
  const [isRefining, setIsRefining] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    fetchConfig().then(setConfig);
  }, []);

  const handleStart = () => setPhase('DIRECTORY_SELECT');
  
  const handleOpenSettings = (tab: 'connection' | 'intelligence' | 'performance' = 'connection') => {
    setSettingsTab(tab);
    setIsSettingsOpen(true);
  };
  
  const handleDirectorySelect = (path: string) => {
    setTargetPath(path);
    setPhase('SCAN_CONFIG');
  };

  const handleScanStart = async (options: { deepWash: boolean; enforceBoundaries: boolean; maxDepth: number }) => {
    setPhase('SCANNING');
    setScanProgress(0);
    setEnforceBoundaries(options.enforceBoundaries);
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
      const p = await proposeOrganization(
        scanFiles, 
        targetPath, 
        config.geminiModel || 'gemini-2.0-flash', 
        instructions, 
        enforceBoundaries, 
        config.defaultThinkingIntensity || 'none'
      );
      setPlan(p);
      
      const newHistory: HistoryItem[] = [
        {
          id: Math.random().toString(36).substring(7),
          role: 'user',
          content: instructions,
          timestamp: new Date().toISOString()
        },
        {
          id: Math.random().toString(36).substring(7),
          role: 'assistant',
          content: p.summary || 'Initial organization plan proposed.',
          planId: p.id,
          timestamp: new Date().toISOString()
        }
      ];
      setHistory(newHistory);
      setPhase('REFINEMENT');
    } catch (e: any) {
      alert(`Proposal failed: ${e.message}`);
      setPhase('INSTRUCTIONS');
    }
  };

  const handleRefine = async (feedback: string) => {
    if (!plan) return;
    setIsRefining(true);
    
    // Add User message immediately
    const userHistoryItem: HistoryItem = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: feedback,
      timestamp: new Date().toISOString()
    };
    setHistory(prev => [...prev, userHistoryItem]);

    try {
      // Pass the updated history (including the NEW user item) to the API
      const p = await refineOrganization(
        scanFiles, 
        targetPath, 
        plan, 
        feedback, 
        config.geminiModel || 'gemini-2.0-flash', 
        [...history, userHistoryItem],
        enforceBoundaries,
        config.defaultThinkingIntensity || 'none'
      );
      setPlan(p);
      
      const assistantHistoryItem: HistoryItem = {
        id: Math.random().toString(36).substring(7),
        role: 'assistant',
        content: p.summary || 'Plan refined based on feedback.',
        planId: p.id,
        timestamp: new Date().toISOString()
      };
      
      setHistory(prev => [...prev, assistantHistoryItem]);
    } catch (e: any) {
      alert(`Refinement failed: ${e.message}`);
    } finally {
      setIsRefining(false);
    }
  };

  const handleExecute = async () => {
    if (!plan) return;
    try {
      const response = await executePlan(plan);
      if (response.results) {
        setPlan({
          ...plan,
          result: response.results
        });
      }
      setPhase('DONE');
    } catch (e: any) {
      alert(`Execution failed: ${e.message}`);
    }
  };

  const handleReset = () => {
    setPhase('LOBBY');
    setTargetPath('');
    setScanFiles([]);
    setScanProgress(0);
    setPlan(null);
    setIsRefining(false);
    setHistory([]);
  };

  const handleExport = async (format: 'json' | 'bash') => {
    if (!plan) return;
    try {
      const result = await exportPlan(plan, format);
      
      const content = format === 'json' ? JSON.stringify(result, null, 2) : (result as string);
      const mimeType = format === 'json' ? 'application/json' : 'text/plain';
      const filename = format === 'json' ? 'filedromat-plan.json' : 'filedromat-organize.sh';
      
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(`Export failed: ${e.message}`);
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
      <Header phase={phase} onReset={handleReset} />
      
      {/* Wash Cycle Phases */}
      <div className="w-full h-full min-h-[80vh]">
        {phase === 'LOBBY' && (
          <Lobby 
            config={config} 
            onStart={handleStart} 
            onSettings={handleOpenSettings} 
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
          <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8 page-enter">
            <div className="relative group">
              <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl animate-pulse" />
              <div className="relative w-48 h-48 rounded-full border-8 border-primary/20 flex items-center justify-center bg-card shadow-2xl laundry-card overflow-hidden">
                <div className="absolute inset-0 bg-primary/10 animate-slosh" style={{ height: '40%', bottom: 0, top: 'auto' }} />
                <div className="absolute inset-2 rounded-full border-4 border-dashed border-primary/10 animate-wash-spin" />
                <Binary className="w-16 h-16 text-primary/80 animate-slosh" />
                
                {/* Bubbles */}
                <div className="bubble w-4 h-4 left-1/4" style={{ animationDelay: '0s' }} />
                <div className="bubble w-3 h-3 left-1/2" style={{ animationDelay: '1.5s' }} />
                <div className="bubble w-5 h-5 left-3/4" style={{ animationDelay: '2s' }} />
              </div>
            </div>
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold tracking-tight bg-linear-to-br from-primary to-accent bg-clip-text text-transparent">
                AI is Sorting your Laundry...
              </h1>
              <p className="text-muted-foreground animate-pulse leading-relaxed max-w-sm mx-auto">
                Analyzing file contents and predicting the optimal closet arrangement.
              </p>
            </div>
          </div>
        )}

        {phase === 'REFINEMENT' && plan && (
          <SplitView 
            plan={plan} 
            history={history}
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
            result={plan?.result}
          />
        )}
      </div>

      {/* Settings Modal Overlay */}
      {isSettingsOpen && (
        <SettingsDialog 
          config={config} 
          onSave={handleConfigSave} 
          onClose={() => setIsSettingsOpen(false)} 
          defaultTab={settingsTab}
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
