/**
 * Mark's published portfolio, retrieved 2026-10-11.
 * Source material: https://markrenzo.com/api/identifiers and linked public records.
 * Dates/current status are the source's claims, not independently audited employment.
 * Summaries and role descriptions are edited for clarity; achievements preserve source text.
 * Current focus and additional tools were confirmed directly by Mark on 2026-10-15.
 */

export interface WorkExperience {
  id: string;
  company: string;
  role: string;
  employmentType: string;
  location: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  period: string;
  summary: string;
  description: string;
  achievements: string[];
  companyUrl: string | null;
  logoUrl: string | null;
  sourceUrl: string;
}

export interface ProfileSkill {
  id: string;
  name: string;
  category: string;
  description: string;
  sourceUrl: string;
}

export interface ProfileTool {
  id: string;
  name: string;
  category: string;
  description: string;
  websiteUrl: string | null;
  sourceUrl: string;
}

export interface CapabilityGroup {
  id: string;
  title: string;
  description: string;
  skills: string[];
  tools: string[];
  sourceUrls: string[];
}

export interface EducationRecord {
  institution: string;
  qualification: string;
  startDate: string | null;
  endDate: string | null;
  sourceUrl: string;
}

export const profileSources = {
  retrievedAt: "2026-10-11",
  ownerUpdatedAt: "2026-10-15",
  website: "https://markrenzo.com/",
  indexUrl: "https://markrenzo.com/api/identifiers",
  recordBaseUrl: "https://markrenzo.com/api/portfolio/",
  provenance:
    "Self-published portfolio records, with current application-building focus and additional tools confirmed directly by Mark on 2026-10-15. Employment and achievement claims have not been independently audited.",
  educationStatus:
    "No education record was found in the public content index or inspected site content.",
} as const;

// Direct owner confirmation, rather than an inferred public portfolio record.
const ownerUpdateSource = "owner:2026-10-15";

// No institution, qualification or graduation date should be inferred from a creative-team role.
export const education: EducationRecord[] = [];

