type Case = {
  title: string;
  brief: string;
  lesson: string;
  references: string[];
};
export type Verdict = "The evidence supports it" | "The evidence contradicts it" | "There’s not enough evidence";
export type Claim = Case & {
  kind: "claim";
  evidence: { title: string; text: string; why: string }[];
  verdict: Verdict;
  decisive: number;
  aiAnswer: string;
  consequences: Record<Verdict, string>;
  reasoning: string;
};
export type Privacy = Case & {
  kind: "privacy";
  original: string;
  example: string;
  privateDetails: { label: string; pattern: RegExp }[];
  requirements: { label: string; pattern: RegExp }[];
};
export type Bias = Case & {
  kind: "bias";
  aiInput: string;
  aiPlan: string;
  gap: string;
  remix?: Bias;
  people: { name: string; barrier: string }[];
  repairs: { text: string; helps: number[]; impact: string }[];
  example: number[];
  slots: number;
};
export type Puzzle = Claim | Privacy | Bias;
export type Game = {
  id: Puzzle["kind"];
  name: string;
  icon: string;
  skill: string;
  description: string;
  instructions: string[];
  takeaway: string;
  scenarios: Puzzle[];
};
export const references = [
  {
    id: "privacy",
    title:
      "Principles for responsible, trustworthy and privacy-protective generative AI technologies",
    publisher: "Office of the Privacy Commissioner of Canada",
    url: "https://www.priv.gc.ca/en/privacy-topics/technology/artificial-intelligence/gd_principles_ai/",
    note: "See the principles on appropriate purposes, necessity and proportionality. Use only the personal information needed for the task.",
  },
  {
    id: "nist",
    title: "AI Risk Management Framework",
    publisher: "National Institute of Standards and Technology",
    url: "https://www.nist.gov/itl/ai-risk-management-framework",
    note: "Background on trustworthy AI and managing risks from unreliable outputs.",
  },
  {
    id: "ethics",
    title: "Recommendation on the Ethics of Artificial Intelligence",
    publisher: "UNESCO",
    url: "https://www.unesco.org/en/artificial-intelligence/recommendation-ethics",
    note: "See the principles on fairness and non-discrimination and the role of affected people.",
  },
  {
    id: "sampling",
    title: "Non-probability sampling",
    publisher: "Statistics Canada",
    url: "https://www150.statcan.gc.ca/n1/edu/power-pouvoir/ch13/nonprob/5214898-eng.htm",
    note: "Explains why volunteer and convenience samples can differ from the target population.",
  },
];

