import { motion } from 'framer-motion';

interface ToolData {
  id: number;
  identifier: string;
  name: string;
  category: string;
  description: string;
  icon_url: string | null;
  website_url: string | null;
  proficiency_level: string;
  years_experience: number;
  is_featured: boolean;
}

interface ToolCardProps {
  data: ToolData;
}

export default function ToolCard({ data }: ToolCardProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'frontend': return 'rgba(59, 130, 246, 0.8)'; // Blue
      case 'backend': return 'rgba(34, 197, 94, 0.8)'; // Green
      case 'database': return 'rgba(168, 85, 247, 0.8)'; // Purple
      case 'cloud': return 'rgba(245, 158, 11, 0.8)'; // Amber
      case 'design': return 'rgba(236, 72, 153, 0.8)'; // Pink
      case 'ai-ml': return 'rgba(239, 68, 68, 0.8)'; // Red
      case 'devops': return 'rgba(20, 184, 166, 0.8)'; // Teal
      default: return 'rgba(156, 163, 175, 0.8)'; // Gray
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'frontend': return '🎨';
      case 'backend': return '⚙️';
      case 'database': return '🗃️';
      case 'cloud': return '☁️';
      case 'design': return '✨';
      case 'ai-ml': return '🤖';
      case 'devops': return '🚀';
      default: return '🛠️';
    }
  };

  const getProficiencyColor = (level: string) => {
    switch (level) {
      case 'expert': return 'rgba(34, 197, 94, 0.8)'; // Green
      case 'advanced': return 'rgba(59, 130, 246, 0.8)'; // Blue
      case 'intermediate': return 'rgba(245, 158, 11, 0.8)'; // Amber
      case 'beginner': return 'rgba(156, 163, 175, 0.8)'; // Gray
      default: return 'rgba(156, 163, 175, 0.8)';
    }
  };

  const getProficiencyPercentage = (level: string) => {
    switch (level) {
      case 'expert': return 95;
      case 'advanced': return 80;
      case 'intermediate': return 60;
      case 'beginner': return 35;
      default: return 50;
    }
  };

  return (
    <motion.div
      className="tool-card"
      style={{
        background: 'rgba(52, 53, 65, 0.4)',
        borderRadius: '16px',
        padding: '20px',
        margin: '16px 0',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)'
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        {/* Tool Icon */}
        <div style={{ 
          width: '48px', 
          height: '48px', 
          borderRadius: '12px',
          background: getCategoryColor(data.category),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          flexShrink: 0
        }}>
          {data.icon_url ? (
            <img 
              src={data.icon_url} 
              alt={data.name}
              style={{ width: '32px', height: '32px', borderRadius: '6px' }}
            />
          ) : (
            getCategoryIcon(data.category)
          )}
        </div>
        
        <div style={{ flex: 1 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            {data.website_url ? (
              <a
                href={data.website_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  textDecoration: 'none',
                  color: 'inherit'
                }}
              >
                <h3 style={{ 
                  margin: 0, 
                  fontSize: '18px', 
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.95)',
                  cursor: 'pointer'
                }}>
                  {data.name}
                </h3>
              </a>
            ) : (
              <h3 style={{ 
                margin: 0, 
                fontSize: '18px', 
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.95)'
              }}>
                {data.name}
              </h3>
            )}
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '500',
              background: getCategoryColor(data.category),
              color: 'white'
            }}>
              <span>{getCategoryIcon(data.category)}</span>
              <span style={{ textTransform: 'capitalize' }}>{data.category}</span>
            </div>
            
            {data.is_featured && (
              <div style={{
                padding: '2px 6px',
                borderRadius: '8px',
                fontSize: '10px',
                fontWeight: '500',
                background: 'rgba(245, 158, 11, 0.2)',
                color: 'rgba(245, 158, 11, 0.9)',
                border: '1px solid rgba(245, 158, 11, 0.3)'
              }}>
                ⭐ Featured
              </div>
            )}
          </div>

          {/* Description */}
          {data.description && (
            <div style={{ 
              fontSize: '14px',
              lineHeight: '1.5',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '16px'
            }}>
              {data.description}
            </div>
          )}

          {/* Experience & Proficiency */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '12px' }}>
            {/* Years Experience */}
            <div>
              <div style={{ 
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '4px'
              }}>
                Experience
              </div>
              <div style={{ 
                fontSize: '14px',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.9)'
              }}>
                {data.years_experience} year{data.years_experience !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Proficiency */}
            <div style={{ flex: 1 }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '4px'
              }}>
                <span style={{ 
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.6)'
                }}>
                  Proficiency
                </span>
                <span style={{ 
                  fontSize: '12px',
                  fontWeight: '600',
                  color: getProficiencyColor(data.proficiency_level),
                  textTransform: 'capitalize'
                }}>
                  {data.proficiency_level}
                </span>
              </div>
              
              {/* Progress Bar */}
              <div style={{
                width: '100%',
                height: '4px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <motion.div
                  style={{
                    height: '100%',
                    background: getProficiencyColor(data.proficiency_level),
                    borderRadius: '2px'
                  }}
                  initial={{ width: '0%' }}
                  animate={{ width: `${getProficiencyPercentage(data.proficiency_level)}%` }}
                  transition={{ 
                    duration: 1.0, 
                    ease: 'easeOut',
                    delay: 0.3 
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 