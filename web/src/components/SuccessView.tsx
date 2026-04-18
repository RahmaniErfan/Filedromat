import { Card } from './ui/card';
import { Button } from './ui/button';
import { CheckCircle2, PartyPopper, RefreshCcw, Home, Sparkles } from 'lucide-react';
import { Badge } from './ui/badge';

import type { ExecutionSummary } from '../../../src/types/index.js';

interface SuccessViewProps {
  onReset: () => void;
  summary?: string;
  result?: ExecutionSummary;
}

export function SuccessView({ onReset, summary, result }: SuccessViewProps) {
  const hasErrors = result && result.errorCount > 0;
  const isPartialSuccess = hasErrors && result.successCount > 0;
  const isTotalFailure = hasErrors && result.successCount === 0;
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

        {result && (
          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 mt-6 animate-in zoom-in-95 duration-500 delay-200 w-full">
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary/60 mb-4">Machine Recap</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4">
                <div className="flex flex-col items-center">
                  <Badge variant="outline" className="bg-green-500/10 px-3 py-1 text-sm font-semibold text-green-600 border-green-500/20">
                    {result.successCount} Folded
                  </Badge>
                </div>
                {result.errorCount > 0 && (
                  <div className="flex flex-col items-center">
                    <Badge variant="outline" className="bg-destructive/10 px-3 py-1 text-sm font-semibold text-destructive border-destructive/20">
                      {result.errorCount} Issues
                    </Badge>
                  </div>
                )}
              </div>
              
              {summary && (
                <p className="text-sm italic font-medium text-primary leading-relaxed px-4 pt-2 border-t border-primary/10">
                  "{summary}"
                </p>
              )}

              {result.errors.length > 0 && (
                <div className="mt-4 pt-4 border-t border-primary/10 text-left max-h-40 overflow-y-auto custom-scrollbar">
                  <p className="text-[10px] font-black uppercase tracking-widest text-destructive mb-2">Error Log:</p>
                  <ul className="space-y-2">
                    {result.errors.map((err, idx) => (
                      <li key={idx} className="text-[11px] leading-tight text-muted-foreground bg-destructive/5 p-2 rounded-lg border border-destructive/10">
                        <span className="font-bold text-destructive brick">ERROR:</span> {err.message}
                        <div className="opacity-60 truncate mt-1">File: {err.path}</div>
                      </li>
                    ))}
                  </ul>
                </div>
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
