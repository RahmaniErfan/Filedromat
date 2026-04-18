import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Play, Settings, Binary } from 'lucide-react';
import { Badge } from './ui/badge';

interface LobbyProps {
  config: any;
  onStart: () => void;
  onSettings: () => void;
}

export function Lobby({ config, onStart, onSettings }: LobbyProps) {
  const hasGemini = !!config.geminiApiKey && typeof config.geminiApiKey === 'string' && config.geminiApiKey.trim().length > 10;
  const hasAnthropic = !!config.anthropicApiKey && typeof config.anthropicApiKey === 'string' && config.anthropicApiKey.trim().length > 10;
  const isConfigured = hasGemini || hasAnthropic;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8 page-enter">
      <div className="relative group">
        <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-all duration-500 animate-pulse" />
        <div className="relative w-48 h-48 rounded-full border-8 border-primary/20 flex items-center justify-center bg-card shadow-2xl laundry-card overflow-hidden">
          <div className="absolute inset-2 rounded-full border-4 border-dashed border-primary/10 animate-wash-spin" />
          <Binary className="w-16 h-16 text-primary/80 animate-slosh" />
          
          {/* Bubbles */}
          <div className="bubble w-4 h-4 left-1/4" style={{ animationDelay: '0s' }} />
          <div className="bubble w-3 h-3 left-1/2" style={{ animationDelay: '1s' }} />
          <div className="bubble w-5 h-5 left-3/4" style={{ animationDelay: '2s' }} />
        </div>
      </div>

      <div className="text-center space-y-3 max-w-lg mb-4">
        <h1 className="text-5xl font-black tracking-tighter bg-linear-to-br from-primary via-blue-400 to-accent bg-clip-text text-transparent drop-shadow-sm">
          Filedromat
        </h1>
        <p className="text-muted-foreground/80 text-lg font-medium">
          The AI-powered File Laundry for your messy directories.
        </p>
      </div>

      <div className="w-full max-w-2xl px-4">
        <Card className="laundry-card relative overflow-hidden group border-2 border-primary/20 p-8">
          {/* Glossy Overlay */}
          <div className="absolute inset-0 gloss opacity-50 transition-opacity group-hover:opacity-70" />
          
          <div className="relative z-10 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg ${isConfigured ? 'bg-primary text-primary-foreground rotate-0 scale-110 shadow-primary/20' : 'bg-muted text-muted-foreground rotate-12 opacity-50'}`}>
                  <Binary className="w-6 h-6" />
                </div>
                <div className="space-y-0.5">
                  <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/60">Main Processing Unit</h2>
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${isConfigured ? 'bg-green-500 status-glow-green' : 'bg-red-500 status-glow-red'}`} />
                    <span className={`text-xs font-bold uppercase tracking-widest ${isConfigured ? 'text-green-600' : 'text-red-500 animate-pulse'}`}>
                      {isConfigured ? 'All Systems Operational' : 'Neural Link Offline'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Badge 
                  variant="outline" 
                  className={`text-[9px] font-black h-6 px-3 transition-all duration-500 rounded-full ${
                    hasGemini 
                      ? 'bg-blue-500/10 text-blue-600 border-blue-500/30 shadow-sm' 
                      : 'bg-muted/30 text-muted-foreground/30 border-transparent grayscale'
                  }`}
                >
                  GEMINI
                </Badge>
                <Badge 
                  variant="outline" 
                  className={`text-[9px] font-black h-6 px-3 transition-all duration-500 rounded-full ${
                    hasAnthropic 
                      ? 'bg-orange-500/10 text-orange-600 border-orange-500/30 shadow-sm' 
                      : 'bg-muted/30 text-muted-foreground/30 border-transparent grayscale'
                  }`}
                >
                  CLAUDE
                </Badge>
              </div>
            </div>

            <div className="py-6 border-y border-primary/5">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40 mb-1">Active Neural Engine</span>
                <div className={`text-3xl font-black italic tracking-tighter uppercase truncate ${isConfigured ? 'text-foreground' : 'text-muted-foreground/30 font-medium'}`}>
                  {isConfigured 
                    ? (config.geminiModel || config.anthropicModel || 'DEFAULT ENGINE').toUpperCase()
                    : 'Awaiting Detergent...'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-xl ${isConfigured ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground/40'}`}>
                  <Settings className="w-4 h-4 animate-spin-slow" />
                 </div>
                 <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-none">
                   {!isConfigured 
                     ? 'API Encryption Keys Missing'
                     : config.fallbackModelId 
                       ? `Active Cluster: Resilient Mode (${config.fallbackModelId.toUpperCase()})` 
                       : 'Standard Folding Protocol Active'}
                 </p>
              </div>
              <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 font-bold uppercase text-[9px]">
                v2.0.4-LNDRY
              </Badge>
            </div>
          </div>
        </Card>
      </div>


      <div className="flex gap-4">
        <Button size="lg" className="rounded-full px-8 gap-2 shadow-lg hover:scale-105 transition-transform" onClick={onStart} disabled={!isConfigured}>
          <Play className="w-4 h-4 fill-current" />
          Start Full Wash
        </Button>
        <Button variant="outline" size="lg" className="rounded-full px-8 gap-2 hover:bg-white transition-colors" onClick={onSettings}>
          <Settings className="w-4 h-4" />
          Settings
        </Button>
      </div>

      {!isConfigured && (
        <p className="text-sm text-destructive animate-bounce">
          ⚠️ Please add your Gemini or Anthropic API Key in Settings to start.
        </p>
      )}
    </div>
  );
}
