import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { logger, createSafeErrorResponse } from '../src/lib/logger.ts';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { pool } from '../src/lib/database.ts';

// Load environment variables
dotenv.config();

logger.info('🚀 Starting Mark Renzo Portfolio Server...');
logger.info('📊 Environment:', process.env.NODE_ENV || 'development');
logger.info('🌐 Port:', process.env.PORT || 3005);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3005', 10);

// Middleware
app.use(cors({
  origin: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','x-admin-key'],
}));
// Handle preflight for all routes
app.options('*', cors({
  origin: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','x-admin-key'],
}));
app.use(express.json({ limit: '50mb' }));

// Debug middleware to log all requests
app.use((req, res, next) => {
  logger.debug(`📨 ${req.method} ${req.path}`);
  next();
});

// Static files
if (process.env.NODE_ENV === 'production') {
  const distPath = join(__dirname, '../dist');
  logger.info('📁 Serving static files from:', distPath);
  app.use(express.static(distPath));
}

// Admin UI is handled by the Vite app at /admin (port 5173 in dev, SPA route in prod)

// Import database functions with error handling
let dbFunctionsAvailable = false;
let getPortfolioItemFromDatabase: any;
let getAllIdentifiersFromDatabase: any;

try {
  const dbModule = await import('../src/lib/api-server.ts');
  getPortfolioItemFromDatabase = dbModule.getPortfolioItemFromDatabase;
  getAllIdentifiersFromDatabase = dbModule.getAllIdentifiersFromDatabase;
  dbFunctionsAvailable = true;
  logger.success('Database functions loaded successfully');
} catch (error) {
  logger.error('Failed to load database functions:', error);
  logger.info('🔄 Server will continue with fallback data only');
}

// API Routes
// --- Admin auth middleware ---
function adminAuth(req: any, res: any, next: any) {
  const key = req.header('x-admin-key') || req.query.admin_key;
  if (!process.env.ADMIN_PASSWORD) return res.status(500).json({ error: 'ADMIN_PASSWORD not set' });
  if (key !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  return next();
}

// Cloudflare R2 presign upload URL
app.post('/api/admin/r2/presign', adminAuth, async (req, res) => {
  try {
    const { key, contentType } = req.body || {};
    if (!key) return res.status(400).json({ error: 'key required' });
    const r2 = new S3Client({
      region: process.env.R2_REGION || 'auto',
      endpoint: process.env.R2_ENDPOINT, // e.g. https://<accountid>.r2.cloudflarestorage.com
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
    });
    const bucket = process.env.R2_BUCKET as string;
    if (!bucket) return res.status(500).json({ error: 'R2_BUCKET not set' });
    const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType || 'application/octet-stream' });
    const url = await getSignedUrl(r2, cmd, { expiresIn: 60 * 5 });
    const pubBase = process.env.R2_PUBLIC_BASE_URL;
    const publicUrl = pubBase ? `${pubBase.replace(/\/$/, '')}/${key}` : null;
    res.json({ url, key, publicUrl });
  } catch (error) {
    logger.error('R2 presign error:', error);
    res.status(500).json(createSafeErrorResponse('Presign failed', error));
  }
});

