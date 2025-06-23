import React, { useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';

export default function ChatContainer() {
  const { messages, isTyping } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (containerRef.current) {
      const scrollHeight = containerRef.current.scrollHeight;
      containerRef.current.scrollTo({
        top: scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Scroll on new messages or typing state change
  useEffect(() => {
    // Use setTimeout to ensure DOM has updated
    setTimeout(scrollToBottom, 100);
  }, [messages, isTyping]);

  return (
    <div className="chat-container" ref={containerRef}>
      {messages.map((message, index) => (
        <ChatMessage key={index} message={message} />
      ))}
      {isTyping && <TypingIndicator />}
      <div ref={messagesEndRef} style={{ height: '20px' }} />
    </div>
  );
} 