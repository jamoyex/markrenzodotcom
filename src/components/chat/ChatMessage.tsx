import React from 'react';
import { motion } from 'framer-motion';
import type { Message } from '../../types/chat';
import DynamicCard from './DynamicCard';
import HorizontalCardScroller from './HorizontalCardScroller';
import BlurText from '../ui/BlurText';

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

// Function to extract all card identifiers from text
const extractCardIdentifiers = (text: string): { single: string[], arrays: Array<{ identifiers: string[], originalText: string }> } => {
  const single: string[] = [];
  const arrays: Array<{ identifiers: string[], originalText: string }> = [];
  
  // First, find array patterns like [<skill_ai>, <skill_leadership>]
  const arrayPattern = /\[([^\]]*(?:<(?:work_|project_|tool_|skill_|gallery_)[^>]+|aboutmecard>[^\]]*)*)\]/g;
  let arrayMatch;
  
  while ((arrayMatch = arrayPattern.exec(text)) !== null) {
    const arrayContent = arrayMatch[1];
    const originalText = arrayMatch[0];
    
    // Extract identifiers from the array content
    const identifierPattern = /<((?:work_|project_|tool_|skill_|gallery_)[^>]+|aboutmecard)>/g;
    const identifiers: string[] = [];
    let identifierMatch;
    
    while ((identifierMatch = identifierPattern.exec(arrayContent)) !== null) {
      identifiers.push(identifierMatch[1]);
    }
    
    if (identifiers.length > 0) {
      arrays.push({ identifiers, originalText });
    }
  }
  
  // Then find individual identifiers that are not part of arrays
  let textWithoutArrays = text;
  arrays.forEach(array => {
    textWithoutArrays = textWithoutArrays.replace(array.originalText, '');
  });
  
  const singlePattern = /<((?:work_|project_|tool_|skill_|gallery_)[^>]+|aboutmecard)>/g;
  let singleMatch;
  
  while ((singleMatch = singlePattern.exec(textWithoutArrays)) !== null) {
    single.push(singleMatch[1]);
  }
  
  return { single, arrays };
};

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
  
  return allLines.map((lineData, index) => (
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
  ));
};

const renderMessageContent = (content: string, isUser: boolean) => {
  if (isUser) {
    return <div dangerouslySetInnerHTML={{ __html: formatMessage(content) }} />;
  }

  // For bot messages, check for card identifiers
  const { single: singleCards, arrays: cardArrays } = extractCardIdentifiers(content);
  
  if (singleCards.length === 0 && cardArrays.length === 0) {
    // No cards, just render regular text with animation
    return <div>{formatBotMessage(content)}</div>;
  }

  // Process content with both single cards and arrays
  let remainingContent = content;
  const elements: JSX.Element[] = [];
  let elementKey = 0;

  // First, handle arrays (they take priority)
  cardArrays.forEach((arrayData) => {
    const parts = remainingContent.split(arrayData.originalText);
    
    // Add text before the array (if any)
    if (parts[0] && parts[0].trim()) {
      elements.push(
        <div key={`text-${elementKey++}`}>
          {formatBotMessage(parts[0].trim())}
        </div>
      );
    }
    
    // Add the horizontal scroller for the array
    elements.push(
      <HorizontalCardScroller 
        key={`array-${elementKey++}`} 
        identifiers={arrayData.identifiers} 
      />
    );
    
    // Update remaining content
    remainingContent = parts.slice(1).join(arrayData.originalText);
  });

  // Then handle single cards in the remaining content
  singleCards.forEach((identifier) => {
    const cardTag = `<${identifier}>`;
    const parts = remainingContent.split(cardTag);
    
    // Add text before the card (if any)
    if (parts[0] && parts[0].trim()) {
      elements.push(
        <div key={`text-${elementKey++}`}>
          {formatBotMessage(parts[0].trim())}
        </div>
      );
    }
    
    // Add the single card
    elements.push(
      <DynamicCard key={`card-${elementKey++}`} identifier={identifier} />
    );
    
    // Update remaining content
    remainingContent = parts.slice(1).join(cardTag);
  });

  // Add any remaining text after the last card/array
  if (remainingContent && remainingContent.trim()) {
    elements.push(
      <div key={`text-${elementKey++}`}>
        {formatBotMessage(remainingContent.trim())}
      </div>
    );
  }

  return <div>{elements}</div>;
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
    color: 'var(--color-text-primary)',
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