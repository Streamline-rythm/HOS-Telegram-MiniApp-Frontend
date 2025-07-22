export interface DriverRequest {
  request: string;
  timestamp: Date;
  sender: 'driver' | 'dispatcher';
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
  text: string;
  timestamp: Date;
  sender: 'driver' | 'dispatch';
  type?: 'request' | 'response' | 'status';
}

export interface ChatHistoryProps {
  requests: any[];
}