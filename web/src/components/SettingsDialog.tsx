import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { 
  X, 
  Key, 
  Cpu, 
  Save, 
  CheckCircle, 
  Zap, 
  Settings2, 
  Activity, 
  ShieldCheck,
  Info
} from 'lucide-react';
import { fetchModels } from '../lib/api';
import type { AIModel } from '../../../src/types/index.js';

interface SettingsDialogProps {
  config: any;
  onSave: (config: any) => void;
  onClose: () => void;
}

export function SettingsDialog({ config, onSave, onClose }: SettingsDialogProps) {
  const [apiKey, setApiKey] = useState(config.geminiApiKey || '');
  const [selectedModel, setSelectedModel] = useState(config.geminiModel || 'gemini-2.5-flash');
  const [parallelCalls, setParallelCalls] = useState(config.parallelCalls || 3);
  const [models, setModels] = useState<AIModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'connection' | 'intelligence' | 'performance'>('connection');

  useEffect(() => {
    if (apiKey) {
      loadModels(apiKey);
    }
  }, []);

  const loadModels = async (key: string) => {
    setIsLoadingModels(true);
    try {
      const m = await fetchModels(key);
      setModels(m);
    } catch (e) {
      console.error('Failed to load models', e);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleSave = () => {
    onSave({ 
      geminiApiKey: apiKey, 
      geminiModel: selectedModel,
      parallelCalls: Number(parallelCalls)
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-md animate-in fade-in duration-500">
      <Card className="w-full max-w-3xl shadow-2xl laundry-card relative overflow-hidden border-primary/20">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-primary via-accent to-primary animate-pulse" />
        
        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-2xl">
              <Settings2 className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-0.5">
              <CardTitle className="text-2xl font-bold tracking-tight">Machine Settings</CardTitle>
              <CardDescription className="text-sm">Fine-tune your folding processor and API cycles.</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors">
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>

        <div className="flex flex-col md:flex-row min-h-[450px]">
          {/* Navigation Sidebar */}
          <div className="w-full md:w-56 border-r bg-muted/20 p-4 space-y-2">
            {[
              { id: 'connection', label: 'Connection', icon: Key },
              { id: 'intelligence', label: 'Intelligence', icon: Cpu },
              { id: 'performance', label: 'Performance', icon: Zap },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                  activeTab === tab.id 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' 
                    : 'hover:bg-primary/10 text-muted-foreground hover:text-primary'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? '' : 'group-hover:scale-110 transition-transform'}`} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Settings Content */}
          <CardContent className="flex-1 p-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
            {activeTab === 'connection' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        API Authentication
                      </h3>
                      <p className="text-xs text-muted-foreground">Your secret key for the Gemini Folding Service.</p>
                    </div>
                    {apiKey && !isLoadingModels && models.length > 0 && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 gap-1.5 py-1">
                        <CheckCircle className="w-3 h-3" /> Connected
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="relative">
                      <Input 
                        type="password" 
                        placeholder="sk-..." 
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        onBlur={() => apiKey && loadModels(apiKey)}
                        className="h-12 pl-4 rounded-xl border-2 focus-visible:ring-primary/20 bg-background/50"
                      />
                      <Key className="absolute right-4 top-3.5 w-5 h-5 text-muted-foreground/30 pointer-events-none" />
                    </div>
                    <div className="p-3 bg-muted/40 rounded-xl flex items-start gap-3 border border-dashed">
                      <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        Your key is stored locally in <code className="bg-primary/5 px-1 rounded text-primary">~/.filedromat/config.json</code>. We never send it to any server other than Google.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'intelligence' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary" />
                      Folding Model
                    </h3>
                    <p className="text-xs text-muted-foreground">Select the AI engine that best fits your laundry load.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2.5">
                    {isLoadingModels ? (
                      <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-pulse">
                        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <span className="text-sm text-muted-foreground font-medium">Detecting available models...</span>
                      </div>
                    ) : models.length > 0 ? (
                      models.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => setSelectedModel(m.id)}
                          className={`group p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                            selectedModel === m.id 
                              ? 'border-primary bg-primary/5 ring-4 ring-primary/5 shadow-sm' 
                              : 'border-border hover:border-primary/30 hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-xl transition-colors ${
                              selectedModel === m.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary'
                            }`}>
                              <Cpu className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-bold tracking-tight">{m.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-muted-foreground uppercase">{m.id}</span>
                                {m.id.includes('flash') && (
                                  <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/10 text-[9px] px-1.5 py-0">Fast</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          {selectedModel === m.id && (
                            <div className="bg-primary text-white p-1 rounded-full shadow-lg shadow-primary/20">
                              <CheckCircle className="w-4 h-4 saturate-150" />
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 bg-muted/20 rounded-3xl border-2 border-dashed border-muted-foreground/20 space-y-3">
                         <div className="p-3 bg-muted/40 rounded-full">
                           <ShieldCheck className="w-6 h-6 text-muted-foreground/40" />
                         </div>
                         <p className="text-xs font-medium text-muted-foreground text-center max-w-[200px]">
                           Please enter a valid API key to discover folding models.
                         </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
                      <Zap className="w-4 h-4 fill-primary" />
                      Parallel Folding Cycles
                    </h3>
                    <p className="text-xs text-muted-foreground">How many wash tubs should run at once for large loads?</p>
                  </div>
                  
                  <div className="p-8 bg-muted/30 rounded-3xl border-2 border-primary/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Zap className="w-24 h-24 text-primary" />
                    </div>
                    
                    <div className="flex flex-col items-center gap-6 relative">
                      <div className="flex items-end gap-1.5">
                        <span className="text-6xl font-black text-primary tracking-tighter leading-none">{parallelCalls}</span>
                        <span className="text-sm font-bold text-muted-foreground pb-2 uppercase tracking-widest">Calls</span>
                      </div>
                      
                      <div className="w-full space-y-4">
                        <input 
                          type="range" 
                          min="1" 
                          max="10" 
                          step="1"
                          value={parallelCalls}
                          onChange={(e) => setParallelCalls(parseInt(e.target.value))}
                          className="w-full h-2.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary hover:accent-accent transition-all ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        />
                        <div className="flex justify-between px-1">
                          {[1, 5, 10].map(val => (
                            <span key={val} className="text-[10px] font-bold text-muted-foreground tabular-nums opacity-50">{val}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-primary/5 border-l-4 border-primary space-y-1.5">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-primary">Efficiency Tip</h4>
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        Increasing parallel calls speeds up processing for large file collections by utilizing multiple AI threads.
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-amber-500/5 border-l-4 border-amber-500 space-y-1.5">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Quota Alert</h4>
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        Higher parallelism may hit API rate limits faster. Default (3) is recommended for most users.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </div>

        <CardFooter className="bg-muted/50 p-6 flex justify-between items-center border-t backdrop-blur-sm">
          <div className="hidden md:flex items-center gap-2 text-muted-foreground">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
             <span className="text-[10px] font-medium uppercase tracking-widest">System Ready</span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose} className="rounded-xl px-6 hover:bg-background">Cancel</Button>
            {isSaved ? (
              <Button disabled className="bg-green-500 text-white rounded-xl px-8 shadow-lg shadow-green-500/20 animate-in zoom-in duration-300">
                <CheckCircle className="w-4 h-4 mr-2" />
                Updated!
              </Button>
            ) : (
              <Button disabled={!apiKey} className="rounded-xl px-8 shadow-lg shadow-primary/20 font-bold group" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                Apply Changes
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
