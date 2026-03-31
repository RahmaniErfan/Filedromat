import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { FolderOpen, ArrowRight, CornerDownRight } from 'lucide-react';

interface DirectorySelectorProps {
  onSelect: (path: string) => void;
  onBack: () => void;
}

export function DirectorySelector({ onSelect, onBack }: DirectorySelectorProps) {
  const [path, setPath] = useState('');

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 page-enter">
      <Card className="w-full max-w-xl laundry-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            Select Laundry Load
          </CardTitle>
          <CardDescription>
            Enter the absolute path of the directory you want to organize.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative group">
            <Input 
              placeholder="/home/user/Downloads" 
              className="h-12 pl-4 pr-12 text-lg rounded-xl"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && path && onSelect(path)}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
              <CornerDownRight className="w-5 h-5" />
            </div>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-xl border border-dashed border-muted-foreground/20">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <span className="font-semibold px-1.5 py-0.5 bg-muted rounded border text-[10px]">PRO TIP</span>
              You can organize any local folder. Make sure Filedromat has read/write permissions.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="ghost" onClick={onBack}>Back to Lobby</Button>
          <Button disabled={!path} onClick={() => onSelect(path)}>
            Prepare Wash
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardFooter>
      </Card>
      
      <div className="grid grid-cols-2 gap-4 w-full max-w-xl">
        <div className="p-4 rounded-2xl bg-white/40 border border-white/20 backdrop-blur-sm text-center">
          <div className="text-2xl font-bold text-primary">01</div>
          <div className="text-xs text-muted-foreground uppercase tracking-widest">Select Path</div>
        </div>
        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 text-center opacity-50">
          <div className="text-2xl font-bold text-primary">02</div>
          <div className="text-xs text-muted-foreground uppercase tracking-widest">Deep Scan</div>
        </div>
      </div>
    </div>
  );
}
