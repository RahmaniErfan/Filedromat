import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Play, Settings, Binary, HardDrive, Thermometer } from 'lucide-react';
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

      <div className="text-center space-y-2 max-w-lg">
        <h1 className="text-4xl font-bold tracking-tight bg-linear-to-br from-primary to-accent bg-clip-text text-transparent">
          Filedromat
        </h1>
        <p className="text-muted-foreground text-lg">
          The AI-powered "File Laundry" for your messy directories.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full max-w-4xl px-4">
        <Card className="laundry-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-orange-500" />
              Machine Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-bold italic tracking-tight uppercase ${isConfigured ? 'text-green-500' : 'text-red-500'}`}>
              {isConfigured ? 'Ready to Wash' : 'Needs Detergent'}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-black uppercase tracking-widest opacity-60">
              {isConfigured ? 'All Systems Operational' : 'API Keys Required'}
            </p>
          </CardContent>
        </Card>

        <Card className="laundry-card md:col-span-2 relative overflow-hidden group">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Binary className="w-4 h-4 text-blue-500" />
                Intelligence & Neural Link
              </div>
              <div className="flex gap-1.5 translate-x-2">
                <Badge 
                  variant="outline" 
                  className={`text-[8px] font-black h-5 px-2 transition-all duration-500 ${
                    hasGemini 
                      ? 'bg-blue-500/10 text-blue-600 border-blue-500/20 shadow-sm shadow-blue-500/10' 
                      : 'bg-muted/30 text-muted-foreground/30 border-transparent opacity-50 grayscale'
                  }`}
                >
                  GEMINI
                </Badge>
                <Badge 
                  variant="outline" 
                  className={`text-[8px] font-black h-5 px-2 transition-all duration-500 ${
                    hasAnthropic 
                      ? 'bg-orange-500/10 text-orange-600 border-orange-500/20 shadow-sm shadow-orange-500/10' 
                      : 'bg-muted/30 text-muted-foreground/30 border-transparent opacity-50 grayscale'
                  }`}
                >
                  CLAUDE
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-2">
              <div className={`text-xl font-bold italic tracking-tight uppercase truncate max-w-[90%] ${isConfigured ? '' : 'text-muted-foreground/50 font-medium'}`}>
                {isConfigured 
                  ? (config.geminiModel || config.anthropicModel || 'DEFAULT ENGINE').toUpperCase()
                  : 'ENGINE OFFLINE'}
              </div>
            </div>
            <div className="flex items-center gap-2">
               <div className={`w-1.5 h-1.5 rounded-full ${isConfigured && config.fallbackModelId ? 'bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]' : (isConfigured ? 'bg-primary/50' : 'bg-muted-foreground/20')}`} />
               <p className="text-xs text-muted-foreground mt-0.5 font-black uppercase tracking-widest opacity-60">
                 {!isConfigured 
                   ? 'Neural Link Required'
                   : config.fallbackModelId 
                     ? `RESILLIENT CLUSTER: ${config.fallbackModelId.toUpperCase()}` 
                     : 'Single Neural Engine Active'}
               </p>
            </div>
          </CardContent>
        </Card>

        <Card className="laundry-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-purple-500" />
              Load Capacity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold italic tracking-tight uppercase">High-Capacity Drum</div>
            <p className="text-xs text-muted-foreground mt-1 font-black uppercase tracking-widest opacity-60">
              Deep Agitation Enabled
            </p>
          </CardContent>
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
