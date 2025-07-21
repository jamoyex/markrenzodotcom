import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
if (typeof window === 'undefined') {
  dotenv.config();
}

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || '194.31.53.67',
  port: parseInt(process.env.DB_PORT || '5438'),
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Rf7t2JV1AIhpCIGhvkasnB1c6tJWvfVI7BAcjKyq0vzUR2uEXcGITpjTY7tV6TuN',
  ssl: false, // Disable SSL since server doesn't support it
  max: 20, // Maximum number of connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Create connection pool
export const pool = new Pool(dbConfig);

// Test database connection
export async function testConnection(): Promise<boolean> {
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

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🔄 Shutting down gracefully...');
  pool.end(() => {
    console.log('✅ Database pool closed');
    process.exit(0);
  });
}); 