import { Card } from './ui/card';
import { Button } from './ui/button';
import { CheckCircle2, PartyPopper, RefreshCcw, Home, Sparkles } from 'lucide-react';
import { Badge } from './ui/badge';

interface SuccessViewProps {
  onReset: () => void;
  summary?: string;
  count?: number;
}

export function SuccessView({ onReset, summary, count }: SuccessViewProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8 page-enter text-center">
      <div className="relative">
        <div className="absolute -inset-8 bg-green-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="relative w-32 h-32 rounded-full bg-green-500 flex items-center justify-center text-white shadow-2xl shadow-green-500/40">
          <CheckCircle2 className="w-16 h-16 animate-bounce" />
        </div>
        
        {/* Floating Sparkles */}
        <Sparkles className="absolute -top-4 -right-4 w-8 h-8 text-yellow-500 animate-pulse" />
        <PartyPopper className="absolute -bottom-4 -left-4 w-8 h-8 text-purple-500 animate-bounce" />
      </div>

      <div className="space-y-4 max-w-md">
        <h2 className="text-4xl font-black bg-linear-to-br from-green-600 to-emerald-600 bg-clip-text text-transparent">
          Freshly Laundered!
        </h2>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Your files have been meticulously folded and placed into their new designated folders. 
          The machine has completed its cycle.
        </p>

        {(summary || count) && (
          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 mt-6 animate-in zoom-in-95 duration-500 delay-200">
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary/60 mb-4">Machine Recap</h3>
            <div className="space-y-4">
              {count !== undefined && (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-px bg-primary/10 flex-1" />
                  <Badge variant="outline" className="bg-white/50 px-3 py-1 text-sm font-semibold text-primary border-primary/20">
                    {count} Files Laundered
                  </Badge>
                  <div className="h-px bg-primary/10 flex-1" />
                </div>
              )}
              {summary && (
                <p className="text-sm italic font-medium text-primary leading-relaxed px-4">
                  "{summary}"
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <Button size="lg" className="rounded-full px-8 gap-2 shadow-xl shadow-primary/20" onClick={onReset}>
          <Home className="w-4 h-4" />
          Dashboard
        </Button>
        <Button variant="outline" size="lg" className="rounded-full px-8 gap-2" onClick={onReset}>
          <RefreshCcw className="w-4 h-4" />
          Another Wash
        </Button>
      </div>

      <Card className="laundry-card mt-8 p-4 bg-muted/20 border-dashed border-2">
        <p className="text-xs text-muted-foreground italic flex items-center gap-2">
          <Sparkles className="w-3 h-3 text-primary" />
          Remember to check your folders. Filedromat uses AI to propose structures, 
          but you're always the boss of your machine.
        </p>
      </Card>
    </div>
  );
}
