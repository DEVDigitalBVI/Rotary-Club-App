# Page loading and efficiency audit

## Scope and evidence

Reviewed shared authentication/layout loading and the data paths for Dashboard, Directory, member profiles, Events and event details, Projects and project details, News, Chat, Notifications, service records, Feedback, Onboarding, installation, and ClubRunner administration. Local development includes compilation overhead, so development navigation time is not a production benchmark.

This pass measures query structure and bounds through source inspection and tests. It does not claim a before/after page-load time, Lighthouse score, mobile LCP, or INP result. Representative populated data and a deployed HTTPS build are still needed for that benchmark.

## Changes implemented

| Area | Before | After |
|---|---|---|
| Shared member loading | Layout, shell, pages and event loaders independently invoke the same authenticated lookup | React request-scoped cache deduplicates identical lookups within one server render; no cross-user or persistent member cache |
| Dashboard chat preview | Four parallel queries plus a reactions query when messages exist; up to 50 messages per channel fetched to display two | One RLS-protected query returning at most two nondeleted messages and channel names |
| Dashboard request chain | Personal activity and onboarding wait for all initial data, including external feeds | Personal queries start as soon as the current member resolves, alongside other page data |
| News for ordinary members | Fetches events and RSVPs despite no permission to use the announcement composer | Event loading runs only for members who can post announcements |
| Public news feeds | No explicit network deadline on a cold fetch | Four-second deadline; existing stored-news fallback remains available |
| Shared rosters and inbox | Repeated identical member/committee/inbox loaders can repeat in the same render | Request-scoped deduplication by arguments |

The chat preview improvement is a reduction from 4–5 loader queries to 1, and from up to 50 × channel count message rows to 2. It excludes other dashboard queries and is not a claim about total page latency.

## Remaining growth-related costs

| Pages | Finding / next step |
|---|---|
| Events / calendar | Events and RSVP history are loaded in full. Separate upcoming events from paginated history when volume grows; preserve the calendar export's completeness. |
| Project details | Loads the full project list before selecting one project. Introduce a targeted detail loader and scoped summary RPCs together. |
| Projects | Participant and hour summaries cover all projects. Paginate archived projects and scope the aggregates at the database layer. |
| Chat | Initial conversation view loads 50 messages per channel. Move to a channel-summary list plus messages for only the selected channel. |
| Directory / profiles | Directory loads full member biographies and birthdays. A lightweight list projection can reduce transfer as membership grows. |
| Service records | Queries are paged in batches of 500 but all history is accumulated for filters/export. Move visible-history filters to the server, keeping export complete. |
| Feedback / Notifications | Feedback is paginated at 20; notifications are bounded at 100. Existing limits are appropriate. |
| Install / administration | Page body has no substantial standalone database load; shared shell and authentication dominate. |

## Validation

- 107 unit tests passed, including a new bounded-chat-preview query contract and error propagation checks.
- ESLint, TypeScript and production compilation passed.
- Auth checks and RLS remain in place. No database migration was needed.

For the next benchmark, use a production HTTPS deployment, a signed-in ordinary member and officer, realistic record volumes, and repeat cold/warm navigation on mobile throttling. Record TTFB, LCP, INP, JS transfer, and database request duration separately to avoid mistaking development compilation or internet latency for rendering cost.
