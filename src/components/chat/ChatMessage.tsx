import React from 'react';
import type { Message } from '../../types/chat';
import AboutCard from './AboutCard';

interface ChatMessageProps {
  message: Message;
}

const formatMessage = (text: string) => {
  // Convert newlines to <br />
  let formatted = text.replace(/\n/g, '<br />');
  // Convert **text** to <strong>text</strong>
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  return formatted;
};

const renderMessageContent = (content: string) => {
  const parts = content.split(/<aboutmecard>/);
  return parts.map((part, index) => (
    <React.Fragment key={index}>
      {part && <div dangerouslySetInnerHTML={{ __html: formatMessage(part) }} />}
      {index < parts.length - 1 && <AboutCard />}
    </React.Fragment>
  ));
};

export default function ChatMessage({ message }: ChatMessageProps) {
  const { content, isUser } = message;

  const messageStyle = isUser ? {
    backgroundColor: 'rgba(52, 53, 65, 0.9)',
    padding: '12px 16px',
    color: 'var(--color-text-primary)',
    borderRadius: '100px',
    width: 'fit-content'
  } : {
    color: 'var(--color-text-primary)'
  };

  return (
    <div
      className={`message ${isUser ? 'user' : 'assistant'}`}
      style={{
        display: 'flex',
        padding: '20px 0',
        justifyContent: isUser ? 'flex-end' : 'flex-start'
      }}
    >
      <div style={messageStyle}>
        {renderMessageContent(content)}
      </div>
    </div>
  );
} 