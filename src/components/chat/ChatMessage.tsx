import { useState } from "react";
import { MoreVertical, Pencil, Trash2, Check, X } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    sender_id: string;
    sender_name: string;
    sender_avatar?: string | null;
    created_at: string;
    updated_at: string;
    is_edited?: boolean;
  };
  currentUserId: string;
  isEditing: boolean;
  editText: string;
  onEditStart: (id: string, content: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onEditTextChange: (text: string) => void;
  onDelete: (id: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function ChatMessage({
  message,
  currentUserId,
  isEditing,
  editText,
  onEditStart,
  onEditSave,
  onEditCancel,
  onEditTextChange,
  onDelete,
  isUpdating,
  isDeleting,
}: ChatMessageProps) {
  const isOwnMessage = message.sender_id === currentUserId;
  const isEdited = message.is_edited === true;

  return (
    <div className={cn("flex mb-4", isOwnMessage ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "flex gap-2 max-w-[85%] sm:max-w-[75%]",
          isOwnMessage && "flex-row-reverse"
        )}
      >
        <Avatar className="h-8 w-8 shrink-0 mt-1">
          <AvatarImage src={message.sender_avatar || undefined} />
          <AvatarFallback
            className={cn(
              "text-sm font-medium",
              isOwnMessage
                ? "bg-primary text-primary-foreground"
                : "bg-primary/20 text-primary"
            )}
          >
            {message.sender_name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className={cn("flex-1", isOwnMessage && "flex flex-col items-end")}>
          {isEditing ? (
            <div className="w-full space-y-2">
              <Textarea
                value={editText}
                onChange={(e) => onEditTextChange(e.target.value)}
                className="min-h-[80px] resize-none"
                disabled={isUpdating}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onEditCancel}
                  disabled={isUpdating}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={onEditSave}
                  disabled={isUpdating || !editText.trim()}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Salvar
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div
                className={cn(
                  "rounded-2xl shadow-sm px-4 py-2.5 relative group",
                  isOwnMessage
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-background border border-border rounded-tl-sm"
                )}
              >
                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                  {message.content}
                </p>

                {isOwnMessage && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -top-2 -right-2 h-7 w-7 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-background shadow-sm hover:bg-muted"
                        disabled={isDeleting}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="z-[100] bg-background border shadow-lg">
                      <DropdownMenuItem
                        onClick={() => onEditStart(message.id, message.content)}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(message.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Deletar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <div
                className={cn(
                  "flex items-center gap-1 mt-1 px-2",
                  isOwnMessage && "justify-end"
                )}
              >
                <p className="text-xs text-muted-foreground">
                  {new Date(message.created_at).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                {isEdited && (
                  <span className="text-xs text-muted-foreground italic">
                    • editada
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
