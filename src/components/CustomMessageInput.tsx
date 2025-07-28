import { useState } from "react"; // Import react hook

// ---------------------- Import Component of UI -------------------------
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ---------------------- Import types, constants, avatar and icons ----------
import { Send, MessageSquare, WifiOff } from "lucide-react";
import { CustomMessageInputProps } from "@/types";

export function CustomMessageInput({ onSendMessage, disabled = false }: CustomMessageInputProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !disabled) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2 items-center">
      {disabled ? (
        <WifiOff size={16} className="text-muted-foreground" />
      ) : (
        <MessageSquare size={16} className="text-muted-foreground" />
      )}
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={disabled ? "Offline - Cannot send messages" : "Custom message (optional)..."}
        className="flex-1 text-sm"
        disabled={disabled}
      />
      <Button
        onClick={handleSend}
        disabled={!message.trim() || disabled}
        variant="minimal"
        size="sm"
        title={disabled ? "You are offline" : "Send message"}
      >
        <Send size={14} />
      </Button>
    </div>
  );
}