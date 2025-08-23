import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Message } from '../../types/chat';
import DynamicCard from './DynamicCard';
import BlurText from '../ui/BlurText';

interface ChatMessageProps {
  message: Message;
}

// Turn markdown links and raw URLs into clickable anchors
const linkify = (text: string) => {
  let result = text;
  // Markdown links [label](url)
  result = result.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_m, label, url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });
  // Raw URLs
  result = result.replace(/(?<![\"'=])(https?:\/\/[^\s)]+)(?![^<]*?>)/g, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
  return result;
};

const formatMessage = (text: string) => {
  // Convert newlines to <br /> and bold to <strong>, then linkify
  let formatted = text.replace(/\n/g, '<br />');
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formatted = linkify(formatted);
  return formatted;
};

// Function to extract all card identifiers from text (unused but kept for future features)
// const extractCardIdentifiers = (text: string): { single: string[], arrays: Array<{ identifiers: string[], originalText: string }> } => {
//   const single: string[] = [];
//   const arrays: Array<{ identifiers: string[], originalText: string }> = [];
//   
//   // First, find array patterns like [<skill_ai>, <skill_leadership>]
//   const arrayPattern = /\[([^\]]*(?:<(?:work_|project_|tool_|skill_|gallery_)[^>]+|aboutmecard>[^\]]*)*)\]/g;
//   let arrayMatch;
//   
//   while ((arrayMatch = arrayPattern.exec(text)) !== null) {
//     const arrayContent = arrayMatch[1];
//     const originalText = arrayMatch[0];
//     
//     // Extract identifiers from the array content
//     const identifierPattern = /<((?:work_|project_|tool_|skill_|gallery_)[^>]+|aboutmecard)>/g;
//     const identifiers: string[] = [];
//     let identifierMatch;
//     
//     while ((identifierMatch = identifierPattern.exec(arrayContent)) !== null) {
//       identifiers.push(identifierMatch[1]);
//     }
//     
//     if (identifiers.length > 0) {
//       arrays.push({ identifiers, originalText });
//     }
//   }
//   
//   // Then find individual identifiers that are not part of arrays
//   let textWithoutArrays = text;
//   arrays.forEach(array => {
//     textWithoutArrays = textWithoutArrays.replace(array.originalText, '');
//   });
//   
//   const singlePattern = /<((?:work_|project_|tool_|skill_|gallery_)[^>]+|aboutmecard)>/g;
//   let singleMatch;
//   
//   while ((singleMatch = singlePattern.exec(textWithoutArrays)) !== null) {
//     single.push(singleMatch[1]);
//   }
//   
//   return { single, arrays };
// };

// New function to format bot messages with better structure
const formatBotMessage = (text: string) => {
  // Clean up the text first
  let cleanedText = text
    .replace(/\r\n/g, '\n') // Normalize line breaks
    .replace(/\r/g, '\n')   // Handle old Mac line breaks
    .trim();
  
  // Split into paragraphs (double line breaks)
  const paragraphs = cleanedText
    .split(/\n\s*\n/)
    .filter(p => p.trim())
    .map(p => p.trim());
  
  console.log('Paragraphs:', paragraphs.length);
  
  // Calculate sequential delays where each paragraph waits for the previous to complete
  const allLines: Array<{ text: string; delay: number }> = [];
  let cumulativeDelay = 0;
  
  paragraphs.forEach((paragraph, index) => {
    // Remove markdown for BlurText
    const cleanLine = paragraph.replace(/\*\*(.*?)\*\*/g, '$1');
    
    // Calculate how long this paragraph will take to animate
    const wordCount = cleanLine.split(' ').filter(word => word.length > 0).length;
    const staggerDelay = wordCount * 0.05; // 0.05s between each word (from BlurText)
    const wordDuration = 0.6; // Duration for each word to animate
    const totalAnimationTime = staggerDelay + wordDuration;
    
    console.log(`Paragraph ${index}:`);
    console.log(`  - Words: ${wordCount}`);
    console.log(`  - Start delay: ${cumulativeDelay}s`);
    console.log(`  - Animation time: ${totalAnimationTime}s`);
    console.log(`  - Text: "${cleanLine.substring(0, 50)}..."`);
    
    allLines.push({
      text: cleanLine,
      delay: cumulativeDelay
    });
    
    // Next paragraph starts after this one completely finishes
    cumulativeDelay += totalAnimationTime + 0.3; // +0.3s pause between paragraphs
  });
  
  return allLines.map((lineData, index) => {
    const hasLink = /\[[^\]]+\]\(https?:\/\/[^)\s]+\)|https?:\/\/[^\s)]+/.test(lineData.text);
    if (hasLink) {
      // Render as HTML to preserve anchors
      const html = linkify(lineData.text).replace(/\n/g, '<br />');
      return (
        <motion.div
          key={index}
          style={{ 
            marginBottom: index < allLines.length - 1 ? '20px' : '0',
            lineHeight: '1.6'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: lineData.delay, duration: 0.3 }}
          className="prose"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }
    return (
      <motion.div
        key={index}
        style={{ 
          marginBottom: index < allLines.length - 1 ? '20px' : '0',
          lineHeight: '1.6'
        }}
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
      >
        <BlurText
          text={lineData.text}
          delay={lineData.delay}
          animateBy="words"
          duration={0.6}
          style={{
            fontSize: '15px',
            color: 'rgba(255, 255, 255, 0.95)',
            wordSpacing: '0.05em',
            letterSpacing: '0.01em'
          }}
        />
      </motion.div>
    );
  });
};

