-- Read-only projections execute with the caller's RLS permissions. Existing
-- checked RSVP helper supplies the same visibility used by event details.
create function public.event_card_summaries(p_ids uuid[])
returns table(event_id uuid, yes_count bigint, no_count bigint, maybe_count bigint, guest_count bigint, waitlisted_count bigint, own_status text)
language sql stable security invoker set search_path='' as $$
 select e.id,
 count(*) filter(where r.status='yes' and r.registration_status='registered'),
 count(*) filter(where r.status='no'), count(*) filter(where r.status='maybe'),
 coalesce(sum(r.guest_count) filter(where r.status='yes' and r.registration_status='registered'),0)::bigint,
 count(*) filter(where r.status='yes' and r.registration_status='waitlisted'),
 max(r.status) filter(where r.member_id=public.current_member_id())
 from public.events e left join lateral public.get_visible_event_rsvps(e.id) r on true
 where e.id=any(p_ids) group by e.id;
$$;

create function public.club_notice_page(p_limit integer default 3,p_offset integer default 0)
returns setof public.news_posts language sql stable security invoker set search_path='' as $$
 select n.* from public.news_posts n where n.source='club'
 and (n.expires_at is null or n.expires_at >= (now() at time zone 'America/Tortola')::date)
 order by n.is_pinned desc, case n.priority when 'urgent' then 0 when 'important' then 1 else 2 end,n.published_at desc,n.id
 limit least(greatest(p_limit,1),100) offset greatest(p_offset,0);
$$;

create function public.personal_service_total(p_member uuid,p_start date,p_end date,p_today date)
returns numeric language sql stable security invoker set search_path='' as $$
 select coalesce(sum(hours),0) from public.volunteer_hours
 where member_id=p_member and member_id=public.current_member_id()
 and served_on>=p_start and served_on<p_end and served_on<=least(p_today,(now() at time zone 'America/Tortola')::date);
$$;

create function public.service_record_years(p_member uuid)
returns table(year_start date) language sql stable security invoker set search_path='' as $$
 select distinct make_date(extract(year from d)::integer-case when extract(month from d)<7 then 1 else 0 end,7,1)
 from (
 select served_on d from public.volunteer_hours where member_id=p_member
 union all select attended_on from public.makeups where member_id=p_member and member_id=public.current_member_id()
 union all select (s.starts_at at time zone 'America/Tortola')::date from public.project_slot_signups r join public.project_slots s on s.id=r.slot_id where r.member_id=p_member and r.attendance is not null
 union all select (now() at time zone 'America/Tortola')::date
 ) dates where d <= (now() at time zone 'America/Tortola')::date order by 1 desc;
$$;

revoke all on function public.event_card_summaries(uuid[]),public.club_notice_page(integer,integer),public.personal_service_total(uuid,date,date,date),public.service_record_years(uuid) from public,anon;
grant execute on function public.event_card_summaries(uuid[]),public.club_notice_page(integer,integer),public.personal_service_total(uuid,date,date,date),public.service_record_years(uuid) to authenticated;
notify pgrst,'reload schema';
