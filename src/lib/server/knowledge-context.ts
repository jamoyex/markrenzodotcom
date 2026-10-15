/**
 * Public context is reconstructed from a small set of whole-question templates.
 * Never return the supplied question or arbitrary captured text. Unrecognized
 * questions remain answer-only, so their owner replies must be self-contained.
 */
export function canonicalKnowledgeQuestion(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 500) return undefined;
  const question = value
    .normalize("NFKC")
    .replace(/[‘’]/g, "'")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/^what's\b/, "what is")
    .replace(/^where's\b/, "where is");

  const preference = question.match(
    /^(?:what|which) (?:is|are) mark(?: renzo)?'s (?:favourite|favorite|preferred) (food|dish|cuisine|sport|book|movie|hobby|hobbies|travel destination)\?$/,
  );
  const preferenceTopics: Record<string, string> = {
    food: "food",
    dish: "food",
    cuisine: "cuisine",
    sport: "sport",
    book: "book",
    movie: "movie",
    hobby: "hobby",
    hobbies: "hobbies",
    "travel destination": "travel destination",
  };
  if (preference) {
    const topic = preferenceTopics[preference[1]];
    return `What ${topic === "hobbies" ? "are" : "is"} Mark's favorite ${topic}?`;
  }
  if (
    /^what (?:food|dish) does mark(?: renzo)? (?:like|enjoy) (?:most|the most|best)\?$/.test(
      question,
    )
  )
    return "What is Mark's favorite food?";
  if (
    /^what are mark(?: renzo)?'s hobbies\?$/.test(question) ||
    /^what does mark(?: renzo)? (?:do|like to do|enjoy doing) (?:outside work|in his free time|for fun)\?$/.test(
      question,
    )
  )
    return "What does Mark enjoy doing outside work?";
  if (/^where is mark(?: renzo)? (?:currently )?based\?$/.test(question))
    return "Where is Mark based?";
  if (/^where is mark(?: renzo)? from\?$/.test(question))
    return "Where is Mark from?";
  if (/^what is mark(?: renzo)?'s current (?:role|job)\?$/.test(question))
    return "What is Mark's current role?";

  const projectNames: Record<string, string> = {
    courtfolio: "Courtfolio",
    hellomarky: "HelloMarky",
    "hello marky": "HelloMarky",
    picklepals: "PicklePals",
    "pickle pals": "PicklePals",
    "selfhelp ai": "SelfHelp AI",
    "self help ai": "SelfHelp AI",
    selfhelp: "SelfHelp AI",
    "self help": "SelfHelp AI",
    "parking buddy": "Parking Buddy",
    parkingbuddy: "Parking Buddy",
    "next move asia": "Next Move Asia",
    nextmoveasia: "Next Move Asia",
  };
  const project = question.match(
    /^what is (courtfolio|hello ?marky|pickle ?pals|self ?help(?: ai)?|parking ?buddy|next ?move ?asia)(?:'s (?:technology|tech) stack| built with)\?$/,
  );
  if (project) return `What is ${projectNames[project[1]]}'s technology stack?`;
  return undefined;
}
