# Feature improvements

Implementation checklist for the accepted September 14 feature review.

- [ ] Shared notification state, recovery and pagination
- [ ] Participation-based onboarding
- [ ] Bounded dashboard queries and independent sections
- [ ] Event pagination, chronological ordering and summary queries
- [ ] Direct project queries, summaries, on-demand audit and personal slots
- [ ] Conversation summaries and on-demand chat threads
- [ ] Independent external news and partial feed merging
- [ ] Lightweight member pickers and persistent directory filters
- [ ] Roster, recognition, role and handover previews
- [ ] Year-filtered service records, aggregate totals and full exports
- [ ] Makeup filters, exports and bulk completion
- [ ] Roster import field-level preview
- [ ] Feedback filters and unanswered queue
- [ ] Authentication linking errors and recovery
- [ ] Draft preservation and offline recovery
- [ ] Regression tests, build and database verification
- [ ] Before/after performance evidence

Production data is not used in local test fixtures. Timings and payload measurements
must identify their environment and authentication context; query-count reductions
alone are not claims of a measured user-visible speedup.
