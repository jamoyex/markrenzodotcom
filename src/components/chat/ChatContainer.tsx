import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../../context/ChatContext';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';

export default function ChatContainer() {
  const { messages, isTyping } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [spacerHeight, setSpacerHeight] = useState('70vh');

  const scrollToBottom = (instant = false) => {
    console.log('🔽 SCROLLING TO BOTTOM, instant:', instant);
    setIsAutoScrolling(true);
    
    // Scroll the window to bottom
    const documentHeight = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight;
    const targetScroll = documentHeight - windowHeight;
    
    window.scrollTo({
      top: targetScroll,
      behavior: instant ? 'instant' : 'smooth'
    });
    
    console.log('✅ BOTTOM SCROLL COMPLETE:', window.scrollY);
    
    // Reset auto-scrolling flag after animation
    setTimeout(() => setIsAutoScrolling(false), instant ? 100 : 800); // Longer for smooth scroll
  };

    const scrollToUserMessage = () => {
    console.log('🚀 SCROLLING TO POSITION USER MESSAGE AT TOP');
    setIsAutoScrolling(true);
    
    // Find the most recent user message and position it below the header
    const messages = document.querySelectorAll('.message.user');
    if (messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1] as HTMLElement;
      const messageTop = lastUserMessage.offsetTop;
      
      // Calculate offset based on screen size for mobile header clearance
      const isMobile = window.innerWidth <= 1024;
      const headerOffset = isMobile ? 100 : 20; // More offset on mobile to clear header
      
      const targetPosition = messageTop - headerOffset;
      
      console.log('📍 USER MESSAGE POSITION:', messageTop);
      console.log('📱 IS MOBILE:', isMobile);
      console.log('🎯 SCROLLING TO:', targetPosition);
      
      // Scroll to position the user message below the header
      window.scrollTo({
        top: Math.max(0, targetPosition), // Don't scroll to negative values
        behavior: 'instant'
      });
      
      console.log('✅ USER MESSAGE POSITIONED BELOW HEADER');
    } else {
      console.log('❌ NO USER MESSAGES FOUND');
      // Fallback to bottom if no user messages
      scrollToBottom(true);
    }
    
    setTimeout(() => setIsAutoScrolling(false), 100);
  };

  const checkScrollPosition = () => {
    if (!isAutoScrolling) {
      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 100; // 100px threshold
      setShowScrollButton(!isAtBottom);
    }
  };

  const adjustSpacerHeight = () => {
    if (messages.length === 0) {
      setSpacerHeight('70vh');
      return;
    }

    const lastMessage = messages[messages.length - 1];
    
    // If last message is user message, reset spacer to full height
    if (lastMessage.isUser) {
      setSpacerHeight('70vh');
      return;
    }

    // If last message is AI, calculate dynamic height
    if (!lastMessage.isUser) {
      const aiMessages = document.querySelectorAll('.message.assistant');
      if (aiMessages.length > 0) {
        const lastAiMessage = aiMessages[aiMessages.length - 1] as HTMLElement;
        const aiMessageHeight = lastAiMessage.offsetHeight;
        const viewportHeight = window.innerHeight;
        const maxSpacerHeight = viewportHeight * 0.7; // 70vh in pixels
        
        // Calculate remaining space
        const remainingSpace = Math.max(0, maxSpacerHeight - aiMessageHeight);
        const remainingVh = (remainingSpace / viewportHeight) * 100;
        
        setSpacerHeight(`${remainingVh}vh`);
        console.log('🔧 AI MESSAGE HEIGHT:', aiMessageHeight);
        console.log('🔧 REMAINING SPACE:', remainingSpace);
        console.log('🔧 SPACER HEIGHT:', `${remainingVh}vh`);
      }
    }
  };

    // Scroll on new messages or typing state change
  useEffect(() => {
    console.log('🔥 MESSAGES CHANGED:', messages.length);
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      console.log('🔥 LAST MESSAGE IS USER:', lastMessage.isUser);
      if (lastMessage.isUser) {
        // For user messages, FORCE scroll to position message at top
        console.log('🔥 USER MESSAGE DETECTED - FORCING SCROLL');
        
        // Multiple aggressive attempts
        scrollToUserMessage();
        setTimeout(() => scrollToUserMessage(), 10);
        setTimeout(() => scrollToUserMessage(), 50);
        setTimeout(() => scrollToUserMessage(), 100);
        setTimeout(() => scrollToUserMessage(), 200);
        setTimeout(() => scrollToUserMessage(), 300);
      }
      // NO scrolling for AI responses - let the spacer handle the layout
    }
    
    // Adjust spacer height based on message content
    setTimeout(() => adjustSpacerHeight(), 200);
  }, [messages]);

  // Adjust spacer height when typing state changes
  useEffect(() => {
    if (!isTyping) {
      // When AI finishes typing, recalculate spacer height after content renders
      setTimeout(() => adjustSpacerHeight(), 500);
    }
  }, [isTyping]);

  // Separate effect for typing indicator
  useEffect(() => {
    console.log('Typing state changed:', isTyping);
    // No scrolling for typing indicator - let the spacer handle the layout
  }, [isTyping]);

  // Check scroll position on scroll
  useEffect(() => {
    window.addEventListener('scroll', checkScrollPosition);
    return () => window.removeEventListener('scroll', checkScrollPosition);
  }, [isAutoScrolling]);

  return (
    <>
      <div className="chat-container" ref={containerRef}>
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} className="dynamic-spacer" style={{ height: spacerHeight }} />
      </div>

      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              console.log('Scroll button clicked');
              scrollToBottom(true);
            }}
            className="scroll-to-bottom-btn"
            title="Scroll to bottom"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 10l5 5 5-5" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
} 