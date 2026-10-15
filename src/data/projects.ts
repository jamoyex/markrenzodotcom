import type { ProjectId } from "@/lib/project-ids";

export type ProjectCaseStudy = {
  id: ProjectId;
  name: string;
  category: string;
  audience: string;
  headline: string;
  summary: string;
  intro: string[];
  sections: { id: string; title: string; paragraphs: string[] }[];
  takeaway: string;
  stack: string[];
  website?: string;
  accent: string;
  accentInk: string;
  video?: { src: string; title: string; duration: string; poster?: string };
};

export const projects: ProjectCaseStudy[] = [
  {
    id: "courtfolio",
    name: "Courtfolio",
    category: "Community app",
    audience:
      "Pickleball players who want to keep track of their games, courts, and crew.",
    headline: "Your pickleball life, all in one place.",
    summary:
      "A mobile-first pickleball journal for discovering courts, checking in to games, saving photos, and looking back on the people and places you’ve played.",
    intro: [
      "A good game rarely ends at the final point. There’s the court you finally visited, the people you met, and the photo you want to keep. Courtfolio gives those little moments somewhere to live.",
      "I built it around a simple habit: play, check in, and keep the memory. Court discovery, a personal playing history, and a community feed sit around that central action, so the app feels useful on the way to a game and worth returning to afterward.",
    ],
    sections: [
      {
        id: "a-small-habit",
        title: "Start with the game you just played.",
        paragraphs: [
          "The check-in is the heart of Courtfolio. A player picks a court and records a session, with room for a note, photos, and the people they played with. It turns something that could disappear into a group chat into a small, lasting entry.",
          "That flow needs to feel quick on a phone. The surrounding features support the check-in instead of making someone complete a complicated profile before they can do anything useful. A nearby court gets them started; their growing history gives them a reason to come back.",
        ],
      },
      {
        id: "a-personal-map",
        title: "A map becomes a personal collection.",
        paragraphs: [
          "Discovering a court and remembering a court are different jobs. Courtfolio connects both: players can find places to play, then build a record of the courts they’ve actually visited. Their profile becomes a collection of experiences, rather than just a name and avatar.",
          "Badges, session history, and monthly recaps give that collection a little personality. They help surface what has changed over time without turning every game into a performance metric. The social side comes from the activity itself: a check-in, a photo, a shared memory.",
        ],
      },
      {
        id: "connected-pieces",
        title: "The interesting work is between the screens.",
        paragraphs: [
          "A check-in touches a lot of the product: court information, a player’s history, uploaded media, and the feed. I treated those as connected parts of one experience. The same session should still make sense when you encounter it on a profile or open a shared link.",
          "The application uses React and Vite, with server-side application logic, PostgreSQL, and object storage for media. Those choices support an interface that can stay light while the record of a player’s activity becomes richer.",
        ],
      },
      {
        id: "what-it-shows",
        title: "A useful app can also feel like a keepsake.",
        paragraphs: [
          "Courtfolio brings together product design, application development, and the small details that make a community product feel personal. It isn’t only a directory of places to play. Its value grows through the ordinary things people choose to remember.",
          "That is a kind of software I enjoy building: a clear everyday action, a connected system underneath it, and enough care in the experience that people want to use it again.",
        ],
      },
    ],
    takeaway: "Find a court. Play a game. Keep the story.",
    stack: ["React", "Vite", "PostgreSQL", "Cloudflare Workers", "R2"],
    website: "https://courtfolio.app",
    video: {
      src: "/project-explainers/courtfolio.mp4",
      title: "A little tour of Courtfolio",
      duration: "18 seconds",
      poster: "/project-explainers/courtfolio-poster.png",
    },
    accent: "#7fd22b",
    accentInk: "#1b2418",
  },
  {
    id: "hellomarky",
    name: "Hello Marky",
    category: "AI conversation platform",
    audience:
      "Small teams that need to answer customer questions and keep conversations moving.",
    headline: "A useful first hello. A human when it matters.",
    summary:
      "An AI chat platform that brings business knowledge, customer conversations, lead capture, and a shared inbox together.",
    intro: [
      "A chatbot is easy to put on a website. Giving it useful answers, connecting it to the business, and making sure a person can take over is a much more interesting problem.",
      "Hello Marky is my exploration of that whole experience. Its chat product helps a business answer visitors using its own knowledge, collect the context it needs, and carry the conversation into a shared inbox when the team needs to step in.",
    ],
    sections: [
      {
        id: "business-context",
        title: "The answer starts with the business.",
        paragraphs: [
          "An assistant should understand the material a team gives it. Hello Marky brings knowledge management and retrieval into the product, so the conversation can draw on business information instead of relying on a generic answer.",
          "That work includes the less visible parts of an AI application: preparing source material, finding relevant context, managing conversation history, and deciding which tools the assistant can use. The widget is the front door to a larger system.",
        ],
      },
      {
        id: "conversation-continuity",
        title: "Keep the thread when a person takes over.",
        paragraphs: [
          "Some visitors need a quick answer. Others need a real conversation. The shared inbox lets the team see what has already been said and continue from there, rather than making the visitor explain the same thing twice.",
          "Lead capture belongs in that flow too. The goal is to collect useful contact details and intent while the conversation is happening, then make that information available to the people who will follow up.",
        ],
      },
      {
        id: "beyond-the-widget",
        title: "One product, several ways to connect.",
        paragraphs: [
          "The product extends beyond an embedded website widget, with integrations for Messenger and Instagram. Each channel brings its own delivery and conversation constraints, while the team still needs a coherent place to work.",
          "The current chat runtime runs its agent logic inside the application. PostgreSQL stores application records, Redis supports coordination, and Qdrant supports knowledge retrieval. This is application engineering around AI: interfaces, state, background work, and integrations all have to agree.",
        ],
      },
      {
        id: "useful-ai",
        title: "AI is one part of the service.",
        paragraphs: [
          "Hello Marky reflects how I like to approach an AI product. The model matters, but so do the handoff, the source material, and what happens after the answer. A polished chat bubble cannot make up for a broken workflow.",
          "The result is a conversation product with room for both automation and human judgment. The assistant helps with the repeatable parts; the team can stay involved where its knowledge and care make the difference.",
        ],
      },
    ],
    takeaway: "Good answers are useful. A connected conversation is better.",
    stack: ["Next.js", "Node.js", "Express", "PostgreSQL", "Redis", "Qdrant"],
    website: "https://chat.hellomarky.com",
    accent: "#173c35",
    accentInk: "#fffdf8",
  },
  {
    id: "pickle-pals",
    name: "PicklePals",
    category: "Club management platform",
    audience:
      "A pickleball community in General Santos—and the people keeping the club running.",
    headline: "Less admin between you and the court.",
    summary:
      "A club platform connecting memberships, court reservations, open-play sessions, and day-to-day operations in one member experience.",
    intro: [
      "A club is a social place, but a surprising amount of work happens before anyone picks up a paddle. Someone needs to know which court is available, who has booked, and how a member gets in.",
      "I designed and built PicklePals to bring those practical details together for a pickleball community in General Santos. The website welcomes people into the club; the member experience helps turn that interest into an actual game.",
    ],
    sections: [
      {
        id: "a-place-to-start",
        title: "Make the next game easy to arrange.",
        paragraphs: [
          "Court availability is a useful starting point because it answers a concrete question: when can we play? The booking flow connects available slots, member credits, and confirmed reservations instead of leaving the final arrangement scattered across messages.",
          "Membership provides continuity. A player can come back to the same account to see their activity and bookings. For the club, that creates a clearer view of what is happening across the courts.",
        ],
      },
      {
        id: "different-kinds-of-play",
        title: "A private booking isn’t the same as open play.",
        paragraphs: [
          "A group reserving a court already knows who it is playing with. Open play is more fluid: players join a shared session, and the club has to manage participation and rotation. PicklePals gives those experiences their own flows.",
          "Open-play passes and skill-level information help organize the session. Bookings, memberships, events, and player activity remain connected, while the interface makes the action in front of the member clear.",
        ],
      },
      {
        id: "digital-meets-physical",
        title: "The software reaches the physical club.",
        paragraphs: [
          "The club platform includes member QR access and court lighting tied to active bookings or assigned open-play courts. These are small moments for a player, but they link a digital reservation to a real space.",
          "That connection changes how I think about the product. A reservation is more than a row in a dashboard: it has to be useful to the member arriving at the venue and the people managing it. The member pages and club administration are parts of the same service.",
        ],
      },
      {
        id: "practical-engineering",
        title: "Build around the way the club works.",
        paragraphs: [
          "The application uses PHP and MySQL, with automation supporting the wider operation. The technical work is in making the rules around availability, membership, and payments feel simple at the point of use.",
          "PicklePals is a good example of the work I enjoy beyond a standalone website: designing the public experience, building the application underneath it, and connecting the everyday tasks that keep a community moving.",
        ],
      },
    ],
    takeaway: "The best club software leaves more room for the game.",
    stack: ["PHP", "MySQL", "JavaScript", "n8n"],
    website: "https://picklepals.co",
    accent: "#084a2c",
    accentInk: "#fcf8ec",
  },
  {
    id: "selfhelp-ai",
    name: "SelfHelp AI",
    category: "AI learning support",
    audience: "Course creators and members using GoHighLevel.",
    headline: "Help that stays beside the lesson.",
    summary:
      "An assistant that connects course material, learner questions, and human support.",
    intro: [
      "A learner’s question often belongs to a particular lesson. SelfHelp AI keeps the conversation beside that material, inside the GoHighLevel portal.",
      "The chat is one part of the product. Behind it is a workspace for the people running the course: a place to manage content, see what members are asking, and help when an answer needs their attention. I built the experience around those two connected jobs.",
    ],
    sections: [
      {
        id: "stay-in-context",
        title: "Find the useful moment.",
        paragraphs: [
          "Answers draw on course content and lesson context. Transcript timestamps can send someone straight to the relevant part of a video, so finding an answer also brings them back to the learning.",
          "The course workspace brings together the syllabus, lesson coverage, transcripts, documents, and common questions. It makes the material available to the support team as well as the learner. Course and page settings give the assistant a useful starting point for each part of the portal.",
        ],
      },
      {
        id: "a-human-loop",
        title: "Keep the team in the conversation.",
        paragraphs: [
          "Questions that need a person become tickets. The team can respond through the Inbox, Telegram, or Google Chat, with the reply delivered in the member’s portal conversation.",
          "The Inbox gives that handoff a clear place to happen. A teammate can review the conversation and its context, work through the open question, and follow the reply back to the member. Support stays connected to the learning experience.",
        ],
      },
      {
        id: "knowledge-that-travels",
        title: "Turn a useful reply into a better answer.",
        paragraphs: [
          "A team can review and publish a useful answer for reuse. MCP and REST access let other agents consult that knowledge too.",
          "The knowledge workspace separates courses, notes, Q&A, open questions, and documents. Search, tags, and pinned notes help the team find the material they need, while a Team Assistant can use that shared context. The result is a product that supports the people answering questions as well as the people asking them.",
          "What interests me here is the connection between assistance and authorship: AI helps people find information, while the team decides what becomes trusted material.",
        ],
      },
      {
        id: "the-application-behind-the-chat",
        title: "Build the application around the assistant.",
        paragraphs: [
          "SelfHelp AI uses Next.js and React for the interface, PostgreSQL and Prisma for application data, and Qdrant for knowledge retrieval. The system connects course content, conversations, member progress, and the team’s support workflow.",
          "This is the kind of AI product I enjoy making: the model has a useful role, and the surrounding software gives people the controls, context, and everyday tools to work with it.",
        ],
      },
    ],
    takeaway: "Help one learner. Make the next answer easier.",
    stack: [
      "GoHighLevel",
      "Next.js",
      "React",
      "PostgreSQL",
      "Prisma",
      "Qdrant",
      "OpenAI",
      "MCP",
      "REST",
      "Telegram integration",
    ],
    website: "https://selfhelp.ai",
    accent: "#2563eb",
    accentInk: "#ffffff",
  },
  {
    id: "parking-buddy",
    name: "Parking Buddy",
    category: "Parking marketplace",
    audience:
      "Drivers looking for a space and property owners making theirs available in the Philippines.",
    headline: "A parking space, without the guessing.",
    summary:
      "A parking marketplace that connects property discovery, space selection, direct owner payments, and a parking pass—with tools for owners to manage availability.",
    intro: [
      "Parking is a very physical problem: a driver needs a particular space, in a particular place, for a particular amount of time. The software has to turn that uncertainty into a clear arrangement.",
      "Parking Buddy connects the driver’s booking journey with the owner’s availability and confirmation workflow. It is a marketplace with two different everyday jobs: finding somewhere to park and managing spaces that other people can use.",
    ],
    sections: [
      {
        id: "choose-your-space",
        title: "Make the choice specific.",
        paragraphs: [
          "A driver chooses a property, arrival time, duration, and an individual parking space. The product shows the pricing before they move into the reservation flow. That detail matters: the user should know what they are selecting, rather than being silently assigned a different slot.",
          "Availability has to make sense for both sides. The driver sees the options they can book; the owner has calendar tools and private blocks to keep their own commitments reflected in the system.",
        ],
      },
      {
        id: "a-clear-handoff",
        title: "Keep payment and confirmation honest.",
        paragraphs: [
          "The reservation flow holds a space while the driver pays the owner directly and uploads a receipt. Depending on the space’s settings, the owner reviews the receipt or the booking confirms automatically after upload. The driver then receives a parking pass.",
          "A receipt upload is not bank verification. Keeping those states separate makes the product clearer: there is a difference between choosing a space, submitting proof of payment, and receiving confirmation. The interface needs to show where the booking actually stands.",
        ],
      },
      {
        id: "both-sides",
        title: "The owner needs a product too.",
        paragraphs: [
          "A marketplace cannot stop at the customer checkout. Owners need to review bookings, maintain availability, and block time when a space is not available. Property management adds an approval layer where the building needs oversight.",
          "Those tools turn the booking page into an operating system for the service. The driver-facing flow can remain focused because the owner and property-management workflows have their own places to handle the details.",
        ],
      },
      {
        id: "an-edge-application",
        title: "A small interaction, a complete application.",
        paragraphs: [
          "Parking Buddy uses React and TypeScript with Cloudflare Workers and D1. Private R2 storage supports receipt handling. The architecture covers the public experience, application data, and files that should not become public assets.",
          "This project captures my move toward building complete tools with AI: designing a useful flow, implementing the rules behind it, and carrying the idea through to a working application. The satisfying part is making the complicated coordination feel ordinary.",
        ],
      },
    ],
    takeaway: "Choose the space. Know the price. Know where you stand.",
    stack: ["React", "TypeScript", "Cloudflare Workers", "D1", "R2"],
    website: "https://parkingbuddy.co",
    accent: "#F8F4E8",
    accentInk: "#1E2926",
  },
  {
    id: "next-move-asia",
    name: "Next Move Asia",
    category: "Website design & development",
    audience:
      "Students, educators, schools, and young professionals exploring learning experiences across Asia.",
    headline: "Open a door to learning beyond the classroom.",
    summary:
      "A website for practical-skills programs and international learning immersions, with a clear path from exploring an experience to making an inquiry.",
    intro: [
      "Next Move Asia offers practical learning and international experiences. My work here was the website: translating those programs into an experience that helps someone understand what is available and take a useful next step.",
      "It has a different job from the applications in this collection. The visitor is exploring possibilities, not managing an account or making a parking reservation. The design needs to create interest while keeping the program information easy to find.",
    ],
    sections: [
      {
        id: "two-ways-to-learn",
        title: "Give different interests a clear starting point.",
        paragraphs: [
          "The website brings together Academy workshops and international learning immersions. These are related ideas, but people arrive with different questions: a practical skill they want to develop, a destination they want to understand, or an experience for their students.",
          "Program and destination content gives those visitors routes into the site. The structure does the quiet work of helping them narrow their interest before they reach the inquiry form.",
        ],
      },
      {
        id: "a-sense-of-journey",
        title: "Use motion to carry the sense of discovery.",
        paragraphs: [
          "GSAP and smooth scrolling support an experience built around moving through the site. The motion helps the pages feel like a journey while the content explains what each opportunity offers.",
          "That balance matters on a website like this. A memorable entrance can encourage someone to explore, but the next program, destination, or contact action still needs to be clear. The visual experience serves the information.",
        ],
      },
      {
        id: "a-useful-enquiry",
        title: "End the visit with a conversation.",
        paragraphs: [
          "The inquiry flow connects the public website to a contact service and a private lead dashboard. The team has somewhere to receive and work with that interest, rather than treating the form as the end of the experience.",
          "The site uses React and Vite, with GSAP and Lenis for motion, and Cloudflare Workers and D1 for the contact workflow. It is a focused website build: thoughtful presentation, clear discovery, and a working route to the people behind the programs.",
        ],
      },
    ],
    takeaway: "Make the possibility feel real. Make the next step easy.",
    stack: ["React", "Vite", "GSAP", "Lenis", "Cloudflare Workers", "D1"],
    website: "https://www.nextmoveasia.com",
    accent: "#063aa8",
    accentInk: "#fdf2dc",
  },
];

export function getProject(id: string): ProjectCaseStudy | undefined {
  return projects.find((project) => project.id === id);
}
