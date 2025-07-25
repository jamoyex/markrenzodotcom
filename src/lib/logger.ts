// Production-safe logging utility
const isDevelopment = process.env.NODE_ENV !== 'production';
const isServer = typeof window === 'undefined';

export const logger = {
  info: (message: string, ...args: any[]) => {
    if (isDevelopment || isServer) {
      console.log(`ℹ️  ${message}`, ...args);
    }
  },
  
  error: (message: string, error?: any) => {
    console.error(`❌ ${message}`, error);
  },
  
  warn: (message: string, ...args: any[]) => {
    console.warn(`⚠️  ${message}`, ...args);
  },
  
  debug: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`🔍 ${message}`, ...args);
    }
  },
  
  success: (message: string, ...args: any[]) => {
    if (isDevelopment || isServer) {
      console.log(`✅ ${message}`, ...args);
    }
  }
};

// Safe error response helper
export const createSafeErrorResponse = (message: string, error?: any) => {
  if (isDevelopment) {
    return {
      error: message,
      details: error?.message || error,
      stack: error?.stack
    };
  }
  
  return {
    error: message
  };
}; 