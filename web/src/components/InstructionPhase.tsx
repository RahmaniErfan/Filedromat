import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Sparkles, FileStack, FolderPlus, Type, ArrowRight, CornerDownRight } from 'lucide-react';

interface InstructionPhaseProps {
  filesCount: number;
  onContinue: (instructions: string) => void;
  onBack: () => void;
}

const PRESETS = [
  {
    id: 'smart-sort',
    title: 'Smart Sort',
    description: 'General organization based on file type and content.',
    prompt: 'Organize these files logically into folders by their type and purpose. Group related items together.',
    icon: <Sparkles className="w-5 h-5 text-yellow-500" />
  },
  {
    id: 'media-sort',
    title: 'Media Centric',
    description: 'Focus on images, videos, and documents.',
    prompt: 'Group all images into a "Photos" folder, videos into "Videos", and documents into "Documents" with subfolders for years.',
    icon: <FileStack className="w-5 h-5 text-blue-500" />
  },
  {
    id: 'project-sort',
    title: 'Project Focused',
    description: 'Organize by perceived project or topic.',
    prompt: 'Analyze the file names and contents to identify different projects. Group files into project-specific folders.',
    icon: <FolderPlus className="w-5 h-5 text-purple-500" />
  }
];

export function InstructionPhase({ filesCount, onContinue, onBack }: InstructionPhaseProps) {
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const handleSubmit = (prompt: string) => {
    onContinue(prompt);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 page-enter max-w-4xl mx-auto px-4">
      <div className="text-center space-y-2 mb-4">
        <h2 className="text-3xl font-bold">How should we organize?</h2>
        <p className="text-muted-foreground flex items-center justify-center gap-2">
          Filedromat has ready <Badge variant="secondary">{filesCount} files</Badge> to be folded.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        {PRESETS.map((p) => (
          <Card 
            key={p.id} 
            className={`laundry-card hover:border-primary/50 transition-all cursor-pointer ${selectedPreset === p.id ? 'border-primary ring-2 ring-primary/20' : ''}`}
            onClick={() => {
              setSelectedPreset(p.id);
              setCustomPrompt(p.prompt);
            }}
          >
            <CardHeader className="pb-3">
              <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center mb-2">
                {p.icon}
              </div>
              <CardTitle className="text-lg">{p.title}</CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                {p.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="w-full laundry-card mt-4 overflow-hidden">
        <CardHeader className="pb-2 border-b bg-muted/30">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Type className="w-4 h-4 text-primary" />
            Custom Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="relative group">
            <textarea
              placeholder="e.g., Put all receipts in a 'Tax 2024' folder..."
              className="w-full h-32 p-4 rounded-2xl bg-muted/30 border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none text-sm"
              value={customPrompt}
              onChange={(e) => {
                setCustomPrompt(e.target.value);
                setSelectedPreset(null);
              }}
            />
            <div className="absolute right-4 bottom-4 text-muted-foreground group-focus-within:text-primary transition-colors">
              <CornerDownRight className="w-5 h-5" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between bg-muted/10">
          <Button variant="ghost" onClick={onBack}>Rethink Wash</Button>
          <Button disabled={!customPrompt} size="lg" className="rounded-full px-8" onClick={() => handleSubmit(customPrompt)}>
            Propose Strategy
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
