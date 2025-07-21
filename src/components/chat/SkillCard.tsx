import React from 'react';
import { motion } from 'framer-motion';

interface SkillData {
  id: number;
  identifier: string;
  name: string;
  category: string;
  description: string;
  proficiency_percentage: number;
  skill_type: string;
  is_featured: boolean;
}

interface SkillCardProps {
  data: SkillData;
}

export default function SkillCard({ data }: SkillCardProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical': return 'rgba(59, 130, 246, 0.8)'; // Blue
      case 'soft': return 'rgba(168, 85, 247, 0.8)'; // Purple
      case 'language': return 'rgba(34, 197, 94, 0.8)'; // Green
      case 'certification': return 'rgba(245, 158, 11, 0.8)'; // Amber
      default: return 'rgba(156, 163, 175, 0.8)'; // Gray
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical': return '💻';
      case 'soft': return '🤝';
      case 'language': return '🌍';
      case 'certification': return '🏆';
      default: return '⭐';
    }
  };

  const getSkillTypeIcon = (skillType: string) => {
    switch (skillType) {
      case 'programming': return '⚡';
      case 'framework': return '🔧';
      case 'soft-skill': return '💡';
      case 'language': return '🗣️';
      case 'certification': return '📜';
      default: return '🎯';
    }
  };

  return (
    <motion.div
      className="skill-card"
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
        <div style={{ fontSize: '32px' }}>
          {getSkillTypeIcon(data.skill_type)}
        </div>
        
        <div style={{ flex: 1 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: '18px', 
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.95)'
            }}>
              {data.name}
            </h3>
            
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

          {/* Proficiency Bar */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '6px'
            }}>
              <span style={{ 
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.6)'
              }}>
                Proficiency
              </span>
              <span style={{ 
                fontSize: '12px',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.9)'
              }}>
                {data.proficiency_percentage}%
              </span>
            </div>
            
            {/* Progress Bar Container */}
            <div style={{
              width: '100%',
              height: '6px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              {/* Progress Bar Fill */}
              <motion.div
                style={{
                  height: '100%',
                  background: `linear-gradient(90deg, ${getCategoryColor(data.category)}, ${getCategoryColor(data.category).replace('0.8', '0.6')})`,
                  borderRadius: '3px'
                }}
                initial={{ width: '0%' }}
                animate={{ width: `${data.proficiency_percentage}%` }}
                transition={{ 
                  duration: 1.2, 
                  ease: 'easeOut',
                  delay: 0.3 
                }}
              />
            </div>
          </div>

          {/* Skill Type */}
          <div style={{ 
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.5)',
            textTransform: 'capitalize'
          }}>
            {data.skill_type.replace('-', ' ')} • {data.category} skill
          </div>
        </div>
      </div>
    </motion.div>
  );
} 