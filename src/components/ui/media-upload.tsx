import { useCallback, useEffect, useId, useRef, useState } from "react";
import { UploadCloud, X, FileIcon, Film, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MediaUploadProps {
  /**
   * Native `accept` attribute. Default covers images, videos and GIFs so the
   * mobile OS shows the full picker (Camera / Photo Library / Files).
   */
  accept?: string;
  multiple?: boolean;
  /**
   * Controlled value. Pass an existing `File` (or array) — for already-saved
   * remote media use `previewUrl` instead.
   */
  value?: File | File[] | null;
  onChange: (files: File[] | null) => void;
  /** Optional max size per file in MB. Files exceeding it are rejected. */
  maxSizeMB?: number;
  /** External preview (e.g. URL of an already-uploaded image). */
  previewUrl?: string;
  label?: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
  /** Called when a rejected file is dropped (wrong type / too large). */
  onReject?: (reason: string, file: File) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function matchesAccept(file: File, accept: string): boolean {
  if (!accept) return true;
  const types = accept.split(",").map(t => t.trim().toLowerCase());
  const name = file.name.toLowerCase();
  const mime = file.type.toLowerCase();
  return types.some(t => {
    if (!t) return false;
    if (t.startsWith(".")) return name.endsWith(t);
    if (t.endsWith("/*")) return mime.startsWith(t.slice(0, -1)); // "image/" prefix
    return mime === t;
  });
}

export function MediaUpload({
  accept = "image/*,video/*,.gif",
  multiple = false,
  value,
  onChange,
  maxSizeMB,
  previewUrl,
  label = "Clique para selecionar ou arraste o arquivo",
  hint,
  disabled = false,
  className,
  onReject,
}: MediaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [isDragging, setIsDragging] = useState(false);
  const [internalPreviews, setInternalPreviews] = useState<string[]>([]);

  const files: File[] = Array.isArray(value)
    ? value
    : value
      ? [value]
      : [];

  // Build object URL previews for selected File(s); revoke on change/unmount.
  useEffect(() => {
    const urls = files.map(f => URL.createObjectURL(f));
    setInternalPreviews(urls);
    return () => {
      urls.forEach(u => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files.length, files.map(f => f.name + f.size).join("|")]);

  const defaultHint =
    hint ??
    (() => {
      const parts: string[] = [];
      if (accept.includes("image")) parts.push("Imagens");
      if (accept.includes("video")) parts.push("Vídeos");
      if (accept.includes("gif")) parts.push("GIFs");
      if (accept.includes("pdf")) parts.push("PDF");
      const base = parts.length ? parts.join(", ") : "Arquivos";
      return maxSizeMB ? `${base} • até ${maxSizeMB} MB` : base;
    })();

  const validateAndEmit = useCallback(
    (list: FileList | File[]) => {
      const arr = Array.from(list);
      const valid: File[] = [];
      for (const f of arr) {
        if (!matchesAccept(f, accept)) {
          onReject?.("Tipo de arquivo não suportado", f);
          continue;
        }
        if (maxSizeMB && f.size > maxSizeMB * 1024 * 1024) {
          onReject?.(`Arquivo maior que ${maxSizeMB} MB`, f);
          continue;
        }
        valid.push(f);
      }
      if (valid.length === 0) return;
      onChange(multiple ? valid : [valid[0]]);
    },
    [accept, maxSizeMB, multiple, onChange, onReject]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndEmit(e.target.files);
    }
    // Reset so selecting the same file again still triggers onChange
    e.target.value = "";
  };

  const openPicker = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPicker();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndEmit(e.dataTransfer.files);
    }
  };

  const handleRemove = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (multiple) {
      const next = files.filter((_, i) => i !== index);
      onChange(next.length > 0 ? next : null);
    } else {
      onChange(null);
    }
  };

  const hasFiles = files.length > 0;
  const showRemotePreview = !hasFiles && !!previewUrl;

  return (
    <div className={cn("w-full", className)}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        disabled={disabled}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-label={label}
        onClick={openPicker}
        onKeyDown={handleKeyDown}
        onDragEnter={handleDragOver}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-6",
          "min-h-[140px] sm:min-h-[120px] cursor-pointer select-none transition-colors",
          "border-border bg-card/40 hover:border-primary/60 hover:bg-primary/[0.04]",
          isDragging && "border-primary bg-primary/10",
          disabled && "opacity-60 cursor-not-allowed pointer-events-none",
        )}
      >
        {hasFiles ? (
          <div className="flex w-full flex-wrap items-start gap-3">
            {files.map((f, i) => (
              <FilePreview
                key={`${f.name}-${i}`}
                file={f}
                url={internalPreviews[i]}
                onRemove={e => handleRemove(e, i)}
              />
            ))}
            {multiple && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  openPicker();
                }}
                className="flex h-24 w-24 flex-col items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:border-primary/60 hover:text-foreground"
              >
                <UploadCloud className="mb-1 h-5 w-5" />
                Adicionar
              </button>
            )}
          </div>
        ) : showRemotePreview ? (
          <div className="flex w-full items-center gap-3">
            <img
              src={previewUrl}
              alt="Pré-visualização atual"
              className="h-24 w-24 rounded-lg object-cover"
            />
            <div className="flex-1">
              <p className="text-sm font-medium">Arquivo atual</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <UploadCloud className="h-6 w-6 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{defaultHint}</p>
            </div>
            <span
              className={cn(
                "inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm",
                "transition-transform active:scale-95",
              )}
            >
              Selecionar arquivo
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function FilePreview({
  file,
  url,
  onRemove,
}: {
  file: File;
  url?: string;
  onRemove: (e: React.MouseEvent) => void;
}) {
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");

  return (
    <div className="relative flex flex-col items-center gap-1">
      <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-border bg-muted">
        {isImage && url ? (
          <img src={url} alt={file.name} className="h-full w-full object-cover" />
        ) : isVideo && url ? (
          <video
            src={url}
            muted
            playsInline
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
            {isImage ? (
              <ImageIcon className="h-6 w-6" />
            ) : isVideo ? (
              <Film className="h-6 w-6" />
            ) : (
              <FileIcon className="h-6 w-6" />
            )}
          </div>
        )}
        <button
          type="button"
          aria-label={`Remover ${file.name}`}
          onClick={onRemove}
          className="absolute right-1 top-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-background/90 text-foreground shadow ring-1 ring-border hover:bg-background"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="max-w-[6rem] truncate text-[11px] text-muted-foreground" title={file.name}>
        {file.name}
      </p>
      <p className="text-[10px] text-muted-foreground">{formatBytes(file.size)}</p>
    </div>
  );
}

export default MediaUpload;
