-- Date of birth, for the home screen's birthday recognition. Self-editable
-- like phone/bio (members_update already allows id = current_member_id()),
-- so no new RLS policy is needed. Nullable: existing members won't have one
-- on file until they set it.
alter table members add column date_of_birth date;
