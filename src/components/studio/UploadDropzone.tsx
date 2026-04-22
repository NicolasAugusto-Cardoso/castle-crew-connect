import { useCallback, useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  accept: string;
  onFile: (file: File) => void | Promise<void>;
  disabled?: boolean;
  hint?: string;
  className?: string;
}

export function UploadDropzone({ accept, onFile, disabled, hint, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);

  const handle = useCallback(async (file: File) => {
    setBusy(true);
    try { await onFile(file); } finally { setBusy(false); }
  }, [onFile]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        if (disabled) return;
        const f = e.dataTransfer.files?.[0];
        if (f) handle(f);
      }}
      onClick={() => !disabled && !busy && inputRef.current?.click()}
      className={cn(
        'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
        'flex flex-col items-center justify-center gap-3',
        drag ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
    >
      {busy ? (
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      ) : (
        <Upload className="w-8 h-8 text-muted-foreground" />
      )}
      <div className="text-sm">
        <p className="font-medium">Arraste um arquivo ou clique para selecionar</p>
        {hint && <p className="text-muted-foreground text-xs mt-1">{hint}</p>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handle(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}
