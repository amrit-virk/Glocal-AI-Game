export type Option = { id: string; text: string; feedback: string };
export type Stage = {
  question: string;
  multiple?: boolean;
  options: Option[];
  answers: string[];
};
export type Scenario = {
  id: string;
  title: string;
  situation: string;
  stages: Stage[];
  takeaway: string;
  references: string[];
};
export type Game = {
  id: string;
  name: string;
  icon: string;
  skill: string;
  description: string;
  instructions: string;
  takeaway: string;
  scenarios: Scenario[];
};
export const references = [
  {
    id: "privacy",
    title:
      "Principles for responsible, trustworthy and privacy-protective generative AI technologies",
    publisher: "Office of the Privacy Commissioner of Canada",
    url: "https://www.priv.gc.ca/en/privacy-topics/technology/artificial-intelligence/gd_principles_ai/",
    note: "Privacy, necessity, consent and safeguarding personal information. Direct page verification pending: environment network policy blocked access.",
  },
  {
    id: "nist",
    title: "AI Risk Management Framework",
    publisher: "National Institute of Standards and Technology",
    url: "https://www.nist.gov/itl/ai-risk-management-framework",
    note: "Trustworthy AI, validity, reliability and harmful bias. Direct page verification pending: environment network policy blocked access.",
  },
  {
    id: "ethics",
    title: "Recommendation on the Ethics of Artificial Intelligence",
    publisher: "UNESCO",
    url: "https://www.unesco.org/en/artificial-intelligence/recommendation-ethics",
    note: "Fairness, inclusion and attention to affected people. Direct page verification pending: environment network policy blocked access.",
  },
  {
    id: "sampling",
    title: "Sampling methods",
    publisher: "Statistics Canada",
    url: "https://www150.statcan.gc.ca/n1/edu/power-pouvoir/ch6/5214806-eng.htm",
    note: "Sampling and the limits of conclusions about a population. Direct page verification pending: environment network policy blocked access.",
  },
];
const choice = (
  question: string,
  texts: string[],
  correct: number,
  explanations: string[],
): Stage => ({
  question,
  options: texts.map((text, i) => ({
    id: String(i),
    text,
    feedback: explanations[i],
  })),
  answers: [String(correct)],
});
const details = (texts: string[], answers: number[]): Stage => ({
  question:
    "Which details should you leave out of the prompt? Select all that apply.",
  multiple: true,
  options: texts.map((text, i) => ({
    id: String(i),
    text,
    feedback: answers.includes(i)
      ? "This identifies someone or reveals private information. Leave it out."
      : "This generic context can help without identifying anyone.",
  })),
  answers: answers.map(String),
});
const privacySeeds = [
  [
    "roster",
    "The club roster",
    "A student drafts a club announcement using a fictional roster: “Maya Chen, maya@example.test, 555-0101; weekly board-game meetup.”",
    [
      "Student name",
      "Email address and phone number",
      "Weekly board-game meetup",
    ],
    [0, 1],
    [
      "Write a friendly announcement for a weekly board-game meetup.",
      "Keep the names but remove the phone numbers.",
      "Replace names with initials but keep contact details.",
    ],
    0,
    "Use the event’s purpose, not a roster of people.",
  ],
  [
    "donors",
    "A thank-you with too much detail",
    "A volunteer wants to paste a fictional donor sign-up sheet into AI to draft a thank-you: “Noor Ali, noor@example.test, 555-0102; community garden fundraiser.”",
    [
      "Donor name",
      "Donor email and phone number",
      "Community garden fundraiser",
    ],
    [0, 1],
    [
      "Write a thank-you for supporters of a community garden fundraiser.",
      "Paste the sheet because donors supported the event.",
      "Keep donor emails so the message feels personal.",
    ],
    0,
    "Supporting an event is not permission to share someone’s contact details with an AI tool.",
  ],
  [
    "access",
    "A peer’s accommodation request",
    "A student wants to summarize a fictional request: “Alex Rivera, student ID 20481, has a medical condition and needs accessible seating at our event.”",
    [
      "Name and student ID",
      "Medical condition and personal accommodation details",
      "Planning an accessible event",
    ],
    [0, 1],
    [
      "Summarize Alex’s condition without the student ID.",
      "Create a generic accessible event-planning checklist.",
      "Use initials and include the medical details.",
    ],
    1,
    "You can ask for accessible planning guidance without sharing a peer’s sensitive information.",
  ],
  [
    "incident",
    "An internal incident note",
    "A club member considers uploading a fictional internal note: “Jordan Lee reported harassment by a named member; confidential witness account attached; need an incident summary.”",
    [
      "People’s names",
      "Confidential allegations and witness account",
      "Need for a blank incident-summary structure",
    ],
    [0, 1],
    [
      "Summarize the full note because it stays within the club.",
      "Remove names but keep the detailed witness account.",
      "Provide a blank incident-summary template without any case details.",
    ],
    2,
    "A blank template avoids exposing a confidential account. Follow your organization’s authorized process for real incidents.",
  ],
] as const;
const privacy: Scenario[] = privacySeeds.map(
  ([id, title, situation, ds, ans, rewrites, best, takeaway]) => ({
    id: "privacy-" + id,
    title,
    situation,
    stages: [
      details([...ds], [...ans]),
      choice(
        "Which prompt is safer?",
        [...rewrites],
        best,
        rewrites.map((_, i) =>
          i === best
            ? "This asks for useful help without personal or confidential details."
            : "This still shares personal or confidential details. Removing a name alone is not enough.",
        ),
      ),
    ],
    takeaway,
    references: ["privacy"],
  }),
);
const claims: Scenario[] = [
  [
    "deadline",
    "A confident deadline",
    "Fictional AI output: “The North Star Scholarship closes on June 15. You can tell your friends.”",
    "Check the scholarship provider’s current official deadline page.",
    "Ask the same AI again and trust it if it repeats the date.",
    "Share it because the answer sounds certain.",
    "Before sharing, verify the current year, deadline and time zone with the provider.",
  ],
  [
    "quote",
    "Did they really say that?",
    "Fictional AI output: “Researcher Dr. L. Park said, ‘AI always makes learning fair.’”",
    "Find the original publication or recording and check wording and context.",
    "Use a quote graphic that repeats the same sentence.",
    "Assume quotation marks prove it is authentic.",
    "If you cannot locate the original, do not present the quote as verified.",
  ],
  [
    "statistic",
    "A number without context",
    "Fictional AI output: “92% of young people use AI every day, according to a recent study.”",
    "Find the original study; check its date, population and question wording.",
    "Use it because a precise percentage looks scientific.",
    "Find a blog repeating 92% and stop there.",
    "Check who was studied and what “use” means before applying a statistic to everyone.",
  ],
  [
    "transit",
    "Has the stop moved?",
    "Fictional AI output: “Route 18 now leaves from Cedar Street instead of the station.”",
    "Check the transit agency’s current notice for the route and travel date.",
    "Follow it because AI knows local information.",
    "Use an undated screenshot of an old timetable.",
    "Service information changes. Use current official notices before making travel plans.",
  ],
].map(([id, title, situation, right, a, b, takeaway], i) => {
  const opts = [right, a, b];
  const rotate = i % 3;
  const ordered = [...opts.slice(rotate), ...opts.slice(0, rotate)];
  return {
    id: "claim-" + id,
    title,
    situation,
    stages: [
      choice(
        "What should you do before relying on this claim?",
        ordered,
        ordered.indexOf(right),
        ordered.map((t) =>
          t === right
            ? "This checks evidence at its source and in the relevant context."
            : t === a
              ? "Repetition or confident presentation does not establish accuracy. Verify the original evidence."
              : "Appearance and older or repeated information do not verify a claim. Check its source and context.",
        ),
      ),
    ],
    takeaway,
    references: ["nist", ...(id === "statistic" ? ["sampling"] : [])],
  };
});
const biasSeeds = [
  [
    "transport",
    "Opportunities for whom?",
    "Fictional AI output: “These are the best volunteer options for students: drive to a rural shelter, deliver meals by car, or transport equipment.”",
    [
      "All students have access to a car.",
      "All students prefer animals.",
      "All students want paid work.",
    ],
    0,
    [
      "Ask for transit-accessible and remote options, with travel requirements.",
      "Tell students without cars to skip volunteering.",
      "Keep the list because driving is convenient for some people.",
    ],
    0,
    "Check transport access before calling a list suitable for everyone.",
  ],
  [
    "gender",
    "Interests before stereotypes",
    "Fictional AI output: “Girls should design the STEM club posters; boys should program the robots.”",
    [
      "Programming requires a car.",
      "Gender determines interests and technical skills.",
      "Everyone has a laptop.",
    ],
    1,
    [
      "Keep the roles because stereotypes save time.",
      "Assign roles by gender but allow swaps later.",
      "Ask about interests and relevant skills; offer everyone a chance to learn.",
    ],
    2,
    "Ask people about their interests. Do not infer ability from gender.",
  ],
  [
    "internet",
    "An event with a hidden barrier",
    "Fictional AI output: “Every participant should join a two-hour HD video workshop from home.”",
    [
      "Everyone wants to speak on camera.",
      "Everyone lives in the same city.",
      "Everyone has reliable fast internet and enough data.",
    ],
    2,
    [
      "Offer low-bandwidth materials and an offline way to participate.",
      "Exclude participants whose video freezes.",
      "Require everyone to buy faster internet.",
    ],
    0,
    "Plan multiple ways to participate, including for people with limited connectivity.",
  ],
  [
    "voices",
    "Five comments, one big conclusion",
    "Fictional AI output: “Five students praised the new timetable, so the whole school supports it.”",
    [
      "Five comments represent the whole school.",
      "No student can like the timetable.",
      "The timetable must be illegal.",
    ],
    0,
    [
      "State that every student agrees.",
      "Say these five students were positive; seek wider feedback, including missing groups.",
      "Discard all positive comments.",
    ],
    1,
    "Acknowledge what a small sample can show and whose views have not been heard.",
  ],
] as const;
const bias: Scenario[] = biasSeeds.map(
  ([id, title, situation, gaps, gap, responses, response, takeaway]) => ({
    id: "bias-" + id,
    title,
    situation,
    stages: [
      choice(
        "What assumption or gap matters most?",
        [...gaps],
        gap,
        gaps.map((_, i) =>
          i === gap
            ? "This identifies the unsupported assumption in the output."
            : "That is not the assumption shown by this output. Look at who is being included or left out.",
        ),
      ),
      choice(
        "Which response improves the answer?",
        [...responses],
        response,
        responses.map((_, i) =>
          i === response
            ? "This addresses the gap and makes the response more inclusive or better supported."
            : "This does not address the gap. Seek relevant perspectives and avoid excluding people.",
        ),
      ),
    ],
    takeaway,
    references: ["ethics", ...(id === "voices" ? ["sampling"] : [])],
  }),
);
export const games: Game[] = [
  {
    id: "privacy",
    name: "Privacy Protector",
    icon: "◈",
    skill: "Protect information",
    description: "Keep the useful context. Leave the private details out.",
    instructions:
      "First select every sensitive detail to leave out. Then choose a safer rewrite. Both steps must be correct to earn a point.",
    takeaway:
      "Pause before pasting. Use generic context and follow authorized processes for sensitive information.",
    scenarios: privacy,
  },
  {
    id: "claim",
    name: "Claim Checker",
    icon: "⌕",
    skill: "Check the evidence",
    description: "A confident answer still needs a reliable source.",
    instructions:
      "For each fictional AI claim, choose the best next verification step.",
    takeaway:
      "Trace claims to original, current evidence. Fluency is not proof.",
    scenarios: claims,
  },
  {
    id: "bias",
    name: "Bias Detective",
    icon: "◎",
    skill: "Notice what’s missing",
    description: "Spot assumptions. Make room for more perspectives.",
    instructions:
      "First identify the assumption or missing context. Then choose a fairer, better-supported response. Both steps must be correct to earn a point.",
    takeaway:
      "Ask who is missing and which assumptions need checking before acting.",
    scenarios: bias,
  },
];
