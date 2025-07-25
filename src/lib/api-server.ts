import { fetchWorkExperience, fetchProjects, fetchTools, fetchSkills, fetchGallery } from './database.ts';

// Server-side API functions that query PostgreSQL directly
export async function getPortfolioItemFromDatabase(identifier: string) {
  try {
    let result = null;
    let type = '';

    if (identifier.startsWith('work_')) {
      result = await fetchWorkExperience(identifier);
      type = 'work_experience';
    } else if (identifier.startsWith('project_')) {
      result = await fetchProjects(identifier);
      type = 'project';
    } else if (identifier.startsWith('tool_')) {
      result = await fetchTools(identifier);
      type = 'tool';
    } else if (identifier.startsWith('skill_')) {
      result = await fetchSkills(identifier);
      type = 'skill';
    } else if (identifier.startsWith('gallery_')) {
      result = await fetchGallery(identifier);
      type = 'gallery';
    } else if (identifier === 'aboutmecard') {
      return { 
        type: 'about', 
        data: {
          name: "Mark Renzo Mariveles",
          role: "Full-Stack Developer & AI Specialist",
          bio: "Passionate about creating innovative digital solutions and helping businesses leverage AI technology."
        }
      };
    }

    if (!result) {
      return null;
    }

    return { type, data: result };
  } catch (error) {
    console.error('Error fetching from database:', error);
    throw error;
  }
}

// Get all available identifiers from database
export async function getAllIdentifiersFromDatabase() {
  try {
    const { getAllIdentifiers } = await import('./database.ts');
    return await getAllIdentifiers();
  } catch (error) {
    console.error('Error fetching identifiers from database:', error);
    throw error;
  }
} 