// Placeholder data for UI/UX scaffolding only. Replace with Supabase queries
// once the directory, events, dues, news, and chat backends are wired up.

// The demo data is frozen around this date, so "upcoming vs. past" has to be
// measured against it rather than the real clock — otherwise every event
// silently ages into the past. It lives here, next to the data it describes,
// because three separate pages were each carrying their own copy of it.
// Delete it along with the mock data once real queries land.
export const TODAY = "2026-08-17";

/**
 * Shifts a YYYY-MM-DD string back by `days`, returning the same format.
 * Done entirely in UTC: parsing as local time and formatting back through
 * toISOString() lands on the previous day for anyone east of UTC.
 */
export function daysBefore(iso: string, days: number) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

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
  avatarUrl?: string;
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
    avatarUrl: "https://i.pravatar.cc/150?u=m-hodge",
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
    avatarUrl: "https://i.pravatar.cc/150?u=m-francis",
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
// Accounts — mirrored from QuickBooks Online
// ---------------------------------------------------------------------------

// QuickBooks is the system of record for anything money-related: invoices
// originate there and payments are applied against member accounts there. The
// app never writes — it reads, and its job is to make the numbers legible to a
// member who is not going to log into QuickBooks to decipher them.
//
// These shapes deliberately mirror the QBO Accounting API entities (Invoice,
// its Lines, and Payment) rather than inventing a friendlier model, so that
// replacing this file with real API responses is a data-source change and not
// a redesign. Amounts are dollars; QBO returns them as decimals.

export type InvoiceLine = {
  id: string;
  description: string;
  /** The meeting or event the line covers, where there is one. */
  serviceDate?: string;
  amount: number;
};

export type Invoice = {
  id: string;
  /** QBO's human-facing invoice number (DocNumber) — what the member quotes. */
  docNumber: string;
  memberId: string;
  /** QBO TxnDate: the date the invoice was issued. */
  txnDate: string;
  dueDate: string;
  total: number;
  /** Amount still outstanding. Zero once fully paid. */
  balance: number;
  lines: InvoiceLine[];
  /**
   * A QuickBooks Payments link, present only if the club has that product
   * enabled — it is a separate subscription from QuickBooks Online itself and
   * has not been confirmed for this club yet. While it is undefined the UI
   * tells members how to pay in person instead of showing a dead button.
   */
  paymentLink?: string;
};

export type PaymentMethod = "cash" | "check" | "online";

export type Payment = {
  id: string;
  memberId: string;
  txnDate: string;
  amount: number;
  method: PaymentMethod;
  /** Cheque number or similar — QBO's PaymentRefNum. */
  reference?: string;
  /** DocNumber of the invoice this payment was applied against. */
  appliedTo?: string;
};

