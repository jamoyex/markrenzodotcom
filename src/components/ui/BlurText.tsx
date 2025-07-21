import { motion } from 'framer-motion';

interface BlurTextProps {
  text: string;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
  animateBy?: 'words' | 'characters';
  duration?: number;
}

export default function BlurText({
  text,
  delay = 0,
  className = '',
  style = {},
  animateBy = 'words',
  duration = 0.5
}: BlurTextProps) {
  // Split text based on animation type
  const elements = animateBy === 'words' 
    ? text.split(' ').filter(word => word.length > 0)
    : text.split('');

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: animateBy === 'words' ? 0.05 : 0.03,
        delayChildren: delay
      }
    }
  };

  const elementVariants = {
    hidden: { 
      filter: 'blur(10px)',
      opacity: 0,
      scale: 1.2
    },
    visible: { 
      filter: 'blur(0px)',
      opacity: 1,
      scale: 1,
      transition: {
        duration: duration,
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
      {elements.map((element, index) => (
        <motion.span
          key={index}
          variants={elementVariants}
          style={{ 
            display: 'inline-block',
            marginRight: animateBy === 'words' && index < elements.length - 1 ? '0.25em' : '0'
          }}
        >
          {element}
        </motion.span>
      ))}
    </motion.div>
  );
} 