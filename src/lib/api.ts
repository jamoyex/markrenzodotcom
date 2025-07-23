// DEPRECATED: Portfolio data is now preloaded via PortfolioDataContext
// API functions that make HTTP requests to Express server
const API_BASE_URL = 'http://localhost:3001/api';

export async function getPortfolioItem(identifier: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/portfolio/${identifier}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Portfolio item '${identifier}' not found`);
        return null;
      }
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching portfolio item:', error);
    return null;
  }
}



// Get all available identifiers from API server
export async function getAllAvailableIdentifiers() {
  try {
    const response = await fetch(`${API_BASE_URL}/identifiers`);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching identifiers from API:', error);
    return null;
  }
} 