-- A classification is normally roster identity maintained by club leadership.
-- Let a member supply it when the roster has no value yet, but preserve the
-- existing leadership-only rule for every later change. The members_update RLS
-- policy still limits an ordinary member to their own row.
create or replace function enforce_members_self_service_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is null or runs_the_club() then
    return new;
  end if;

  if new.id is distinct from old.id
    or new.name is distinct from old.name
    or new.email is distinct from old.email
    or (
      new.classification is distinct from old.classification
      and not (
        nullif(btrim(old.classification), '') is null
        and nullif(btrim(new.classification), '') is not null
        and char_length(btrim(new.classification)) <= 100
      )
    )
    or new.join_date is distinct from old.join_date
    or new.status is distinct from old.status
    or new.created_at is distinct from old.created_at
  then
    raise exception 'only club leadership can edit roster identity fields';
  end if;

  if new.user_id is distinct from old.user_id
    and not (old.user_id is null and new.user_id = auth.uid())
  then
    raise exception 'member account links cannot be reassigned';
  end if;

  return new;
end;
$$;
