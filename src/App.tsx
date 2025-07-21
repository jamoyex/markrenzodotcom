import { useState, useEffect, FormEvent } from 'react';
import Aurora from './components/Aurora/Aurora';
import ChatContainer from './components/chat/ChatContainer';
import { ChatProvider, useChat } from './context/ChatContext';
import BlurText from './components/ui/BlurText';
import { heroImage } from '@/assets';

function ChatInterface() {
  const { messages, isTyping, sendMessage } = useChat();
  const [inputValue, setInputValue] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const hasMessages = messages.length > 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Start transition if this is the first message
    if (!hasMessages && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setShowChat(true);
      }, 800); // Hero fade out duration
    }

    await sendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleSuggestionClick = async (text: string) => {
    // Start transition if this is the first message
    if (!hasMessages && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setShowChat(true);
      }, 800); // Hero fade out duration
    }

    setInputValue(text);
    await sendMessage(text);
    setInputValue('');
  };

  const handleContactClick = async (e: FormEvent) => {
    e.preventDefault();
    await handleSuggestionClick("Hi! I'd like to get in touch and learn more about your AI and automation services.");
  };

  return (
    <>


      <header id="main-header">
        <div className="header-left">
          <h1>
            <span>Mark Renzo Mariveles</span>
          </h1>
        </div>
        <div className="header-right">
          <button onClick={handleContactClick} className="contact-btn">Contact Me</button>
        </div>
      </header>

      {/* Hero Section - Outside chat container */}
      <div id="hero-state" className={`${isTransitioning ? 'fade-out' : ''} ${hasMessages ? 'hidden' : ''}`}>
          <div className="hero-container">
            <div className="hero-image-container">
              <img 
                src={heroImage} 
                alt="Mark Renzo - AI and Automation Specialist"
                className="hero-image"
              />
            </div>
            <div className="hero-content">
                            <div>
                                  <BlurText 
                  text="Hi there!"
                  className="text-2xl font-normal text-white/80 block mb-2 hero-greeting"
                  delay={0.5}
                  animateBy="words"
                  duration={0.6}
                />
                <BlurText 
                  text="I'm Mark Renzo"
                  className="text-5xl font-bold text-white block hero-main-title"
                  delay={0.7}
                  animateBy="words"
                  duration={0.6}
                />
                                </div>
                <BlurText 
                  text="AI and Automation Specialist"
                  className="hero-subtitle"
                  delay={0.9}
                  animateBy="words"
                  duration={0.6}
                />
                <BlurText 
                  text="I help businesses work smarter by turning complex, time-consuming processes into streamlined, automated systems. With a mix of creativity and strategy, I build AI-driven solutions that solve real problems, save hours, and scale effortlessly."
                  className="hero-description"
                  delay={1.1}
                  animateBy="words"
                  duration={0.8}
                />
            {/* Social Media Icons */}
            <div className="social-icons">
              <a href="#" className="social-icon">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="social-icon">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="#" className="social-icon">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
            </div>
          </div>
        </div>

      <div id="app-container" className={`${hasMessages ? 'conversation-started' : ''} ${showChat ? 'fade-in' : ''}`}>
        <main id="chat-container">
          <ChatContainer />
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


    </>
  );
}

export default function App() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <ChatProvider>
      <Aurora 
        colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
        blend={isMobile ? 1.2 : 0.5}
        amplitude={isMobile ? 3.0 : 1.0}
        speed={0.5}
      />
      <ChatInterface />
    </ChatProvider>
  );
} 