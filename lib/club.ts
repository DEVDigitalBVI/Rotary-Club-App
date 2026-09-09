// Shared club types, reference options, and permission helpers.
import { todayDateString } from "@/lib/format";
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

/**
 * Rotary Foundation recognition. Kept on the member but not editable by them:
 * these are club records of giving, maintained by the Secretary and the
 * Foundation director, so a member cannot award themselves a Paul Harris.
 */
export type FoundationRecognition = {
  /**
   * How many Paul Harris Fellow recognitions the member holds, stored as a
   * total: 0 none, 1 a Paul Harris Fellow, 4 a fellow with three additional
   * recognitions. Note that Rotary's shorthand counts the *additions*, so a
   * total of 4 is written "PHF+3" — paulHarrisLabel() does that conversion, so
   * store the total here and never the +N.
   */
  paulHarrisCount: number;
  /** Member of the PolioPlus Society. */
  polioPlusSociety: boolean;
  /** Rotary Action Groups the member belongs to. */
  actionGroups: string[];
};

/** Elected club officers. Distinct from committee directorships below. */
export type ClubPosition =
  | "president"
  | "president-elect"
  | "secretary"
  | "secretary-elect"
  | "treasurer";

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
  /** Set only for the handful of members holding an elected office. */
  position?: ClubPosition;
  /** Absent when the club has nothing recorded yet. */
  foundation?: FoundationRecognition;
  bio?: string;
  /** YYYY-MM-DD. Absent until the member sets it themselves. */
  dateOfBirth?: string;
  avatarColor: string;
  avatarUrl?: string;
};

// ---------------------------------------------------------------------------
// Committees
// ---------------------------------------------------------------------------

// The club runs five standing committees, each led by a director. Committees
// are their own records rather than a list of strings on each member, because
// they now carry a director and an editable roster — and because the roster is
// the thing a director is given permission to change.

export type CommitteeId =
  | "board"
  | "youth-service"
  | "membership"
  | "club-administration"
  | "foundation"
  | "community-service";

export type Committee = {
  id: CommitteeId;
  name: string;
  description: string;
  /**
   * The member who leads it. Absent on the Board, which the President chairs
   * ex officio rather than having a director appointed to it.
   */
  directorId?: string;
  /** Includes the director — they sit on their own committee. */
  memberIds: string[];
  /**
   * How the committee is led. A standing committee has a director who runs it;
   * the Board is led by the officers collectively. This describes leadership,
   * not permission — see committeeManageRight() for who may edit a roster.
   */
  managedBy: "director" | "officers";
};

const positionLabels: Record<ClubPosition, string> = {
  president: "President",
  "president-elect": "President-Elect",
  secretary: "Secretary",
  "secretary-elect": "Secretary-Elect",
  treasurer: "Treasurer",
};

export function positionLabel(position: ClubPosition | undefined) {
  return position ? positionLabels[position] : undefined;
}

export function committeesForMember(memberId: string, roster: Committee[]) {
  return roster.filter((committee) => committee.memberIds.includes(memberId));
}

export function committeesDirectedBy(memberId: string, roster: Committee[]) {
  return roster.filter((committee) => committee.directorId === memberId);
}

/**
 * The President, the Secretary, or the Club Administration director — the
 * people who run the club day to day. President-Elect and Secretary-Elect
 * carry the same standing once the President names them (see
 * canAssignRoles below for who may do the naming). Several distinct
 * permissions land on this same group today; they stay separate exported
 * functions below so that one can change later without dragging the others
 * along with it.
 */
function runsTheClub(member: Member, roster: Committee[]) {
  if (
    member.position === "president" ||
    member.position === "president-elect" ||
    member.position === "secretary" ||
    member.position === "secretary-elect"
  ) {
    return true;
  }
  return roster.some(
    (committee) =>
      committee.id === "club-administration" && committee.directorId === member.id
  );
}

/**
 * Who may assign President, Secretary, Treasurer, and committee directors,
 * and who may run the annual handover (startNewRotaryYearAction).
 * Deliberately narrower than runsTheClub(): the Club Administration
 * director runs meetings, not the roster.
 */
export function canAssignRoles(member: Member) {
  return (
    member.position === "president" ||
    member.position === "president-elect" ||
    member.position === "secretary" ||
    member.position === "secretary-elect"
  );
}

/**
 * The one person who may name a President-Elect or Secretary-Elect.
 * Deliberately excludes the Elects themselves — full access to run the club
 * day to day isn't the same as the standing to name your own successor.
 */
