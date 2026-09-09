# Project slots and attendance

Status: implemented and locally tested; connected Supabase migration requires explicit approval before activation.

## Setup

Apply `supabase/migrations/20260909004450_project_slots_and_leadership.sql` to the intended Supabase project through the normal migration process. The connected project is `ezdoxdcnbwhdzhbumkye`. Until then, the dashboard stays usable and project scheduling shows a setup message.

Existing projects initially belong to Community Service. A club officer can change the responsible committee on the project scheduling page. Existing volunteer enrollments, hours, and makeups are retained; legacy enrollments are not automatically assigned to time slots.

## Club workflow

1. Open Projects, then View slots & attendance. A club officer or responsible committee manager selects a lead and optional deputy from that committee. Leaving the committee removes their delegated access.
2. The secretary, responsible committee manager, or assigned project leader creates slots with a date, start/end time, capacity, location, and signup cutoff. Times use British Virgin Islands time.
3. Members book slots, join a full slot's waitlist, cancel before cutoff, or switch slots. Overlapping choices are rejected. Switching to a full slot preserves the original booking. A cancellation promotes the earliest waiting member and creates an in-app notification.
4. Once a slot starts, a manager records Present, Absent, or Excused, adds walk-ins, and adjusts hours if needed. Unrecorded members remain unrecorded. Present defaults to the slot duration.
5. Saving attendance credits service hours immediately without approval and creates one meeting makeup per member per project day. Multiple slots add hours without duplicating that day's makeup. This does not mark a regular meeting attended.
6. The secretary opens Projects → Meeting makeups · ClubRunner entry, enters credits in ClubRunner, then marks them Logged. ClubRunner synchronization is manual.
7. Attendance corrections update hours and makeup credits together, preserve an audit history, and queue any required ClubRunner removal. A stale roster must be refreshed before saving.

Booked slots cannot be edited; cancel and replace them if plans change. Slots with recorded attendance cannot be cancelled. Projects with scheduling records are retained rather than deleted.

## Verification

- `npm run lint`
- `npm test -- --run`
- `npm run build -- --webpack`
- Install `@electric-sql/pglite` in a temporary directory, then run `PGLITE_MODULE=/absolute/path/to/@electric-sql/pglite/dist/index.js node tests/database/project-slots.mjs`.

The database test applies every repository migration to an isolated PostgreSQL runtime and checks delegated access, committee eligibility, capacity, waitlist promotion, atomic switching, direct-write denial, participation summaries, attendance credits, adjustments, stale submissions, makeup corrections, audit privacy, and revoked committee membership. It never connects to the shared database.
