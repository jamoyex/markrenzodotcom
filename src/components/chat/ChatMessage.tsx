import React from 'react';
import { motion } from 'framer-motion';
import type { Message } from '../../types/chat';
import AboutCard from './AboutCard';
import FadeUpText from '../ui/FadeUpText';

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

const renderMessageContent = (content: string, isUser: boolean) => {
  const parts = content.split(/<aboutmecard>/);
  return parts.map((part, index) => (
    <React.Fragment key={index}>
      {part && (
        <div>
          {isUser ? (
            <div dangerouslySetInnerHTML={{ __html: formatMessage(part) }} />
          ) : (
            <FadeUpText
              text={part.replace(/\*\*(.*?)\*\*/g, '$1')} // Remove markdown for now
              delay={index * 0.2}
            />
          )}
        </div>
      )}
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
    <motion.div
      className={`message ${isUser ? 'user' : 'assistant'}`}
      style={{
        display: 'flex',
        padding: '20px 0',
        justifyContent: isUser ? 'flex-end' : 'flex-start'
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        ease: 'easeOut',
        delay: isUser ? 0 : 0.2
      }}
    >
      <div style={messageStyle}>
        {renderMessageContent(content, isUser)}
      </div>
    </motion.div>
  );
} 