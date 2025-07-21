import { motion } from 'framer-motion';

interface FadeUpTextProps {
  text: string;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function FadeUpText({
  text,
  delay = 0,
  className = '',
  style = {}
}: FadeUpTextProps) {
  // Split text into chunks (sentences or by punctuation)
  const chunks = text
    .split(/([.!?]+\s)/)
    .filter(chunk => chunk.trim().length > 0)
    .map(chunk => chunk.trim());

  // If no punctuation, split by words in groups of 3-5
  const finalChunks = chunks.length === 1 
    ? text.split(' ').reduce((acc: string[], word, index) => {
        const chunkIndex = Math.floor(index / 4);
        if (!acc[chunkIndex]) acc[chunkIndex] = '';
        acc[chunkIndex] += (acc[chunkIndex] ? ' ' : '') + word;
        return acc;
      }, [])
    : chunks;

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.3,
        delayChildren: delay
      }
    }
  };

  const chunkVariants = {
    hidden: { 
      opacity: 0, 
      y: 20 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut'
      }
    }
  };

  return (
    <motion.div
      className={className}
      style={style}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {finalChunks.map((chunk, index) => (
        <motion.span
          key={index}
          variants={chunkVariants}
          style={{ display: 'inline-block', marginRight: '4px' }}
        >
          {chunk}
        </motion.span>
      ))}
    </motion.div>
  );
} 