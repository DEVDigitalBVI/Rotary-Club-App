# Member balance snapshots — agreed direction

Discussed September 15, 2026. Planning only; implementation is deferred until the user confirms the record identifier and QuickBooks export capabilities.

## Purpose

QuickBooks remains the authoritative financial record. The app displays a monthly snapshot of each member's balance uploaded by the treasurer. This is not a second bookkeeping system: no invoice generation, payment recording, dues calculation, or meeting-charge automation is included.

## Agreed approach

- Show a private **My balance** card on the Home dashboard, never on directory profiles.
- Show amount, currency, and balance-as-of date, with a note to contact the treasurer about questions or recent payments.
- Distinguish amount due, confirmed zero (paid up), credit, and balance not yet available. A missing record must never imply zero.
- Give the treasurer a restricted **Member balances** administration page for CSV upload, preview, publishing, and private upload history.
- Proposed CSV fields: shared member identifier, member name for human review, and balance. Positive balances mean owed; negative balances mean credit. Confirm these conventions against the actual export before implementation.
- Select a balance-as-of date for the batch and use an explicitly displayed, agreed currency. Adapt the import format once a sample export is available.
- Match by a stable shared identifier. Email is a possible fallback if needed; names alone must not establish a match.
- Preview matched members, old and proposed balances, unknown or duplicate identifiers, invalid amounts, and omitted members before publishing.
- Nothing is published on upload alone. Resolve invalid rows and ambiguous matches before publishing the batch.
- If a member is omitted, preserve their previous balance and its original date. Do not make it appear newly updated.
- Store each balance's member, amount, currency, as-of date, upload batch, publisher, and publication time.
- Retain previous published uploads privately for audit and correction history. Members initially see only their latest published balance.
- Corrections retain a traceable history. Prevent accidental replacement of newer balances by older uploads without explicit review.
- Enforce privacy at the database and interface levels: members can read only their own published balances; the treasurer manages uploads and corrections. Other officers do not automatically receive access to all balances.
- Show the treasurer the latest batch publication and members whose balances have older dates.

## Monthly workflow

Export from QuickBooks → upload CSV → review changes → publish.

## Waiting on the user

1. Identify the cross-referenced member ID available in both the club's member records and QuickBooks.
2. Determine whether the installed QuickBooks edition can export the required fields to CSV, including the member identifier and latest balance.

Resume by reviewing the available export structure and matching identifiers before designing the schema or implementing the feature. Do not build yet.
