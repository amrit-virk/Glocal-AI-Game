export type SceneId = "studio" | "archive" | "courtyard";
export type DocumentId = "draft" | "booking" | "poster" | "roster" | "update";
export type PersonId = "ada" | "mara" | "ivo";
export type EndingId = "clear-signal" | "last-minute-save" | "crossed-wires";

export const scenes: Record<SceneId, { name: string; description: string; exits: SceneId[] }> = {
  studio: {
    name: "Broadcast room",
    description: "Rain ticks against the windows. The evening bulletin is waiting on the desk.",
    exits: ["archive", "courtyard"],
  },
  archive: {
    name: "Equipment room",
    description: "A warm printer, old event notices, and the original booking messages.",
    exits: ["studio", "courtyard"],
  },
  courtyard: {
    name: "Sheltered courtyard",
    description: "Two volunteers wait under the awning. Across the water, the harbour hall lights come on.",
    exits: ["studio", "archive"],
  },
};

export const documents: Record<DocumentId, { title: string; source: string; body: string; clue: string }> = {
  draft: {
    title: "AI-generated radio announcement",
    source: "AI assistant · unchecked draft",
    body: "The harbour repair café opens this Saturday. Opening time is 18:00. Bring a small item to mend. Enter through the front doors. All volunteers can watch the mobile briefing at 6:15.",
    clue: "The assistant was given a flyer and a booking email. It combined them without checking which details apply tonight.",
  },
  booking: {
    title: "Tonight’s booking",
    source: "Harbour hall · Saturday, 14:20",
    body: "Confirmed for SATURDAY. Public opening is 18:30, after the market clears the hall. The street-side front doors lock at 18:00. Evening visitors must use the EAST ENTRANCE, which has a step-free ramp.",
    clue: "This is tonight’s booking confirmation. It specifies the opening time and the entrance after the front doors lock.",
  },
  poster: {
    title: "Last month’s poster",
    source: "Printed flyer · previous repair café",
    body: "FRIDAY REPAIR CAFÉ · 18:00 · FRONT DOORS. The notes on the back say: ‘Reuse the layout next time. Confirm new details with the hall.’",
    clue: "A reusable layout is not a current schedule. This flyer belongs to a different event.",
  },
  roster: {
    title: "Private volunteer notes",
    source: "Mara · restricted planning sheet",
    body: "Noor Patel · noor@example.test · 555-0142. Gets the 17:50 bus. Ivo has an old phone and almost no data, and will collect supplies at the station before leaving for the hall. Rae uses a wheelchair. She asked us to keep her diagnosis, multiple sclerosis, out of group messages. The east ramp needs to be clear.",
    clue: "Use the practical requirements to plan. The names, contact details, and diagnosis do not belong in an AI request for a general briefing.",
  },
  update: {
    title: "The late service notice",
    source: "Transit desk · Saturday, 17:35",
    body: "The 17:50 harbour bus is cancelled because the road is flooded. The station’s driver can still take the inland road. A shared pickup can carry Noor, Ivo, and the briefing sheets. The east entrance remains available. Please update travel arrangements before broadcasting.",
    clue: "The opening time has not changed. The transport plan has. A briefing sent by phone does not solve a missing bus.",
  },
};

export const people: Record<PersonId, { name: string; role: string; color: string }> = {
  ada: { name: "Ada", role: "Station engineer", color: "#5e8490" },
  mara: { name: "Mara", role: "Repair café organizer", color: "#aa6f84" },
  ivo: { name: "Ivo", role: "Volunteer courier", color: "#65a49b" },
};

export type Dialogue = { speaker: string; lines: string[] };
export const conversations: Record<PersonId, Dialogue> = {
  ada: {
    speaker: "Ada",
    lines: [
      "You’re on the evening desk. The repair café needs its bulletin before we close up. Our AI assistant wrote the announcement. It mixed details from different events, so we need to check its work.",
      "I gave the AI last month’s poster and today’s booking message. Originals are in the equipment room. Talk to Mara and Ivo outside before you approve the volunteer plan.",
      "Use the desk to edit the bulletin and prepare a briefing. You can test and revise the work. Sending a prompt shares its contents. Going on air is your final commitment.",
    ],
  },
  mara: {
    speaker: "Mara",
    lines: [
      "We’re repairing lamps and small household things at the hall tonight. The market is packing up first, so please use the hall’s actual opening time.",
      "I copied my private volunteer sheet into a request for the AI. It hasn’t been sent yet. It’s on the bench. We need practical instructions, but nobody’s contact details or diagnosis should go into the assistant.",
      "Rae needs the east ramp clear. We can put a greeter there and move the market trolley. The crew can handle three points’ worth of arrangements. Ask Ivo what he needs before choosing.",
    ],
  },
  ivo: {
    speaker: "Ivo",
    lines: [
      "I’m collecting the tools here, then going to the hall. My phone barely loads messages. The AI suggested a video briefing for everyone, but that won’t reach me.",
      "If someone prints a sheet, I can carry it. A shared pickup would work too if the driver brings copies. Noor usually takes the bus. Rae can get there herself if the ramp is clear.",
      "A plan can sound inclusive and still assume everyone has the same connection or transport. Give us a way to actually follow it.",
    ],
  },
};

