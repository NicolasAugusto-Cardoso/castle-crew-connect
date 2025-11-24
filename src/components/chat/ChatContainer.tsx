import { useEffect, useRef, useState } from "react";
import { ChatHeader } from "./ChatHeader";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string | null;
  created_at: string;
  updated_at: string;
}

interface ChatContainerProps {
  headerName: string;
  headerAvatar?: string | null;
  headerSubtitle: string;
  messages: Message[];
  currentUserId: string;
  isLoading: boolean;
  replyText: string;
  onReplyTextChange: (text: string) => void;
  onSendReply: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  editingId: string | null;
  editText: string;
  onEditStart: (id: string, content: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onEditTextChange: (text: string) => void;
  onDeleteReply: (id: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
  isSending: boolean;
}

export function ChatContainer({
  headerName,
  headerAvatar,
  headerSubtitle,
  messages,
  currentUserId,
  isLoading,
  replyText,
  onReplyTextChange,
  onSendReply,
  onKeyPress,
  editingId,
  editText,
  onEditStart,
  onEditSave,
  onEditCancel,
  onEditTextChange,
  onDeleteReply,
  isUpdating,
  isDeleting,
  isSending,
}: ChatContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const previousMessagesLength = useRef(messages.length);

  // Auto-scroll inteligente
  useEffect(() => {
    if (!scrollRef.current) return;

    // Se o usuário enviou mensagem, sempre fazer scroll
    const userSentMessage = messages.length > previousMessagesLength.current;
    previousMessagesLength.current = messages.length;

    if (userSentMessage || shouldAutoScroll) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, shouldAutoScroll]);

  // Detectar posição do scroll
  const handleScroll = () => {
    if (!scrollRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    // Se estiver a menos de 100px do final, ativar auto-scroll
    setShouldAutoScroll(distanceFromBottom < 100);
  };

  // Forçar scroll ao enviar mensagem
  const handleSendMessage = () => {
    setShouldAutoScroll(true);
    onSendReply();
  };

  return (
    <div
      className="flex flex-col bg-muted/30"
      style={{
        height: "100vh",
        paddingTop: "120px",
        paddingBottom: "calc(120px + env(safe-area-inset-bottom))",
      }}
    >
      <ChatHeader
        name={headerName}
        avatar={headerAvatar}
        subtitle={headerSubtitle}
      />

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-1 max-w-screen-xl mx-auto">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                currentUserId={currentUserId}
                isEditing={editingId === message.id}
                editText={editText}
                onEditStart={onEditStart}
                onEditSave={onEditSave}
                onEditCancel={onEditCancel}
                onEditTextChange={onEditTextChange}
                onDelete={onDeleteReply}
                isUpdating={isUpdating}
                isDeleting={isDeleting}
              />
            ))}
          </div>
        )}
      </div>

      <ChatInput
        value={replyText}
        onChange={onReplyTextChange}
        onSend={handleSendMessage}
        onKeyPress={onKeyPress}
        placeholder="Digite sua mensagem..."
        disabled={isLoading}
        isLoading={isSending}
      />
    </div>
  );
}
