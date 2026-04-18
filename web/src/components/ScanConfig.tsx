import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from '@/components/ui/label';
import { Sparkles, Layers, Sliders, Droplets, ArrowRight } from 'lucide-react';

interface ScanConfigProps {
  onScan: (options: { deepWash: boolean; maxDepth: number }) => void;
  onBack: () => void;
}

export function ScanConfig({ onScan, onBack }: ScanConfigProps) {
  const [deepWash, setDeepWash] = useState(false);
  const [maxDepth, setMaxDepth] = useState(1);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 page-enter">
      <Card className="w-full max-w-xl laundry-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-primary" />
            Washing Cycles
          </CardTitle>
          <CardDescription>
            Configure how thoroughly Filedromat should analyze your files.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/10">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <Label htmlFor="deep-wash" className="text-base font-semibold">Deep Wash</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Extract content samples from PDFs and text files for better sorting.
              </p>
            </div>
            <Switch 
              id="deep-wash" 
              checked={deepWash} 
              onCheckedChange={setDeepWash} 
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <Label className="text-base font-semibold">Load Depth</Label>
              </div>
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-bold">
                {maxDepth === 1 ? 'Surface Clean (Main Folder)' : maxDepth === 5 ? 'Extreme Recursion' : `Load Depth: ${maxDepth}`}
              </span>
            </div>
            
            <div className="flex gap-2">
              {[1, 2, 3, 5].map((d) => (
                <Button
                  key={d}
                  variant={maxDepth === d ? 'default' : 'outline'}
                  className={`flex-1 h-12 rounded-xl transition-all ${maxDepth === d ? 'shadow-lg shadow-primary/20 scale-105' : ''}`}
                  onClick={() => setMaxDepth(d)}
                >
                  {d}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {maxDepth === 1 
                ? "Scans ONLY the files directly inside your selected folder." 
                : `Scans files in the main folder and ${maxDepth - 1} level${maxDepth > 2 ? 's' : ''} of subdirectories.`}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pt-4">
          <Button variant="ghost" onClick={onBack}>Change Path</Button>
          <Button size="lg" className="rounded-full px-8 gap-2" onClick={() => onScan({ deepWash, maxDepth: maxDepth - 1 })}>
            <Droplets className="w-4 h-4" />
            Start Cycle
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardFooter>
      </Card>

      <div className="grid grid-cols-2 gap-4 w-full max-w-xl">
        <div className="p-4 rounded-2xl bg-white/40 border border-white/20 backdrop-blur-sm text-center opacity-70">
          <div className="text-2xl font-bold text-primary">02</div>
          <div className="text-xs text-muted-foreground uppercase tracking-widest">Configuration</div>
        </div>
        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 text-center animate-pulse">
          <div className="text-2xl font-bold text-primary">03</div>
          <div className="text-xs text-muted-foreground uppercase tracking-widest">Washing...</div>
        </div>
      </div>
    </div>
  );
}
