import { motion } from 'framer-motion';

interface ProjectData {
  id: number;
  identifier: string;
  title: string;
  short_description: string;
  project_type: string;
  status: string;
  github_url: string | null;
  live_demo_url: string | null;
  featured_image_url: string | null;
  tech_stack: string[];
}

interface ProjectCardProps {
  data: ProjectData;
}

export default function ProjectCard({ data }: ProjectCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'rgba(34, 197, 94, 0.8)';
      case 'in-progress': return 'rgba(234, 179, 8, 0.8)';
      case 'planning': return 'rgba(168, 85, 247, 0.8)';
      case 'archived': return 'rgba(156, 163, 175, 0.8)';
      default: return 'rgba(156, 163, 175, 0.8)';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'web-app': return '🌐';
      case 'mobile-app': return '📱';
      case 'api': return '🔌';
      case 'ai-project': return '🤖';
      case 'tool': return '🛠️';
      default: return '💻';
    }
  };

  return (
    <motion.div
      className="project-card"
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
      <div style={{ display: 'flex', gap: '16px' }}>
        {data.featured_image_url && (
          <div style={{ flexShrink: 0 }}>
            <img
              src={data.featured_image_url}
              alt={data.title}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '12px',
                objectFit: 'cover'
              }}
            />
          </div>
        )}
        
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '20px' }}>{getTypeIcon(data.project_type)}</span>
            <h3 style={{ 
              margin: 0, 
              fontSize: '18px', 
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.95)'
            }}>
              {data.title}
            </h3>
            <div style={{
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '500',
              textTransform: 'capitalize',
              background: getStatusColor(data.status),
              color: 'white'
            }}>
              {data.status.replace('-', ' ')}
            </div>
          </div>

          {data.short_description && (
            <div style={{ 
              fontSize: '14px',
              lineHeight: '1.5',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '12px'
            }}>
              {data.short_description}
            </div>
          )}

          {data.tech_stack && data.tech_stack.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ 
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '4px'
              }}>
                Tech Stack:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {data.tech_stack.map((tech, index) => (
                  <span
                    key={index}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {data.live_demo_url && (
              <a
                href={data.live_demo_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '500',
                  background: 'rgba(100, 200, 255, 0.2)',
                  color: 'rgba(100, 200, 255, 0.9)',
                  textDecoration: 'none',
                  border: '1px solid rgba(100, 200, 255, 0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                🚀 Live Demo
              </a>
            )}
            {data.github_url && (
              <a
                href={data.github_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '500',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  textDecoration: 'none',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.2s ease'
                }}
              >
                💻 GitHub
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
} 