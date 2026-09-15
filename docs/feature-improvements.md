# Feature improvements

Implementation checklist for the accepted September 14 feature review.

- [x] Shared notification state, recovery and pagination
- [x] Participation-based onboarding
- [x] Bounded dashboard queries and independent sections
- [x] Event pagination, chronological ordering and summary queries
- [x] Direct project queries, summaries, on-demand audit and personal slots
- [x] Conversation summaries and on-demand chat threads
- [x] Independent external news and partial feed merging
- [x] Lightweight member pickers and persistent directory filters
- [x] Roster, recognition, role and handover previews
- [x] Year-filtered service records, aggregate totals and full exports
- [x] Makeup filters, exports and bulk completion
- [x] Roster import field-level preview
- [x] Feedback filters and unanswered queue
- [x] Authentication linking errors and recovery
- [x] Draft preservation and offline recovery
- [x] Regression tests, build and database verification
- [x] Before/after performance evidence

Production data is not used in local test fixtures. Timings and payload measurements
must identify their environment and authentication context; query-count reductions
alone are not claims of a measured user-visible speedup.

## Delivered behavior

- A single notification provider serves both navigation layouts and the inbox.
  Read writes are acknowledged before the UI reports success. Realtime events,
  reconnects and focus reconcile counts; older notifications use timestamp/ID
  cursors and can be loaded beyond the former 100-row cap.
- Onboarding derives participation from confirmed RSVPs and non-cancelled slot
  registrations, while preserving legacy project participation. Only the directory
  visit is manually recorded; saved flags cannot falsely complete participation.
- Dashboard previews are bounded to three upcoming events, three notices and two
  open projects. Only birthday profiles needed today are loaded. Personal activity
  and conversation sections stream separately with their own failure messages.
- Events are paginated in date/time order. Card counts are aggregated in Postgres;
  individual RSVPs remain in the event detail workflow.
- Project cards load summaries and aggregate counts. Editing, impact and RI tools
  live on the selected project's detail page. Attendance history loads on expansion.
  `/projects/my-slots` lists the current member's bookings and waitlist places.
- Chat initially loads one preview per conversation plus the selected thread.
  Other threads load on selection. Reconnect refreshes include the selected thread.
- Club notices render independently from external news. Available feed entries
  merge with stored fallbacks individually and duplicate source URLs are removed.
- Member pickers use lightweight records; directory search, committee, recognition
  and tab choices survive navigation through URL parameters.
- Committee roster, director, officer and recognition edits show before/after
  changes. Annual handover requires acknowledgement of its named-officer preview.
- Service records load a selected Rotary year. `/service-record/export` explicitly
  exports the signed-in member's complete history, with private/no-store responses.
- Makeup queues offer search, additions/corrections filters, CSV export and bulk
  completion. A stale selection causes the entire batch to roll back.
- Roster import previews all additions, changed fields and unchanged records.
  A fingerprint detects changes between preview and the apply-time reread.
  Missing values preserve existing fields; CSV status cannot revoke membership.
- Feedback provides category, status and unanswered filters with pagination.
- Sign-in reports roster-linking failures with recovery instructions.
- Chat, announcement, project and feedback drafts survive reloads within the same
  tab. Drafts are scoped to the member and cleared on sign-out. Files, passwords
  and hidden fields are excluded. Reconnection messages guide failed-save recovery.

## Verification

- 137 unit tests passed across 23 files.
- All four isolated Postgres suites passed: feedback, project slots, event reminders
  and feature efficiency. These exercise authorization, rollback, date boundaries,
  RSVP counts, news priority and service totals with synthetic fixtures.
- Lint and TypeScript (including unused-symbol checks) passed.
- Production build passed. Safari smoke test confirmed login rendering and the
  protected dashboard's signed-out redirect. Authenticated browser interaction
  tests were not performed: no signed-in session was available.
- Migration `20260915020155_feature_efficiency.sql` is applied to Supabase project
  `ezdoxdcnbwhdzhbumkye`; its filename matches the remote migration version.
  All six new functions are SECURITY INVOKER, deny anon execution, and grant
  execution to authenticated users subject to RLS and explicit function checks.
- Remote empty-input read checks passed. No member records were altered for tests.

## Performance evidence

Synthetic authenticated-member test in isolated PGlite, one event with 50 RSVPs:

| Response | Before | After |
| --- | ---: | ---: |
| Rows returned for event registration display | 50 | 1 |
| Serialized JSON bytes | 9,501 | 153 |
| Single cold query sample, milliseconds | 6.10 | 5.51 |

The payload reduction is about 98.4%. The single timing sample is illustrative,
not a production speed claim. Full signed-in page timings and mobile-network
transfer measurements remain a deployment-validation step.

Other structural reductions: one notification subscription instead of two mounted
bells; selected-project lookup instead of loading every project; one chat preview
per inactive conversation instead of 50; year-bounded service queries and a scalar
hours total instead of transferring every hours row to calculate it in JavaScript.
No speculative database indexes were added.

## Existing Supabase advisories

Advisor counts were unchanged before and after this migration: 9 anonymous and 27
signed-in SECURITY DEFINER execution notices, plus disabled leaked-password
protection. None concerns a newly added function. These pre-existing notices need
separate assessment; they are not all demonstrated vulnerabilities. References:
[anonymous execution](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable),
[signed-in execution](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable),
[password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
