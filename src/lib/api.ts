// Client-side API functions
// Note: In production, these would call your backend API endpoints
// For now, we'll fetch directly since this is a personal portfolio



// For now, use a hybrid approach - try database if available, fallback to hardcoded data
export async function getPortfolioItem(identifier: string) {
  try {
    // Try to fetch from database (server-side only)
    if (typeof window === 'undefined') {
      // Server-side: use database
      const { fetchWorkExperience, fetchProjects, fetchTools, fetchSkills, fetchGallery } = await import('./database.js');
      
      if (identifier.startsWith('work_')) {
        const data = await fetchWorkExperience(identifier);
        return data ? { type: 'work_experience', data } : null;
      } else if (identifier.startsWith('project_')) {
        const data = await fetchProjects(identifier);
        return data ? { type: 'project', data } : null;
      } else if (identifier.startsWith('tool_')) {
        const data = await fetchTools(identifier);
        return data ? { type: 'tool', data } : null;
      } else if (identifier.startsWith('skill_')) {
        const data = await fetchSkills(identifier);
        return data ? { type: 'skill', data } : null;
      } else if (identifier.startsWith('gallery_')) {
        const data = await fetchGallery(identifier);
        return data ? { type: 'gallery', data } : null;
      }
    } else {
      // Client-side: use hardcoded data (for now)
      // In production, you'd make HTTP requests to your API endpoints
      const hardcodedData = await getHardcodedData(identifier);
      return hardcodedData;
    }
    
    // Handle aboutmecard
    if (identifier === 'aboutmecard') {
      return { 
        type: 'about', 
        data: {
          name: "Mark Renzo Mariveles",
          role: "Full-Stack Developer & AI Specialist",
          bio: "Passionate about creating innovative digital solutions and helping businesses leverage AI technology."
        }
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching portfolio item:', error);
    // Fallback to hardcoded data
    return getHardcodedData(identifier);
  }
}

// Hardcoded data for client-side use (mirrors database content)
async function getHardcodedData(identifier: string) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const data: Record<string, any> = {
    // Work Experience
    work_current: {
      type: 'work_experience',
      data: {
        id: 1,
        identifier: 'work_current',
        company_name: 'Tech Innovations Inc.',
        position_title: 'Senior Full-Stack Developer',
        employment_type: 'full-time',
        location: 'San Francisco, CA (Remote)',
        start_date: '2023-01-15',
        end_date: null,
        is_current: true,
        description: 'Leading development of AI-powered applications and managing a team of 5 developers. Responsible for architecture decisions and implementation of scalable solutions.',
        achievements: 'Built an AI chatbot platform that serves over 10,000 users daily',
        company_logo_url: null,
        company_website: 'https://techinnovations.com'
      }
    },
    work_freelance: {
      type: 'work_experience',
      data: {
        id: 2,
        identifier: 'work_freelance',
        company_name: 'Freelance Consulting',
        position_title: 'AI & Web Development Consultant',
        employment_type: 'freelance',
        location: 'Remote',
        start_date: '2022-01-01',
        end_date: '2022-12-31',
        is_current: false,
        description: 'Helping businesses integrate AI solutions and build modern web applications. Specializing in React, Node.js, and OpenAI implementations.',
        achievements: 'Successfully delivered 15+ AI projects for various clients',
        company_logo_url: null,
        company_website: null
      }
    },
    // Projects
    project_chatbot: {
      type: 'project',
      data: {
        id: 1,
        identifier: 'project_chatbot',
        title: 'AI Chatbot SaaS Platform',
        short_description: 'Multi-tenant AI chatbot platform for businesses to integrate intelligent conversation capabilities',
        project_type: 'ai-project',
        status: 'completed',
        github_url: 'https://github.com/markrenzo/ai-chatbot-saas',
        live_demo_url: 'https://demo.chatbot-platform.com',
        featured_image_url: null,
        tech_stack: ['React', 'TypeScript', 'Node.js', 'OpenAI', 'PostgreSQL', 'Docker']
      }
    },
    project_portfolio: {
      type: 'project',
      data: {
        id: 2,
        identifier: 'project_portfolio',
        title: 'Interactive Portfolio Website',
        short_description: 'Modern portfolio website with AI integration and dynamic content management',
        project_type: 'web-app',
        status: 'in-progress',
        github_url: 'https://github.com/markrenzo/portfolio',
        live_demo_url: 'https://markrenzo.com',
        featured_image_url: null,
        tech_stack: ['React', 'TypeScript', 'Tailwind CSS', 'Vite', 'Framer Motion']
      }
    },
    // Skills
    skill_fullstack: {
      type: 'skill',
      data: {
        id: 1,
        identifier: 'skill_fullstack',
        name: 'Full-Stack Development',
        category: 'technical',
        description: 'Complete web application development from frontend to backend, including database design, API development, and deployment.',
        proficiency_percentage: 90,
        skill_type: 'programming',
        is_featured: true
      }
    },
    skill_ai: {
      type: 'skill',
      data: {
        id: 2,
        identifier: 'skill_ai',
        name: 'AI Development',
        category: 'technical',
        description: 'Artificial intelligence and machine learning development, including chatbots, natural language processing, and AI integration.',
        proficiency_percentage: 85,
        skill_type: 'programming',
        is_featured: true
      }
    },
    skill_javascript: {
      type: 'skill',
      data: {
        id: 3,
        identifier: 'skill_javascript',
        name: 'JavaScript',
        category: 'technical',
        description: 'Advanced JavaScript programming including ES6+, async/await, promises, and modern JavaScript frameworks.',
        proficiency_percentage: 95,
        skill_type: 'programming',
        is_featured: true
      }
    },
    skill_leadership: {
      type: 'skill',
      data: {
        id: 4,
        identifier: 'skill_leadership',
        name: 'Leadership',
        category: 'soft',
        description: 'Team leadership, project management, and mentoring developers to deliver successful projects.',
        proficiency_percentage: 80,
        skill_type: 'soft-skill',
        is_featured: false
      }
    },
    // Tools
    tool_react: {
      type: 'tool',
      data: {
        id: 1,
        identifier: 'tool_react',
        name: 'React.js',
        category: 'frontend',
        description: 'Advanced React development including hooks, context, state management, and performance optimization.',
        icon_url: null,
        website_url: 'https://reactjs.org',
        proficiency_level: 'expert',
        years_experience: 4,
        is_featured: true
      }
    },
    tool_nodejs: {
      type: 'tool',
      data: {
        id: 2,
        identifier: 'tool_nodejs',
        name: 'Node.js',
        category: 'backend',
        description: 'Server-side JavaScript development, API creation, and backend service architecture.',
        icon_url: null,
        website_url: 'https://nodejs.org',
        proficiency_level: 'advanced',
        years_experience: 3,
        is_featured: true
      }
    },
    tool_postgres: {
      type: 'tool',
      data: {
        id: 3,
        identifier: 'tool_postgres',
        name: 'PostgreSQL',
        category: 'database',
        description: 'Relational database design, query optimization, and database administration.',
        icon_url: null,
        website_url: 'https://postgresql.org',
        proficiency_level: 'advanced',
        years_experience: 2,
        is_featured: true
      }
    },
    tool_typescript: {
      type: 'tool',
      data: {
        id: 4,
        identifier: 'tool_typescript',
        name: 'TypeScript',
        category: 'frontend',
        description: 'Type-safe JavaScript development with advanced TypeScript features and patterns.',
        icon_url: null,
        website_url: 'https://typescriptlang.org',
        proficiency_level: 'expert',
        years_experience: 3,
        is_featured: true
      }
    }
  };
  
  return data[identifier] || null;
}

// Get all available identifiers for AI context
export async function getAllAvailableIdentifiers() {
  return {
    work_experience: [
      { identifier: 'work_current', description: 'My current job or most recent work experience' },
      { identifier: 'work_freelance', description: 'My freelance work and consulting experience' }
    ],
    projects: [
      { identifier: 'project_chatbot', description: 'My AI chatbot SaaS platform project' },
      { identifier: 'project_portfolio', description: 'This portfolio website project' }
    ],
    tools: [
      { identifier: 'tool_react', description: 'React.js framework for frontend development' },
      { identifier: 'tool_nodejs', description: 'Node.js runtime for backend development' },
      { identifier: 'tool_postgres', description: 'PostgreSQL database for data storage' }
    ],
    skills: [
      { identifier: 'skill_fullstack', description: 'Full-stack web development capabilities' },
      { identifier: 'skill_ai', description: 'AI and machine learning development' },
      { identifier: 'skill_javascript', description: 'JavaScript programming language expertise' }
    ],
    gallery: [
      { identifier: 'gallery_chatbot_demo', description: 'Screenshot of my AI chatbot platform in action' },
      { identifier: 'gallery_portfolio_mobile', description: 'Mobile view of my portfolio website' }
    ]
  };
} 