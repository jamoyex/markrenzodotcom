import { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import DynamicCard from './DynamicCard';

interface HorizontalCardScrollerProps {
  identifiers: string[];
}

export default function HorizontalCardScroller({ identifiers }: HorizontalCardScrollerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update scroll button states
  const updateScrollButtons = useCallback(() => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    
    setCanScrollLeft(scrollLeft > 5); // Small threshold for precision
    setCanScrollRight(scrollLeft < maxScrollLeft - 5);
  }, []);

  // Initialize scroll buttons when component mounts or identifiers change
  useEffect(() => {
    const timer = setTimeout(() => {
      updateScrollButtons();
    }, 100); // Small delay to ensure DOM is ready

    return () => clearTimeout(timer);
  }, [identifiers, updateScrollButtons]);

  // Scroll handler
  const handleScroll = useCallback(() => {
    updateScrollButtons();
  }, [updateScrollButtons]);

  // Navigation functions
  const scrollLeft = () => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const cardWidth = isMobile ? 280 : 320;
    const gap = isMobile ? 12 : 16;
    const scrollAmount = cardWidth + gap;
    
    container.scrollBy({
      left: -scrollAmount,
      behavior: 'smooth'
    });
  };

  const scrollRight = () => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const cardWidth = isMobile ? 280 : 320;
    const gap = isMobile ? 12 : 16;
    const scrollAmount = cardWidth + gap;
    
    container.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <motion.div
      style={{
        margin: '16px 0',
        padding: '8px 0',
        width: '100%'
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Header with navigation */}
      <div style={{
        fontSize: '12px',
        color: 'rgba(255, 255, 255, 0.5)',
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px' 
        }}>
          <span>📊</span>
          <span>{identifiers.length} items {isMobile ? '• Scroll horizontally →' : ''}</span>
        </div>
        
        {/* Desktop Navigation Buttons */}
        {!isMobile && (
          <div style={{ 
            display: 'flex', 
            gap: '8px',
            alignItems: 'center'
          }}>
            <button
              onClick={scrollLeft}
              disabled={!canScrollLeft}
              style={{
                background: canScrollLeft ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: canScrollLeft ? 'pointer' : 'not-allowed',
                color: canScrollLeft ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.3)',
                transition: 'all 0.2s ease',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
              onMouseEnter={(e) => {
                if (canScrollLeft) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = canScrollLeft ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              ←
            </button>
            <button
              onClick={scrollRight}
              disabled={!canScrollRight}
              style={{
                background: canScrollRight ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: canScrollRight ? 'pointer' : 'not-allowed',
                color: canScrollRight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.3)',
                transition: 'all 0.2s ease',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
              onMouseEnter={(e) => {
                if (canScrollRight) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = canScrollRight ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              →
            </button>
          </div>
        )}
      </div>
      
      {/* Horizontal Scrollable Container */}
      <div 
        ref={scrollContainerRef}
        className="horizontal-card-scroller"
        onScroll={handleScroll}
        style={{
          display: 'flex',
          gap: isMobile ? '12px' : '16px',
          overflowX: 'auto',
          overflowY: 'hidden',
          paddingBottom: '8px',
          paddingRight: '8px', // Extra padding for last card
          scrollBehavior: 'smooth',
          width: '100%',
          alignItems: 'stretch', // Ensure cards align properly
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 255, 255, 0.3) transparent'
        }}
      >
        {identifiers.map((identifier, index) => (
          <motion.div
            key={identifier}
            style={{
              minWidth: isMobile ? '280px' : '320px',
              maxWidth: isMobile ? '280px' : '320px',
              flexShrink: 0,
              height: 'auto'
            }}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ 
              duration: 0.4, 
              ease: 'easeOut',
              delay: index * 0.08
            }}
          >
            <DynamicCard identifier={identifier} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
} 