// Placeholder data for UI/UX scaffolding only. Replace with Supabase queries
// once the directory, events, dues, news, and chat backends are wired up.

export type MembershipStatus = "active" | "inactive" | "honorary";
export type MemberRole = "member" | "admin";

export type Member = {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  classification: string;
  joinDate: string;
  status: MembershipStatus;
  role: MemberRole;
  committees: string[];
  bio?: string;
  avatarColor: string;
};

export const members: Member[] = [
  {
    id: "m-hodge",
    name: "Jamaal Hodge",
    initials: "JH",
    email: "jamaal.hodge@example.com",
    phone: "(284) 555-0142",
    classification: "Software Development",
    joinDate: "2021-03-14",
    status: "active",
    role: "admin",
    committees: ["Board", "Membership"],
    bio: "Club secretary. Builds the tools nobody else wants to.",
    avatarColor: "var(--rotary-blue)",
  },
  {
    id: "m-francis",
    name: "Althea Francis",
    initials: "AF",
    email: "althea.francis@example.com",
    phone: "(284) 555-0118",
    classification: "Marine Biology",
    joinDate: "2018-09-02",
    status: "active",
    role: "admin",
    committees: ["Board", "Community Service"],
    bio: "Club president, 2025–2026. Runs the reef cleanup every spring.",
    avatarColor: "var(--rotary-turquoise)",
  },
  {
    id: "m-charles",
    name: "Devon Charles",
    initials: "DC",
    email: "devon.charles@example.com",
    phone: "(284) 555-0107",
    classification: "Accounting",
    joinDate: "2016-01-20",
    status: "active",
    role: "admin",
    committees: ["Board", "Finance"],
    bio: "Treasurer. Sends the friendliest past-due reminders in the district.",
    avatarColor: "var(--rotary-grass)",
  },
  {
    id: "m-james",
    name: "Renee James",
    initials: "RJ",
    email: "renee.james@example.com",
    phone: "(284) 555-0163",
    classification: "Hospitality Management",
    joinDate: "2022-06-11",
    status: "active",
    role: "member",
    committees: ["Events"],
    avatarColor: "var(--rotary-cranberry)",
  },
  {
    id: "m-pemberton",
    name: "Marcus Pemberton",
    initials: "MP",
    email: "marcus.pemberton@example.com",
    phone: "(284) 555-0199",
    classification: "Civil Engineering",
    joinDate: "2019-11-05",
    status: "active",
    role: "member",
    committees: ["Community Service"],
    avatarColor: "var(--rotary-violet)",
  },
  {
    id: "m-defreitas",
    name: "Nadia DeFreitas",
    initials: "ND",
    email: "nadia.defreitas@example.com",
    phone: "(284) 555-0175",
    classification: "Pediatric Medicine",
    joinDate: "2023-02-27",
    status: "active",
    role: "member",
    committees: ["International Service"],
    avatarColor: "var(--rotary-sky)",
  },
  {
    id: "m-rollins",
    name: "Corey Rollins",
    initials: "CR",
    email: "corey.rollins@example.com",
    phone: "(284) 555-0184",
    classification: "Real Estate",
    joinDate: "2020-08-19",
    status: "inactive",
    role: "member",
    committees: ["Membership"],
    avatarColor: "var(--rotary-orange)",
  },
  {
    id: "m-simmonds",
    name: "Patrice Simmonds",
    initials: "PS",
    email: "patrice.simmonds@example.com",
    phone: "(284) 555-0130",
    classification: "Public Education",
    joinDate: "2014-04-30",
    status: "honorary",
    role: "member",
    committees: [],
    bio: "Past president, 2016–2017.",
    avatarColor: "var(--rotary-azure)",
  },
  {
    id: "m-outten",
    name: "Kevin Outten",
    initials: "KO",
    email: "kevin.outten@example.com",
    phone: "(284) 555-0156",
    classification: "Marine Transport",
    joinDate: "2021-10-08",
    status: "active",
    role: "member",
    committees: ["Events", "Community Service"],
    avatarColor: "var(--rotary-cardinal)",
  },
];

export const currentMember = members[0];

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export type RsvpStatus = "yes" | "no" | "maybe" | "none";

export type EventItem = {
  id: string;
  title: string;
  date: string; // ISO date
  time: string;
  location: string;
  isVirtual: boolean;
  description: string;
  speaker?: { name: string; topic: string };
  rsvpDeadline?: string;
  rsvps: { yes: number; no: number; maybe: number };
  myRsvp: RsvpStatus;
  attendance?: { present: number; total: number };
  attendeeIds?: string[];
};

