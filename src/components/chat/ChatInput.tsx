import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  placeholder: string;
  disabled: boolean;
  isLoading: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  onKeyPress,
  placeholder,
  disabled,
  isLoading,
}: ChatInputProps) {
  return (
    <div
      className="bg-background border-t border-border fixed bottom-0 left-0 right-0 z-50 shadow-lg"
      style={{
        marginBottom: "calc(60px + env(safe-area-inset-bottom))",
      }}
    >
      <div className="flex items-end gap-2 p-3 max-w-screen-xl mx-auto">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={onKeyPress}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className={cn(
            "min-h-[44px] max-h-32 resize-none flex-1",
            "focus-visible:ring-1 focus-visible:ring-primary"
          )}
          rows={1}
        />
        <Button
          onClick={onSend}
          disabled={disabled || !value.trim() || isLoading}
          size="icon"
          className="h-11 w-11 shrink-0 rounded-full"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
}
