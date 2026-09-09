# Event reminders and waitlist promotion

Implemented and locally tested. Remote activation is pending explicit approval of `supabase/migrations/20260909010958_event_reminders_and_promotion.sql` for project `ezdoxdcnbwhdzhbumkye`.

## Behavior

- Confirmed Going RSVPs receive in-app reminders within 24 hours and within 2 hours of the event. The worker runs every five minutes. Late RSVPs receive the applicable reminder on its next run.
- Waitlisted, Maybe, Not going, inactive members, and past events receive no reminders. Event notification preferences apply to both reminders and promotion notices.
- Reminder delivery is deduplicated by recipient, event, start time, and reminder window. Rescheduling permits fresh reminders for the new start time. Reminders already in the inbox remain historical messages.
- Cancelling a booking or increasing capacity promotes the oldest eligible waiting booking when its entire party fits. A member and guests stay together; smaller later bookings do not jump the queue.
- Editing a waitlisted RSVP preserves its queue time; leaving and rejoining gets a new position. Existing queue order uses the recorded RSVP response time.
- Cancellations are allowed after the RSVP deadline and before the event starts. Promotions may also happen after the deadline. New Yes/Maybe RSVPs remain closed after the deadline.
- The scheduled worker also reconciles queues with available seats, including existing queues and seats released by administrative deletion.
- Database event-row locks serialize bookings and promotions. Members cannot write derived registration status directly. No email, SMS, or push delivery is configured.

## Activation

The migration installs `pg_cron`, schedules `rotary-event-reminders` every five minutes, and moves RSVP writes behind an authenticated RPC. The current RSVP action falls back to the existing database-enforced upsert only while that RPC is absent.

After applying, verify `cron.job` contains an active `rotary-event-reminders` job and inspect `cron.job_run_details` for successful runs. Match the local migration version to Supabase's recorded version.

## Tests

`PGLITE_MODULE=/absolute/path/to/@electric-sql/pglite/dist/index.js node tests/database/event-reminders.mjs`

This applies all migrations to isolated PostgreSQL, skips pg_cron installation when the extension is unavailable, and invokes the actual worker directly. It covers capacity, guest groups, queue order, promotion notices, deadlines, permissions, preferences, duplicate reminders, rescheduling, and past events. It does not exercise a real scheduler or simultaneous database connections.
