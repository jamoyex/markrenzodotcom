import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

console.log('🚀 Starting Mark Renzo Portfolio Server...');
console.log('📊 Environment:', process.env.NODE_ENV || 'development');
console.log('🌐 Port:', process.env.PORT || 3005);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3005', 10);

// Middleware
app.use(cors());
app.use(express.json());

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - ${req.get('User-Agent') ? 'Browser' : 'API'}`);
  next();
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const distPath = join(__dirname, '../dist');
  console.log('📁 Serving static files from:', distPath);
  app.use(express.static(distPath));
}

// Import database functions with error handling
let dbFunctionsAvailable = false;
let getPortfolioItemFromDatabase: any;
let getAllIdentifiersFromDatabase: any;

try {
  const dbModule = await import('../src/lib/api-server.ts');
  getPortfolioItemFromDatabase = dbModule.getPortfolioItemFromDatabase;
  getAllIdentifiersFromDatabase = dbModule.getAllIdentifiersFromDatabase;
  dbFunctionsAvailable = true;
  console.log('✅ Database functions loaded successfully');
} catch (error) {
  console.error('❌ Failed to load database functions:', error);
  console.log('🔄 Server will continue with fallback data only');
}

// API Routes
app.get('/api/portfolio/:identifier', async (req, res) => {
  console.log('🔍 API Request: /api/portfolio/' + req.params.identifier);
  try {
    const { identifier } = req.params;
    
    // Handle special case for aboutmecard
    if (identifier === 'aboutmecard') {
      return res.json({ 
        type: 'about', 
        data: {
          name: "Mark Renzo Mariveles",
          role: "Full-Stack Developer & AI Specialist",  
          bio: "Passionate about creating innovative digital solutions and helping businesses leverage AI technology."
        }
      });
    }

    let result;
    
    if (dbFunctionsAvailable) {
      try {
        result = await getPortfolioItemFromDatabase(identifier);
      } catch (dbError) {
        console.error('Database Error:', dbError);
        // Return fallback data if database fails
        return res.json({
          type: 'skill',
          name: identifier.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          identifier,
          fallback: true,
          description: 'Database connection temporarily unavailable'
        });
      }
    } else {
      // Fallback when DB functions aren't available
      return res.json({
        type: 'skill',
        name: identifier.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        identifier,
        fallback: true,
        description: 'Database functions not available'
      });
    }
    
    if (result) {
      res.json(result);
    } else {
      res.status(404).json({ error: 'Portfolio item not found' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.get('/api/identifiers', async (req, res) => {
  console.log('🔍 API Request: /api/identifiers');
  try {
    let identifiers;
    
    if (dbFunctionsAvailable) {
      try {
        identifiers = await getAllIdentifiersFromDatabase();
      } catch (dbError) {
        console.error('Database Error:', dbError);
        // Return fallback identifiers if database fails
        return res.json({
          skills: ['skill_ai', 'skill_leadership', 'skill_fullstack'],
          projects: ['project_portfolio', 'project_chatbot'],
          work: ['work_freelance'],
          tools: ['tool_react', 'tool_nodejs'],
          gallery: ['gallery_ui', 'gallery_mobile'],
          fallback: true
        });
      }
    } else {
      // Fallback when DB functions aren't available
      return res.json({
        skills: ['skill_ai', 'skill_leadership', 'skill_fullstack'],
        projects: ['project_portfolio', 'project_chatbot'],
        work: ['work_freelance'],
        tools: ['tool_react', 'tool_nodejs'],
        gallery: ['gallery_ui', 'gallery_mobile'],
        fallback: true
      });
    }
    
    res.json(identifiers);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('🔍 API Request: /api/health');
  res.json({ 
    status: 'OK', 
    message: 'API server is running',
    environment: process.env.NODE_ENV || 'development',
    port: port,
    timestamp: new Date().toISOString(),
    database: dbFunctionsAvailable ? 'loaded' : 'fallback'
  });
});

// Simple test endpoint that doesn't depend on database
app.get('/api/test', (req, res) => {
  console.log('🔍 API Request: /api/test');
  res.json({ 
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    server: 'Express + TypeScript'
  });
});

// Handle 404 for API routes specifically
app.use('/api/*', (req, res) => {
  console.log('❌ API 404:', req.path);
  res.status(404).json({ error: 'API endpoint not found', path: req.path });
});

// Serve React app for all non-API routes (production only)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    console.log('📄 Serving React app for:', req.path);
    const indexPath = join(__dirname, '../dist/index.html');
    console.log('📁 Index path:', indexPath);
    res.sendFile(indexPath);
  });
}

// Start server - IMPORTANT: bind to 0.0.0.0 for Docker containers
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 API Server running on http://0.0.0.0:${port}`);
  console.log(`🔗 Health check: http://0.0.0.0:${port}/api/health`);
  console.log(`📂 Static files: ${process.env.NODE_ENV === 'production' ? 'enabled' : 'disabled'}`);
});

// Global error handlers to prevent crashes
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.log('🔄 Server continuing to run...');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  console.log('🔄 Server continuing to run...');
});

console.log('✅ Server startup complete!'); 