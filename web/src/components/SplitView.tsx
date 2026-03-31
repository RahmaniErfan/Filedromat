import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { 
  FolderTree, 
  MessageSquare, 
  Send, 
  ChevronRight, 
  ChevronDown, 
  File, 
  Folder,
  Download,
  Terminal,
  Play,
  Sparkles
} from 'lucide-react';
import type { ActionPlan, FileAction } from '../../../src/types/index.js';

interface SplitViewProps {
  plan: ActionPlan;
  onRefine: (feedback: string) => void;
  onExecute: () => void;
  onExport: (format: 'json' | 'bash') => void;
  isRefining: boolean;
}

// Helper to build tree from flat actions
function buildTree(actions: FileAction[], targetFolder: string) {
  const root: any = { name: 'New Structure', children: {}, files: [] };
  
  if (!actions || !Array.isArray(actions)) return root;
  
  const normalizedTarget = targetFolder.endsWith('/') ? targetFolder : targetFolder + '/';
  
  for (const action of actions) {
    // Get relative path by stripping targetFolder
    const relativePath = action.targetPath.startsWith(normalizedTarget) 
      ? action.targetPath.substring(normalizedTarget.length)
      : action.targetPath;

    const parts = relativePath.split('/').filter(Boolean);
    const fileName = parts.pop();
    let current = root;
    
    for (const part of parts) {
      if (!current.children[part]) {
        current.children[part] = { name: part, children: {}, files: [] };
      }
      current = current.children[part];
    }
    
    current.files.push({ name: fileName, original: action.sourcePath, reason: action.reason });
  }
  
  return root;
}

const TreeItem = ({ item, depth = 0 }: { item: any, depth?: number }) => {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = Object.keys(item.children).length > 0 || item.files.length > 0;

  return (
    <div className="select-none">
      <div 
        className={`flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-primary/5 cursor-pointer transition-colors ${depth === 0 ? 'font-bold text-primary' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        style={{ paddingLeft: `${depth * 1.25}rem` }}
      >
        {hasChildren && (
          isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
        )}
        {!hasChildren && <div className="w-4" />}
        <Folder className={`w-4 h-4 ${depth === 0 ? 'fill-primary/20' : 'fill-muted'}`} />
        <span className="text-sm truncate">{item.name}</span>
        {item.files.length > 0 && (
          <Badge variant="secondary" className="ml-auto text-[10px] h-4 px-1 opacity-50">
            {item.files.length}
          </Badge>
        )}
      </div>
      
      {isOpen && (
        <div className="animate-in slide-in-from-left-2 duration-200">
          {Object.values(item.children).map((child: any) => (
            <TreeItem key={child.name} item={child} depth={depth + 1} />
          ))}
          {item.files.map((file: any) => (
            <div 
              key={file.name} 
              className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-muted/50 transition-colors group"
              style={{ paddingLeft: `${(depth + 1) * 1.25}rem` }}
              title={file.reason}
            >
              <File className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs truncate flex-1 text-muted-foreground">{file.name}</span>
              <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                {file.reason.substring(0, 20)}...
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export function SplitView({ plan, onRefine, onExecute, onExport, isRefining }: SplitViewProps) {
  const [feedback, setFeedback] = useState('');
  const treeData = useMemo(() => buildTree(plan.actions, plan.targetFolder || ''), [plan]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback.trim()) {
      onRefine(feedback);
      setFeedback('');
    }
  };

  return (
    <div className="flex flex-col h-[85vh] gap-4 page-enter">
      <div className="flex items-center justify-between px-2">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            Fold & Dry Phase
            <Badge className="bg-green-500/20 text-green-600 hover:bg-green-500/30 border-green-500/20">
              AI PROPOSAL
            </Badge>
          </h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onExport('json')}>
            <Download className="w-4 h-4 mr-2" /> JSON
          </Button>
          <Button variant="outline" size="sm" onClick={() => onExport('bash')}>
            <Terminal className="w-4 h-4 mr-2" /> Bash
          </Button>
          <Button size="sm" className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20" onClick={onExecute}>
            <Play className="w-4 h-4 mr-2" /> Execute Laundry
          </Button>
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Left Pane: The Tree */}
        <Card className="flex-3 laundry-card flex flex-col overflow-hidden text-card-foreground">
          <CardHeader className="py-3 bg-muted/20 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-primary" />
              Proposed Hierarchy
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-4 custom-scrollbar">
            <TreeItem item={treeData} />
          </CardContent>
        </Card>

        {/* Right Pane: The Chat */}
        <Card className="flex-2 laundry-card flex flex-col overflow-hidden relative text-card-foreground">
          <CardHeader className="py-3 bg-muted/20 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              Refinement Chat
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-4 space-y-4">
            <div className="bg-primary/5 p-4 rounded-2xl text-sm border border-primary/10">
              <p className="font-semibold text-primary mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Filedromat AI
              </p>
              <div className="space-y-3">
                <p className="text-sm italic border-l-2 border-primary/20 pl-3 py-1 bg-white/40 rounded-r-md">
                   "{plan.summary}"
                </p>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  I've categorized your files based on the structure above. 
                  Want me to change anything? Just say so!
                </p>
              </div>
            </div>
            
            {isRefining && (
              <div className="flex items-center gap-2 text-sm text-primary animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                Folding files into new structure...
              </div>
            )}
          </CardContent>
          <CardFooter className="p-4 bg-muted/10 border-t">
            <form onSubmit={handleSubmit} className="w-full relative">
              <Input 
                placeholder="Actually, group images by month..." 
                className="pr-12 h-12 rounded-xl bg-background border-primary/20 focus:border-primary transition-all"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                disabled={isRefining}
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!feedback.trim() || isRefining}
                className="absolute right-1.5 top-1.5 h-9 w-9 rounded-lg shadow-lg"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

function Loader2(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