// Direct upload proxy (avoids browser→R2 CORS). Body: { key, contentType, base64 }
app.post('/api/admin/r2/upload', adminAuth, async (req, res) => {
  try {
    const { key, contentType, base64 } = req.body || {};
    if (!key || !base64) return res.status(400).json({ error: 'key and base64 required' });
    const r2 = new S3Client({
      region: process.env.R2_REGION || 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
    });
    const bucket = process.env.R2_BUCKET as string;
    if (!bucket) return res.status(500).json({ error: 'R2_BUCKET not set' });
    const buf = Buffer.from(base64, 'base64');
    await r2.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buf, ContentType: contentType || 'application/octet-stream' }));
    const pubBase = process.env.R2_PUBLIC_BASE_URL;
    const publicUrl = pubBase ? `${pubBase.replace(/\/$/, '')}/${key}` : null;
    res.json({ ok: true, key, publicUrl });
  } catch (error) {
    logger.error('R2 upload error:', error);
    res.status(500).json(createSafeErrorResponse('Upload failed', error));
  }
});
// --- Simple Admin Endpoints (minimal, whitelisted) ---
const ADMIN_TABLES: Record<string, { editable: string[]; orderBy?: string }> = {
  work_experience: {
    editable: ['identifier','ai_description','company_name','position_title','employment_type','location','start_date','end_date','is_current','description','achievements','company_logo_url','company_website','display_order','is_active'],
    orderBy: 'display_order DESC NULLS LAST, start_date DESC NULLS LAST, id DESC'
  },
  projects: {
    editable: ['identifier','ai_description','title','slug','short_description','full_description','project_type','status','github_url','live_demo_url','featured_image_url','tech_stack','start_date','end_date','is_featured','display_order','is_active'],
    orderBy: 'display_order DESC NULLS LAST, start_date DESC NULLS LAST, id DESC'
  },
  tools: {
    editable: ['identifier','ai_description','name','category','description','icon_url','website_url','proficiency_level','years_experience','is_featured','display_order','is_active'],
    orderBy: 'display_order DESC NULLS LAST, name ASC, id DESC'
  },
  skills: {
    editable: ['identifier','ai_description','name','category','description','proficiency_percentage','skill_type','is_featured','display_order','is_active'],
    orderBy: 'display_order DESC NULLS LAST, proficiency_percentage DESC, id DESC'
  },
  gallery: {
    editable: ['identifier','ai_description','title','description','image_url','alt_text','category','metadata','project_id','is_featured','display_order','is_active'],
    orderBy: 'display_order DESC NULLS LAST, created_at DESC NULLS LAST, id DESC'
  }
};

function isValidTable(name: string): name is keyof typeof ADMIN_TABLES {
  return Object.prototype.hasOwnProperty.call(ADMIN_TABLES, name);
}

app.get('/api/admin/:table', adminAuth, async (req, res) => {
  try {
    const { table } = req.params as { table: string };
    if (!isValidTable(table)) return res.status(400).json({ error: 'Invalid table' });
    if (!pool) return res.status(500).json({ error: 'DB unavailable' });
    const orderBy = ADMIN_TABLES[table].orderBy || 'id DESC';
    const client = await pool.connect();
    const { rows } = await client.query(`SELECT * FROM ${table} ORDER BY ${orderBy} LIMIT 200`);
    client.release();
    res.json(rows);
  } catch (error) {
    logger.error('Admin GET error:', error);
    res.status(500).json(createSafeErrorResponse('Admin fetch failed', error));
  }
});

app.post('/api/admin/:table', adminAuth, async (req, res) => {
  try {
    const { table } = req.params as { table: string };
    if (!isValidTable(table)) return res.status(400).json({ error: 'Invalid table' });
    if (!pool) return res.status(500).json({ error: 'DB unavailable' });
    const body = req.body || {};
    const allowed = ADMIN_TABLES[table].editable;
    const keys = Object.keys(body).filter(k => allowed.includes(k));
    if (keys.length === 0) return res.status(400).json({ error: 'No valid fields' });
    const cols = keys.join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const values = keys.map(k => body[k]);
    // Upsert by identifier if present, otherwise insert
    const conflictTarget = keys.includes('identifier') ? 'identifier' : 'id';
    const updateSet = keys.map((k, i) => `${k} = EXCLUDED.${k}`).join(', ');
    const client = await pool.connect();
    const sql = `INSERT INTO ${table} (${cols}) VALUES (${placeholders}) ON CONFLICT (${conflictTarget}) DO UPDATE SET ${updateSet} RETURNING *`;
    const { rows } = await client.query(sql, values);
    client.release();
    res.json(rows[0]);
  } catch (error) {
    logger.error('Admin POST error:', error);
    res.status(500).json(createSafeErrorResponse('Admin save failed', error));
  }
});

