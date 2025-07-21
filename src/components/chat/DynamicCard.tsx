import React, { useState, useEffect } from 'react';
import WorkExperienceCard from './WorkExperienceCard';
import ProjectCard from './ProjectCard';
import SkillCard from './SkillCard';
import ToolCard from './ToolCard';
import AboutCard from './AboutCard';
import { getPortfolioItem } from '../../lib/api.js';

interface DynamicCardProps {
  identifier: string;
}

export default function DynamicCard({ identifier }: DynamicCardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cardType, setCardType] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch real data from database
        const result = await getPortfolioItem(identifier);
        
        if (!result) {
          throw new Error(`No data found for identifier: ${identifier}`);
        }
        
        setCardType(result.type);
        setData(result.data);
      } catch (err) {
        console.error('Error fetching card data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [identifier]);

  if (loading) {
    return (
      <div style={{
        padding: '20px',
        margin: '16px 0',
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: '14px'
      }}>
        Loading {identifier}...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{
        padding: '20px',
        margin: '16px 0',
        textAlign: 'center',
        color: 'rgba(255, 100, 100, 0.8)',
        fontSize: '14px',
        background: 'rgba(255, 100, 100, 0.1)',
        borderRadius: '8px',
        border: '1px solid rgba(255, 100, 100, 0.2)'
      }}>
        ⚠️ Could not load {identifier}
        {error && <div style={{ fontSize: '12px', marginTop: '4px' }}>{error}</div>}
      </div>
    );
  }

  // Render appropriate card based on data type
  if (cardType === 'work_experience') {
    return <WorkExperienceCard data={data} />;
  } else if (cardType === 'project') {
    return <ProjectCard data={data} />;
  } else if (cardType === 'skill') {
    return <SkillCard data={data} />;
  } else if (cardType === 'tool') {
    return <ToolCard data={data} />;
  } else if (cardType === 'about' || identifier === 'aboutmecard') {
    return <AboutCard />;
  }

  // Fallback for unknown card types
  return (
    <div style={{
      padding: '20px',
      margin: '16px 0',
      background: 'rgba(52, 53, 65, 0.4)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      color: 'rgba(255, 255, 255, 0.8)'
    }}>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
        {data.title || data.name || identifier}
      </h3>
      <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
        {data.description || data.short_description || 'No description available'}
      </p>
    </div>
  );
} 