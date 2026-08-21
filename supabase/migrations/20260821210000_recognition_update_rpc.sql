-- canEditRecognition() (Secretary or the Foundation director) is a narrower,
-- different group than runs_the_club() (which members_update's RLS relies
-- on) — a Foundation director who isn't also an officer would pass the UI
-- check but fail a plain table update. This RPC enforces the correct rule
-- directly and only ever touches the three recognition columns, regardless
-- of what else a caller might try to pass.
create or replace function update_member_recognition(
  target_member_id uuid,
  p_paul_harris_count integer,
  p_polio_plus_society boolean,
  p_action_groups text[]
)
returns members
language plpgsql
security definer
set search_path = public
as $$
declare
  updated members;
begin
  if not can_edit_recognition() then
    raise exception 'not permitted';
  end if;

  update members
  set
    paul_harris_count = greatest(0, p_paul_harris_count),
    polio_plus_society = p_polio_plus_society,
    action_groups = p_action_groups
  where id = target_member_id
  returning * into updated;

  return updated;
end;
$$;

revoke all on function update_member_recognition(uuid, integer, boolean, text[]) from public;
revoke execute on function update_member_recognition(uuid, integer, boolean, text[]) from anon;
grant execute on function update_member_recognition(uuid, integer, boolean, text[]) to authenticated;
