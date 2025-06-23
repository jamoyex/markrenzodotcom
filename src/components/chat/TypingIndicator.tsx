import { motion } from 'framer-motion';

export default function TypingIndicator() {
  const indicatorStyle = {
    backgroundColor: 'rgba(68, 70, 84, 0.9)',
    padding: 'var(--space-4)',
    color: 'var(--color-text-primary)',
    maxWidth: '85%',
    lineHeight: 1.5,
    borderRadius: '100px'
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-start',
        marginBottom: '1rem',
      }}
    >
      <div
        style={indicatorStyle}
      >
        <motion.div
          style={{
            display: 'flex',
            gap: '0.25rem',
          }}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-text-secondary)',
            }}
          />
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-text-secondary)',
            }}
          />
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-text-secondary)',
            }}
          />
        </motion.div>
      </div>
    </div>
  );
} 