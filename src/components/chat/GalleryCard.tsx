import { motion } from 'framer-motion';

interface GalleryData {
  id: number;
  identifier: string;
  title: string;
  description: string;
  image_url: string;
  alt_text?: string;
  category: string;
  is_featured: boolean;
}

interface GalleryCardProps {
  data: GalleryData;
}

export default function GalleryCard({ data }: GalleryCardProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'screenshot': return 'rgba(34, 197, 94, 0.8)'; // Green
      case 'design': return 'rgba(168, 85, 247, 0.8)'; // Purple
      case 'photo': return 'rgba(59, 130, 246, 0.8)'; // Blue
      case 'certificate': return 'rgba(245, 158, 11, 0.8)'; // Amber
      default: return 'rgba(156, 163, 175, 0.8)'; // Gray
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'screenshot': return '📷';
      case 'design': return '🎨';
      case 'photo': return '🖼️';
      case 'certificate': return '🏆';
      default: return '📸';
    }
  };

  return (
    <motion.div
      className="gallery-card"
      style={{
        background: 'rgba(52, 53, 65, 0.4)',
        borderRadius: '16px',
        padding: '0',
        margin: '16px 0',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        overflow: 'hidden'
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Image Section */}
      <div style={{ 
        width: '100%', 
        height: '200px', 
        position: 'relative',
        overflow: 'hidden'
      }}>
        <img
          src={data.image_url}
          alt={data.alt_text || data.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        />
        
        {/* Category Badge */}
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: '500',
          background: getCategoryColor(data.category),
          color: 'white',
          backdropFilter: 'blur(10px)'
        }}>
          <span>{getCategoryIcon(data.category)}</span>
          <span style={{ textTransform: 'capitalize' }}>{data.category}</span>
        </div>

        {/* Featured Badge */}
        {data.is_featured && (
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '500',
            background: 'rgba(245, 158, 11, 0.9)',
            color: 'white',
            backdropFilter: 'blur(10px)'
          }}>
            ⭐ Featured
          </div>
        )}
      </div>

      {/* Content Section */}
      <div style={{ padding: '20px' }}>
        <h3 style={{ 
          margin: '0 0 8px 0', 
          fontSize: '18px', 
          fontWeight: '600',
          color: 'rgba(255, 255, 255, 0.95)',
          lineHeight: '1.3'
        }}>
          {data.title}
        </h3>

        {data.description && (
          <p style={{ 
            margin: 0, 
            fontSize: '14px', 
            lineHeight: '1.5',
            color: 'rgba(255, 255, 255, 0.7)'
          }}>
            {data.description}
          </p>
        )}
      </div>
    </motion.div>
  );
} 