const claims: Claim[] = [
  {
    kind: "claim",
    title: "A deadline worth double-checking",
    brief: "You’re helping a classmate apply for the fictional North Star Scholarship. They work on June 10 and plan to finish the application afterward. Decide what deadline to share in the class group chat.",
    aiAnswer: "The 2026 North Star Scholarship application is due June 15 at 11:59 p.m. Eastern.",
    consequences: {
      "The evidence supports it": "A classmate who waits until after the June 10 shift would miss the application deadline.",
      "The evidence contradicts it": "Your reminder gives applicants the June 8 deadline and keeps June 15 separate for references.",
      "There’s not enough evidence": "Holding the post avoids sharing a bad date, but classmates miss a useful reminder even though the correction is available.",
    },
    evidence: [
      { title: "May student services newsletter", text: "North Star Scholarship: submit by June 15. The linked provider application page was last checked on May 3.", why: "The newsletter had a credible source in May, but its date predates the provider’s correction." },
      { title: "Provider notice posted May 21", text: "Correction for the 2026 intake: applications close June 8 at 11:59 p.m. Eastern. June 15 is the deadline for referees to upload letters for applications already submitted.", why: "This notice separates the application and reference deadlines and explicitly corrects the earlier date." },
      { title: "2026 applicant dashboard", text: "Your file remains open until June 15 if a reference is outstanding. Status: draft. This dashboard does not display application submission deadlines.", why: "An open file can still receive references. That does not extend the deadline to submit a draft." },
    ],
    verdict: "The evidence contradicts it", decisive: 1,
    reasoning: "June 15 is a real deadline, but it applies to referees. The applicant needs to submit by June 8, before the planned shift.",
    lesson: "When two dates look official, check who each deadline applies to and whether either source was updated.",
    references: ["nist"],
  },
  {
    kind: "claim",
    title: "The quote that changed on its way",
    brief: "Your campus club is making a carousel about a panel on AI and accessibility. Decide what can go on the first slide before the club posts it.",
    aiAnswer: "Dr. Park said: ‘Every student learns better with AI captions.’",
    consequences: {
      "The evidence supports it": "The carousel attributes words to Dr. Park that the recording does not support.",
      "The evidence contradicts it": "Your revised caption can say some students found lectures easier to follow, and attribute that as feedback rather than a measured learning result.",
      "There’s not enough evidence": "Holding the slide avoids the misquote, but the recording gives you enough to write an accurate paraphrase.",
    },
    evidence: [
      { title: "Event recording at 18:42", text: "Asked whether every student learns better with captions, Dr. Park replies: ‘We didn’t test learning outcomes. Some students told us captions made lectures easier to follow.’", why: "The recording gives the original wording and distinguishes student feedback from measured learning outcomes." },
      { title: "Campus news recap", text: "Dr. Park said AI captions helped some students follow lectures more easily. The recap paraphrases the panel and links the recording.", why: "The recap provides useful context, but a paraphrase cannot verify a direct quote." },
      { title: "Official slide deck", text: "Slide 9 lists a pilot goal: ‘Improve learning for every student.’ The deck was prepared before feedback was collected.", why: "An official slide can establish the project’s goal, but it cannot establish what the panelist said or what the pilot found." },
    ],
    verdict: "The evidence contradicts it", decisive: 0,
    reasoning: "The speaker explicitly says the pilot did not test learning outcomes. The proposed quotation turns narrower feedback into a finding about every student.",
    lesson: "Before quoting someone, listen to the answer in context. Separate the project’s aim, what people reported, and what was measured.",
    references: ["nist"],
  },
  {
    kind: "claim",
    title: "92 percent of whom?",
    brief: "You’re drafting a student newspaper story about how often young people use AI. Decide whether to run the chatbot’s number in a national headline.",
    aiAnswer: "92% of 16- to 24-year-olds nationwide use AI daily, according to a youth technology roundup.",
    consequences: {
      "The evidence supports it": "Readers would see a local club poll presented as a national statistic.",
      "The evidence contradicts it": "You can describe the club poll accurately, but you still don’t have a corrected national daily-use figure for the headline.",
      "There’s not enough evidence": "You keep the unsupported number out of the national headline and can report the club result with its scope.",
    },
    evidence: [
      { title: "National youth technology survey", text: "A national sample of 1,800 people aged 16–24 was asked whether they paid for an AI subscription in the past month. 31% said yes. The report does not provide daily-use figures.", why: "The survey has a relevant population, but asks a different question. Paying for a tool is different from using one. This survey cannot trace or verify the cited 92%." },
      { title: "Youth technology roundup", text: "‘At Westview High, 92% use AI daily.’ The sidebar links a robotics club survey. A separate chapter discusses the national sample.", why: "The roundup puts a local result beside national data. Being on the same page does not give both numbers the same scope." },
      { title: "Westview poll results and methods", text: "23 of 25 people who answered said they used AI daily. The poll was posted to one school’s robotics club chat. No other students were invited.", why: "This is the source of 92% and shows exactly who was counted. The poll does not estimate the national population." },
    ],
    verdict: "There’s not enough evidence", decisive: 2,
    reasoning: "The cited 92% describes club respondents. The national survey measures paid subscriptions. Neither establishes the nationwide daily rate.",
    lesson: "Follow a statistic back to its sample and question. Report the group it actually describes.",
    references: ["nist", "sampling"],
  },
  {
    kind: "claim",
    title: "The moving bus stop",
    brief: "Your group is meeting downtown on Saturday, October 17. Decide what instructions to send in the group chat. Two transit agency pages seem to disagree.",
    aiAnswer: "Board westbound Route 18 at the temporary Cedar Street stop at 11:10 a.m.",
    consequences: {
      "The evidence supports it": "Your group gets the correct temporary stop and departure time.",
      "The evidence contradicts it": "Changing the stop to Central Station would send riders to the normal boarding point during the temporary relocation.",
      "There’s not enough evidence": "Holding the instructions delays a useful update even though the agency’s route-specific alert confirms it.",
    },
    evidence: [
      { title: "Route 18 regular timetable", text: "Saturday westbound departures: Central Station at 10:40 and 11:10. This timetable lists scheduled service. Check service alerts for temporary changes.", why: "The timetable gives the normal stop and time. It explicitly leaves temporary changes to the alerts." },
      { title: "Service alert for October 17", text: "From 9 a.m. to 2 p.m., westbound Route 18 will board at Cedar Street instead of Central Station. Scheduled departure times stay the same. Eastbound service is unchanged.", why: "The notice matches the direction, date, and time. It also confirms the departure time is unchanged." },
      { title: "Agency update posted October 16", text: "Central Station remains open during the weekend event. Passengers should check their specific route for boarding changes.", why: "An open station does not mean every route boards there. This update gives no stop for the westbound 18." },
    ],
    verdict: "The evidence supports it", decisive: 1,
    reasoning: "11:10 is within the temporary alert window for the westbound route. The regular schedule still supplies the time, and the alert supplies the boarding stop.",
    lesson: "Check the specific direction and time window. A general service update and a route-specific exception can both be true.",
    references: ["nist"],
  },
];

