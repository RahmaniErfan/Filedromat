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
  Info,
  Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';
import { fetchModels } from '../lib/api';
import type { AIModel } from '../../../src/types/index.js';

interface SettingsDialogProps {
  config: any;
  onSave: (config: any) => void;
  onClose: () => void;
  defaultTab?: 'connection' | 'intelligence' | 'performance';
}

export function SettingsDialog({ config, onSave, onClose, defaultTab = 'connection' }: SettingsDialogProps) {
  const [geminiApiKey, setGeminiApiKey] = useState(config.geminiApiKey || '');
  const [anthropicApiKey, setAnthropicApiKey] = useState(config.anthropicApiKey || '');
  const [selectedModel, setSelectedModel] = useState(config.geminiModel || config.anthropicModel || 'gemini-2.0-flash');
  const [fallbackModelId, setFallbackModelId] = useState(config.fallbackModelId || '');
  const [parallelCalls, setParallelCalls] = useState(config.parallelCalls || 3);
  const [defaultThinkingIntensity, setDefaultThinkingIntensity] = useState(config.defaultThinkingIntensity || 'none');
  
  const [geminiModels, setGeminiModels] = useState<AIModel[]>([]);
  const [anthropicModels, setAnthropicModels] = useState<AIModel[]>([]);
  const [isLoadingGemini, setIsLoadingGemini] = useState(false);
  const [isLoadingAnthropic, setIsLoadingAnthropic] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'connection' | 'intelligence' | 'performance'>(defaultTab);
  
  const [mainProvider, setMainProvider] = useState<'google' | 'anthropic'>(
    config.anthropicModel && !config.geminiModel ? 'anthropic' : 'google'
  );
  const [secondaryProvider, setSecondaryProvider] = useState<'google' | 'anthropic'>('google');

  useEffect(() => {
    if (geminiApiKey) {
      loadGeminiModels(geminiApiKey);
    } else {
      setGeminiModels([]);
    }
  }, [geminiApiKey]);

  useEffect(() => {
    if (anthropicApiKey) {
      loadAnthropicModels(anthropicApiKey);
    } else {
      setAnthropicModels([]);
    }
  }, [anthropicApiKey]);

  const loadGeminiModels = async (key: string) => {
    if (!key.trim()) {
      setGeminiModels([]);
      return;
    }
    setIsLoadingGemini(true);
    try {
      const m = await fetchModels(key, 'google');
      setGeminiModels(m);
    } catch (e) {
      console.error('Failed to load Gemini models', e);
      setGeminiModels([]);
    } finally {
      setIsLoadingGemini(false);
    }
  };

  const loadAnthropicModels = async (key: string) => {
    if (!key.trim()) {
      setAnthropicModels([]);
      return;
    }
    setIsLoadingAnthropic(true);
    try {
      const m = await fetchModels(key, 'anthropic');
      setAnthropicModels(m);
    } catch (e) {
      console.error('Failed to load Anthropic models', e);
      setAnthropicModels([]);
    } finally {
      setIsLoadingAnthropic(false);
    }
  };

  const handleSave = () => {
    const hasGemini = geminiApiKey.trim().length > 0;
    const hasAnthropic = anthropicApiKey.trim().length > 0;
    
    const isGeminiSelected = geminiModels.some(m => m.id === selectedModel);
    const isAnthropicSelected = anthropicModels.some(m => m.id === selectedModel);
    
    let finalGeminiModel = isGeminiSelected && hasGemini ? selectedModel : undefined;
    let finalAnthropicModel = isAnthropicSelected && hasAnthropic ? selectedModel : undefined;
    
    // Auto-fallback if the current selection is now invalid due to missing key
    if (!finalGeminiModel && !finalAnthropicModel) {
      if (hasGemini && geminiModels.length > 0) {
        finalGeminiModel = geminiModels[0].id;
      } else if (hasAnthropic && anthropicModels.length > 0) {
        finalAnthropicModel = anthropicModels[0].id;
      }
    }

    // Clean up fallback model as well
    let finalFallbackId = fallbackModelId;
    const isFallbackGemini = geminiModels.some(m => m.id === fallbackModelId);
    const isFallbackAnthropic = anthropicModels.some(m => m.id === fallbackModelId);
    
    if ((isFallbackGemini && !hasGemini) || (isFallbackAnthropic && !hasAnthropic)) {
      finalFallbackId = '';
    }

    onSave({ 
      geminiApiKey: hasGemini ? geminiApiKey : '',
      anthropicApiKey: hasAnthropic ? anthropicApiKey : '',
      geminiModel: finalGeminiModel,
      anthropicModel: finalAnthropicModel,
      fallbackModelId: finalFallbackId,
      parallelCalls: Number(parallelCalls),
      defaultThinkingIntensity
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 1500);
  };

  const allModels = [...geminiModels, ...anthropicModels];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-md animate-in fade-in duration-500">
      <Card className="w-full max-w-5xl shadow-2xl laundry-card relative overflow-hidden border-primary/20 p-0 gap-0">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-primary via-accent to-primary animate-pulse" />
        
        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30 pb-10 pt-8 px-10">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-primary/10 rounded-2xl shadow-inner-sm">
              <Settings2 className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-3xl font-black tracking-tight text-primary">Machine Configuration</CardTitle>
              <CardDescription className="text-base text-muted-foreground/80">Fine-tune the intelligence and speed of your laundry machine.</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors w-12 h-12">
            <X className="w-6 h-6" />
          </Button>
        </CardHeader>

        <div className="flex flex-col md:flex-row min-h-[600px] bg-muted/5">
          {/* Navigation Sidebar */}
          <div className="w-full md:w-64 border-r bg-background/50 p-6 space-y-3">
            {[
              { id: 'connection', label: 'Connection', icon: Key, description: 'API Management' },
              { id: 'intelligence', label: 'Intelligence', icon: Cpu, description: 'AI Processing' },
              { id: 'performance', label: 'Performance', icon: Zap, description: 'Wash Speed' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex flex-col gap-1 px-5 py-4 rounded-2xl text-left transition-all duration-300 group ${
                  activeTab === tab.id 
                    ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/20 scale-105' 
                    : 'hover:bg-primary/5 text-muted-foreground hover:text-primary active:scale-95'
                }`}
              >
                <div className="flex items-center gap-3">
                  <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? '' : 'group-hover:translate-x-1 transition-transform'}`} />
                  <span className="font-bold tracking-tight">{tab.label}</span>
                </div>
                <span className={`text-[10px] font-medium opacity-60 ml-8 ${activeTab === tab.id ? 'text-primary-foreground/70' : ''}`}>
                  {tab.description}
                </span>
              </button>
            ))}
          </div>

          {/* Settings Content */}
          <CardContent className="flex-1 p-10 overflow-y-auto max-h-[70vh] custom-scrollbar bg-background/30 backdrop-blur-sm">
            {activeTab === 'connection' && (
              <div className="space-y-10 animate-in slide-in-from-right-8 duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {/* Gemini Config */}
                  <div className="space-y-5 p-6 rounded-3xl bg-muted/20 border-2 border-transparent hover:border-primary/10 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1.5">
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-bold px-3">Google</Badge>
                        <h3 className="text-lg font-bold tracking-tight">Gemini Infrastructure</h3>
                      </div>
                      {geminiApiKey && !isLoadingGemini && geminiModels.length > 0 && (
                        <div className="flex items-center gap-1.5 text-green-600">
                          <CheckCircle className="w-4 h-4 fill-green-500/20" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Active</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="relative group">
                      <Input 
                        type="password" 
                        placeholder="AIzaSy..." 
                        value={geminiApiKey}
                        onChange={(e) => setGeminiApiKey(e.target.value)}
                        className="h-14 pl-12 rounded-2xl border-2 border-border/50 bg-background focus:ring-4 focus:ring-primary/10 hover:border-primary/30 transition-all text-sm font-mono"
                      />
                      <Key className="absolute left-4 top-4.5 w-5 h-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                    </div>
                  </div>

                  {/* Anthropic Config */}
                  <div className="space-y-5 p-6 rounded-3xl bg-muted/20 border-2 border-transparent hover:border-accent/10 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1.5">
                        <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 font-bold px-3">Anthropic</Badge>
                        <h3 className="text-lg font-bold tracking-tight">Claude Core</h3>
                      </div>
                      {anthropicApiKey && !isLoadingAnthropic && anthropicModels.length > 0 && (
                        <div className="flex items-center gap-1.5 text-green-600">
                          <CheckCircle className="w-4 h-4 fill-green-500/20" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Active</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="relative group">
                      <Input 
                        type="password" 
                        placeholder="sk-ant-..." 
                        value={anthropicApiKey}
                        onChange={(e) => setAnthropicApiKey(e.target.value)}
                        className="h-14 pl-12 rounded-2xl border-2 border-border/50 bg-background focus:ring-4 focus:ring-accent/10 hover:border-accent/30 transition-all text-sm font-mono"
                      />
                      <Key className="absolute left-4 top-4.5 w-5 h-5 text-muted-foreground/30 group-hover:text-accent transition-colors" />
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-primary/5 rounded-3xl flex items-start gap-5 border border-primary/20 shadow-inner-sm">
                  <div className="p-3 bg-primary/10 rounded-2xl">
                    <Info className="w-5 h-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-primary uppercase tracking-widest">Security Protocol</p>
                    <p className="text-[11px] leading-relaxed text-muted-foreground font-medium">
                      Your machine secrets are stored safely in <code className="bg-primary/10 px-2 py-0.5 rounded-md text-primary font-bold">~/.filedromat/config.json</code>. We never expose your keys to third-party tracking services.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'intelligence' && (
              <div className="space-y-10 animate-in slide-in-from-right-8 duration-500 px-2">
                <div className="space-y-6">
                  <div className="flex items-end justify-between border-b pb-6 border-border/50">
                    <div className="space-y-1.5">
                      <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
                        <Activity className="w-6 h-6 text-primary" />
                        Main Folding Unit
                      </h3>
                      <p className="text-sm text-muted-foreground/70 font-medium">The primary AI engine for organizing your laundry load.</p>
                    </div>
                    {allModels.length > 0 && <Badge variant="secondary" className="font-mono text-[10px] px-3">{allModels.length} Units Available</Badge>}
                  </div>
                  
                  <div className="flex items-center gap-2 p-1.5 bg-muted/30 rounded-2xl w-fit mb-4 border border-border/50">
                    <button
                      onClick={() => setMainProvider('google')}
                      className={`px-6 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-300 ${
                        mainProvider === 'google' 
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105' 
                          : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                      }`}
                    >
                      Google Gemini
                    </button>
                    <button
                      onClick={() => setMainProvider('anthropic')}
                      className={`px-6 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-300 ${
                        mainProvider === 'anthropic' 
                          ? 'bg-accent text-accent-foreground shadow-lg shadow-accent/20 scale-105' 
                          : 'text-muted-foreground hover:text-accent hover:bg-accent/5'
                      }`}
                    >
                      Anthropic Claude
                    </button>
                  </div>

                  {mainProvider === 'google' && (
                    <div className="space-y-6 pb-10 border-b border-border/50 animate-in fade-in slide-in-from-top-4 duration-500 bg-primary/5 -mx-10 px-10 py-8">
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="space-y-1.5">
                          <h3 className="text-xl font-black tracking-tight flex items-center justify-center gap-3">
                            <Sparkles className="w-6 h-6 text-primary" />
                            Default Machine Reasoning
                          </h3>
                          <p className="text-sm text-muted-foreground/70 font-medium max-w-md">Set the baseline "Thinking Power" for all organization tasks.</p>
                        </div>
                        
                        <div className="flex gap-2 p-1.5 bg-background/50 rounded-2xl border border-border/50 w-full max-w-md shadow-inner-sm">
                          {['none', 'low', 'medium', 'high'].map((intensity) => (
                            <Button
                              key={intensity}
                              variant={defaultThinkingIntensity === intensity ? 'default' : 'ghost'}
                              className={cn(
                                "flex-1 h-11 rounded-xl transition-all duration-300 font-bold text-xs capitalize",
                                defaultThinkingIntensity === intensity ? "bg-white text-primary shadow-lg hover:bg-white scale-105" : "text-muted-foreground hover:bg-primary/5"
                              )}
                              onClick={() => setDefaultThinkingIntensity(intensity as any)}
                            >
                              {intensity}
                            </Button>
                          ))}
                        </div>

                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className="font-bold uppercase tracking-widest text-[10px] bg-primary/10 text-primary border-primary/20 px-3 py-1">
                            {defaultThinkingIntensity === 'none' ? 'Standard Protocol' : `${defaultThinkingIntensity} intensity reasoning`}
                          </Badge>
                          <p className="text-[11px] font-medium text-muted-foreground/80 italic">
                            {defaultThinkingIntensity === 'none' 
                              ? "Fast, direct folding. Best for clear, simple file loads." 
                              : "Increases organization accuracy by allowing the AI to 'reason' before proposing moves. Adds latency per load."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {(mainProvider === 'google' ? isLoadingGemini : isLoadingAnthropic) ? (
                      <div className="col-span-full flex flex-col items-center justify-center py-20 space-y-6 bg-muted/20 rounded-[2.5rem] border-2 border-dashed border-primary/10">
                        <div className="relative">
                          <div className="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                          <div className="absolute inset-0 flex items-center justify-center">
                             <Cpu className="w-6 h-6 text-primary animate-pulse" />
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground font-black uppercase tracking-[0.2em] animate-pulse">Establishing Neural Link...</span>
                      </div>
                    ) : (mainProvider === 'google' ? geminiModels : anthropicModels).length > 0 ? (
                      (mainProvider === 'google' ? geminiModels : anthropicModels).map((m) => (
                        <div
                          key={m.id}
                          onClick={() => setSelectedModel(m.id)}
                          className={`group p-6 rounded-4xl border-2 cursor-pointer transition-all duration-300 flex items-center justify-between relative overflow-hidden ${
                            selectedModel === m.id 
                              ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10 ring-1 ring-primary/20' 
                              : 'border-border/60 hover:border-primary/40 hover:bg-muted/30'
                          }`}
                        >
                          {selectedModel === m.id && <div className="absolute top-0 right-0 p-1 opacity-10"><Cpu className="w-16 h-16 text-primary" /></div>}
                          <div className="flex items-center gap-5 relative z-10">
                            <div className={`p-3 rounded-2xl transition-all duration-500 ${
                              selectedModel === m.id ? 'bg-primary text-primary-foreground rotate-12' : 'bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary'
                            }`}>
                              <Cpu className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="text-base font-bold tracking-tight">{m.name}</span>
                                <Badge variant="secondary" className={`text-[10px] px-2 py-0 font-bold uppercase transition-colors ${selectedModel === m.id ? 'bg-primary/20 text-primary border-primary/10' : ''}`}>
                                  {m.provider === 'google' ? 'Gemini' : 'Claude'}
                                </Badge>
                              </div>
                              <span className="text-[10px] font-mono text-muted-foreground/60 font-bold tracking-wider uppercase">{m.id}</span>
                            </div>
                          </div>
                          {selectedModel === m.id && (
                            <div className="bg-primary text-white p-1.5 rounded-full shadow-lg shadow-primary/30 z-10 ring-4 ring-background">
                              <CheckCircle className="w-4 h-4 saturate-150" />
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full flex flex-col items-center justify-center py-20 bg-muted/10 rounded-[2.5rem] border-2 border-dashed border-muted-foreground/10 space-y-4">
                         <div className="p-5 bg-muted/20 rounded-full">
                           <Key className="w-8 h-8 text-muted-foreground/30" />
                         </div>
                         <p className="text-sm font-bold text-muted-foreground/60 uppercase tracking-widest text-center max-w-xs">
                           No {mainProvider === 'google' ? 'Gemini' : 'Claude'} Neural Links Detected. Check your API keys in the connection tab.
                         </p>
                      </div>
                    )}
                  </div>

                  </div>

                {/* Fallback Config */}
                <div className="space-y-6 pt-10 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1.5">
                      <h3 className="text-lg font-black tracking-tight flex items-center gap-3">
                        <Zap className="w-5 h-5 text-primary fill-primary/10" />
                        Resilient Secondary Unit
                      </h3>
                      <p className="text-sm text-muted-foreground/70 font-medium">Auto-switches to this engine if the primary unit overheats (quota hit).</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-1.5 bg-muted/30 rounded-2xl w-fit mb-4 border border-border/50">
                    <button
                      onClick={() => setSecondaryProvider('google')}
                      className={`px-5 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all duration-300 ${
                        secondaryProvider === 'google' 
                          ? 'bg-primary text-primary-foreground shadow-lg' 
                          : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                      }`}
                    >
                      Google
                    </button>
                    <button
                      onClick={() => setSecondaryProvider('anthropic')}
                      className={`px-5 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all duration-300 ${
                        secondaryProvider === 'anthropic' 
                          ? 'bg-accent text-accent-foreground shadow-lg' 
                          : 'text-muted-foreground hover:text-accent hover:bg-accent/5'
                      }`}
                    >
                      Anthropic
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {(secondaryProvider === 'google' ? geminiModels : anthropicModels).length > 0 ? (
                      <>
                        <div
                          onClick={() => setFallbackModelId('')}
                          className={`group p-5 rounded-3xl border-2 cursor-pointer transition-all duration-300 flex items-center justify-between relative overflow-hidden ${
                            fallbackModelId === '' 
                              ? 'border-destructive bg-destructive/5' 
                              : 'border-border/60 hover:border-destructive/40 hover:bg-muted/30'
                          }`}
                        >
                          <div className="flex items-center gap-4 relative z-10">
                            <div className={`p-2 rounded-xl transition-all ${
                              fallbackModelId === '' ? 'bg-destructive text-white outline-4 outline-destructive/20' : 'bg-muted text-muted-foreground font-black'
                            }`}>
                              <X className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold tracking-tight">Disable Resilience</span>
                              <span className="text-[9px] font-medium text-muted-foreground/60 uppercase">Stop organizational process on error</span>
                            </div>
                          </div>
                          {fallbackModelId === '' && <CheckCircle className="w-4 h-4 text-destructive" />}
                        </div>

                        {(secondaryProvider === 'google' ? geminiModels : anthropicModels)
                          .filter(m => m.id !== selectedModel)
                          .map((m) => (
                            <div
                              key={m.id}
                              onClick={() => setFallbackModelId(m.id)}
                              className={`group p-5 rounded-3xl border-2 cursor-pointer transition-all duration-300 flex items-center justify-between relative overflow-hidden ${
                                fallbackModelId === m.id 
                                  ? 'border-primary bg-primary/5' 
                                  : 'border-border/60 hover:border-primary/40 hover:bg-muted/30'
                              }`}
                            >
                              <div className="flex items-center gap-4 relative z-10">
                                <div className={`p-2 rounded-xl transition-all ${
                                  fallbackModelId === m.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                                }`}>
                                  <Cpu className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold tracking-tight">{m.name}</span>
                                  <span className="text-[9px] font-mono text-muted-foreground/60 uppercase">{m.id}</span>
                                </div>
                              </div>
                              {fallbackModelId === m.id && <CheckCircle className="w-4 h-4 text-primary" />}
                            </div>
                        ))}
                      </>
                    ) : (
                      <div className="col-span-full py-10 px-6 bg-muted/10 rounded-3xl border-2 border-dashed border-muted-foreground/10">
                         <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest text-center">
                           No {secondaryProvider === 'google' ? 'Gemini' : 'Claude'} models available for fallback.
                         </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="animate-in zoom-in-95 duration-500 h-full flex flex-col max-w-3xl mx-auto py-4">
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <div className="inline-block p-3 bg-primary/10 rounded-2xl mb-2">
                      <Zap className="w-8 h-8 text-primary fill-primary/20" />
                    </div>
                    <h3 className="text-2xl font-black tracking-tighter text-primary uppercase">Parallel Folding Cycles</h3>
                    <p className="text-sm text-muted-foreground/80 font-medium max-w-sm mx-auto">Configure the number of virtual wash tubs running simultaneously for bulk loads.</p>
                  </div>
                  
                  <div className="p-8 bg-muted/20 rounded-4xl border-2 border-primary/10 relative overflow-hidden group shadow-inner-lg">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-all duration-1000 group-hover:rotate-12 group-hover:scale-110">
                      <Zap className="w-48 h-48 text-primary" />
                    </div>
                    
                    <div className="flex flex-col items-center gap-6 relative z-10">
                      <div className="flex flex-col items-center space-y-1">
                        <span className="text-7xl font-black text-primary tracking-tighter tabular-nums drop-shadow-2xl">
                          {parallelCalls}
                        </span>
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest opacity-40">Active Cycles</span>
                      </div>
                      
                      <div className="w-full space-y-6">
                        <input 
                          type="range" 
                          min="1" 
                          max="10" 
                          step="1"
                          value={parallelCalls}
                          onChange={(e) => setParallelCalls(parseInt(e.target.value))}
                          className="w-full h-4 bg-background/50 rounded-full appearance-none cursor-pointer accent-primary hover:accent-accent transition-all shadow-inner border border-white/10"
                        />
                        <div className="flex justify-between px-2">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
                            <div key={val} className="flex flex-col items-center gap-3">
                              <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${val <= parallelCalls ? 'bg-primary scale-125 shadow-sm' : 'bg-muted-foreground/20'}`} />
                              <span className={`text-[10px] font-black tabular-nums transition-colors ${val === parallelCalls ? 'text-primary scale-125' : 'text-muted-foreground/40'}`}>{val}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-3xl bg-primary/5 border border-primary/20 space-y-2 group hover:bg-primary/10 transition-colors">
                      <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary">High-Speed Mode</h4>
                      <p className="text-[11px] font-semibold leading-relaxed text-muted-foreground/80">
                        Maximize throughput by allocating more neural threads. Recommended for loads {'>'} 500 files.
                      </p>
                    </div>
                    <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/20 space-y-2 group hover:bg-amber-500/10 transition-colors">
                      <h4 className="text-xs font-black uppercase tracking-[0.2em] text-amber-600">Rate Limiter</h4>
                      <p className="text-[11px] font-semibold leading-relaxed text-muted-foreground/80">
                        Higher cycle counts consume API quota rapidly. Use with premium tiers or multiple backup keys.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </div>

        <CardFooter className="bg-muted/30 p-8 flex justify-between items-center border-t border-border/50 backdrop-blur-md px-10">
          <div className="flex items-center gap-3 py-2 px-4 rounded-2xl bg-background/50 border border-white/5">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-sm shadow-green-500/50" />
             <span className="text-[11px] font-black uppercase tracking-[0.15em] text-muted-foreground/80">Diagnostics: Stable</span>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" onClick={onClose} className="rounded-2xl px-10 h-14 hover:bg-background/80 font-bold transition-all active:scale-95">Cancel</Button>
            {isSaved ? (
              <Button disabled className="bg-green-500 text-white rounded-2xl px-12 h-14 shadow-2xl shadow-green-500/30 font-black animate-in zoom-in duration-300">
                <CheckCircle className="w-5 h-5 mr-3" />
                SYSTEM UPDATED
              </Button>
            ) : (
              <Button className="rounded-2xl px-12 h-14 shadow-2xl shadow-primary/40 font-black group transition-all duration-500 hover:scale-105 active:scale-95" onClick={handleSave}>
                <Save className="w-5 h-5 mr-3 group-hover:scale-125 transition-transform" />
                COMMIT CHANGES
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
