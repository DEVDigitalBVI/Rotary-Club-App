create table public.member_feedback (
 id uuid primary key,
 member_id uuid not null references public.members(id),
 category text not null check(category in ('idea','app','event','service','other')),
 subject text not null check(char_length(trim(subject)) between 3 and 120),
 body text not null check(char_length(trim(body)) between 10 and 3000),
 status text not null default 'new' check(status in ('new','reviewing','planned','done','declined')),
 response text not null default '' check(char_length(response)<=3000),
 revision integer not null default 0,
 reviewed_by uuid references public.members(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index member_feedback_member_idx on public.member_feedback(member_id,created_at);
create index member_feedback_status_idx on public.member_feedback(status,created_at);
alter table public.member_feedback enable row level security;
revoke all on public.member_feedback from anon,authenticated;
grant select on public.member_feedback to authenticated;
create policy feedback_read on public.member_feedback for select to authenticated using(public.is_active_club_member() and (member_id=public.current_member_id() or public.can_assign_roles()));

create function app_private.submit_member_feedback(p_id uuid,p_category text,p_subject text,p_body text) returns uuid language plpgsql security definer set search_path='' as $$
declare me uuid:=public.current_member_id();
begin
 if not public.is_active_club_member() then raise exception 'Active membership is required'; end if;
 perform 1 from public.members where id=me for update;
 if exists(select 1 from public.member_feedback where id=p_id and member_id=me) then return p_id; end if;
 if p_id is null or p_category is null or p_category not in ('idea','app','event','service','other') or p_subject is null or char_length(trim(p_subject)) not between 3 and 120 or p_body is null or char_length(trim(p_body)) not between 10 and 3000 then raise exception 'Choose a category, a subject (3–120 characters), and a message (10–3000 characters)'; end if;
 if (select count(*) from public.member_feedback where member_id=me and created_at>now()-interval '24 hours')>=10 then raise exception 'You have sent 10 submissions today. Please try again tomorrow'; end if;
 insert into public.member_feedback(id,member_id,category,subject,body) values(p_id,me,p_category,trim(p_subject),trim(p_body));
 insert into public.notifications(recipient_id,type,title,body,link,dedupe_key)
 select m.id,'feedback','New member feedback',trim(p_subject),'/feedback?view=review','feedback:new:'||p_id
 from public.members m where m.position in ('president','president-elect','secretary','secretary-elect') and m.status in ('active','honorary') and not m.is_superuser and m.id<>me and public.notification_enabled(m.id,'feedback') on conflict do nothing;
 return p_id;
end; $$;
create function app_private.review_member_feedback(p_id uuid,p_revision integer,p_status text,p_response text) returns void language plpgsql security definer set search_path='' as $$
declare f public.member_feedback;
begin
 if not public.is_active_club_member() or not public.can_assign_roles() then raise exception 'Only club officers can review feedback'; end if;
 select * into f from public.member_feedback where id=p_id for update;
 if f.id is null then raise exception 'Submission not found'; end if;
 if f.revision is distinct from p_revision then raise exception 'This submission changed. Refresh before saving'; end if;
 if p_status is null or p_status not in ('new','reviewing','planned','done','declined') or p_response is null or char_length(p_response)>3000 then raise exception 'Choose a valid status and keep the response within 3000 characters'; end if;
 if f.status=p_status and f.response=trim(p_response) then return; end if;
 update public.member_feedback set status=p_status,response=trim(p_response),reviewed_by=public.current_member_id(),revision=revision+1,updated_at=now() where id=p_id;
 if public.notification_enabled(f.member_id,'feedback') then
 insert into public.notifications(recipient_id,type,title,body,link,dedupe_key) values(f.member_id,'feedback','Your feedback has an update',f.subject,'/feedback','feedback:update:'||p_id||':'||(f.revision+1)) on conflict do nothing;
 end if;
end; $$;
create function public.submit_member_feedback(p_id uuid,p_category text,p_subject text,p_body text) returns uuid language sql set search_path='' as $$ select app_private.submit_member_feedback(p_id,p_category,p_subject,p_body); $$;
create function public.review_member_feedback(p_id uuid,p_revision integer,p_status text,p_response text) returns void language sql set search_path='' as $$ select app_private.review_member_feedback(p_id,p_revision,p_status,p_response); $$;
revoke all on function app_private.submit_member_feedback(uuid,text,text,text),public.submit_member_feedback(uuid,text,text,text),app_private.review_member_feedback(uuid,integer,text,text),public.review_member_feedback(uuid,integer,text,text) from public,anon;
grant execute on function app_private.submit_member_feedback(uuid,text,text,text),public.submit_member_feedback(uuid,text,text,text),app_private.review_member_feedback(uuid,integer,text,text),public.review_member_feedback(uuid,integer,text,text) to authenticated;
notify pgrst,'reload schema';