export const events: EventItem[] = [
  {
    id: "e-1",
    title: "Weekly Club Meeting",
    date: "2026-08-20",
    time: "12:00 PM – 1:15 PM",
    location: "Peebles Hospitality Centre, Road Town",
    isVirtual: false,
    description:
      "Regular weekly luncheon meeting with club business and program.",
    speaker: { name: "Dr. Nadia DeFreitas", topic: "Pediatric outreach in the sister isles" },
    rsvpDeadline: "2026-08-19",
    rsvps: { yes: 24, no: 3, maybe: 2 },
    myRsvp: "yes",
    attendeeIds: [
      "m-hodge",
      "m-francis",
      "m-charles",
      "m-james",
      "m-pemberton",
      "m-outten",
    ],
  },
  {
    id: "e-2",
    title: "Reef Cleanup — Cane Garden Bay",
    date: "2026-08-23",
    time: "8:00 AM – 11:00 AM",
    location: "Cane Garden Bay Beach",
    isVirtual: false,
    description:
      "Community service morning with the Marine Conservation Society. Bring reef-safe sunscreen and a reusable water bottle.",
    rsvps: { yes: 15, no: 1, maybe: 4 },
    myRsvp: "maybe",
  },
  {
    id: "e-3",
    title: "Weekly Club Meeting (Virtual)",
    date: "2026-08-27",
    time: "12:00 PM – 1:00 PM",
    location: "Zoom",
    isVirtual: true,
    description: "Virtual meeting for members traveling this week.",
    speaker: { name: "District 7020 Governor's Rep", topic: "District conference preview" },
    rsvpDeadline: "2026-08-26",
    rsvps: { yes: 11, no: 0, maybe: 1 },
    myRsvp: "none",
  },
  {
    id: "e-4",
    title: "Board Meeting",
    date: "2026-09-02",
    time: "6:00 PM – 7:30 PM",
    location: "Club Office, Wickhams Cay",
    isVirtual: false,
    description: "Monthly board meeting. Board members and committee chairs only.",
    rsvps: { yes: 6, no: 0, maybe: 0 },
    myRsvp: "yes",
  },
  {
    id: "e-5",
    title: "Weekly Club Meeting",
    date: "2026-08-13",
    time: "12:00 PM – 1:15 PM",
    location: "Peebles Hospitality Centre, Road Town",
    isVirtual: false,
    description: "Regular weekly luncheon meeting with club business and program.",
    speaker: { name: "Marcus Pemberton", topic: "Harbour resilience project update" },
    rsvps: { yes: 26, no: 2, maybe: 0 },
    myRsvp: "yes",
    attendance: { present: 24, total: 28 },
    attendeeIds: [
      "m-hodge",
      "m-francis",
      "m-charles",
      "m-james",
      "m-pemberton",
      "m-defreitas",
      "m-outten",
    ],
  },
  {
    id: "e-6",
    title: "Scholarship Fund Golf Tournament",
    date: "2026-07-25",
    time: "7:30 AM – 2:00 PM",
    location: "Carambola Golf Course, St. Croix",
    isVirtual: false,
    description: "Annual fundraiser supporting the district scholarship fund.",
    rsvps: { yes: 32, no: 4, maybe: 0 },
    myRsvp: "yes",
    attendance: { present: 30, total: 36 },
  },
];

// ---------------------------------------------------------------------------
// Dues & meeting fees — account ledger
// ---------------------------------------------------------------------------

export type LedgerEntry = {
  id: string;
  memberId: string;
  type: "charge" | "payment";
  amount: number;
  date: string;
  label: string;
  meta?: string; // meeting name for charges, payment method for payments
};

export const feeSettings = {
  inPersonFee: 30,
  onlineFee: 5,
  annualDues: 250,
};

export type FeeSettings = typeof feeSettings;

export const ledgerEntries: LedgerEntry[] = [
  { id: "l-1", memberId: "m-hodge", type: "payment", amount: 150, date: "2026-07-01", label: "Prepayment", meta: "Online" },
  { id: "l-2", memberId: "m-hodge", type: "charge", amount: 30, date: "2026-07-09", label: "Weekly Club Meeting", meta: "In person" },
  { id: "l-3", memberId: "m-hodge", type: "charge", amount: 30, date: "2026-07-16", label: "Weekly Club Meeting", meta: "In person" },
  { id: "l-4", memberId: "m-hodge", type: "charge", amount: 5, date: "2026-07-23", label: "Weekly Club Meeting", meta: "Online" },
  { id: "l-5", memberId: "m-hodge", type: "charge", amount: 30, date: "2026-07-25", label: "Scholarship Fund Golf Tournament", meta: "In person" },
  { id: "l-6", memberId: "m-hodge", type: "charge", amount: 30, date: "2026-08-13", label: "Weekly Club Meeting", meta: "In person" },
  { id: "l-7", memberId: "m-james", type: "charge", amount: 30, date: "2026-08-13", label: "Weekly Club Meeting", meta: "In person" },
  { id: "l-8", memberId: "m-james", type: "charge", amount: 250, date: "2026-07-01", label: "Annual Membership Dues", meta: "2026–2027" },
  { id: "l-9", memberId: "m-james", type: "payment", amount: 100, date: "2026-07-05", label: "Payment", meta: "Check #1042" },
  { id: "l-10", memberId: "m-pemberton", type: "charge", amount: 30, date: "2026-08-13", label: "Weekly Club Meeting", meta: "In person" },
  { id: "l-11", memberId: "m-pemberton", type: "charge", amount: 30, date: "2026-07-25", label: "Scholarship Fund Golf Tournament", meta: "In person" },
  { id: "l-12", memberId: "m-rollins", type: "charge", amount: 250, date: "2026-07-01", label: "Annual Membership Dues", meta: "2026–2027" },
];