const privacy: Privacy[] = [
  {
    kind: "privacy", title: "The club roster",
    brief: "You run the school games club’s public account. A former organizer shared their draft with private RSVP notes pasted below the useful event information. Rewrite the prompt for a public announcement that tells newcomers what, when, and where the meetup is.",
    original: "Draft an announcement for our board-game meetup this Friday at 4 p.m. in Room 204. Games are provided and beginners are welcome. RSVP notes for tone: Maya Chen (maya@example.test, 555-0101) is the only exchange student in the club and asked to be paired with a beginner. Work that example into the announcement.",
    example: "Draft a friendly announcement for our board game meetup this Friday at 4 p.m. in Room 204. Mention that beginners are welcome.",
    privateDetails: [
      { label: "A club member’s name", pattern: /\b(?:maya|chen)\b/ },
      { label: "A member’s private RSVP context. Generalize it to ‘beginners welcome’.", pattern: /\b(?:exchange student|paired with a beginner|rsvp notes)\b/ },
    ],
    requirements: [
      { label: "Ask for an announcement or invitation", pattern: /\b(?:announcement|invit\w*|flyer|notice|promot\w*|post)\b/ },
      { label: "Name the board-game meetup", pattern: /\b(?:board games?|tabletop games?)\b/ },
      { label: "Keep Room 204 so newcomers know where to go.", pattern: /\b(?:room|rm)\s*204\b/ },
      { label: "Keep Friday at 4 p.m.", pattern: /(?=.*\b(?:fri|friday)\b)(?=.*\b(?:4(?::00)?\s*p\s*m|16:00|four\s*p\s*m)\b)/s },
    ],
    lesson: "Keep the event and timing. A list of members and their contact details adds nothing to an announcement.",
    references: ["privacy"],
  },
  {
    kind: "privacy", title: "Thank the donors",
    brief: "You’re sending a newsletter after a community garden fundraiser. The coordinator wants supporters to know what they made possible. The notes you received include both public campaign information and a private donation record. Ask for a group thank-you that keeps the public purpose and the promised use of funds.",
    original: "Write a thank-you email for our community garden fundraiser. Donations will pay for raised beds and tools. From the treasurer’s notes: Noor Ali gave $250 using noor@example.test and asked not to be named. Mention that gift as an example without naming the person, and tell the group what we will buy.",
    example: "Write a warm thank-you email to community garden supporters. Explain that the funds will buy raised beds and tools.",
    privateDetails: [
      { label: "The donor’s name", pattern: /\b(?:noor|ali)\b/ },
      { label: "The donor’s individual contribution", pattern: /\b(?:250|two hundred(?: and)? fifty)\b/ },
    ],
    requirements: [
      { label: "Ask for a thank-you", pattern: /\b(?:thank\w*|gratitude|appreciation)\b/ },
      { label: "Explain what the money will buy: raised beds and tools.", pattern: /(?=.*\braised beds?\b)(?=.*\b(?:tools?|equipment)\b)/s },
      { label: "Keep the community garden context", pattern: /\b(?:community|neighbou?rhood|shared) garden\b/ },
    ],
    lesson: "Draft a general message first. Use an authorized process to personalize it later.",
    references: ["privacy"],
  },
  {
    kind: "privacy", title: "Make room",
    brief: "Your school is turning the gym into a venue for a showcase. A volunteer pasted part of a private accommodation request into the draft planning prompt. Ask for an event checklist that keeps the seating and step-free access needs. The checklist is for the whole venue.",
    original: "Make a venue checklist for the school showcase. We need accessible seating and a step-free route from the entrance to the seats. Accommodation note: Student 20481, our only Grade 11 robotics captain, has multiple sclerosis. Build the checklist around that student’s condition and include a note for volunteers explaining why they need the route.",
    example: "Create a school showcase checklist covering accessible seating and a step-free route from the entrance to the seating area.",
    privateDetails: [
      { label: "The student ID", pattern: /\b20481\b/ },
      { label: "Medical information", pattern: /\b(?:multiple sclerosis|diagnos\w*|medical condition)\b/ },
      { label: "A combination of details that could identify the student", pattern: /(?=.*\b(?:grade|year)\s*(?:11|eleven)\b)(?=.*\b(?:robotics|captain)\b)/s },
    ],
    requirements: [
      { label: "Keep the step-free route from the entrance.", pattern: /\b(?:step free|no steps|without stairs|wheelchair accessible route)\b/ },
      { label: "Ask for a checklist", pattern: /\b(?:check\s?list|list of steps|list of tasks)\b/ },
      { label: "Keep the accessible seating requirement", pattern: /\b(?:accessib\w*|wheelchair)\b.*\bseat\w*\b|\bseat\w*\b.*\b(?:accessib\w*|wheelchair)\b/s },
    ],
    lesson: "A unique combination of details can identify someone. Keep the access requirement and remove the personal backstory.",
    references: ["privacy"],
  },
  {
    kind: "privacy", title: "The incident note",
    brief: "Your club has a separate, restricted process for handling incident reports. Someone drafted a prompt to save time on formatting, but copied in part of a report. Ask for a reusable blank form with sections for immediate actions and follow-up. Keep details of the incident in the restricted process.",
    original: "Turn Jordan Lee’s witness account into an incident report we can reuse. They reported harassment outside the east stairwell after Tuesday rehearsal. They asked that a staff member check in the next day. Keep a section for immediate actions and one for follow-up actions. Use the actual account as a worked example.",
    example: "Create a blank incident report template with separate sections for immediate actions and follow-up.",
    privateDetails: [
      { label: "A person’s name", pattern: /\b(?:jordan|lee)\b/ },
      { label: "Details of the real incident in this case", pattern: /\b(?:harassment|rehearsal|witness account|east stairwell|check in the next day)\b/ },
    ],
    requirements: [
      { label: "Ask for a blank incident-report template", pattern: /(?=.*\b(?:blank|empty|generic|unfilled)\b)(?=.*\bincident\b)(?=.*\b(?:template|form|outline)\b)/s },
      { label: "Keep a section for steps taken right away.", pattern: /\b(?:immediate actions?|initial response|actions? taken|steps taken right away)\b/ },
      { label: "Keep a section for follow-up", pattern: /\b(?:follow\s?up|next steps|action items)\b/ },
    ],
    lesson: "Use the tool to draft the structure. Follow your organization’s authorized process for the incident itself.",
    references: ["privacy"],
  },
];

