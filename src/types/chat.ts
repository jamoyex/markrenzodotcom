export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: number;
}

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
}

export interface SuggestionChip {
  id: string;
  text: string;
  action: string;
} 