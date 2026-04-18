import { useState, useMemo, useRef, useEffect } from 'react';
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
  ChevronLeft,
  File, 
  Folder,
  Download,
  Terminal,
  Play,
  Sparkles
} from 'lucide-react';
import type { ActionPlan, FileAction, HistoryItem } from '../../../src/types/index.js';

interface SplitViewProps {
  plan: ActionPlan;
  history: HistoryItem[];
  onRefine: (feedback: string) => void;
  onExecute: () => void;
  onExport: (format: 'json' | 'bash') => void;
  isRefining: boolean;
}

// Helper to build tree from flat actions
function buildTree(actions: FileAction[], targetFolder: string) {
  const root: any = { id: 'root', name: 'New Structure', children: {}, files: [] };
  
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
    
    let pathAcc = '';
    for (const part of parts) {
      pathAcc += (pathAcc ? '-' : '') + part;
      if (!current.children[part]) {
        current.children[part] = { id: `folder-${pathAcc}`, name: part, children: {}, files: [] };
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
    <div className="select-none relative" id={item.id}>
      <div 
        className={`flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-primary/5 cursor-pointer transition-colors group/item ${depth === 0 ? 'font-bold text-primary' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        style={{ paddingLeft: `${depth * 1.25}rem` }}
      >
        <div className="flex items-center gap-2 relative z-10">
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
      </div>
      
      {isOpen && (
        <div className="animate-in slide-in-from-left-2 duration-200 relative">
          {/* Vertical guideline */}
          {hasChildren && (
            <div 
              className="absolute left-0 top-0 bottom-4 w-px bg-primary/25 group-hover/item:bg-primary/50 transition-colors"
              style={{ left: `${depth * 1.25 + 0.5}rem` }}
            />
          )}
          
          {Object.values(item.children).map((child: any) => (
            <TreeItem key={child.name} item={child} depth={depth + 1} />
          ))}
          {item.files.map((file: any) => (
            <div 
              key={file.name} 
              className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-muted/50 transition-colors group relative z-10"
              style={{ paddingLeft: `${(depth + 1) * 1.25}rem` }}
              title={file.reason}
            >
              <File className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs truncate flex-1 text-muted-foreground">{file.name}</span>
              <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]">
                {file.reason.substring(0, 20)}...
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const FolderPills = ({ folders, onScrollTo }: { folders: any[], onScrollTo: (id: string) => void }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (el) {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      setShowLeftArrow(scrollLeft > 5);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      checkScroll();
      
      const handleWheel = (e: WheelEvent) => {
        // If content is not scrollable horizontally, let the event pass through
        if (el.scrollWidth <= el.clientWidth) return;

        // If the user is already scrolling horizontally (Shift + Wheel or Trackpad), let it be
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

        if (e.deltaY !== 0) {
          const isScrollingLeft = e.deltaY < 0;
          const canScrollLeft = el.scrollLeft > 0;
          const canScrollRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 1;

          // Only intercept if we haven't reached the boundaries in the desired direction
          if ((isScrollingLeft && canScrollLeft) || (!isScrollingLeft && canScrollRight)) {
            e.preventDefault();
            el.scrollLeft += e.deltaY;
            checkScroll();
          }
        }
      };
      
      el.addEventListener('wheel', handleWheel, { passive: false });
      el.addEventListener('scroll', checkScroll);
      
      return () => {
        el.removeEventListener('wheel', handleWheel);
        el.removeEventListener('scroll', checkScroll);
      };
    }
  }, [folders]);

  if (folders.length === 0) return null;

  const scrollBy = (amount: number) => {
    scrollRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
  };
  
  return (
    <div className="relative group/pills mt-1 flex-1 min-w-0 overflow-hidden">
      {/* Navigation Arrows */}
      {showLeftArrow && (
        <div className="absolute left-0 top-0 bottom-2 z-20 flex items-center pr-8 bg-gradient-to-r from-muted/40 via-muted/20 to-transparent pointer-events-none">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-full bg-white/90 shadow-sm border border-primary/10 pointer-events-auto hover:bg-white hover:scale-110 transition-all ml-0.5"
            onClick={() => scrollBy(-150)}
          >
            <ChevronLeft className="h-4 w-4 text-primary" />
          </Button>
        </div>
      )}

      {showRightArrow && (
        <div className="absolute right-0 top-0 bottom-2 z-20 flex items-center pl-8 bg-gradient-to-l from-muted/40 via-muted/20 to-transparent pointer-events-none">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-full bg-white/90 shadow-sm border border-primary/10 pointer-events-auto hover:bg-white hover:scale-110 transition-all mr-0.5"
            onClick={() => scrollBy(150)}
          >
            <ChevronRight className="h-4 w-4 text-primary" />
          </Button>
        </div>
      )}

      <div 
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-2 px-1 no-scrollbar overflow-y-hidden"
      >
        {folders.map(folder => (
          <Badge 
            key={folder.id}
            variant="secondary" 
            className="cursor-pointer hover:bg-primary/20 hover:text-primary whitespace-nowrap transition-all flex items-center gap-1.5 py-1 px-3 border border-transparent hover:border-primary/20 shadow-sm"
            onClick={() => onScrollTo(folder.id)}
          >
            <Folder className="w-3 h-3 fill-current opacity-60" />
            {folder.name}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export function SplitView({ plan, history, onRefine, onExecute, onExport, isRefining }: SplitViewProps) {
  const [feedback, setFeedback] = useState('');
  const treeData = useMemo(() => buildTree(plan.actions, plan.targetFolder || ''), [plan]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const hierarchyRef = useRef<HTMLDivElement>(null);

  const mainFolders = useMemo(() => {
    return Object.values(treeData.children).map((child: any) => ({
      id: child.id,
      name: child.name
    }));
  }, [treeData]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isRefining]);

  const scrollToFolder = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Add a brief highlight effect
      element.classList.add('bg-primary/10');
      setTimeout(() => element.classList.remove('bg-primary/10'), 2000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback.trim() && !isRefining && feedback.length <= 500) {
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

      <div className="flex flex-1 gap-6 overflow-hidden pb-4">
        {/* Left Pane: The Tree */}
        <Card className="flex-3 laundry-card flex flex-col overflow-hidden text-card-foreground">
          <CardHeader className="py-3 bg-muted/20 border-b space-y-1">
            <div className="flex items-center justify-between w-full">
              <CardTitle className="text-[12px] font-bold uppercase tracking-wider flex items-center gap-2 text-muted-foreground/80">
                <FolderTree className="w-3.5 h-3.5 text-primary" />
                Proposed Hierarchy
              </CardTitle>
              <span className="text-[10px] text-primary/40 font-semibold uppercase tracking-widest selection:bg-transparent">
                Swipe tags to browse • Tap to jump
              </span>
            </div>
            <FolderPills folders={mainFolders} onScrollTo={scrollToFolder} />
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-4 custom-scrollbar" ref={hierarchyRef}>
            <TreeItem item={treeData} />
          </CardContent>
        </Card>

        {/* Right Pane: The Chat */}
        <Card className="flex-2 laundry-card flex flex-col overflow-hidden relative text-card-foreground">
          <CardHeader className="py-3 bg-muted/20 border-b">
            <CardTitle className="text-[12px] font-bold uppercase tracking-wider flex items-center gap-2 text-muted-foreground/80">
              <MessageSquare className="w-3.5 h-3.5 text-primary" />
              Refinement Chat
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-4 space-y-4 custom-scrollbar">
            {history.map((item) => (
              <div 
                key={item.id} 
                className={`p-4 rounded-2xl text-sm border animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                  item.role === 'user' 
                    ? 'bg-muted/50 border-muted ml-8 rounded-tr-none' 
                    : 'bg-primary/5 border-primary/10 mr-8 rounded-tl-none'
                }`}
              >
                <p className={`font-semibold mb-2 flex items-center gap-2 ${
                  item.role === 'user' ? 'text-muted-foreground' : 'text-primary'
                }`}>
                  {item.role === 'user' ? (
                    <MessageSquare className="w-4 h-4" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {item.role === 'user' ? 'You' : 'Filedromat AI'}
                </p>
                <div className="space-y-3">
                  {item.role === 'assistant' ? (
                    <p className="text-sm italic border-l-2 border-primary/20 pl-3 py-1 bg-white/40 rounded-r-md">
                       "{item.content}"
                    </p>
                  ) : (
                    <p className="leading-relaxed">
                      {item.content}
                    </p>
                  )}
                </div>
              </div>
            ))}
            
            {isRefining && (
              <div className="flex items-center gap-2 text-sm text-primary animate-pulse py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Folding files into new structure...
              </div>
            )}
            <div ref={chatEndRef} />
          </CardContent>
          <CardFooter className="p-4 bg-muted/10 border-t flex flex-col gap-2">
            <div className="flex justify-between items-center w-full px-1">
              <span className={`text-[10px] font-medium transition-colors ${feedback.length > 450 ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`}>
                {feedback.length} / 500 characters
              </span>
              {feedback.length > 500 && (
                <span className="text-[10px] text-destructive font-bold uppercase tracking-wider">
                  Too long! Please shorten.
                </span>
              )}
            </div>
            <form onSubmit={handleSubmit} className="w-full relative">
              <Input 
                placeholder="Actually, group images by month..." 
                className={`pr-12 h-12 rounded-xl bg-background border-primary/20 focus:border-primary transition-all ${feedback.length > 500 ? 'border-destructive focus:border-destructive shadow-[0_0_0_2px_rgba(239,68,68,0.1)]' : ''}`}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                disabled={isRefining}
                maxLength={510} // allow slightly over for the 'too long' state feedback
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!feedback.trim() || isRefining || feedback.length > 500}
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
