import pkg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pkg;

// Load environment variables
dotenv.config();

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: false
});

async function createTables() {
  console.log('🚀 Creating database tables...\n');
  
  try {
    const client = await pool.connect();
    
    // Test connection
    const testResult = await client.query('SELECT NOW() as current_time');
    console.log('✅ Database connected at:', testResult.rows[0].current_time);
    
    // Create work_experience table
    console.log('\n📋 Creating work_experience table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS work_experience (
        id SERIAL PRIMARY KEY,
        identifier VARCHAR(50) UNIQUE NOT NULL,
        ai_description TEXT NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        position_title VARCHAR(255) NOT NULL,
        employment_type VARCHAR(20) DEFAULT 'full-time',
        location VARCHAR(255),
        start_date DATE NOT NULL,
        end_date DATE NULL,
        is_current BOOLEAN DEFAULT FALSE,
        description TEXT,
        achievements TEXT,
        company_logo_url VARCHAR(500),
        company_website VARCHAR(500),
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ work_experience table created');

    // Create projects table
    console.log('\n📋 Creating projects table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        identifier VARCHAR(50) UNIQUE NOT NULL,
        ai_description TEXT NOT NULL,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        short_description TEXT,
        full_description TEXT,
        project_type VARCHAR(20) DEFAULT 'web-app',
        status VARCHAR(20) DEFAULT 'completed',
        github_url VARCHAR(500),
        live_demo_url VARCHAR(500),
        featured_image_url VARCHAR(500),
        tech_stack JSONB,
        start_date DATE,
        end_date DATE,
        is_featured BOOLEAN DEFAULT FALSE,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ projects table created');

    // Create tools table
    console.log('\n📋 Creating tools table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS tools (
        id SERIAL PRIMARY KEY,
        identifier VARCHAR(50) UNIQUE NOT NULL,
        ai_description TEXT NOT NULL,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(20) NOT NULL,
        description TEXT,
        icon_url VARCHAR(500),
        website_url VARCHAR(500),
        proficiency_level VARCHAR(20) DEFAULT 'intermediate',
        years_experience INTEGER DEFAULT 0,
        is_featured BOOLEAN DEFAULT FALSE,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ tools table created');

    // Create skills table
    console.log('\n📋 Creating skills table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS skills (
        id SERIAL PRIMARY KEY,
        identifier VARCHAR(50) UNIQUE NOT NULL,
        ai_description TEXT NOT NULL,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(20) DEFAULT 'technical',
        description TEXT,
        proficiency_percentage INTEGER DEFAULT 0 CHECK (proficiency_percentage >= 0 AND proficiency_percentage <= 100),
        skill_type VARCHAR(20) DEFAULT 'programming',
        is_featured BOOLEAN DEFAULT FALSE,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ skills table created');

    // Create gallery table
    console.log('\n📋 Creating gallery table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS gallery (
        id SERIAL PRIMARY KEY,
        identifier VARCHAR(50) UNIQUE NOT NULL,
        ai_description TEXT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        image_url VARCHAR(500) NOT NULL,
        alt_text VARCHAR(255),
        category VARCHAR(20) DEFAULT 'screenshot',
        metadata JSONB,
        project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
        is_featured BOOLEAN DEFAULT FALSE,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ gallery table created');

    // Create relationship tables
    console.log('\n📋 Creating relationship tables...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_tools (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        tool_id INTEGER NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (project_id, tool_id)
      );
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_skills (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (project_id, skill_id)
      );
    `);
    console.log('✅ relationship tables created');

    // Create indexes
    console.log('\n📋 Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_work_experience_identifier ON work_experience(identifier)',
      'CREATE INDEX IF NOT EXISTS idx_projects_identifier ON projects(identifier)',
      'CREATE INDEX IF NOT EXISTS idx_tools_identifier ON tools(identifier)',
      'CREATE INDEX IF NOT EXISTS idx_skills_identifier ON skills(identifier)',
      'CREATE INDEX IF NOT EXISTS idx_gallery_identifier ON gallery(identifier)',
      'CREATE INDEX IF NOT EXISTS idx_work_experience_active ON work_experience(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_projects_active ON projects(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_tools_active ON tools(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_skills_active ON skills(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_gallery_active ON gallery(is_active)'
    ];

    for (const index of indexes) {
      await client.query(index);
    }
    console.log('✅ indexes created');

    client.release();
    
    console.log('\n🎉 All tables created successfully!');
    console.log('\n📊 Next: Run the insert sample data script');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
  } finally {
    await pool.end();
  }
}

createTables(); 