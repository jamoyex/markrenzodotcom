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

async function insertSampleData() {
  console.log('🚀 Inserting sample portfolio data...\n');
  
  try {
    const client = await pool.connect();
    
    // Insert work experience
    console.log('💼 Inserting work experience...');
    await client.query(`
      INSERT INTO work_experience (identifier, ai_description, company_name, position_title, employment_type, location, start_date, is_current, description, achievements) VALUES
      ('work_current', 'My current job or most recent work experience', 'Tech Innovations Inc.', 'Senior Full-Stack Developer', 'full-time', 'San Francisco, CA (Remote)', '2023-01-15', true, 'Leading development of AI-powered applications and managing a team of 5 developers. Responsible for architecture decisions and implementation of scalable solutions.', 'Built an AI chatbot platform that serves over 10,000 users daily'),
      ('work_freelance', 'My freelance work and consulting experience', 'Freelance Consulting', 'AI & Web Development Consultant', 'freelance', 'Remote', '2022-01-01', false, 'Helping businesses integrate AI solutions and build modern web applications. Specializing in React, Node.js, and OpenAI implementations.', 'Successfully delivered 15+ AI projects for various clients')
      ON CONFLICT (identifier) DO UPDATE SET
        company_name = EXCLUDED.company_name,
        position_title = EXCLUDED.position_title,
        description = EXCLUDED.description,
        achievements = EXCLUDED.achievements
    `);
    console.log('✅ Work experience inserted');

    // Insert projects
    console.log('\n🚀 Inserting projects...');
    await client.query(`
      INSERT INTO projects (identifier, ai_description, title, slug, short_description, project_type, status, github_url, live_demo_url, tech_stack, is_featured) VALUES
      ('project_chatbot', 'My AI chatbot SaaS platform project', 'AI Chatbot SaaS Platform', 'ai-chatbot-saas', 'Multi-tenant AI chatbot platform for businesses to integrate intelligent conversation capabilities', 'ai-project', 'completed', 'https://github.com/markrenzo/ai-chatbot-saas', 'https://demo.chatbot-platform.com', '["React", "TypeScript", "Node.js", "OpenAI", "PostgreSQL", "Docker"]', true),
      ('project_portfolio', 'This portfolio website project', 'Interactive Portfolio Website', 'portfolio-website', 'Modern portfolio website with AI integration and dynamic content management', 'web-app', 'in-progress', 'https://github.com/markrenzo/portfolio', 'https://markrenzo.com', '["React", "TypeScript", "Tailwind CSS", "Vite", "Framer Motion"]', true)
      ON CONFLICT (identifier) DO UPDATE SET
        title = EXCLUDED.title,
        short_description = EXCLUDED.short_description,
        tech_stack = EXCLUDED.tech_stack,
        status = EXCLUDED.status
    `);
    console.log('✅ Projects inserted');

    // Insert tools
    console.log('\n🛠️ Inserting tools...');
    await client.query(`
      INSERT INTO tools (identifier, ai_description, name, category, proficiency_level, years_experience, is_featured) VALUES
      ('tool_react', 'React.js framework for frontend development', 'React.js', 'frontend', 'expert', 4, true),
      ('tool_nodejs', 'Node.js runtime for backend development', 'Node.js', 'backend', 'advanced', 3, true),
      ('tool_postgres', 'PostgreSQL database for data storage', 'PostgreSQL', 'database', 'advanced', 2, true),
      ('tool_typescript', 'TypeScript for type-safe JavaScript development', 'TypeScript', 'frontend', 'expert', 3, true),
      ('tool_docker', 'Docker for containerization and deployment', 'Docker', 'devops', 'intermediate', 2, false),
      ('tool_aws', 'Amazon Web Services for cloud infrastructure', 'AWS', 'cloud', 'intermediate', 2, false)
      ON CONFLICT (identifier) DO UPDATE SET
        name = EXCLUDED.name,
        proficiency_level = EXCLUDED.proficiency_level,
        years_experience = EXCLUDED.years_experience
    `);
    console.log('✅ Tools inserted');

    // Insert skills
    console.log('\n🎯 Inserting skills...');
    await client.query(`
      INSERT INTO skills (identifier, ai_description, name, category, proficiency_percentage, skill_type, is_featured) VALUES
      ('skill_fullstack', 'Full-stack web development capabilities', 'Full-Stack Development', 'technical', 90, 'programming', true),
      ('skill_ai', 'AI and machine learning development', 'AI Development', 'technical', 85, 'programming', true),
      ('skill_leadership', 'Team leadership and project management', 'Leadership', 'soft', 80, 'soft-skill', false),
      ('skill_javascript', 'JavaScript programming language expertise', 'JavaScript', 'technical', 95, 'programming', true),
      ('skill_react', 'React.js framework expertise', 'React Development', 'technical', 90, 'framework', true),
      ('skill_communication', 'Written and verbal communication skills', 'Communication', 'soft', 85, 'soft-skill', false)
      ON CONFLICT (identifier) DO UPDATE SET
        name = EXCLUDED.name,
        proficiency_percentage = EXCLUDED.proficiency_percentage,
        is_featured = EXCLUDED.is_featured
    `);
    console.log('✅ Skills inserted');

    // Insert gallery items
    console.log('\n🖼️ Inserting gallery items...');
    await client.query(`
      INSERT INTO gallery (identifier, ai_description, title, description, image_url, category, is_featured) VALUES
      ('gallery_chatbot_demo', 'Screenshot of my AI chatbot platform in action', 'AI Chatbot Platform Demo', 'Interactive AI chatbot interface with real-time responses and conversation management', '/images/chatbot-demo.png', 'screenshot', true),
      ('gallery_portfolio_mobile', 'Mobile view of my portfolio website', 'Portfolio Mobile Design', 'Responsive portfolio design optimized for mobile devices', '/images/portfolio-mobile.png', 'design', false),
      ('gallery_dashboard_ui', 'Dashboard interface design for admin panel', 'Admin Dashboard UI', 'Clean and modern dashboard interface with data visualization', '/images/dashboard-ui.png', 'design', true)
      ON CONFLICT (identifier) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        is_featured = EXCLUDED.is_featured
    `);
    console.log('✅ Gallery items inserted');

    // Link projects with tools and skills
    console.log('\n🔗 Creating project relationships...');
    
    // Get project and tool IDs
    const projectResult = await client.query('SELECT id, identifier FROM projects');
    const toolResult = await client.query('SELECT id, identifier FROM tools');
    const skillResult = await client.query('SELECT id, identifier FROM skills');
    
    const projects = Object.fromEntries(projectResult.rows.map(row => [row.identifier, row.id]));
    const tools = Object.fromEntries(toolResult.rows.map(row => [row.identifier, row.id]));
    const skills = Object.fromEntries(skillResult.rows.map(row => [row.identifier, row.id]));
    
    // Link chatbot project with tools
    const chatbotProjectId = projects['project_chatbot'];
    const chatbotTools = ['tool_react', 'tool_nodejs', 'tool_postgres', 'tool_typescript'];
    
    for (const toolId of chatbotTools) {
      if (tools[toolId]) {
        await client.query(`
          INSERT INTO project_tools (project_id, tool_id) 
          VALUES ($1, $2) 
          ON CONFLICT (project_id, tool_id) DO NOTHING
        `, [chatbotProjectId, tools[toolId]]);
      }
    }
    
    // Link portfolio project with tools
    const portfolioProjectId = projects['project_portfolio'];
    const portfolioTools = ['tool_react', 'tool_typescript'];
    
    for (const toolId of portfolioTools) {
      if (tools[toolId]) {
        await client.query(`
          INSERT INTO project_tools (project_id, tool_id) 
          VALUES ($1, $2) 
          ON CONFLICT (project_id, tool_id) DO NOTHING
        `, [portfolioProjectId, tools[toolId]]);
      }
    }
    
    // Link projects with skills
    const chatbotSkills = ['skill_fullstack', 'skill_ai', 'skill_javascript'];
    for (const skillId of chatbotSkills) {
      if (skills[skillId]) {
        await client.query(`
          INSERT INTO project_skills (project_id, skill_id) 
          VALUES ($1, $2) 
          ON CONFLICT (project_id, skill_id) DO NOTHING
        `, [chatbotProjectId, skills[skillId]]);
      }
    }
    
    console.log('✅ Project relationships created');

    client.release();
    
    // Verify data
    console.log('\n📊 Data verification:');
    const verifyClient = await pool.connect();
    
    const counts = await Promise.all([
      verifyClient.query('SELECT COUNT(*) FROM work_experience'),
      verifyClient.query('SELECT COUNT(*) FROM projects'),
      verifyClient.query('SELECT COUNT(*) FROM tools'),
      verifyClient.query('SELECT COUNT(*) FROM skills'),
      verifyClient.query('SELECT COUNT(*) FROM gallery'),
      verifyClient.query('SELECT COUNT(*) FROM project_tools'),
      verifyClient.query('SELECT COUNT(*) FROM project_skills')
    ]);

    console.log(`   💼 Work Experience: ${counts[0].rows[0].count} records`);
    console.log(`   🚀 Projects: ${counts[1].rows[0].count} records`);
    console.log(`   🛠️  Tools: ${counts[2].rows[0].count} records`);
    console.log(`   🎯 Skills: ${counts[3].rows[0].count} records`);
    console.log(`   🖼️  Gallery: ${counts[4].rows[0].count} records`);
    console.log(`   🔗 Project-Tool links: ${counts[5].rows[0].count} records`);
    console.log(`   🔗 Project-Skill links: ${counts[6].rows[0].count} records`);
    
    verifyClient.release();
    
    console.log('\n🎉 Sample data inserted successfully!');
    console.log('\n💡 You can now test with bot responses like:');
    console.log('   • "Here is my current work: <work_current>"');
    console.log('   • "Check out my chatbot project: <project_chatbot>"');
    console.log('   • "I\'m an expert in: <tool_react>"');
    console.log('   • "My skills include: <skill_fullstack>"');
    
  } catch (error) {
    console.error('❌ Error inserting data:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

insertSampleData(); 