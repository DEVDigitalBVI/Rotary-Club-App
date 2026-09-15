# Performance review — September 15, 2026

## Changes

- News announcement audience options now fetch only event IDs and titles. Previously this picker loaded complete event records and the visible RSVP roster for all events. The event lookup now uses one database request instead of two, excluding the separately shared current-member lookup.
- Calendar downloads now select only the event fields written to the ICS file. They no longer query RSVPs or perform an extra member lookup inside the event loader. The route still verifies an active member before loading records and returns private/no-store responses.
- Event details use lightweight member summaries for attendee names, avatars, and the attendance picker. The ordinary member-list path uses two queries instead of four and no longer loads biographies, contact fields, recognition, or birthdays. Existing current-member and committee permission checks remain intact.
- Member-summary and superuser-visibility queries run concurrently. Failure of either still fails the request; superusers remain excluded from their own picker roster.
- News audience and acknowledgement-summary requests are awaited together so both failures are handled by the same awaited operation.

All reads retain the existing authenticated Supabase client and database access policies. No shared cache, database migration, new feature, or remote data change was introduced.

## Validation

- 151 tests passed across 25 files.
- Lint passed.
- Production build, including TypeScript validation, passed.
- Added regression coverage for calendar authorization and independence from RSVP failures; event option query scope and failures; concurrent member-summary reads and visibility enforcement.

## Measurements and limits

Query reductions above are based on the executed code paths and mocked regression checks, not measured production latency. No authenticated browser interaction or live database performance measurement was performed.

A directory editor lazy-loading experiment reduced the gzip total of the JavaScript chunks listed for the member-directory client entry from 192,084 to 191,582 bytes (about 0.3%), while increasing the listed chunk count. That experiment was removed; the final directory implementation is unchanged. These were local Next.js production-build artifacts, not browser transfer measurements.

Next measurement should compare authenticated Home, Events, News, and Chat navigations on the deployment, including mobile-network conditions, before selecting further optimizations.