const CardCarousel = ({ cards }: { cards: string[] }) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isAnimating, setIsAnimating] = React.useState(false);

  const goNext = () => {
    if (isAnimating) return;
    console.log('Next button clicked!', currentIndex);
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const goPrev = () => {
    if (isAnimating) return;
    console.log('Prev button clicked!', currentIndex);
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <div 
      style={{
        width: '100%',
        minWidth: '100%',
        minHeight: '250px',
        margin: '16px 0',
        padding: '20px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'relative',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onMouseEnter={() => console.log('Carousel hover')}
    >
      {/* Current Card */}
      <div style={{ 
        flex: 1,
        margin: '0 60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ 
              duration: 0.3, 
              ease: [0.25, 0.46, 0.45, 0.94] 
            }}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <DynamicCard identifier={cards[currentIndex]} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Left Arrow */}
      {cards.length > 1 && (
        <motion.button
          onClick={goPrev}
          disabled={isAnimating}
          onMouseDown={(e) => {
            console.log('Mouse down on prev button');
            e.stopPropagation();
          }}
          animate={{ y: '-50%' }}
          whileHover={{ 
            scale: isAnimating ? 1 : 1.2, 
            opacity: isAnimating ? 0.3 : 1,
            y: '-50%'
          }}
          whileTap={{ 
            scale: isAnimating ? 1 : 0.9,
            y: '-50%'
          }}
          style={{
            position: 'absolute',
            left: '15px',
            top: '50%',
            transformOrigin: 'center',
            background: 'transparent',
            border: 'none',
            borderRadius: '0',
            width: '30px',
            height: '30px',
            color: 'rgba(255, 255, 255, 0.8)',
            cursor: isAnimating ? 'not-allowed' : 'pointer',
            fontSize: '24px',
            fontWeight: '300',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            pointerEvents: 'all',
            opacity: isAnimating ? 0.3 : 0.8,
            transition: 'opacity 0.2s ease'
          }}
        >
          ←
        </motion.button>
      )}

      {/* Right Arrow */}
      {cards.length > 1 && (
        <motion.button
          onClick={goNext}
          disabled={isAnimating}
          onMouseDown={(e) => {
            console.log('Mouse down on next button');
            e.stopPropagation();
          }}
          animate={{ y: '-50%' }}
          whileHover={{ 
            scale: isAnimating ? 1 : 1.2, 
            opacity: isAnimating ? 0.3 : 1,
            y: '-50%'
          }}
          whileTap={{ 
            scale: isAnimating ? 1 : 0.9,
            y: '-50%'
          }}
          style={{
            position: 'absolute',
            right: '15px',
            top: '50%',
            transformOrigin: 'center',
            background: 'transparent',
            border: 'none',
            borderRadius: '0',
            width: '30px',
            height: '30px',
            color: 'rgba(255, 255, 255, 0.8)',
            cursor: isAnimating ? 'not-allowed' : 'pointer',
            fontSize: '24px',
            fontWeight: '300',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            pointerEvents: 'all',
            opacity: isAnimating ? 0.3 : 0.8,
            transition: 'opacity 0.2s ease'
          }}
        >
          →
        </motion.button>
      )}

      {/* Card Counter */}
      {cards.length > 1 && (
        <div style={{
          position: 'absolute',
          bottom: '8px',
          right: '16px',
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.6)',
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '4px 8px',
          borderRadius: '12px'
        }}>
          {currentIndex + 1} / {cards.length}
        </div>
      )}
    </div>
  );
};