export const workExperience: WorkExperience[] = [
  {
    id: "work_botbuilders",
    company: "BotBuilders",
    role: "AI & Automation Specialist",
    employmentType: "full-time",
    location: "Phoenix, AZ / Remote",
    startDate: "2025-03-24",
    endDate: null,
    isCurrent: true,
    period: "Mar 2025 — Present",
    summary:
      "Builds AI chatbots, automation systems, proprietary SaaS tools and internal AI assets across ManyChat, PHP, Node.js and n8n.",
    description:
      "I design and deploy chatbots and automation systems using ManyChat, PHP, Node.js and n8n for SMEs and thousands of brands worldwide. I also build proprietary SaaS tools and internal AI assets.",
    achievements: [
      "Engineered a high-converting SMS bot that drove $500K in sales within two weeks, while spearheading the company’s proprietary chatbot stack serving over 5000 clients.",
    ],
    companyUrl: "https://botbuilders.com",
    logoUrl:
      "https://media.hellomarky.com/work_experience/1755954370302-botbuilders.png",
    sourceUrl: "https://markrenzo.com/api/portfolio/work_botbuilders",
  },
  {
    id: "work_sge",
    company: "Sustainable Growth Experts",
    role: "Accounts & Digital Marketing PM",
    employmentType: "contract",
    location: "Singapore / Remote",
    startDate: "2024-12-01",
    endDate: "2025-03-01",
    isCurrent: false,
    period: "Dec 2024 — Mar 2025",
    summary:
      "Managed client accounts across web, SEO and paid campaigns, introducing AI automation for outreach, ad creation and production workflows.",
    description:
      "I managed 8 retainer accounts across web, SEO and paid campaigns. I introduced AI automations for outreach, ad creation and production, reducing manual work and improving campaign performance.",
    achievements: [
      "Automated SEO outreach and ad creation, reducing manual work 70% and doubling reply rates, while cutting website build time from 10 days to just 3.",
    ],
    companyUrl: "https://sustainable-growth-experts.com/",
    logoUrl:
      "https://media.hellomarky.com/work_experience/1756111649066-sge.png",
    sourceUrl: "https://markrenzo.com/api/portfolio/work_sge",
  },
  {
    id: "work_afc",
    company: "Aussie Founders Club",
    role: "Social Media Content Creator",
    employmentType: "part-time",
    location: "Melbourne, AU",
    startDate: "2024-04-29",
    endDate: "2025-12-31",
    isCurrent: false,
    period: "Apr 2024 — Dec 2025",
    summary:
      "Created event-led social content and AI-assisted highlight workflows for founder meetups and community engagement.",
    description:
      "I created content around founder meetups and built AI workflows for event highlights. The work helped grow the community’s visibility and event attendance.",
    achievements: [
      "Grew community followers 200% in six months and boosted event attendance by 30% with real-time social storytelling.",
    ],
    companyUrl: "https://aussiefoundersclub.com",
    logoUrl:
      "https://media.hellomarky.com/work_experience/1755955207617-afc logo.png",
    sourceUrl: "https://markrenzo.com/api/portfolio/work_afc",
  },
  {
    id: "work_reactor",
    company: "Reactor School",
    role: "Digital Marketing Lead",
    employmentType: "full-time",
    location: "Singapore",
    startDate: "2023-08-01",
    endDate: "2024-04-01",
    isCurrent: false,
    period: "Aug 2023 — Apr 2024",
    summary:
      "Led branding, lead generation and digital content, connecting landing pages, email nurturing and event campaigns.",
    description:
      "I led branding, lead generation and digital content for B2B and B2C audiences. I connected landing pages, email nurturing and creative content to bring more people to events.",
    achievements: [
      "Achieved 2,000+ signups for the Future School Festival and drove traffic through rebranding and optimized marketing funnels.",
    ],
    companyUrl: "https://reactor.school",
    logoUrl:
      "https://media.hellomarky.com/work_experience/1756111954812-reactor.png",
    sourceUrl: "https://markrenzo.com/api/portfolio/work_reactor",
  },
  {
    id: "work_mellow",
    company: "Mellow Nutrition",
    role: "Strategic Marketing Consultant",
    employmentType: "contract",
    location: "Philippines",
    startDate: "2021-10-01",
    endDate: "2022-10-01",
    isCurrent: false,
    period: "Oct 2021 — Oct 2022",
    summary:
      "Developed e-commerce strategy, digital campaigns and brand positioning for a nutrition business.",
    description:
      "I developed e-commerce strategies and digital campaigns to grow visibility and sales. I worked on brand positioning and used market trends to guide that work.",
    achievements: [
      "Drove measurable e-commerce growth by implementing data-driven campaigns and optimizing digital channels for engagement and retention.",
    ],
    companyUrl: "https://mellownutrition.com/",
    logoUrl:
      "https://media.hellomarky.com/work_experience/1756112038434-mellow.png",
    sourceUrl: "https://markrenzo.com/api/portfolio/work_mellow",
  },
  {
    id: "work_ciderbears",
    company: "Ciderbears",
    role: "Head of Marketing",
    employmentType: "full-time",
    location: "Philippines",
    startDate: "2020-07-01",
    endDate: "2023-10-01",
    isCurrent: false,
    period: "Jul 2020 — Oct 2023",
    summary:
      "Led performance marketing, influencer campaigns and Shopify optimisation for a consumer brand.",
    description:
      "I built the brand through targeted campaigns, influencer collaborations and Shopify store optimization. I used campaign data to refine the marketing and support growth.",
    achievements: [
      "Sold 50,000+ bottles, generated 60,000+ leads, and drove strong revenue growth through Meta Ads, and high-impact influencer campaigns.",
    ],
    companyUrl: "https://ciderbears.com/",
    logoUrl:
      "https://media.hellomarky.com/work_experience/1756112007037-ciderbears.png",
    sourceUrl: "https://markrenzo.com/api/portfolio/work_ciderbears",
  },
  {
    id: "work_riway",
    company: "RIWAY International",
    role: "Business Development",
    employmentType: "full-time",
    location: "Philippines",
    startDate: "2019-01-01",
    endDate: "2021-01-01",
    isCurrent: false,
    period: "Jan 2019 — Jan 2021",
    summary:
      "Delivered training, coordinated large events and supported market expansion and stakeholder relationships.",
    description:
      "I delivered training to large audiences and coordinated major events. I also worked on market expansion and relationships with stakeholders.",
    achievements: [
      "Managed events with 10,000–25,000 attendees and delivered training sessions to 1,000+ people, boosting engagement and community growth.",
    ],
    companyUrl: "https://web.riway.com/",
    logoUrl:
      "https://media.hellomarky.com/work_experience/1756112089034-riway.png",
    sourceUrl: "https://markrenzo.com/api/portfolio/work_riway",
  },
  {
    id: "work_bpi",
    company: "Bank of the Philippine Islands (BPI)",
    role: "Mortgage Loans Associate",
    employmentType: "full-time",
    location: "Metro Davao, PH",
    startDate: "2018-07-01",
    endDate: "2019-01-01",
    isCurrent: false,
    period: "Jul 2018 — Jan 2019",
    summary:
      "Reviewed and processed mortgage applications across customer service, underwriting and operational workflows.",
    description:
      "I reviewed and processed mortgage applications, working across customer service, underwriting and operations. The job called for careful attention to compliance and turnaround times.",
    achievements: [
      "Improved loan processing turnaround times by streamlining workflows while maintaining compliance and client satisfaction.",
    ],
    companyUrl: "https://www.bpi.com.ph",
    logoUrl:
      "https://media.hellomarky.com/work_experience/1756112118183-bpi.png",
    sourceUrl: "https://markrenzo.com/api/portfolio/work_bpi",
  },
  {
    id: "work_samahan_lead",
    company: "SAMAHAN Creative Team",
    role: "Creative Team Lead",
    employmentType: "part-time",
    location: "Philippines",
    startDate: "2016-04-01",
    endDate: "2017-04-01",
    isCurrent: false,
    period: "Apr 2016 — Apr 2017",
    summary:
      "Led a creative team producing event coverage, video, graphics and live content for university branding.",
    description:
      "I led a creative team producing event coverage across video, graphics and live content. I coordinated the storytelling and creative direction behind the university’s branding.",
    achievements: [
      "Directed the creative team and executed high-impact projects, boosting audience engagement and strengthening event visibility.",
    ],
    companyUrl: "https://www.facebook.com/SAMAHANCreativeTeam",
    logoUrl:
      "https://media.hellomarky.com/work_experience/1756112150253-sct.png",
    sourceUrl: "https://markrenzo.com/api/portfolio/work_samahan_lead",
  },
  {
    id: "work_digital_dream",
    company: "Digital Dream Studios",
    role: "Creative Producer",
    employmentType: "freelance",
    location: "Philippines",
    startDate: "2014-06-01",
    endDate: "2018-03-01",
    isCurrent: false,
    period: "Jun 2014 — Mar 2018",
    summary:
      "Produced weddings, events and festival videos from creative direction through final delivery.",
    description:
      "I managed video productions for weddings, events and festivals, from planning and creative direction through delivery. I shaped each project around the client’s vision.",
    achievements: [
      "Delivered dozens of large-scale productions that enhanced client brands and built a strong portfolio in professional videography.",
    ],
    companyUrl: "https://www.facebook.com/DigitalDreamStudiosPH",
    logoUrl:
      "https://media.hellomarky.com/work_experience/1756112197318-digitaldream.png",
    sourceUrl: "https://markrenzo.com/api/portfolio/work_digital_dream",
  },
];