export const promptOriginal = "Write a volunteer briefing for the harbour repair café. Noor Patel, noor@example.test, 555-0142, is arriving by bus. Ivo has no mobile data. Rae has multiple sclerosis and uses a wheelchair. Explain the opening time and east entrance, give an offline way to get the instructions, and include the private notes so it feels personal.";
export const promptExample = "Write a general volunteer briefing for the repair café. Use the confirmed opening time and east entrance. Include a printable or offline copy and keep the step-free ramp clear.";

export const arrangements = [
  { id: "bus", name: "Meet the 17:50 bus", cost: 1, description: "A greeter meets the scheduled harbour service.", impact: "Works for Noor only while that service runs." },
  { id: "print", name: "Print a briefing sheet", cost: 1, description: "Leave a paper copy with the tools Ivo collects.", impact: "Ivo gets instructions without downloading a video." },
  { id: "ramp", name: "Clear and staff the east ramp", cost: 1, description: "Move the trolley and put a greeter at the step-free entrance.", impact: "Rae can enter through the confirmed evening entrance." },
  { id: "shuttle", name: "Shared pickup, with briefing sheets", cost: 2, description: "The station driver takes the inland road and brings printed copies.", impact: "Noor gets a lift. Ivo travels with the tools and gets a paper briefing." },
  { id: "video", name: "Send everyone the video briefing", cost: 1, description: "Send a link for people to watch before their shift.", impact: "A video still needs data and doesn’t provide a ride or clear the ramp." },
] as const;

export const endings: Record<EndingId, { title: string; summary: string; scene: string; hint: string }> = {
  "clear-signal": {
    title: "A Clear Signal",
    summary: "A careful broadcast, a private briefing, and a plan that works.",
    scene: "At 18:30, the east entrance glows. The pickup arrives with the tools and printed sheets. Rae rolls past the cleared trolley. Inside, someone switches on the first repaired lamp.",
    hint: "Verify the bulletin, send only useful context, and make the final arrangements work for everyone.",
  },
  "last-minute-save": {
    title: "The Last-Minute Save",
    summary: "You caught the disruption and got people to the right place.",
    scene: "The pickup turns into the courtyard just as your closing music starts. Everyone reaches the east entrance. Ada spots a problem in the earlier request and helps you contain it before the next shift.",
    hint: "A working launch can still carry the cost of an earlier information decision.",
  },
  "crossed-wires": {
    title: "Crossed Wires",
    summary: "The bulletin went out, but some of the details didn’t connect.",
    scene: "Your closing music fades. A message comes back from the hall. Someone has been left waiting, or the announcement has sent people to the wrong place. The next shift starts with corrections to make.",
    hint: "Match the final announcement and arrangements to the original messages and the late notice.",
  },
};

export const references = [
  { title: "Privacy and generative AI", publisher: "Office of the Privacy Commissioner of Canada", url: "https://www.priv.gc.ca/en/privacy-topics/technology/artificial-intelligence/gd_principles_ai/", note: "Necessity, proportionality, and limiting the personal information used for a task." },
  { title: "AI Risk Management Framework", publisher: "NIST", url: "https://www.nist.gov/itl/ai-risk-management-framework", note: "Checking reliability and considering the context in which AI output will be used." },
  { title: "Ethics of artificial intelligence", publisher: "UNESCO", url: "https://www.unesco.org/en/artificial-intelligence/recommendation-ethics", note: "Fairness, inclusion, and attention to people affected by a system." },
];

export const announcementClaims = [
  {
    id: "day", title: "Event day", text: "The harbour repair café opens this Saturday.",
    correction: "Change to Friday", expected: "keep",
    evidence: { booking: "Confirmed for SATURDAY.", poster: "FRIDAY REPAIR CAFÉ · 18:00 · FRONT DOORS.", draft: "The harbour repair café opens this Saturday." },
    why: "Saturday was already correct: tonight’s booking confirms it. Checking AI also means keeping claims the evidence supports.",
    consequence: "Changing this to Friday sends listeners to the wrong day; withholding it leaves a confirmed date out of the announcement.",
  },
  {
    id: "time", title: "Opening time", text: "Opening time is 18:00.",
    correction: "Change to 18:30", expected: "correct",
    evidence: { booking: "Public opening is 18:30, after the market clears the hall.", poster: "FRIDAY REPAIR CAFÉ · 18:00 · FRONT DOORS.", draft: "Opening time is 18:00." },
    why: "Tonight’s booking says 18:30. The AI carried 18:00 over from an older event. Check whether a source applies to this occasion.",
    consequence: "An 18:00 announcement sends visitors before the hall is ready; withholding the time leaves them without an arrival time.",
  },
  {
    id: "entrance", title: "Visitor entrance", text: "Enter through the front doors.",
    correction: "Change to the east entrance", expected: "correct",
    evidence: { booking: "The street-side front doors lock at 18:00. Evening visitors must use the EAST ENTRANCE, which has a step-free ramp.", poster: "FRIDAY REPAIR CAFÉ · 18:00 · FRONT DOORS.", draft: "Enter through the front doors." },
    why: "Tonight’s booking specifies the east entrance. The older flyer’s front doors will be locked. A familiar instruction can still be wrong in a new context.",
    consequence: "Keeping the front doors sends listeners to a locked entrance; withholding the entrance leaves them without a usable route.",
  },
] as const;
export type ClaimId = typeof announcementClaims[number]["id"];
export const claimReasons = [
  { id: "current", text: "It applies to tonight’s event." },
  { id: "confidence", text: "The AI sounds certain." },
  { id: "reuse", text: "Old event details still apply." },
] as const;
