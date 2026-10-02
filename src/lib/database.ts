import { Pool } from 'pg';
import dotenv from 'dotenv';
import { DatabaseConfigError, getDatabaseConfig } from '../../server/database-config.ts';

// Load environment variables
if (typeof window === 'undefined') {
  dotenv.config({ quiet: true });
}

// Only create database connection server-side
let pool: Pool | null = null;

if (typeof window === 'undefined') {
  try {
    pool = new Pool(getDatabaseConfig(process.env));
    // Idle-client errors may contain connection details; never log the raw error/client.
    pool.on('error', () => console.error('Database pool connection failed.'));
  } catch (error) {
    console.error(error instanceof DatabaseConfigError ? error.message : 'Database configuration failed.');
  }
}

// Export pool (will be null in browser)
export { pool };

// Test database connection
export async function testConnection(): Promise<boolean> {
  if (!pool) {
    console.error('Database pool not available. Check server-side database configuration.');
    return false;
  }
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connected successfully!');
    return true;
  } catch {
    console.error('Database connection failed. Check reachability, credentials and verified TLS configuration.');
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
  } catch {
    // Driver errors can include connection details; expose only a fixed message.
    throw new Error('Database query failed while fetching work experience.');
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
  } catch {
    // Driver errors can include connection details; expose only a fixed message.
    throw new Error('Database query failed while fetching projects.');
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
  } catch {
    // Driver errors can include connection details; expose only a fixed message.
    throw new Error('Database query failed while fetching tools.');
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
  } catch {
    // Driver errors can include connection details; expose only a fixed message.
    throw new Error('Database query failed while fetching skills.');
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
  } catch {
    // Driver errors can include connection details; expose only a fixed message.
    throw new Error('Database query failed while fetching gallery.');
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
  } catch {
    // Driver errors can include connection details; expose only a fixed message.
    throw new Error('Database query failed while fetching identifiers.');
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
