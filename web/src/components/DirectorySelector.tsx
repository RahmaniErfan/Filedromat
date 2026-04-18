import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { FolderOpen, ArrowRight, CornerDownRight, Loader2, FolderPlus } from 'lucide-react';
import { useSuggestions } from '../hooks/useSuggestions';
import { cn } from '@/lib/utils';
import { Popover } from '@base-ui/react/popover';

interface DirectorySelectorProps {
  /** Callback triggered when a final directory path is selected. */
  onSelect: (path: string) => void;
  /** Callback to return to the previous screen. */
  onBack: () => void;
}

/**
 * A directory selection component with autocomplete suggestions.
 * Allows users to enter an absolute path or pick from system suggestions.
 */
export function DirectorySelector({ onSelect, onBack }: DirectorySelectorProps) {
  const [path, setPath] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { suggestions, isLoading, refresh } = useSuggestions(path);
  const suggestionListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedIndex >= 0 && suggestionListRef.current) {
      const selectedElement = suggestionListRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ 
          block: 'nearest', 
          behavior: 'instant' as any 
        });
      }
    }
  }, [selectedIndex]);

  const handleFocus = () => {
    setShowSuggestions(true);
    if (!path) refresh();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > -1 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        e.preventDefault();
        handleSuggestionClick(null, suggestions[selectedIndex]);
      } else if (path) {
        onSelect(path);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleSuggestionClick = (e: React.BaseSyntheticEvent | null, suggestion: string) => {
    e?.stopPropagation();
    const slashPath = suggestion.endsWith('/') ? suggestion : suggestion + '/';
    
    // If we click the EXACT same folder already in the input, close it
    const normalizedCurrentPath = path.endsWith('/') ? path : path + '/';
    if (normalizedCurrentPath === slashPath) {
      setShowSuggestions(false);
      return;
    }

    setPath(slashPath);
    setSelectedIndex(-1);
    setShowSuggestions(true);
    
    // Maintain focus on input after selection
    setTimeout(() => inputRef.current?.focus(), 0);
  };

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
          <Popover.Root 
            open={showSuggestions} 
            onOpenChange={(open: boolean, details: { reason: any }) => {
              // Prevent closing the suggestions immediately upon focusing the input
              if (details.reason === 'trigger-press' && showSuggestions) {
                 return;
              }
              
              setShowSuggestions(open);
            }}
            modal={false}
          >
            <div className="relative group">
              <Popover.Trigger
                nativeButton={false}
                render={
                  <Input 
                    ref={inputRef}
                    placeholder="/home/user/Downloads" 
                    className="h-12 pl-4 pr-12 text-lg rounded-xl focus:ring-primary/20"
                    value={path}
                    onChange={(e) => {
                      const newPath = e.target.value;
                      setPath(newPath);
                      setShowSuggestions(true);
                      setSelectedIndex(-1);
                    }}
                    onFocus={handleFocus}
                    onClick={() => {
                      setShowSuggestions(true);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                  />
                }
              />

              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors flex items-center gap-2 pointer-events-none">
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CornerDownRight className="w-5 h-5" />
                )}
              </div>
            </div>
            
            <Popover.Portal>
              <Popover.Positioner 
                side="bottom" 
                align="start" 
                sideOffset={8}
                className="z-200 w-[--anchor-width]"
              >
                <Popover.Popup 
                  autoFocus={false}
                  initialFocus={false}
                  finalFocus={false}
                  className="overflow-hidden rounded-xl border border-white/20 bg-card/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in fade-in slide-in-from-top-2 duration-200 outline-none"
                >
                  <div 
                    ref={suggestionListRef} 
                    className="p-1.5 max-h-[350px] min-w-[200px] overflow-y-auto overflow-x-hidden scroll-smooth custom-scrollbar"
                  >
                    {isLoading && suggestions.length === 0 && (
                      <div className="flex items-center justify-center p-8 gap-3 text-muted-foreground animate-pulse">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm font-medium italic">Searching...</span>
                      </div>
                    )}
                    
                    {!isLoading && suggestions.length === 0 && (
                      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground opacity-60">
                        <FolderPlus className="w-8 h-8 mb-2 opacity-20" />
                        <span className="text-sm italic">No folders found</span>
                      </div>
                    )}

                    {suggestions.map((suggestion, index) => (
                      <button
                        key={suggestion}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all text-left outline-none relative overflow-hidden group/btn",
                          index === selectedIndex 
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.01] z-10" 
                            : "hover:bg-primary/10 text-foreground/80 hover:text-foreground"
                        )}
                        onClick={(e) => handleSuggestionClick(e, suggestion)}
                        onMouseEnter={() => setSelectedIndex(index)}
                      >
                        <FolderPlus className={cn("w-4 h-4", index === selectedIndex ? "text-primary-foreground" : "text-primary/60")} />
                        <span className="truncate flex-1 font-medium italic">{suggestion}</span>
                        {index === selectedIndex && (
                          <div className="absolute right-2 text-[10px] font-bold tracking-tighter opacity-40 uppercase">Select</div>
                        )}
                      </button>
                    ))}
                  </div>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
          
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