export function isPresident(member: Member) {
  return member.position === "president";
}

/**
 * Adding someone to the club roster is a club-officer act, not a committee
 * one: it is how a person becomes a Rotarian here.
 */
export function canAddMembers(member: Member, roster: Committee[]) {
  return runsTheClub(member, roster);
}

/**
 * Any board member may post a club announcement. Deliberately wider than
 * runsTheClub(): the Board includes every committee director, and a director
 * needs to be able to tell the club about their own committee's work without
 * routing it through an officer.
 */
export function canPostNews(member: Member, roster: Committee[]) {
  return roster.some(
    (committee) =>
      committee.id === "board" && committee.memberIds.includes(member.id)
  );
}

/**
 * Posting meeting materials — flyers and agendas — falls to whoever runs the
 * meetings, which is Club Administration's stated remit.
 */
export function canManageEvents(member: Member, roster: Committee[]) {
  return runsTheClub(member, roster);
}

/**
 * Rotary Action Groups, grouped by the area of focus each serves. Kept in that
 * structure rather than flattened alphabetically because the areas of focus
 * are how Rotarians navigate this list — someone looking for their group knows
 * the cause before they know the group's exact name.
 *
 * Names are RI's own, punctuation included: display them verbatim, and treat
 * them as the stored value, so renaming one here is a data migration.
 */
export const actionGroupsByArea: { area: string; groups: string[] }[] = [
  {
    area: "Promoting Peace",
    groups: [
      "Domestic Violence Prevention",
      "Peace",
      "Refugees, Forced Displacement, and Migration",
      "Slavery Prevention",
    ],
  },
  {
    area: "Fighting Disease",
    groups: [
      "Addiction Prevention",
      "Alzheimer's and Dementia",
      "Blindness Prevention",
      "Blood, Tissue, and Organ Donation",
      "Diabetes",
      "Family Health and AIDS Prevention",
      "Health Education and Wellness",
      "Hearing",
      "Hepatitis Eradication",
      "Malaria",
      "Mental Health Initiatives",
      "Multiple Sclerosis",
      "Polio Survivors and Associates",
    ],
  },
  {
    area: "Providing Clean Water and Sanitation",
    groups: [
      "Menstrual Health and Hygiene",
      "Water, Sanitation, and Hygiene (WASH)",
    ],
  },
  {
    area: "Saving Mothers and Children",
    groups: ["Clubfoot", "Reproductive, Maternal, and Child Health"],
  },
  {
    area: "Supporting Education",
    groups: ["Basic Education and Literacy"],
  },
  {
    area: "Growing Local Economies",
    groups: ["Community Economic Development", "Disaster Assistance"],
  },
  {
    area: "Protecting the Environment",
    groups: ["Endangered Species", "Environmental Sustainability"],
  },
  {
    area: "Multi-Focus Groups",
    groups: ["Food Plant Solutions"],
  },
];

/** Flat list, for anything that just needs to know the valid values. */
export const actionGroupOptions = actionGroupsByArea.flatMap(
  (entry) => entry.groups
);

const emptyRecognition: FoundationRecognition = {
  paulHarrisCount: 0,
  polioPlusSociety: false,
  actionGroups: [],
};

/** Normalises the optional field so callers never branch on undefined. */
export function foundationRecognition(member: Member): FoundationRecognition {
  return member.foundation ?? emptyRecognition;
}

/**
 * Formats a recognition total the way Rotary International writes it: the
 * first recognition is a plain "Paul Harris Fellow", and each one after that
 * is a "+N" counting the additions — so a total of 4 reads PHF+3, not PHF×4.
 * Returns null below 1 so callers render nothing rather than an empty badge.
 */
export function paulHarrisLabel(count: number, short = false) {
  if (count < 1) return null;
  if (count === 1) return short ? "PHF" : "Paul Harris Fellow";
  // Abbreviated it closes up ("PHF+3"); spelled out it takes a space
  // ("Paul Harris Fellow +3"), which is how RI sets it.
  return short ? `PHF+${count - 1}` : `Paul Harris Fellow +${count - 1}`;
}

export function hasAnyRecognition(member: Member) {
  const recognition = foundationRecognition(member);
  return (
    recognition.paulHarrisCount > 0 ||
    recognition.polioPlusSociety ||
    recognition.actionGroups.length > 0
  );
}

