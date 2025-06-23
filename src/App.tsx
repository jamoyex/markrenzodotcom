import React, { useState, FormEvent } from 'react';
import Aurora from './components/Aurora/Aurora';
import ChatMessage from './components/chat/ChatMessage';
import TypingIndicator from './components/chat/TypingIndicator';
import { ChatProvider, useChat } from './context/ChatContext';

function ChatInterface() {
  const { messages, isTyping, sendMessage, clearChat } = useChat();
  const [inputValue, setInputValue] = useState('');
  const hasMessages = messages.length > 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    await sendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleSuggestionClick = async (text: string) => {
    setInputValue(text);
    await sendMessage(text);
    setInputValue('');
  };

  return (
    <>
      <header id="main-header">
        <div className="header-left">
          <h1>
            <span>Mark Renzo</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="dropdown-arrow">
              <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </h1>
        </div>
        <div className="header-right">
          <a href="#" className="contact-btn">Contact Me</a>
        </div>
      </header>

      <div id="app-container" className={hasMessages ? 'conversation-started' : ''}>
        <main id="chat-container">
          {!hasMessages && (
            <div id="hero-state">
              <div>
                <h1>What can I help with?</h1>
              </div>
            </div>
          )}
          <div id="chat-content">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isTyping && <TypingIndicator />}
          </div>
        </main>

        <footer id="input-container">
          <form id="chat-form" onSubmit={handleSubmit}>
            <div className="input-wrapper">
              <div className="input-main">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask anything..."
                  disabled={isTyping}
                />
                <button type="submit" disabled={!inputValue.trim() || isTyping}>
                  →
                </button>
              </div>
              <div className="input-actions">
                <button 
                  type="button" 
                  className="input-action-btn" 
                  onClick={() => handleSuggestionClick('Who are you?')}
                >
                  Who are you?
                </button>
                <button 
                  type="button" 
                  className="input-action-btn"
                  onClick={() => handleSuggestionClick('What do you do?')}
                >
                  What do you do?
                </button>
                <button 
                  type="button" 
                  className="input-action-btn"
                  onClick={() => handleSuggestionClick('Show me your work')}
                >
                  Show me your work
                </button>
              </div>
            </div>
          </form>
          <p className="copyright">
            © {new Date().getFullYear()} Mark Renzo. All Rights Reserved.
          </p>
        </footer>
      </div>

      <button 
        id="clear-chat-btn" 
        title="Clear Chat History & Reload"
        onClick={clearChat}
      >
        Clear Chat
      </button>
    </>
  );
}

export default function App() {
  return (
    <ChatProvider>
      <Aurora 
        colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
        blend={0.5}
        amplitude={1.0}
        speed={0.5}
      />
      <ChatInterface />
    </ChatProvider>
  );
} 