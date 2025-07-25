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

const API_BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3005/api';

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
        console.log('🔍 Fetching identifiers from:', `${API_BASE_URL}/identifiers`);
        const identifiersResponse = await fetch(`${API_BASE_URL}/identifiers`);
        
        console.log('📊 Identifiers response status:', identifiersResponse.status);
        console.log('📊 Identifiers response headers:', identifiersResponse.headers.get('content-type'));
        
        if (!identifiersResponse.ok) {
          const errorText = await identifiersResponse.text();
          console.error('❌ Identifiers fetch failed:', errorText);
          throw new Error(`Failed to fetch identifiers: ${identifiersResponse.status}`);
        }
        
        const responseText = await identifiersResponse.text();
        console.log('📄 Raw response:', responseText.substring(0, 200) + '...');
        
        let identifiersData;
        try {
          identifiersData = JSON.parse(responseText);
        } catch (parseError) {
          console.error('❌ JSON Parse Error:', parseError);
          console.error('📄 Response that failed to parse:', responseText);
          throw new Error('Server returned invalid JSON');
        }
        
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