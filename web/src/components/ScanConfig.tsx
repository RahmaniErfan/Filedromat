import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from '@/components/ui/label';
import { Sparkles, Layers, Sliders, Droplets, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScanConfigProps {
  onScan: (options: { deepWash: boolean; enforceBoundaries: boolean; maxDepth: number }) => void;
  onBack: () => void;
}

export function ScanConfig({ onScan, onBack }: ScanConfigProps) {
  const [deepWash, setDeepWash] = useState(false);
  const [enforceBoundaries, setEnforceBoundaries] = useState(true);
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary/70">Cycle Options</h3>
              </div>
            </div>

            <div className="grid gap-3">
              <div 
                className="group flex items-center justify-between p-4 rounded-2xl bg-white/50 border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer"
                onClick={() => setDeepWash(!deepWash)}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className={cn("w-4 h-4 transition-colors", deepWash ? "text-primary" : "text-muted-foreground")} />
                    <Label className="text-base font-semibold cursor-pointer">Deep Wash</Label>
                  </div>
                  <p className="text-xs text-muted-foreground pr-8 leading-relaxed">
                    Extract content samples from PDFs and text files for ultra-accurate sorting.
                  </p>
                </div>
                <Switch 
                  id="deep-wash" 
                  checked={deepWash} 
                  onCheckedChange={setDeepWash} 
                  className="shadow-sm"
                />
              </div>

              <div 
                className="group flex items-center justify-between p-4 rounded-2xl bg-white/50 border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer"
                onClick={() => setEnforceBoundaries(!enforceBoundaries)}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Droplets className={cn("w-4 h-4 transition-colors", enforceBoundaries ? "text-primary" : "text-muted-foreground")} />
                    <Label className="text-base font-semibold cursor-pointer">Enforce Folder Boundaries</Label>
                  </div>
                  <p className="text-xs text-muted-foreground pr-8 leading-relaxed">
                    Safeguard: Prevents files from being "plucked" out of their original top-level folders.
                  </p>
                </div>
                <Switch 
                  id="enforce-boundaries" 
                  checked={enforceBoundaries} 
                  onCheckedChange={setEnforceBoundaries} 
                  className="shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6 pt-4 border-t border-border/40">
            <div className="flex items-center justify-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              <Label className="text-lg font-bold tracking-tight">Load Depth</Label>
            </div>

            <div className="text-center space-y-2">
               <div className="text-2xl font-black text-primary tracking-tight uppercase tabular-nums">
                 {maxDepth === 1 ? 'Surface Clean' : maxDepth === 5 ? 'Extreme Wash' : `Level ${maxDepth}`}
               </div>
               <p className="text-sm text-foreground/70 font-medium max-w-[280px] mx-auto leading-tight">
                  {maxDepth === 1 
                    ? "Focuses strictly on the surface files of your selected folder." 
                    : `Deep cycle: Scans your folder plus ${maxDepth - 1} levels of nested subdirectories.`}
               </p>
            </div>
            
            <div className="flex gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-border/40">
              {[1, 2, 3, 5].map((d) => (
                <Button
                  key={d}
                  variant={maxDepth === d ? 'default' : 'ghost'}
                  className={cn(
                    "flex-1 h-12 rounded-xl transition-all duration-300 font-extrabold text-lg",
                    maxDepth === d 
                      ? "bg-white text-primary shadow-md hover:bg-white scale-[1.02]" 
                      : "text-muted-foreground hover:bg-white/50"
                  )}
                  onClick={() => setMaxDepth(d)}
                >
                  {d}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pt-6">
          <Button variant="ghost" className="rounded-xl hover:bg-primary/5" onClick={onBack}>Change Path</Button>
          <Button size="lg" className="rounded-full px-10 gap-2 h-14 text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all" onClick={() => onScan({ deepWash, enforceBoundaries, maxDepth: maxDepth - 1 })}>
            <Droplets className="w-5 h-5 animate-pulse" />
            Start Wash
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