export const invoices: Invoice[] = [
  {
    id: "inv-1041",
    docNumber: "1041",
    memberId: "m-hodge",
    txnDate: "2026-08-01",
    dueDate: "2026-08-15",
    total: 95,
    balance: 0,
    lines: [
      { id: "ln-1", description: "Weekly meeting — in person", serviceDate: "2026-07-09", amount: 30 },
      { id: "ln-2", description: "Weekly meeting — in person", serviceDate: "2026-07-16", amount: 30 },
      { id: "ln-3", description: "Weekly meeting — online", serviceDate: "2026-07-23", amount: 5 },
      { id: "ln-4", description: "Scholarship Fund Golf Tournament", serviceDate: "2026-07-25", amount: 30 },
    ],
  },
  {
    id: "inv-1052",
    docNumber: "1052",
    memberId: "m-hodge",
    txnDate: "2026-08-15",
    dueDate: "2026-08-31",
    total: 60,
    balance: 60,
    lines: [
      { id: "ln-5", description: "Weekly meeting — in person", serviceDate: "2026-08-06", amount: 30 },
      { id: "ln-6", description: "Weekly meeting — in person", serviceDate: "2026-08-13", amount: 30 },
    ],
  },
  {
    id: "inv-1038",
    docNumber: "1038",
    memberId: "m-james",
    txnDate: "2026-07-01",
    dueDate: "2026-07-31",
    total: 250,
    balance: 150,
    lines: [
      { id: "ln-7", description: "Annual membership dues 2026–2027", amount: 250 },
    ],
  },
  {
    id: "inv-1053",
    docNumber: "1053",
    memberId: "m-james",
    txnDate: "2026-08-15",
    dueDate: "2026-08-31",
    total: 30,
    balance: 30,
    lines: [
      { id: "ln-8", description: "Weekly meeting — in person", serviceDate: "2026-08-13", amount: 30 },
    ],
  },
  {
    id: "inv-1054",
    docNumber: "1054",
    memberId: "m-pemberton",
    txnDate: "2026-08-15",
    dueDate: "2026-08-31",
    total: 60,
    balance: 60,
    lines: [
      { id: "ln-9", description: "Scholarship Fund Golf Tournament", serviceDate: "2026-07-25", amount: 30 },
      { id: "ln-10", description: "Weekly meeting — in person", serviceDate: "2026-08-13", amount: 30 },
    ],
  },
  {
    id: "inv-1039",
    docNumber: "1039",
    memberId: "m-rollins",
    txnDate: "2026-07-01",
    dueDate: "2026-07-31",
    total: 250,
    balance: 250,
    lines: [
      { id: "ln-11", description: "Annual membership dues 2026–2027", amount: 250 },
    ],
  },
  {
    id: "inv-1040",
    docNumber: "1040",
    memberId: "m-francis",
    txnDate: "2026-08-01",
    dueDate: "2026-08-15",
    total: 60,
    balance: 0,
    lines: [
      { id: "ln-12", description: "Weekly meeting — in person", serviceDate: "2026-07-09", amount: 30 },
      { id: "ln-13", description: "Weekly meeting — in person", serviceDate: "2026-07-16", amount: 30 },
    ],
  },
];

export const payments: Payment[] = [
  { id: "pmt-1", memberId: "m-hodge", txnDate: "2026-08-04", amount: 95, method: "check", reference: "Check #2210", appliedTo: "1041" },
  { id: "pmt-2", memberId: "m-james", txnDate: "2026-07-05", amount: 100, method: "check", reference: "Check #1042", appliedTo: "1038" },
  { id: "pmt-3", memberId: "m-francis", txnDate: "2026-08-06", amount: 60, method: "cash", appliedTo: "1040" },
  { id: "pmt-4", memberId: "m-hodge", txnDate: "2026-07-01", amount: 150, method: "online", reference: "Prepayment", appliedTo: "1030" },
];

/** Newest first, matching how QBO lists a customer's transactions. */
export function invoicesForMember(memberId: string) {
  return invoices
    .filter((invoice) => invoice.memberId === memberId)
    .sort((a, b) => (a.txnDate < b.txnDate ? 1 : -1));
}

export function paymentsForMember(memberId: string) {
  return payments
    .filter((payment) => payment.memberId === memberId)
    .sort((a, b) => (a.txnDate < b.txnDate ? 1 : -1));
}

/**
 * What the member owes: the sum of what is still outstanding on their
 * invoices. This is the app's stand-in for QBO's customer Balance field, which
 * a real integration would read directly rather than recompute.
 */
export function balanceForMember(memberId: string) {
  return invoicesForMember(memberId).reduce(
    (total, invoice) => total + invoice.balance,
    0
  );
}

/** An invoice is overdue once its due date has passed with a balance left. */
export function isOverdue(invoice: Invoice, today: string = TODAY) {
  return invoice.balance > 0 && invoice.dueDate < today;
}

export function overdueBalanceForMember(memberId: string, today: string = TODAY) {
  return invoicesForMember(memberId)
    .filter((invoice) => isOverdue(invoice, today))
    .reduce((total, invoice) => total + invoice.balance, 0);
}

/**
 * Stands in for the record a real integration would keep of its last
 * successful pull from the QuickBooks API. Offset from the current clock so
 * the preview always shows a healthy, recent sync; a real one would be a
 * stored timestamp, and "stale" and "disconnected" are the states the UI has
 * to survive — QBO's OAuth tokens expire, so a connection that silently died
 * is a normal condition rather than an edge case.
 */
export const quickbooksSync: {
  lastSyncedAt: string;
  status: "ok" | "stale" | "disconnected";
} = {
  lastSyncedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  status: "ok",
};

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