const renderMessageContent = (content: string, isUser: boolean) => {
  if (isUser) {
    return <div dangerouslySetInnerHTML={{ __html: formatMessage(content) }} />;
  }

  // Handle carousel: if content has [], parse text + carousel + text
  if (content.includes('[') && content.includes(']')) {
    const elements: JSX.Element[] = [];
    let elementKey = 0;
    
    // Split by array pattern [<...>,<...>]
    const arrayPattern = /\[([^\]]*<[^>]+[^\]]*)\]/;
    const match = content.match(arrayPattern);
    
    if (match) {
      const beforeCarousel = content.substring(0, match.index);
      const afterCarousel = content.substring(match.index! + match[0].length);
      const arrayContent = match[1];
      
      // Add text before carousel
      if (beforeCarousel && beforeCarousel.trim()) {
        elements.push(
          <div key={`text-before-${elementKey++}`}>
            {formatBotMessage(beforeCarousel.trim())}
          </div>
        );
      }
      
      // Add carousel
      const cardTags = arrayContent.match(/<[^>]+>/g);
      if (cardTags) {
        const identifiers = cardTags.map(tag => tag.replace(/[<>]/g, ''));
        elements.push(
          <CardCarousel key={`carousel-${elementKey++}`} cards={identifiers} />
        );
      }
      
      // Add text after carousel
      if (afterCarousel && afterCarousel.trim()) {
        elements.push(
          <div key={`text-after-${elementKey++}`}>
            {formatBotMessage(afterCarousel.trim())}
          </div>
        );
      }
      
      return <div>{elements}</div>;
    }
  }

  // Handle multiple individual cards
  if (content.includes('<') && content.includes('>')) {
    const cardTags = content.match(/<[^>]+>/g);
    if (cardTags) {
      const parts = content.split(/<[^>]+>/);
      const elements: JSX.Element[] = [];
      let elementKey = 0;

      // Interleave text parts and cards
      for (let i = 0; i < parts.length; i++) {
        // Add text part if not empty
        if (parts[i] && parts[i].trim()) {
          elements.push(
            <div key={`text-${elementKey++}`}>
              {formatBotMessage(parts[i].trim())}
            </div>
          );
        }
        
        // Add card if it exists
        if (cardTags[i]) {
          const identifier = cardTags[i].replace(/[<>]/g, '');
          elements.push(
            <DynamicCard key={`card-${elementKey++}`} identifier={identifier} />
          );
        }
      }

      return <div>{elements}</div>;
    }
  }

  // Regular text
  return <div>{formatBotMessage(content)}</div>;
};

export default function ChatMessage({ message }: ChatMessageProps) {
  const { content, isUser } = message;

  // Check if this is a carousel message
  const hasCarousel = !isUser && content.includes('[') && content.includes(']');

  const messageStyle = isUser ? {
    backgroundColor: 'rgba(52, 53, 65, 0.9)',
    padding: '12px 16px',
    color: 'var(--color-text-primary)',
    borderRadius: '100px',
    width: 'fit-content'
  } : {
    color: 'var(--color-text-primary)',
    width: hasCarousel ? '100%' : 'auto',
    maxWidth: '100%'
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