const bias: Bias[] = [
  {
    kind: "bias", title: "A volunteer shift people can reach",
    brief: "A food bank asks your club to pack weekend hampers. Arrange at most two alternatives so each student has a shift they can actually attend.",
    aiInput: "Choose one shift with enough open places. The spreadsheet lists shift times, sites, and capacity.",
    aiPlan: "Use Saturday morning at the industrial-road warehouse. It has the most open places.",
    gap: "Capacity was in the spreadsheet. Transit access, work shifts, and caregiving were missing.",
    people: [
      { name: "Sam", barrier: "I can do either day, but I rely on the bus. The nearest warehouse stop is a 35-minute walk along a road without a sidewalk." },
      { name: "Ari", barrier: "I have a car but work until 2 p.m. Saturday. Sunday afternoon is open." },
      { name: "Nia", barrier: "I care for my sibling on Sundays. I can do Saturday morning if I’m done by 11:30." },
    ],
    slots: 2,
    repairs: [
      { text: "Saturday 9–11 at the downtown depot, five minutes from a bus stop", helps: [0, 2], impact: "Works for Sam and Nia. Ari is still at work." },
      { text: "Sunday 3–5 at the warehouse", helps: [1], impact: "Works for Ari, who can drive. The location still excludes Sam and the day conflicts with Nia’s care duties." },
      { text: "Sunday 3–5 at the downtown depot", helps: [0, 1], impact: "Works for Sam and Ari. Nia still needs a Saturday option." },
      { text: "Saturday noon–2 at the downtown depot", helps: [0], impact: "Fixes transport for Sam, but overlaps Ari’s shift and ends after Nia’s cutoff." },
    ],
    example: [0, 2],
    lesson: "Compare each option with both travel and time constraints. A more central venue solves only one part of the problem.",
    references: ["ethics"],
  },
  {
    kind: "bias", title: "Who gets to build?",
    brief: "Your robotics team has two coaching blocks before the build. Revise the plan so students can try the roles they signed up to learn.",
    aiInput: "Assign build roles from these rows: student name, prior robotics experience, and existing skills.",
    aiPlan: "Send experienced members into programming. Assign everyone else to outreach.",
    gap: "The export left out students’ preferred roles and availability. Past experience became a stand-in for what students wanted to learn.",
    people: [
      { name: "Mei", barrier: "I want to code, but I haven’t joined a robotics team before. I need help with the first setup." },
      { name: "Eli", barrier: "I’ve programmed robots before, but I signed up to learn poster design. The draft assigned me to code again." },
      { name: "Luis", barrier: "I want to learn wiring. The only hardware intro is during my shift, but I can attend at lunch." },
    ],
    slots: 2,
    repairs: [
      { text: "Run a first-project coding block open to students without prior experience", helps: [0], impact: "Gives Mei a supported start. It leaves Eli’s assignment and Luis’s scheduling problem in place." },
      { text: "Use one block for a lunch wiring intro and a role sign-up where students can switch to design", helps: [1, 2], impact: "Lets Eli choose design and gives Luis a time he can attend. Beginners still need coding support." },
      { text: "Open a mentored coding block and allow experienced members to switch to design", helps: [0, 1], impact: "Works for Mei and Eli, but leaves hardware training at the original time." },
      { text: "Record the existing wiring intro and require a supervised lunch wiring check", helps: [2], impact: "Gives Luis the practice and supervision he needs, while leaving role assignments as they are." },
    ],
    example: [0, 1],
    lesson: "Prior experience can guide support. Ask what people want to learn before using it to assign their roles.",
    references: ["ethics"],
  },
  {
    kind: "bias", title: "The video-only workshop",
    brief: "Your group is teaching people to spot misleading charts. The facilitator can support two changes. Everyone needs a way to learn the method and submit the exercise.",
    aiInput: "Design one workshop for this time slot. Include a demo, guided practice, and a way to submit work.",
    aiPlan: "Run a live video call and have everyone submit the exercise before it ends.",
    gap: "The instructions gave a time slot, but nothing about device access, data limits, work schedules, or library hours.",
    people: [
      { name: "Jo", barrier: "I’m free for the session. My phone can handle text pages and messages, but my data plan is nearly out." },
      { name: "Rae", barrier: "I work during the session. I have Wi-Fi and can complete the exercise after 8 p.m." },
      { name: "Dev", barrier: "I only have internet at the library. It closes before the live call, but I can go the next afternoon." },
    ],
    slots: 2,
    repairs: [
      { text: "Add a text-only live session with the same exercise due before the session ends", helps: [0], impact: "Uses less data, but still requires everyone to be online at the original time." },
      { text: "Post an HD recording with the exercise due by midnight that day", helps: [1], impact: "Rae can use Wi-Fi after work. Jo still needs a small download, and Dev’s library has already closed." },
      { text: "Offer a small text lesson and phone submission through midnight that day", helps: [0, 1], impact: "Jo can use the material and Rae can work after 8 p.m. Dev cannot get online until tomorrow." },
      { text: "Run a next-afternoon library session with on-site submission", helps: [2], impact: "Works for Dev. It adds a way to participate at the library, without changing the online options for Jo and Rae." },
    ],
    example: [2, 3],
    lesson: "Check the full path from getting the lesson to submitting the work. A recording only fixes scheduling if people can access it before the deadline.",
    references: ["ethics"],
  },
  {
    kind: "bias", title: "The timetable everyone loves",
    brief: "You have two staff blocks to gather feedback on a pilot timetable before editing the report. Reach students the meeting missed and report whose views you actually heard.",
    aiInput: "Summarize these meeting notes. Five students stayed after school and all five said they liked the timetable.",
    aiPlan: "Write that students support the new timetable.",
    gap: "The notes covered attendees only. The summary broadened five people’s views to students generally.",
    people: [
      { name: "Tess", barrier: "I leave on the last school bus and can use a paper form at lunch, but I don’t have regular internet access after school." },
      { name: "Vic", barrier: "I’m off campus for a placement. I can answer an online form after work." },
      { name: "Amal", barrier: "I use a screen reader. The pilot feedback form was a scanned handout my reader couldn’t read." },
    ],
    slots: 2,
    repairs: [
      { text: "Offer paper forms at lunch and transcribe the answers for the report", helps: [0], impact: "Reaches Tess before the bus leaves. Paper alone is still inaccessible to Vic and Amal." },
      { text: "Email the scanned form to placement students and accept typed replies", helps: [1], impact: "Vic can reply off campus, but typing the answers does not make the scanned questions readable." },
      { text: "Publish a screen-reader-tested web form, including a link for placement students", helps: [1, 2], impact: "Reaches Vic and Amal. Tess still needs an option she can use at school without internet." },
      { text: "Collect verbal feedback at lunch and offer a phone slot for Amal", helps: [0, 2], impact: "Works for Tess and Amal, but still leaves out Vic, who needs an online option after work." },
    ],
    example: [0, 2],
    lesson: "Collect feedback through more than one channel and describe who responded. Better outreach still doesn’t make a voluntary sample representative by default.",
    references: ["ethics", "sampling"],
  },
];

