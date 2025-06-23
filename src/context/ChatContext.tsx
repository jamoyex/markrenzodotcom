import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { Message, ChatState } from '../types/chat';

interface ChatContextType extends ChatState {
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

type ChatAction =
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_TYPING'; payload: boolean }
  | { type: 'CLEAR_CHAT' };

const initialState: ChatState = {
  messages: [],
  isTyping: false,
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    case 'SET_TYPING':
      return {
        ...state,
        isTyping: action.payload,
      };
    case 'CLEAR_CHAT':
      return initialState;
    default:
      return state;
  }
}

const WEBHOOK_URL = 'https://api.hellomarky.com/webhook/jamoyex';

// Function to load component content
async function loadComponent(componentName: string) {
  try {
    const response = await fetch(`/pages/${componentName}.php`);
    if (!response.ok) throw new Error('Failed to load component');
    return await response.text();
  } catch (error) {
    console.error('Error loading component:', error);
    return null;
  }
}

// Function to replace component tags with actual content
async function replaceComponents(text: string) {
  if (text.includes('<aboutmecard>')) {
    const aboutComponent = await loadComponent('about');
    if (aboutComponent) {
      text = text.replace('<aboutmecard>', aboutComponent);
    }
  }
  return text;
}

// Function to format bot message
async function formatBotMessage(text: string) {
  // First replace components
  text = await replaceComponents(text);
  
  // Then apply regular formatting
  let html = text.replace(/\n/g, '<br />');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  return html;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  const sendMessage = useCallback(async (content: string) => {
    // Create session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: Date.now(),
    };
    dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
    dispatch({ type: 'SET_TYPING', payload: true });

    try {
      // Send message to webhook
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, sessionID: sessionId })
      });

      if (!response.ok) {
        throw new Error(`Webhook response was not ok: ${response.statusText}`);
      }

      const data = await response.json();
      const botReply = data.output || "Sorry, I didn't get a valid response.";

      // Add bot response
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: botReply, // Keep the raw content with tags
        isUser: false,
        timestamp: Date.now(),
      };
      dispatch({ type: 'ADD_MESSAGE', payload: botMessage });

    } catch (error) {
      console.error('Error communicating with webhook:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, something went wrong. Please try again later.',
        isUser: false,
        timestamp: Date.now(),
      };
      dispatch({ type: 'ADD_MESSAGE', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_TYPING', payload: false });
    }
  }, []);

  const clearChat = useCallback(() => {
    dispatch({ type: 'CLEAR_CHAT' });
  }, []);

  return (
    <ChatContext.Provider value={{ ...state, sendMessage, clearChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
} 