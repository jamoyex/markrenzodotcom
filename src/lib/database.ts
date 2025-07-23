import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
if (typeof window === 'undefined') {
  dotenv.config();
}

// Only create database connection server-side
let pool: Pool | null = null;

if (typeof window === 'undefined') {
  // Database connection configuration - ONLY from environment variables
  const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };

  // Validate required environment variables
  if (!dbConfig.host || !dbConfig.port || !dbConfig.database || !dbConfig.user || !dbConfig.password) {
    console.error('Missing required database environment variables. Please check your .env file.');
    console.error('Required: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD');
  } else {
    // Create connection pool only if all env vars are present
    pool = new Pool(dbConfig);
  }
}

// Export pool (will be null in browser)
export { pool };

// Test database connection
export async function testConnection(): Promise<boolean> {
  if (!pool) {
    console.error('Database pool not available - running in browser context');
    return false;
  }
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Database connected successfully!');
    console.log('📅 Server time:', result.rows[0].current_time);
    console.log('🗄️ PostgreSQL version:', result.rows[0].pg_version.split(' ')[0]);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Portfolio data fetching functions
export async function fetchWorkExperience(identifier?: string) {
  if (!pool) throw new Error('Database not available');
  try {
    const client = await pool.connect();
    let query = 'SELECT * FROM work_experience WHERE is_active = true';
    const params: any[] = [];
    
    if (identifier) {
      query += ' AND identifier = $1';
      params.push(identifier);
    }
    
    query += ' ORDER BY display_order ASC, start_date DESC';
    
    const result = await client.query(query, params);
    client.release();
    
    return identifier ? result.rows[0] : result.rows;
  } catch (error) {
    console.error('Error fetching work experience:', error);
    throw error;
  }
}

export async function fetchProjects(identifier?: string) {
  if (!pool) throw new Error('Database not available');
  try {
    const client = await pool.connect();
    let query = 'SELECT * FROM projects WHERE is_active = true';
    const params: any[] = [];
    
    if (identifier) {
      query += ' AND identifier = $1';
      params.push(identifier);
    }
    
    query += ' ORDER BY display_order ASC, start_date DESC';
    
    const result = await client.query(query, params);
    client.release();
    
    return identifier ? result.rows[0] : result.rows;
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
}

export async function fetchTools(identifier?: string) {
  if (!pool) throw new Error('Database not available');
  try {
    const client = await pool.connect();
    let query = 'SELECT * FROM tools WHERE is_active = true';
    const params: any[] = [];
    
    if (identifier) {
      query += ' AND identifier = $1';
      params.push(identifier);
    }
    
    query += ' ORDER BY display_order ASC, name ASC';
    
    const result = await client.query(query, params);
    client.release();
    
    return identifier ? result.rows[0] : result.rows;
  } catch (error) {
    console.error('Error fetching tools:', error);
    throw error;
  }
}

export async function fetchSkills(identifier?: string) {
  if (!pool) throw new Error('Database not available');
  try {
    const client = await pool.connect();
    let query = 'SELECT * FROM skills WHERE is_active = true';
    const params: any[] = [];
    
    if (identifier) {
      query += ' AND identifier = $1';
      params.push(identifier);
    }
    
    query += ' ORDER BY display_order ASC, proficiency_percentage DESC';
    
    const result = await client.query(query, params);
    client.release();
    
    return identifier ? result.rows[0] : result.rows;
  } catch (error) {
    console.error('Error fetching skills:', error);
    throw error;
  }
}

export async function fetchGallery(identifier?: string) {
  if (!pool) throw new Error('Database not available');
  try {
    const client = await pool.connect();
    let query = 'SELECT * FROM gallery WHERE is_active = true';
    const params: any[] = [];
    
    if (identifier) {
      query += ' AND identifier = $1';
      params.push(identifier);
    }
    
    query += ' ORDER BY display_order ASC, created_at DESC';
    
    const result = await client.query(query, params);
    client.release();
    
    return identifier ? result.rows[0] : result.rows;
  } catch (error) {
    console.error('Error fetching gallery:', error);
    throw error;
  }
}

// Function to get all available identifiers (for AI context)
export async function getAllIdentifiers() {
  if (!pool) throw new Error('Database not available');
  try {
    const client = await pool.connect();
    
    const queries = [
      'SELECT identifier, ai_description FROM work_experience WHERE is_active = true',
      'SELECT identifier, ai_description FROM projects WHERE is_active = true',
      'SELECT identifier, ai_description FROM tools WHERE is_active = true',
      'SELECT identifier, ai_description FROM skills WHERE is_active = true',
      'SELECT identifier, ai_description FROM gallery WHERE is_active = true'
    ];
    
    const results = await Promise.all(
      queries.map(query => client.query(query))
    );
    
    client.release();
    
    const identifiers = {
      work_experience: results[0].rows,
      projects: results[1].rows,
      tools: results[2].rows,
      skills: results[3].rows,
      gallery: results[4].rows
    };
    
    return identifiers;
  } catch (error) {
    console.error('Error fetching identifiers:', error);
    throw error;
  }
}

// Graceful shutdown (only in server environment)
if (typeof window === 'undefined' && pool) {
  process.on('SIGINT', () => {
    console.log('🔄 Shutting down gracefully...');
    pool!.end(() => {
      console.log('✅ Database pool closed');
      process.exit(0);
    });
  });
} 