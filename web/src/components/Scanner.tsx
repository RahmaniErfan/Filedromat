import { Binary, Loader2 } from 'lucide-react';

interface ScannerProps {
  progress: number;
  path: string;
}

export function Scanner({ progress, path }: ScannerProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8 page-enter">
      <div className="relative">
        <div className="w-64 h-64 rounded-full border-8 border-primary/20 flex items-center justify-center bg-card shadow-2xl overflow-hidden relative">
          {/* Water effect */}
          <div 
            className="absolute bottom-0 left-0 right-0 bg-primary/20 transition-all duration-500 ease-in-out animate-slosh" 
            style={{ height: `${Math.min(100, (progress / 100) * 100)}%` }}
          />
          
          <div className="relative z-10 flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <div className="text-4xl font-bold text-primary">{progress}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-widest">Files Found</div>
          </div>

          {/* Bubbles */}
          <div className="bubble w-4 h-4 left-1/4" style={{ animationDelay: '0s' }} />
          <div className="bubble w-3 h-3 left-1/2" style={{ animationDelay: '1.5s' }} />
          <div className="bubble w-5 h-5 left-3/4" style={{ animationDelay: '0.8s' }} />
        </div>
        
        {/* Decorative Ring */}
        <div className="absolute -inset-4 border-2 border-dashed border-primary/10 rounded-full animate-wash-spin" />
      </div>

      <div className="text-center space-y-4 max-w-md">
        <h2 className="text-2xl font-bold">Washing in Progress...</h2>
        <div className="p-3 bg-muted/50 rounded-xl border border-border flex items-center gap-3">
          <Binary className="w-5 h-5 text-primary" />
          <code className="text-xs truncate flex-1 block">{path}</code>
        </div>
        <p className="text-sm text-muted-foreground italic">
          Filedromat is recursively indexing your load and extracting "Deep Wash" features. 
          Please keep the machine running.
        </p>
      </div>

      <div className="w-full max-w-sm bg-muted rounded-full h-2 overflow-hidden border border-border">
        <div className="bg-primary h-full animate-pulse transition-all duration-300" style={{ width: '60%' }} />
      </div>
    </div>
  );
}
