import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { X, Key, Cpu, Save, CheckCircle } from 'lucide-react';
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
  const [models, setModels] = useState<AIModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

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
    onSave({ geminiApiKey: apiKey, geminiModel: selectedModel });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className="w-full max-w-md shadow-2xl laundry-card relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary via-accent to-primary animate-pulse" />
        
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle>Machine Settings</CardTitle>
            <CardDescription>Configure your Gemini AI connection.</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Key className="w-4 h-4 text-primary" />
              Gemini API Key
            </div>
            <Input 
              type="password" 
              placeholder="Paste your API key here" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onBlur={() => apiKey && loadModels(apiKey)}
              className="h-10 rounded-xl"
            />
            <p className="text-[10px] text-muted-foreground">
              Your key is stored locally in ~/.filedromat/config.json
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Cpu className="w-4 h-4 text-primary" />
              Folding Model
            </div>
            
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {isLoadingModels ? (
                <div className="text-sm text-center py-4 text-muted-foreground animate-pulse">
                  Detecting available models...
                </div>
              ) : models.length > 0 ? (
                models.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedModel(m.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedModel === m.id 
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                        : 'border-border hover:border-primary/30 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{m.name}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{m.id}</span>
                    </div>
                    {selectedModel === m.id && <CheckCircle className="w-4 h-4 text-primary" />}
                  </div>
                ))
              ) : (
                <div className="text-xs text-center py-4 bg-muted/30 rounded-xl border border-dashed text-muted-foreground">
                  Enter a valid API key to see available models.
                </div>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="bg-muted/10 pt-4 flex justify-end gap-2">
          {isSaved ? (
            <Button disabled className="bg-green-500 text-white rounded-full px-6">
              <CheckCircle className="w-4 h-4 mr-2" />
              Settings Saved
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button disabled={!apiKey} className="rounded-full px-6" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Config
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