export const skills: ProfileSkill[] = [
  {
    id: "skill_ai_software",
    name: "AI-assisted software engineering",
    category: "technical",
    description: "Building applications and tools with AI coding agents.",
    sourceUrl: ownerUpdateSource,
  },
  {
    id: "skill_vibe_coding",
    name: "Vibe coding & prototyping",
    category: "technical",
    description: "Turning ideas into working application prototypes with AI.",
    sourceUrl: ownerUpdateSource,
  },
  {
    id: "skill_automation",
    name: "Workflow Automation",
    category: "technical",
    description: "Workflow Automation",
    sourceUrl: "https://markrenzo.com/api/portfolio/skill_automation",
  },
  {
    id: "skill_chatbots",
    name: "Chatbot Development",
    category: "technical",
    description: "Chatbot Development",
    sourceUrl: "https://markrenzo.com/api/portfolio/skill_chatbots",
  },
  {
    id: "skill_voice_ai",
    name: "Voice AI",
    category: "technical",
    description: "Developing Voice AI Agents through Vapi and Eleven Labs.",
    sourceUrl: "https://markrenzo.com/api/portfolio/skill_voice_ai",
  },
  {
    id: "skill_digital_marketing",
    name: "Digital Marketing",
    category: "technical",
    description: "Digital Marketing",
    sourceUrl: "https://markrenzo.com/api/portfolio/skill_digital_marketing",
  },
  {
    id: "skill_n8n",
    name: "n8n",
    category: "technical",
    description: "Building robust n8n automations & agent graphs",
    sourceUrl: "https://markrenzo.com/api/portfolio/skill_n8n",
  },
  {
    id: "skill_llm_ops",
    name: "LLM Ops",
    category: "technical",
    description: "RAG, vector search, prompt strategy, evals",
    sourceUrl: "https://markrenzo.com/api/portfolio/skill_llm_ops",
  },
  {
    id: "skill_public_speaking",
    name: "Public Speaking",
    category: "soft",
    description: "Training & talks for 1k+ audiences",
    sourceUrl: "https://markrenzo.com/api/portfolio/skill_public_speaking",
  },
  {
    id: "skill_leadership",
    name: "Leadership",
    category: "soft",
    description: "Team leadership & project management",
    sourceUrl: "https://markrenzo.com/api/portfolio/skill_leadership",
  },
  {
    id: "skill_video",
    name: "Videography",
    category: "technical",
    description: "Creative production & editing for events",
    sourceUrl: "https://markrenzo.com/api/portfolio/skill_video",
  },
];

