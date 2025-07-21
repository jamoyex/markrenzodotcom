import React from 'react';
import { motion } from 'framer-motion';

interface WorkExperienceData {
  id: number;
  identifier: string;
  company_name: string;
  position_title: string;
  employment_type: string;
  location: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string;
  achievements: string;
  company_logo_url: string | null;
  company_website: string | null;
}

interface WorkExperienceCardProps {
  data: WorkExperienceData;
}

export default function WorkExperienceCard({ data }: WorkExperienceCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const getPeriod = () => {
    const start = formatDate(data.start_date);
    const end = data.is_current ? 'Present' : (data.end_date ? formatDate(data.end_date) : 'Present');
    return `${start} - ${end}`;
  };

  return (
    <motion.div
      className="work-experience-card"
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
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        {data.company_logo_url && (
          <div style={{ flexShrink: 0 }}>
            <img
              src={data.company_logo_url}
              alt={`${data.company_name} logo`}
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '8px',
                objectFit: 'cover'
              }}
            />
          </div>
        )}
        
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: '8px' }}>
            <h3 style={{ 
              margin: '0 0 4px 0', 
              fontSize: '18px', 
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.95)'
            }}>
              {data.position_title}
            </h3>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>
              {data.company_website ? (
                <a 
                  href={data.company_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ 
                    color: 'rgba(100, 200, 255, 0.9)',
                    textDecoration: 'none'
                  }}
                >
                  {data.company_name}
                </a>
              ) : (
                <span>{data.company_name}</span>
              )}
              <span>•</span>
              <span>{data.employment_type}</span>
              {data.location && (
                <>
                  <span>•</span>
                  <span>{data.location}</span>
                </>
              )}
            </div>
            <div style={{ 
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.6)',
              marginTop: '4px'
            }}>
              {getPeriod()}
            </div>
          </div>

          {data.description && (
            <div style={{ 
              fontSize: '14px',
              lineHeight: '1.5',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '12px'
            }}>
              {data.description}
            </div>
          )}

          {data.achievements && (
            <div style={{ 
              fontSize: '13px',
              lineHeight: '1.4',
              color: 'rgba(255, 255, 255, 0.7)',
              fontStyle: 'italic',
              padding: '8px 12px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              borderLeft: '3px solid rgba(100, 200, 255, 0.5)'
            }}>
              <strong>Key Achievement:</strong> {data.achievements}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
} 