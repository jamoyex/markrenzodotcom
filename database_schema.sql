-- Portfolio Database Schema with Dynamic Card Identifiers
-- Each table includes 'identifier' for bot responses and 'ai_description' for context

-- Work Experience Table
CREATE TABLE work_experience (
    id SERIAL PRIMARY KEY,
    identifier VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'work_google', 'work_freelance'
    ai_description TEXT NOT NULL, -- Description for AI to understand when to use this
    company_name VARCHAR(255) NOT NULL,
    position_title VARCHAR(255) NOT NULL,
    employment_type VARCHAR(20) DEFAULT 'full-time' CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'internship', 'freelance')),
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

-- Projects Table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    identifier VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'project_chatbot', 'project_ecommerce'
    ai_description TEXT NOT NULL, -- Description for AI to understand when to use this
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    short_description TEXT,
    full_description TEXT,
    project_type VARCHAR(20) DEFAULT 'web-app' CHECK (project_type IN ('web-app', 'mobile-app', 'api', 'ai-project', 'tool', 'other')),
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'in-progress', 'planning', 'archived')),
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

-- Tools Table
CREATE TABLE tools (
    id SERIAL PRIMARY KEY,
    identifier VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'tool_react', 'tool_docker'
    ai_description TEXT NOT NULL, -- Description for AI to understand when to use this
    name VARCHAR(255) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('frontend', 'backend', 'database', 'cloud', 'design', 'ai-ml', 'devops', 'other')),
    description TEXT,
    icon_url VARCHAR(500),
    website_url VARCHAR(500),
    proficiency_level VARCHAR(20) DEFAULT 'intermediate' CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    years_experience INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Skills Table
CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    identifier VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'skill_javascript', 'skill_leadership'
    ai_description TEXT NOT NULL, -- Description for AI to understand when to use this
    name VARCHAR(255) NOT NULL,
    category VARCHAR(20) DEFAULT 'technical' CHECK (category IN ('technical', 'soft', 'language', 'certification')),
    description TEXT,
    proficiency_percentage INTEGER DEFAULT 0 CHECK (proficiency_percentage >= 0 AND proficiency_percentage <= 100),
    skill_type VARCHAR(20) DEFAULT 'programming' CHECK (skill_type IN ('programming', 'framework', 'soft-skill', 'language', 'certification', 'other')),
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gallery Table
CREATE TABLE gallery (
    id SERIAL PRIMARY KEY,
    identifier VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'gallery_homepage', 'gallery_mobile'
    ai_description TEXT NOT NULL, -- Description for AI to understand when to use this
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    category VARCHAR(20) DEFAULT 'screenshot' CHECK (category IN ('screenshot', 'design', 'photo', 'certificate', 'other')),
    metadata JSONB,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Relationship Tables
CREATE TABLE project_tools (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    tool_id INTEGER NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (project_id, tool_id)
);

CREATE TABLE project_skills (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (project_id, skill_id)
);

-- Indexes for performance
CREATE INDEX idx_work_experience_identifier ON work_experience(identifier);
CREATE INDEX idx_projects_identifier ON projects(identifier);
CREATE INDEX idx_tools_identifier ON tools(identifier);
CREATE INDEX idx_skills_identifier ON skills(identifier);
CREATE INDEX idx_gallery_identifier ON gallery(identifier);

CREATE INDEX idx_work_experience_active ON work_experience(is_active);
CREATE INDEX idx_projects_active ON projects(is_active);
CREATE INDEX idx_tools_active ON tools(is_active);
CREATE INDEX idx_skills_active ON skills(is_active);
CREATE INDEX idx_gallery_active ON gallery(is_active);

-- Sample Data
INSERT INTO work_experience (identifier, ai_description, company_name, position_title, employment_type, location, start_date, is_current, description, achievements) VALUES
('work_current', 'My current job or most recent work experience', 'Tech Company', 'Senior Full-Stack Developer', 'full-time', 'Remote', '2023-01-01', true, 'Leading development of AI-powered applications', 'Built chatbot platform serving 10k+ users'),
('work_freelance', 'My freelance work and consulting experience', 'Freelance', 'AI & Web Development Consultant', 'freelance', 'Remote', '2022-01-01', false, 'Helping businesses integrate AI solutions', 'Delivered 15+ AI projects for various clients');

INSERT INTO projects (identifier, ai_description, title, slug, short_description, project_type, status, tech_stack, is_featured) VALUES
('project_chatbot', 'My AI chatbot SaaS platform project', 'AI Chatbot SaaS', 'ai-chatbot-saas', 'Multi-tenant AI chatbot platform for businesses', 'ai-project', 'completed', '["React", "Node.js", "OpenAI", "PostgreSQL"]', true),
('project_portfolio', 'This portfolio website project', 'Portfolio Website', 'portfolio-website', 'Modern portfolio with AI integration', 'web-app', 'in-progress', '["React", "TypeScript", "Tailwind"]', true);

INSERT INTO tools (identifier, ai_description, name, category, proficiency_level, years_experience, is_featured) VALUES
('tool_react', 'React.js framework for frontend development', 'React.js', 'frontend', 'expert', 4, true),
('tool_nodejs', 'Node.js runtime for backend development', 'Node.js', 'backend', 'advanced', 3, true),
('tool_postgres', 'PostgreSQL database for data storage', 'PostgreSQL', 'database', 'advanced', 2, true);

INSERT INTO skills (identifier, ai_description, name, category, proficiency_percentage, skill_type, is_featured) VALUES
('skill_fullstack', 'Full-stack web development capabilities', 'Full-Stack Development', 'technical', 90, 'programming', true),
('skill_ai', 'AI and machine learning development', 'AI Development', 'technical', 85, 'programming', true),
('skill_leadership', 'Team leadership and project management', 'Leadership', 'soft', 80, 'soft-skill', false);

INSERT INTO gallery (identifier, ai_description, title, description, image_url, category, is_featured) VALUES
('gallery_chatbot_demo', 'Screenshot of my AI chatbot platform in action', 'Chatbot Platform Demo', 'AI chatbot interface with real-time responses', '/images/chatbot-demo.png', 'screenshot', true),
('gallery_portfolio_mobile', 'Mobile view of my portfolio website', 'Portfolio Mobile View', 'Responsive design on mobile devices', '/images/portfolio-mobile.png', 'design', false); 