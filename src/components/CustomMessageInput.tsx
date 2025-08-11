import { useState } from "react"; // Import react hook

// ---------------------- Import Component of UI -------------------------
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ---------------------- Import types, constants, avatar and icons ----------
import { Send, MessageSquare, Slack } from "lucide-react";
import { CustomMessageInputProps } from "@/types";
import sendButton from '@/assets/send.png';

export function CustomMessageInput({ onSendMessage }: CustomMessageInputProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim(), "slack");
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
        <p className="bg-yellow-600 text-white px-1">Send</p>
        {/* <img
          src={sendButton}
          alt="sendButton"
          className="w-[40px] h-[40px] rounded-full border-2 border-primary-border"
        /> */}
        {/* <Send size={14} /> */}
      </Button>
    </div>
  );
}