/**
 * Foundation recognition is a giving record, so it is maintained by the
 * Secretary and the Foundation director rather than by members or by whoever
 * happens to hold another directorship.
 */
export function canEditRecognition(member: Member, roster: Committee[]) {
  if (member.position === "secretary" || member.position === "secretary-elect") return true;
  return roster.some(
    (committee) =>
      committee.id === "foundation" && committee.directorId === member.id
  );
}

/** Why a member may edit a committee's roster, or null if they may not. */
export type CommitteeManageRight = "director" | "officer" | null;

/**
 * A director owns their own committee's roster. The President and Secretary
 * can edit any of them, but that is an override rather than their normal
 * business — it exists for the director who is travelling, unresponsive, or
 * mid-handover. So this returns *why* the right is held rather than a bare
 * boolean, and the UI says which one is in play: an officer reshuffling
 * someone else's committee should be able to see that that is what they are
 * doing.
 */
export function committeeManageRight(
  member: Member,
  committee: Committee
): CommitteeManageRight {
  if (committee.directorId === member.id) return "director";
  if (canAssignRoles(member)) return "officer";
  return null;
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export type RsvpStatus = "yes" | "no" | "maybe" | "none";

/** The poster for an event — the thing that gets shared around before it. */
export type EventFlyer = {
  url: string;
  alt: string;
};

/** The agenda document for a meeting. */
export type EventAgenda = {
  fileName: string;
  url: string;
  /** ISO date the file was posted. */
  uploadedAt: string;
  sizeLabel?: string;
};

export type EventItem = {
  id: string;
  title: string;
  startsAt?: string; // Original absolute instant for calendar exports
  endsAt?: string;
  date: string; // ISO date
  time: string;
  location: string;
  isVirtual: boolean;
  description: string;
  speaker?: { name: string; topic: string };
  rsvpDeadline?: string;
  rsvps: { yes: number; no: number; maybe: number; guests?: number; waitlisted?: number };
  myRsvp: RsvpStatus;
  registration?: {
    guestCount: number;
    dietaryNotes: string;
    status: "registered" | "waitlisted";
  };
  capacity?: number;
  allowGuests?: boolean;
  waitlistEnabled?: boolean;
  dietaryNotesEnabled?: boolean;
  attendance?: { present: number; total: number };
  attendeeIds?: string[];
  attendeeGuestCounts?: Record<string, number>;
  /** Whether this event counts toward the bylaws' 50%-of-meetings requirement. */
  countsTowardAttendance: boolean;
  flyer?: EventFlyer;
  agenda?: EventAgenda;
};

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

/** An invoice is overdue once its due date has passed with a balance left. */
export function isOverdue(invoice: Invoice, today: string = todayDateString()) {
  return invoice.balance > 0 && invoice.dueDate < today;
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
  priority?: "normal" | "important" | "urgent";
  isPinned?: boolean;
  expiresAt?: string;
  requiresAcknowledgement?: boolean;
  acknowledgedAt?: string;
  audience?: { type: "all" | "board" | "committee" | "event"; id?: string };
  /** A photo or graphic attached to a club announcement. */
  image?: { url: string; alt: string };
  /**
   * Where a syndicated item came from. Only club announcements are written in
   * this app — district items are pulled from the District 7020 site and RI
   * items from Rotary International's news feed, so those carry a link back to
   * the original and are never editable here.
   */
  sourceUrl?: string;
};

/** True for anything the club did not write itself. */
export function isSyndicated(post: NewsPost) {
  return post.source !== "club";
}

/**
 * Source names and links for the live external news feeds.
 */
export const newsFeeds: Record<
  Exclude<NewsSource, "club">,
  { name: string; homeUrl: string }
> = {
  district: {
    name: "District 7020",
    homeUrl: "https://7020.org/",
  },
  ri: {
    name: "Rotary International",
    homeUrl: "https://www.rotary.org/en/news-features",
  },
};

/** How many items each external feed contributes to the news list. */
export const FEED_POST_LIMIT = 2;

/**
 * Every club announcement shows, but each external feed contributes only its
 * two most recent items. Without a cap, a busy RI feed would bury the club's
 * own news — which is the reason a member opens this screen at all.
 */
export function visibleNewsPosts(posts: NewsPost[]) {
  const seen: Record<string, number> = { district: 0, ri: 0 };
  return [...posts]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .filter((post) => {
      if (post.source === "club") return true;
      seen[post.source] += 1;
      return seen[post.source] <= FEED_POST_LIMIT;
    });
}


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