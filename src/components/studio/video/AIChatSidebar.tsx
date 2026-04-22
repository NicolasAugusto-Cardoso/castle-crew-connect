import { useEffect, useRef, useState } from 'react';
import { Send, Loader2, Sparkles, Scissors, Captions, Gauge, Mic2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  prompt: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'silence', label: 'Remover silêncios', icon: Mic2, prompt: 'Remova os silêncios automaticamente.' },
  { id: 'captions', label: 'Gerar legendas', icon: Captions, prompt: 'Gere legendas automáticas para o vídeo.' },
  { id: 'cut', label: 'Cortar trecho', icon: Scissors, prompt: 'Quero cortar um trecho do vídeo.' },
  { id: 'speed', label: 'Alterar velocidade', icon: Gauge, prompt: 'Aumente a velocidade do vídeo em 1.25x.' },
];

interface Props {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onQuickAction: (prompt: string) => void;
  isLoading?: boolean;
}

export function AIChatSidebar({ messages, onSend, onQuickAction, isLoading }: Props) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading]);

  const submit = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-sm leading-tight">Cutty AI</h3>
          <p className="text-[11px] text-muted-foreground leading-tight">Seu editor inteligente</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="p-3 border-b border-border">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 font-medium">
          Ações rápidas
        </p>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.id}
              onClick={() => onQuickAction(a.prompt)}
              disabled={isLoading}
              className={cn(
                'flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-lg',
                'border border-border bg-background hover:bg-accent hover:border-primary/40',
                'text-[11px] font-medium transition-colors disabled:opacity-50',
              )}
            >
              <a.icon className="w-4 h-4 text-primary" />
              <span className="text-center leading-tight">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mensagens */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-xs text-muted-foreground p-6">
              <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-50" />
              Olá! Sou Cutty, seu editor IA. Você pode me pedir para remover silêncios,
              gerar legendas e muito mais!
            </div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                'rounded-lg px-3 py-2 text-sm max-w-[92%] break-words',
                m.role === 'user'
                  ? 'ml-auto bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground',
              )}
            >
              {m.role === 'assistant' ? (
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-pre:my-1">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{m.content}</p>
              )}
              <p className="text-[10px] opacity-60 mt-1">
                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground px-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Cutty está pensando…
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Digite um comando…"
            rows={2}
            className="resize-none pr-11 text-sm bg-background"
            disabled={isLoading}
          />
          <Button
            size="icon"
            onClick={submit}
            disabled={isLoading || !input.trim()}
            className="absolute right-1.5 bottom-1.5 h-7 w-7"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