export const tools: ProfileTool[] = [
  {
    id: "tool_claude_code",
    name: "Claude Code",
    category: "development",
    description:
      "Part of Mark’s AI-assisted coding and application-building workflow.",
    websiteUrl: null,
    sourceUrl: ownerUpdateSource,
  },
  {
    id: "tool_codex",
    name: "Codex",
    category: "development",
    description:
      "Part of Mark’s AI-assisted coding and application-building workflow.",
    websiteUrl: null,
    sourceUrl: ownerUpdateSource,
  },
  {
    id: "tool_hermes",
    name: "Hermes",
    category: "development",
    description: "One of the tools Mark reaches for when building with AI.",
    websiteUrl: null,
    sourceUrl: ownerUpdateSource,
  },
  {
    id: "tool_railway",
    name: "Railway",
    category: "deployment",
    description:
      "One of Mark’s platforms for deploying and running applications.",
    websiteUrl: null,
    sourceUrl: ownerUpdateSource,
  },
  {
    id: "tool_cloudflare",
    name: "Cloudflare",
    category: "deployment",
    description:
      "Part of the infrastructure Mark uses to build and ship applications.",
    websiteUrl: null,
    sourceUrl: ownerUpdateSource,
  },
  {
    id: "tool_cursor",
    name: "Cursor",
    category: "devops",
    description: "Cursor, code assistant tool",
    websiteUrl: "https://cursor.com",
    sourceUrl: "https://markrenzo.com/api/portfolio/tool_cursor",
  },
  {
    id: "tool_manychat",
    name: "ManyChat",
    category: "frontend",
    description: "Chatbots on social & web with flows, tags, and AI replies",
    websiteUrl: "https://manychat.com",
    sourceUrl: "https://markrenzo.com/api/portfolio/tool_manychat",
  },
  {
    id: "tool_n8n",
    name: "n8n",
    category: "devops",
    description: "General-purpose automation + AI agent orchestrations",
    websiteUrl: "https://n8n.io",
    sourceUrl: "https://markrenzo.com/api/portfolio/tool_n8n",
  },
  {
    id: "tool_vapi",
    name: "Vapi",
    category: "ai-ml",
    description: "Voice AI platform",
    websiteUrl: "https://vapi.ai",
    sourceUrl: "https://markrenzo.com/api/portfolio/tool_vapi",
  },
  {
    id: "tool_flowise",
    name: "Flowise",
    category: "ai-ml",
    description: "LLM orchestration and graph-based agent flows",
    websiteUrl: "https://flowiseai.com",
    sourceUrl: "https://markrenzo.com/api/portfolio/tool_flowise",
  },
  {
    id: "tool_qdrant",
    name: "Qdrant",
    category: "database",
    description: "Vector DB for retrieval & semantic search",
    websiteUrl: "https://qdrant.tech",
    sourceUrl: "https://markrenzo.com/api/portfolio/tool_qdrant",
  },
  {
    id: "tool_redis",
    name: "Redis",
    category: "database",
    description: "In-memory store for state, queues, and rate-limits",
    websiteUrl: "https://redis.io",
    sourceUrl: "https://markrenzo.com/api/portfolio/tool_redis",
  },
  {
    id: "tool_supabase",
    name: "Supabase",
    category: "backend",
    description: "Postgres + auth + functions for app backends",
    websiteUrl: "https://supabase.com",
    sourceUrl: "https://markrenzo.com/api/portfolio/tool_supabase",
  },
  {
    id: "tool_botpress",
    name: "Botpress",
    category: "ai-ml",
    description: "Bot framework for multi-channel deployments",
    websiteUrl: "https://botpress.com",
    sourceUrl: "https://markrenzo.com/api/portfolio/tool_botpress",
  },
  {
    id: "tool_coolify",
    name: "Coolify",
    category: "devops",
    description: "Self-hosting PaaS used for infra",
    websiteUrl: "https://coolify.io",
    sourceUrl: "https://markrenzo.com/api/portfolio/tool_coolify",
  },
  {
    id: "tool_openai",
    name: "OpenAI",
    category: "ai-ml",
    description: "LLMs and APIs for text, tools, and vision",
    websiteUrl: "https://platform.openai.com",
    sourceUrl: "https://markrenzo.com/api/portfolio/tool_openai",
  },
  {
    id: "tool_claude",
    name: "Claude",
    category: "ai-ml",
    description: "Anthropic Claude models for reasoning",
    websiteUrl: "https://www.anthropic.com",
    sourceUrl: "https://markrenzo.com/api/portfolio/tool_claude",
  },
  {
    id: "tool_node",
    name: "Node.js",
    category: "backend",
    description: "Runtime for APIs and services",
    websiteUrl: "https://nodejs.org",
    sourceUrl: "https://markrenzo.com/api/portfolio/tool_node",
  },
  {
    id: "tool_postgres",
    name: "PostgreSQL",
    category: "database",
    description: "Primary relational store",
    websiteUrl: "https://www.postgresql.org",
    sourceUrl: "https://markrenzo.com/api/portfolio/tool_postgres",
  },
  {
    id: "tool_make",
    name: "Make.com",
    category: "devops",
    description: "Automation glue for ops",
    websiteUrl: "https://www.make.com",
    sourceUrl: "https://markrenzo.com/api/portfolio/tool_make",
  },
  {
    id: "tool_zapier",
    name: "Zapier",
    category: "devops",
    description: "Automation workflows for SaaS apps",
    websiteUrl: "https://zapier.com",
    sourceUrl: "https://markrenzo.com/api/portfolio/tool_zapier",
  },
  {
    id: "tool_twilio",
    name: "Twilio",
    category: "backend",
    description: "Programmable SMS & WhatsApp",
    websiteUrl: "https://www.twilio.com",
    sourceUrl: "https://markrenzo.com/api/portfolio/tool_twilio",
  },
  {
    id: "tool_shopify",
    name: "Shopify",
    category: "backend",
    description: "DTC storefront engine",
    websiteUrl: "https://www.shopify.com",
    sourceUrl: "https://markrenzo.com/api/portfolio/tool_shopify",
  },
];

