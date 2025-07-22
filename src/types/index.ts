export interface DriverRequest {
  id: string;
  request: string;
  timestamp: Date;
  status: 'sent' | 'acknowledged' | 'completed';
  response?: string;
  responseTimestamp?: Date;
}

export interface TemplateMessage {
  id: string;
  text: string;
  icon: any;
  needsTime?: boolean;
  variant: 'template' | 'accent' | 'success';
  description: string;
}

export interface TemplateMessagesProps {
  onSendMessage: (message: string) => void;
}

export interface CustomMessageInputProps {
  onSendMessage: (message: string) => void;
}

export interface ChatMessage {
  id: string;
  text: string;
  timestamp: Date;
  sender: 'driver' | 'dispatch';
  type?: 'request' | 'response' | 'status';
}

export interface ChatHistoryProps {
  requests: any[];
}