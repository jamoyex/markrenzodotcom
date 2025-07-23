import React, { createContext, useContext, useEffect, useState } from 'react';

interface PortfolioData {
  [identifier: string]: {
    type: string;
    data: any;
  };
}

interface PortfolioDataContextType {
  portfolioData: PortfolioData;
  isLoading: boolean;
  error: string | null;
  getItem: (identifier: string) => any;
}

const PortfolioDataContext = createContext<PortfolioDataContextType | undefined>(undefined);

export const usePortfolioData = () => {
  const context = useContext(PortfolioDataContext);
  if (context === undefined) {
    throw new Error('usePortfolioData must be used within a PortfolioDataProvider');
  }
  return context;
};

const API_BASE_URL = 'http://localhost:3001/api';

export const PortfolioDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [portfolioData, setPortfolioData] = useState<PortfolioData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const preloadAllData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get all available identifiers from the API
        const identifiersResponse = await fetch(`${API_BASE_URL}/identifiers`);
        if (!identifiersResponse.ok) {
          throw new Error('Failed to fetch identifiers');
        }
        
        const identifiersData = await identifiersResponse.json();
        
        // Flatten the categorized response into a single array
        const identifiers: string[] = [];
        Object.values(identifiersData).forEach((category: any) => {
          if (Array.isArray(category)) {
            category.forEach((item: any) => {
              if (item.identifier) {
                identifiers.push(item.identifier);
              }
            });
          }
        });
        
        console.log('🚀 Preloading portfolio data for identifiers:', identifiers);

        // Fetch all portfolio items in parallel
        const promises = identifiers.map(async (identifier: string) => {
          try {
            const response = await fetch(`${API_BASE_URL}/portfolio/${identifier}`);
            if (response.ok) {
              const data = await response.json();
              return { identifier, data };
            }
            return null;
          } catch (err) {
            console.warn(`Failed to fetch ${identifier}:`, err);
            return null;
          }
        });

        const results = await Promise.all(promises);
        
        // Build the portfolio data cache
        const dataCache: PortfolioData = {};
        
        // Add aboutmecard manually since it's handled specially
        dataCache.aboutmecard = {
          type: 'about',
          data: {
            name: "Mark Renzo Mariveles",
            role: "Full-Stack Developer & AI Specialist",
            bio: "Passionate about creating innovative digital solutions and helping businesses leverage AI technology."
          }
        };

        // Add all fetched items
        results.forEach(result => {
          if (result && result.data) {
            dataCache[result.identifier] = result.data;
          }
        });

        setPortfolioData(dataCache);
        console.log('✅ Portfolio data preloaded:', Object.keys(dataCache).length, 'items');
        
      } catch (err) {
        console.error('❌ Failed to preload portfolio data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    preloadAllData();
  }, []);

  const getItem = (identifier: string) => {
    return portfolioData[identifier] || null;
  };

  const value: PortfolioDataContextType = {
    portfolioData,
    isLoading,
    error,
    getItem
  };

  return (
    <PortfolioDataContext.Provider value={value}>
      {children}
    </PortfolioDataContext.Provider>
  );
}; 