import { MessageCircle, Clock, User, Truck } from "lucide-react";
import { useEffect, useRef } from "react";

interface ChatMessage {
  id: string;
  text: string;
  timestamp: Date;
  sender: 'driver' | 'dispatch';
  type?: 'request' | 'response' | 'status';
}

interface ChatHistoryProps {
  requests: any[];
}

export function RequestStatus({ requests }: ChatHistoryProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  // Convert requests to chat messages
  const chatMessages: ChatMessage[] = [];

  requests.forEach(request => {
    // Add driver request message
    chatMessages.push({
      id: `${request.id}-request`,
      text: request.request,
      timestamp: request.timestamp,
      sender: 'driver',
      type: 'request'
    });

    // Add dispatch response if exists
    if (request.status === 'acknowledged' && request.response) {
      chatMessages.push({
        id: `${request.id}-response`,
        text: request.response,
        timestamp: request.responseTimestamp,
        sender: 'dispatch',
        type: 'response'
      });
    }
  });

  // Sort by timestamp
  // chatMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  chatMessages.sort((a, b) => {
    const timeDiff = a.timestamp.getTime() - b.timestamp.getTime();
    // If timestamps are the same, prioritize requests over responses
    if (timeDiff === 0) {
      if (a.type === 'request' && b.type === 'response') return -1;
      if (a.type === 'response' && b.type === 'request') return 1;
    }
    return timeDiff;
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'auto',
        block: 'end',
        inline: 'nearest'
      });
    }
  }, [chatMessages.length]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 space-y-4">
        {chatMessages.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground font-medium">No communication yet</p>
            <p className="text-sm text-muted-foreground">Send a request to start communication</p>
          </div>
        ) : (
          <>
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 animate-slide-up ${message.sender === 'driver' ? 'justify-end' : 'justify-start'
                  }`}
              >
                {message.sender === 'dispatch' && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                      <User size={16} className="text-accent-foreground" />
                    </div>
                  </div>
                )}

                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-soft ${message.sender === 'driver'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border'
                    }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <div className="flex items-center gap-1 mt-2 opacity-70">
                    <Clock size={12} />
                    <span className="text-xs">{formatTime(message.timestamp)}</span>
                  </div>
                </div>

                {message.sender === 'driver' && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <Truck size={16} className="text-primary-foreground" />
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
    </div>
  );
}