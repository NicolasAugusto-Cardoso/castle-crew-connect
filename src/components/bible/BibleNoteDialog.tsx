import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Bold, Underline, Palette, PaintBucket, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BibleNote } from '@/hooks/useBibleAnnotations';
import { toast } from 'sonner';

interface BibleNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookName: string;
  chapter: number;
  verse: number;
  existingNote?: BibleNote;
  onSave: (content: BibleNote['content_json'], textColor?: string, bgColor?: string) => Promise<void>;
  onDelete?: () => Promise<void>;
  isSaving?: boolean;
  isDeleting?: boolean;
}

const TEXT_COLORS = [
  { value: '#000000', label: 'Preto' },
  { value: '#EF4444', label: 'Vermelho' },
  { value: '#3B82F6', label: 'Azul' },
  { value: '#22C55E', label: 'Verde' },
  { value: '#8B5CF6', label: 'Roxo' },
];

const BG_COLORS = [
  { value: '', label: 'Nenhum' },
  { value: '#FEF3C7', label: 'Amarelo' },
  { value: '#DBEAFE', label: 'Azul' },
  { value: '#DCFCE7', label: 'Verde' },
  { value: '#FCE7F3', label: 'Rosa' },
];

export function BibleNoteDialog({
  open,
  onOpenChange,
  bookName,
  chapter,
  verse,
  existingNote,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
}: BibleNoteDialogProps) {
  const [text, setText] = useState('');
  const [isBold, setIsBold] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [textColor, setTextColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('');
  const [showTextColors, setShowTextColors] = useState(false);
  const [showBgColors, setShowBgColors] = useState(false);

  // Load existing note data
  useEffect(() => {
    if (existingNote) {
      setText(existingNote.content_json.text || '');
      setIsBold(existingNote.content_json.formatting?.bold || false);
      setIsUnderline(existingNote.content_json.formatting?.underline || false);
      setTextColor(existingNote.text_color || '#000000');
      setBgColor(existingNote.background_color || '');
    } else {
      setText('');
      setIsBold(false);
      setIsUnderline(false);
      setTextColor('#000000');
      setBgColor('');
    }
  }, [existingNote, open]);

  const handleSave = async () => {
    if (!text.trim()) {
      toast.error('Digite uma anotação');
      return;
    }

    try {
      await onSave(
        {
          text: text.trim(),
          formatting: {
            bold: isBold,
            underline: isUnderline,
          },
        },
        textColor,
        bgColor || undefined
      );
      toast.success('Anotação salva!');
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao salvar anotação');
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    try {
      await onDelete();
      toast.success('Anotação excluída');
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao excluir anotação');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">
            Anotação - {bookName} {chapter}:{verse}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Formatting toolbar */}
          <div className="flex items-center gap-1 border-b border-border pb-3">
            <Button
              type="button"
              variant={isBold ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setIsBold(!isBold)}
              className="h-8 w-8 p-0"
            >
              <Bold className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant={isUnderline ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setIsUnderline(!isUnderline)}
              className="h-8 w-8 p-0"
            >
              <Underline className="w-4 h-4" />
            </Button>

            {/* Text color */}
            <div className="relative">
              <Button
                type="button"
                variant={showTextColors ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => {
                  setShowTextColors(!showTextColors);
                  setShowBgColors(false);
                }}
                className="h-8 w-8 p-0"
              >
                <Palette className="w-4 h-4" style={{ color: textColor }} />
              </Button>
              {showTextColors && (
                <div className="absolute top-10 left-0 z-10 flex gap-1 bg-popover border border-border rounded-lg p-2 shadow-lg">
                  {TEXT_COLORS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => {
                        setTextColor(c.value);
                        setShowTextColors(false);
                      }}
                      className={cn(
                        'w-6 h-6 rounded-full border-2 transition-all',
                        textColor === c.value ? 'border-primary scale-110' : 'border-transparent'
                      )}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Background color */}
            <div className="relative">
              <Button
                type="button"
                variant={showBgColors ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => {
                  setShowBgColors(!showBgColors);
                  setShowTextColors(false);
                }}
                className="h-8 w-8 p-0"
              >
                <PaintBucket className="w-4 h-4" style={{ color: bgColor || undefined }} />
              </Button>
              {showBgColors && (
                <div className="absolute top-10 left-0 z-10 flex gap-1 bg-popover border border-border rounded-lg p-2 shadow-lg">
                  {BG_COLORS.map(c => (
                    <button
                      key={c.value || 'none'}
                      type="button"
                      onClick={() => {
                        setBgColor(c.value);
                        setShowBgColors(false);
                      }}
                      className={cn(
                        'w-6 h-6 rounded-full border-2 transition-all',
                        bgColor === c.value ? 'border-primary scale-110' : 'border-muted',
                        !c.value && 'bg-background'
                      )}
                      style={{ backgroundColor: c.value || undefined }}
                      title={c.label}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Text area */}
          <Textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Digite sua anotação..."
            className={cn(
              'min-h-[150px] resize-none',
              isBold && 'font-bold',
              isUnderline && 'underline'
            )}
            style={{
              color: textColor,
              backgroundColor: bgColor || undefined,
            }}
          />

          {/* Actions */}
          <div className="flex justify-between gap-2">
            {existingNote && onDelete ? (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting || isSaving}
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Excluir
              </Button>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving || isDeleting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={isSaving || isDeleting}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Salvar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
