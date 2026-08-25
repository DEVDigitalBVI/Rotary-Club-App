-- Club officers may remove a roster row created in error. Most real departures
-- should use members.status = 'inactive' so the club's history is retained.
-- Foreign-key restrictions still prevent deletion when protected history (for
-- example authored chat messages) must remain attributable.
create policy "members_delete" on members for delete to authenticated
  using (runs_the_club() and id <> current_member_id());
