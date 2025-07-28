import { useState } from "react"; // Import react hook

// ---------------------- Import Component of UI -------------------------
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ---------------------- Import types, constants, avatar and icons ----------
import { Send, MessageSquare } from "lucide-react";
import { CustomMessageInputProps } from "@/types";

export function CustomMessageInput({ onSendMessage }: CustomMessageInputProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <MessageSquare size={16} className="text-muted-foreground" />
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Custom message (optional)..."
        className="flex-1 text-sm"
      />
      <Button
        onClick={handleSend}
        disabled={!message.trim()}
        variant="minimal"
        size="sm"
      >
        <Send size={14} />
      </Button>
    </div>
  );
}