const volunteer = bias[0];
volunteer.remix = {
  ...volunteer,
  title: "A volunteer shift people can reach · Transit change",
  brief: "The food bank needs help again. The downtown depot has lost Sunday bus service and its parking lot is closed for construction. Use at most two alternatives to give each student a workable shift under the new schedule.",
  people: [
    { name: "Sam", barrier: "I rely on the bus. I can still reach the depot on Saturday, but there’s no Sunday bus service there now." },
    ...volunteer.people.slice(1),
  ],
  repairs: volunteer.repairs.map((repair, i) => i === 2 ? {
    ...repair,
    helps: [],
    impact: "Sam has no bus. Ari cannot park there. Nia is busy on Sundays.",
  } : repair),
  example: [0, 1],
  gap: "The spreadsheet counts places but leaves out travel conditions. Even a plan that worked last week needs to be checked when access changes.",
};

export const games: Game[] = [
  {
    id: "claim", name: "Claim Checker", icon: "⌕", skill: "Check the evidence",
    description: "Open the case file and build a verdict you can defend.",
    instructions: [
      "Read the AI’s answer and open the source cards. Check who, what, and when each source actually covers.",
      "Choose Use as evidence on the source that best supports your decision to share, correct, or hold the claim.",
      "Submit your decision and see what would happen if someone followed it.",
    ],
    takeaway: "Match the evidence to the exact claim before sharing it.",
    scenarios: claims,
  },
  {
    id: "privacy", name: "Privacy Protector", icon: "◈", skill: "Protect information",
    description: "Rewrite a risky prompt so it still does the job.",
    instructions: [
      "Read the task and the original prompt above the editor.",
      "Rewrite the prompt in your own words. Remove or generalize private details while keeping the instructions needed to do the job.",
      "Select Check rewrite to submit. Compare your rewrite with the original to see what you removed, what still exposes someone, and which instructions went missing.",
    ],
    takeaway: "Share only the context needed for the job.",
    scenarios: privacy,
  },
  {
    id: "bias", name: "Bias Detective", icon: "◎", skill: "Notice what’s missing",
    description: "Try an AI plan from different perspectives, then repair it.",
    instructions: [
      "Compare what the AI was told with what it recommended and what people actually need.",
      "Choose repairs within the slot limit. You can preview the impact for one person before submitting.",
      "Select Test the plan to submit. Review who your repairs reached and what context the AI was missing.",
    ],
    takeaway: "Test plans with the people and constraints they need to account for.",
    scenarios: bias,
  },
];
