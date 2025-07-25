import React, { createContext, useContext, useState, useEffect } from 'react';

interface PortfolioData {
  [key: string]: any;
}

interface PortfolioDataContextType {
  portfolioData: PortfolioData;
  isLoading: boolean;
  error: string | null;
  refetchData: () => Promise<void>;
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

  const preloadAllData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get all available identifiers from the API
      const identifiersResponse = await fetch(`${API_BASE_URL}/identifiers`);
      
      if (!identifiersResponse.ok) {
        throw new Error(`Failed to fetch identifiers: ${identifiersResponse.status}`);
      }
      
      const responseText = await identifiersResponse.text();
      
      let identifiersData;
      try {
        identifiersData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError);
        throw new Error('Server returned invalid JSON');
      }
      
      // Flatten the categorized response into a single array of identifier strings
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

      // Add special identifiers that don't come from the database
      identifiers.push('aboutmecard');

      // Preload data for all identifiers
      const dataPromises = identifiers.map(async (identifier) => {
        try {
          const response = await fetch(`${API_BASE_URL}/portfolio/${identifier}`);
          if (response.ok) {
            const data = await response.json();
            return { identifier, data };
          }
        } catch (error) {
          console.warn(`Failed to preload data for ${identifier}:`, error);
        }
        return null;
      });

      const results = await Promise.all(dataPromises);
      
      // Build the portfolio data object
      const newPortfolioData: PortfolioData = {};
      results.forEach((result) => {
        if (result) {
          newPortfolioData[result.identifier] = result.data; // Store the full API response
        }
      });

      setPortfolioData(newPortfolioData);
      
    } catch (error) {
      console.error('Failed to load portfolio data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load portfolio data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    preloadAllData();
  }, []);

  const value = {
    portfolioData,
    isLoading,
    error,
    refetchData: preloadAllData,
  };

  return (
    <PortfolioDataContext.Provider value={value}>
      {children}
    </PortfolioDataContext.Provider>
  );
}; 