export const capabilityGroups: CapabilityGroup[] = [
  {
    id: "building-with-ai",
    title: "Building apps with AI",
    description:
      "I turn ideas into tools people can use. Claude Code, Codex and Hermes are part of how I prototype, write code and work through an application, from the first version to the details.",
    skills: [
      "AI-assisted software engineering",
      "Vibe coding",
      "Application prototyping",
    ],
    tools: ["Claude Code", "Codex", "Hermes", "Cursor"],
    sourceUrls: [ownerUpdateSource],
  },
  {
    id: "apps-and-backends",
    title: "Software & connected systems",
    description:
      "I build web apps, internal tools and APIs, connect the data behind them, and get them online. Railway and Cloudflare are part of the stack I reach for to ship and run them.",
    skills: [
      "Web app development",
      "API integrations",
      "Application deployment",
    ],
    tools: [
      "Node.js",
      "PHP",
      "Supabase",
      "PostgreSQL",
      "Redis",
      "Railway",
      "Cloudflare",
      "Coolify",
    ],
    sourceUrls: [
      ownerUpdateSource,
      "https://markrenzo.com/api/portfolio/work_botbuilders",
      "https://markrenzo.com/api/portfolio/project_picklepals",
      "https://markrenzo.com/api/portfolio/project_hello-marky-chat",
      "https://markrenzo.com/api/portfolio/tool_node",
      "https://markrenzo.com/api/portfolio/tool_supabase",
      "https://markrenzo.com/api/portfolio/tool_coolify",
    ],
  },
  {
    id: "automation",
    title: "Automations that connect the work",
    description:
      "I connect applications, APIs and everyday workflows so information moves where it needs to. That can be lead handling, outreach or a custom tool that takes repetitive work off someone’s plate.",
    skills: ["Workflow Automation", "n8n", "API integrations"],
    tools: ["n8n", "Make.com", "Zapier", "Twilio"],
    sourceUrls: [
      ownerUpdateSource,
      "https://markrenzo.com/api/portfolio/skill_automation",
      "https://markrenzo.com/api/portfolio/skill_n8n",
      "https://markrenzo.com/api/portfolio/work_sge",
    ],
  },
  {
    id: "ai-agents",
    title: "AI inside the product",
    description:
      "I build chatbots and voice assistants into useful products. They can draw on a business’s knowledge, answer questions and take action through connected workflows.",
    skills: ["Chatbot Development", "Voice AI", "LLM Ops"],
    tools: [
      "OpenAI",
      "Claude",
      "Flowise",
      "Botpress",
      "ManyChat",
      "Vapi",
      "Qdrant",
    ],
    sourceUrls: [
      "https://markrenzo.com/api/portfolio/skill_chatbots",
      "https://markrenzo.com/api/portfolio/skill_voice_ai",
      "https://markrenzo.com/api/portfolio/skill_llm_ops",
      "https://markrenzo.com/api/portfolio/work_botbuilders",
    ],
  },
  {
    id: "growth",
    title: "Marketing & growth",
    description:
      "I work on brand positioning, performance campaigns and Shopify stores, from how people find a business to how they buy from it.",
    skills: ["Digital Marketing", "E-commerce strategy", "Lead generation"],
    tools: ["Shopify", "ManyChat", "Twilio"],
    sourceUrls: [
      "https://markrenzo.com/api/portfolio/skill_digital_marketing",
      "https://markrenzo.com/api/portfolio/work_ciderbears",
      "https://markrenzo.com/api/portfolio/work_reactor",
      "https://markrenzo.com/api/portfolio/work_mellow",
    ],
  },
  {
    id: "creative",
    title: "Creative production",
    description:
      "I take video and social content from creative direction through production and editing, with a background in events and live coverage.",
    skills: ["Videography", "Video editing", "Social content"],
    tools: [],
    sourceUrls: [
      "https://markrenzo.com/api/portfolio/skill_video",
      "https://markrenzo.com/api/portfolio/work_digital_dream",
      "https://markrenzo.com/api/portfolio/work_samahan_lead",
      "https://markrenzo.com/api/portfolio/work_afc",
    ],
  },
  {
    id: "people",
    title: "People & delivery",
    description:
      "I lead teams, manage client accounts and coordinate projects and events. I also give talks and deliver training.",
    skills: ["Leadership", "Project management", "Public Speaking"],
    tools: [],
    sourceUrls: [
      "https://markrenzo.com/api/portfolio/skill_leadership",
      "https://markrenzo.com/api/portfolio/skill_public_speaking",
      "https://markrenzo.com/api/portfolio/work_sge",
      "https://markrenzo.com/api/portfolio/work_riway",
    ],
  },
];