app.put('/api/admin/:table/:id', adminAuth, async (req, res) => {
  try {
    const { table, id } = req.params as { table: string; id: string };
    if (!isValidTable(table)) return res.status(400).json({ error: 'Invalid table' });
    if (!pool) return res.status(500).json({ error: 'DB unavailable' });
    const body = req.body || {};
    const allowed = ADMIN_TABLES[table].editable;
    const keys = Object.keys(body).filter(k => allowed.includes(k));
    if (keys.length === 0) return res.status(400).json({ error: 'No valid fields' });
    const setSql = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const values = keys.map(k => body[k]);
    values.push(Number(id));
    const client = await pool.connect();
    const { rows } = await client.query(`UPDATE ${table} SET ${setSql} WHERE id = $${keys.length + 1} RETURNING *`, values);
    client.release();
    res.json(rows[0]);
  } catch (error) {
    logger.error('Admin PUT error:', error);
    res.status(500).json(createSafeErrorResponse('Admin update failed', error));
  }
});

app.delete('/api/admin/:table/:id', adminAuth, async (req, res) => {
  try {
    const { table, id } = req.params as { table: string; id: string };
    if (!isValidTable(table)) return res.status(400).json({ error: 'Invalid table' });
    if (!pool) return res.status(500).json({ error: 'DB unavailable' });
    const client = await pool.connect();
    await client.query(`DELETE FROM ${table} WHERE id = $1`, [Number(id)]);
    client.release();
    res.json({ ok: true });
  } catch (error) {
    logger.error('Admin DELETE error:', error);
    res.status(500).json(createSafeErrorResponse('Admin delete failed', error));
  }
});
app.get('/api/portfolio/:identifier', async (req, res) => {
  logger.debug('API Request: /api/portfolio/' + req.params.identifier);
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
        logger.error('Database Error:', dbError);
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
    logger.error('API Error:', error);
    res.status(500).json(createSafeErrorResponse('Internal server error', error));
  }
});

app.get('/api/identifiers', async (req, res) => {
  logger.debug('API Request: /api/identifiers');
  try {
    let identifiers;
    
    if (dbFunctionsAvailable) {
      try {
        identifiers = await getAllIdentifiersFromDatabase();
      } catch (dbError) {
        logger.error('Database Error:', dbError);
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
    logger.error('API Error:', error);
    res.status(500).json(createSafeErrorResponse('Internal server error', error));
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  logger.debug('API Request: /api/health');
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
  logger.debug('API Request: /api/test');
  res.json({ 
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    server: 'Express + TypeScript'
  });
});

// Handle 404 for API routes specifically
app.use('/api/*', (req, res) => {
  logger.warn('API 404:', req.path);
  res.status(404).json({ error: 'API endpoint not found' });
});

// Serve React app for all non-API routes (production only)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    logger.debug('Serving React app for:', req.path);
    const indexPath = join(__dirname, '../dist/index.html');
    res.sendFile(indexPath);
  });
}

// Start server - IMPORTANT: bind to 0.0.0.0 for Docker containers
app.listen(port, '0.0.0.0', () => {
  logger.success(`API Server running on http://0.0.0.0:${port}`);
  logger.info(`Health check: http://0.0.0.0:${port}/api/health`);
  logger.info(`Static files: ${process.env.NODE_ENV === 'production' ? 'enabled' : 'disabled'}`);
});

// Global error handlers to prevent crashes
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  logger.info('🔄 Server continuing to run...');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', { reason, promise });
  logger.info('🔄 Server continuing to run...');
});

logger.success('Server startup complete!');
logger.info('API endpoints available:');
logger.info(`   • Health: http://0.0.0.0:${port}/api/health`);
logger.info(`   • Test: http://0.0.0.0:${port}/api/test`);
logger.info(`   • Identifiers: http://0.0.0.0:${port}/api/identifiers`); 