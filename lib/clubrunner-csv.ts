export type ClubRunnerMemberRow = {
  rowNumber: number;
  name: string;
  email: string;
  phone?: string;
  classification?: string;
  joinDate?: string;
  status?: "active" | "inactive" | "honorary";
};

export type ClubRunnerCsvResult = {
  rows: ClubRunnerMemberRow[];
  errors: string[];
};

const aliases = {
  name: ["name", "membername", "fullname"],
  firstName: ["firstname", "givenname"],
  lastName: ["lastname", "surname", "familyname"],
  email: ["email", "emailaddress", "primaryemail"],
  phone: ["phone", "phonenumber", "primaryphone", "mobile", "cellphone"],
  classification: ["classification", "rotaryclassification"],
  joinDate: ["joindate", "datejoined", "memberdate", "admissiondate"],
  status: ["status", "memberstatus", "membershipstatus", "membertype"],
} as const;

function normalizedHeader(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseRecords(input: string) {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (character === '"') {
      if (quoted && input[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      record.push(field.trim());
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && input[index + 1] === "\n") index += 1;
      record.push(field.trim());
      if (record.some(Boolean)) records.push(record);
      record = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error("The CSV contains an unclosed quoted value.");
  record.push(field.trim());
  if (record.some(Boolean)) records.push(record);
  return records;
}

function columnIndex(headers: string[], candidates: readonly string[]) {
  return headers.findIndex((header) => candidates.includes(header));
}

function valueAt(record: string[], index: number) {
  return index >= 0 ? record[index]?.trim() ?? "" : "";
}

function normalizedDate(value: string) {
  if (!value) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const match = value.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (!match) return null;
  const [, month, day, year] = match;
  const candidate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  const parsed = new Date(`${candidate}T12:00:00Z`);
  return Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== candidate
    ? null
    : candidate;
}

function normalizedStatus(value: string) {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (normalized.includes("honorary")) return "honorary" as const;
  if (normalized.includes("inactive") || normalized.includes("former") || normalized.includes("terminated")) return "inactive" as const;
  if (normalized.includes("active") || normalized.includes("member")) return "active" as const;
  return undefined;
}

export function parseClubRunnerCsv(input: string): ClubRunnerCsvResult {
  const cleanInput = input.replace(/^\uFEFF/, "");
  let records: string[][];
  try {
    records = parseRecords(cleanInput);
  } catch (error) {
    return { rows: [], errors: [error instanceof Error ? error.message : "The CSV could not be read."] };
  }

  if (records.length < 2) return { rows: [], errors: ["The CSV needs a header row and at least one member."] };

  const headers = records[0].map(normalizedHeader);
  const indexes = {
    name: columnIndex(headers, aliases.name),
    firstName: columnIndex(headers, aliases.firstName),
    lastName: columnIndex(headers, aliases.lastName),
    email: columnIndex(headers, aliases.email),
    phone: columnIndex(headers, aliases.phone),
    classification: columnIndex(headers, aliases.classification),
    joinDate: columnIndex(headers, aliases.joinDate),
    status: columnIndex(headers, aliases.status),
  };

  const errors: string[] = [];
  if (indexes.email < 0) errors.push("Add an Email or Email Address column.");
  if (indexes.name < 0 && indexes.firstName < 0 && indexes.lastName < 0) {
    errors.push("Add a Name column, or First Name and Last Name columns.");
  }
  if (errors.length > 0) return { rows: [], errors };

  const rows: ClubRunnerMemberRow[] = [];
  const seenEmails = new Set<string>();
  records.slice(1).forEach((record, offset) => {
    const rowNumber = offset + 2;
    const name = valueAt(record, indexes.name) || [valueAt(record, indexes.firstName), valueAt(record, indexes.lastName)].filter(Boolean).join(" ");
    const email = valueAt(record, indexes.email).toLowerCase();
    const joinDateValue = valueAt(record, indexes.joinDate);
    const joinDate = normalizedDate(joinDateValue);

    if (!name || !email) {
      errors.push(`Row ${rowNumber}: name and email are required.`);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(`Row ${rowNumber}: ${email || "the email"} is not valid.`);
      return;
    }
    if (seenEmails.has(email)) {
      errors.push(`Row ${rowNumber}: ${email} appears more than once.`);
      return;
    }
    if (joinDate === null) {
      errors.push(`Row ${rowNumber}: use YYYY-MM-DD or MM/DD/YYYY for the join date.`);
      return;
    }

    seenEmails.add(email);
    rows.push({
      rowNumber,
      name,
      email,
      phone: valueAt(record, indexes.phone) || undefined,
      classification: valueAt(record, indexes.classification) || undefined,
      joinDate,
      status: normalizedStatus(valueAt(record, indexes.status)),
    });
  });

  return { rows, errors };
}
