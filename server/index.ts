import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../dist')));
}

// Import database functions
import { getPortfolioItemFromDatabase, getAllIdentifiersFromDatabase } from '../src/lib/api-server.js';

// API Routes
app.get('/api/portfolio/:identifier', async (req, res) => {
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

    const result = await getPortfolioItemFromDatabase(identifier);
    
    if (result) {
      res.json(result);
    } else {
      res.status(404).json({ error: 'Portfolio item not found' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/identifiers', async (req, res) => {
  try {
    const identifiers = await getAllIdentifiersFromDatabase();
    res.json(identifiers);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API server is running' });
});

// Serve React app for all non-API routes (production only)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../dist/index.html'));
  });
}

app.listen(port, () => {
  console.log(`🚀 API Server running on http://localhost:${port}`);
}); 