export function ledgerForMember(memberId: string) {
  return ledgerEntries
    .filter((entry) => entry.memberId === memberId)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function balanceForMember(memberId: string) {
  return ledgerEntries
    .filter((entry) => entry.memberId === memberId)
    .reduce((balance, entry) => balance + (entry.type === "charge" ? entry.amount : -entry.amount), 0);
}

// ---------------------------------------------------------------------------
// News
// ---------------------------------------------------------------------------

export type NewsSource = "club" | "district" | "ri";

export type NewsPost = {
  id: string;
  title: string;
  body: string;
  source: NewsSource;
  date: string;
  author: string;
};

export const newsPosts: NewsPost[] = [
  {
    id: "n-1",
    title: "New meeting time starting September",
    body: "Starting September 3rd, weekly meetings will begin at 12:00 PM instead of 12:30 PM to accommodate the Peebles Centre's updated booking hours. Same location, same Wednesday schedule.",
    source: "club",
    date: "2026-08-16",
    author: "Althea Francis",
  },
  {
    id: "n-2",
    title: "District Conference registration now open",
    body: "Registration for the 2026 District 7020 Conference in Tortola is now open. Early-bird pricing ends September 30th. Contact the club secretary for the group registration code.",
    source: "district",
    date: "2026-08-12",
    author: "District 7020",
  },
  {
    id: "n-3",
    title: "Rotary Foundation surpasses $4 billion in global giving",
    body: "The Rotary Foundation announced this week that cumulative giving has surpassed $4 billion since its founding, funding polio eradication, clean water, and literacy programs worldwide.",
    source: "ri",
    date: "2026-08-10",
    author: "Rotary International",
  },
  {
    id: "n-4",
    title: "Reef cleanup volunteers needed",
    body: "We still need 6 more volunteers for Sunday's Cane Garden Bay reef cleanup. RSVP on the Events tab if you can make it — gloves and bags provided.",
    source: "club",
    date: "2026-08-08",
    author: "Marcus Pemberton",
  },
  {
    id: "n-5",
    title: "Applications open for Global Grant scholarships",
    body: "Rotary International is now accepting applications for 2027 Global Grant scholarships in peace and conflict resolution, disease prevention, and economic development.",
    source: "ri",
    date: "2026-08-01",
    author: "Rotary International",
  },
];

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

export type ChatMessage = {
  id: string;
  senderId: string;
  body: string;
  timestamp: string;
};

export type Channel = {
  id: string;
  name: string;
  kind: "channel" | "dm";
  memberIds: string[];
  messages: ChatMessage[];
};

export const channels: Channel[] = [
  {
    id: "c-general",
    name: "General",
    kind: "channel",
    memberIds: members.map((m) => m.id),
    messages: [
      { id: "msg-1", senderId: "m-francis", body: "Reminder: Wednesday's meeting starts at the new time, 12:00 PM sharp.", timestamp: "2026-08-17T14:02:00" },
      { id: "msg-2", senderId: "m-charles", body: "Statements went out this morning — a few of you have a balance, check My Account when you get a chance.", timestamp: "2026-08-17T14:10:00" },
      { id: "msg-3", senderId: "m-outten", body: "Can we get a few more hands for the reef cleanup Sunday? Great turnout so far.", timestamp: "2026-08-17T15:44:00" },
    ],
  },
  {
    id: "c-community-service",
    name: "Community Service",
    kind: "channel",
    memberIds: ["m-francis", "m-pemberton", "m-outten", "m-hodge"],
    messages: [
      { id: "msg-4", senderId: "m-pemberton", body: "Dropped off the supplies at the harbour office, ready for Sunday.", timestamp: "2026-08-16T18:20:00" },
      { id: "msg-5", senderId: "m-francis", body: "Perfect, thank you Marcus.", timestamp: "2026-08-16T18:25:00" },
    ],
  },
  {
    id: "dm-francis",
    name: "Althea Francis",
    kind: "dm",
    memberIds: ["m-hodge", "m-francis"],
    messages: [
      { id: "msg-6", senderId: "m-francis", body: "Can you post the golf tournament photos to the news feed?", timestamp: "2026-08-15T10:05:00" },
      { id: "msg-7", senderId: "m-hodge", body: "On it — posting this afternoon.", timestamp: "2026-08-15T10:12:00" },
    ],
  },
];
