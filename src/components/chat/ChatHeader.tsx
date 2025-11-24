import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ChatHeaderProps {
  name: string;
  avatar?: string | null;
  subtitle: string;
}

export function ChatHeader({ name, avatar, subtitle }: ChatHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-background border-b-2 border-border/40 sticky top-0 z-50 shadow-lg shadow-black/10">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => navigate("/contact")}
          className="p-2 hover:bg-muted rounded-full transition-colors -ml-2"
          aria-label="Voltar para lista de conversas"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>

        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={avatar || undefined} />
          <AvatarFallback className="bg-primary/20 text-primary font-medium">
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground text-base truncate">
            {name}
          </h2>
          <p className="text-xs text-muted-foreground truncate">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}
