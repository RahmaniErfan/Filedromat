import { Waves } from 'lucide-react';

interface HeaderProps {
  phase: string;
  onReset: () => void;
}

export function Header({ phase, onReset }: HeaderProps) {
  if (phase === 'LOBBY') return null;

  return (
    <header className="w-full flex items-center mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-2 cursor-pointer group" onClick={onReset}>
        <div className="relative">
          <div className="absolute -inset-2 bg-primary/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          <Waves className="w-6 h-6 text-primary relative animate-slosh" />
        </div>
        <span className="text-xl font-bold tracking-tight bg-linear-to-br from-primary to-accent bg-clip-text text-transparent">
          Filedromat
        </span>
      </div>
    </header>
  );
}
