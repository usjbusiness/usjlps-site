-- LPS STEP 19: public website calendar, fed automatically by the E-Board portal.
-- Prerequisite: STEP 18 (confirmed meeting status). Safe to run repeatedly.
-- No member/contact data, private meeting content or internal descriptions are exposed.
begin;
create table if not exists public.site_calendar (
 kind text not null check(kind in ('meeting','event')),
 source_id uuid not null,
 title text not null,
 starts_at timestamptz not null,
 ends_at timestamptz,
 location text,
 headliner boolean not null default false,
 status text not null check(status in ('confirmed','upcoming','postponed','cancelled')),
 published_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(kind,source_id)
);
alter table public.site_calendar enable row level security;
revoke all on public.site_calendar from public,anon,authenticated;
-- Writes are exclusively through triggers; no direct browser table access.
create or replace function public._sync_site_calendar()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare k text; s text; t text; is_public_meeting boolean;
begin
 k:=case when tg_table_name='meetings' then 'meeting' else 'event' end;
 if tg_op='DELETE' then
  -- A previously published event must not silently disappear when deleted.
  update public.site_calendar set status='cancelled',updated_at=now()
  where kind=k and source_id=old.id;
  return old;
 end if;
 if k='meeting' then
  is_public_meeting:=new.meeting_type::text='general_body';
  if not is_public_meeting then
   delete from public.site_calendar where kind=k and source_id=new.id;
   return new;
  end if;
  s:=new.status::text;t:=new.title;
 else
  s:=new.stage::text;t:=new.name;
 end if;
 if s in ('confirmed','upcoming') and new.starts_at is not null then
  if k='meeting' then
   insert into public.site_calendar(kind,source_id,title,starts_at,ends_at,location,headliner,status)
   values(k,new.id,t,new.starts_at,new.ends_at,new.location,new.is_headliner,s)
   on conflict(kind,source_id) do update set title=excluded.title,starts_at=excluded.starts_at,
    ends_at=excluded.ends_at,location=excluded.location,headliner=excluded.headliner,status=excluded.status,updated_at=now();
  else
   insert into public.site_calendar(kind,source_id,title,starts_at,ends_at,location,headliner,status)
   values(k,new.id,t,new.starts_at,new.ends_at,new.location,false,s)
   on conflict(kind,source_id) do update set title=excluded.title,starts_at=excluded.starts_at,
    ends_at=excluded.ends_at,location=excluded.location,status=excluded.status,updated_at=now();
  end if;
 elsif s in ('cancelled','postponed') then
  -- Only if this record has actually been published before. Keep the last published
  -- public title/date/location: unreviewed changes made during cancellation stay private.
  update public.site_calendar set status=s,updated_at=now() where kind=k and source_id=new.id;
 else
  -- Scheduled/Tentative/planning/held, or missing dates, withdraw publication.
  delete from public.site_calendar where kind=k and source_id=new.id;
 end if;
 return new;
end $$;
revoke all on function public._sync_site_calendar() from public,anon,authenticated;
drop trigger if exists lps_site_calendar_meeting on public.meetings;
create trigger lps_site_calendar_meeting after insert or update or delete on public.meetings
 for each row execute function public._sync_site_calendar();
drop trigger if exists lps_site_calendar_event on public.events;
create trigger lps_site_calendar_event after insert or update or delete on public.events
 for each row execute function public._sync_site_calendar();
-- Remove withdrawn records when rerun. Deleted cancelled snapshots are preserved.
delete from public.site_calendar c using public.meetings m
 where c.kind='meeting' and c.source_id=m.id
 and (m.meeting_type::text<>'general_body' or m.status::text not in ('confirmed','postponed','cancelled'));
delete from public.site_calendar c using public.events e
 where c.kind='event' and c.source_id=e.id and e.stage::text not in ('confirmed','upcoming','cancelled');
-- Backfill only currently confirmed/upcoming. Historical cancelled/draft records
-- are not assumed to have been public, so they are not newly published.
insert into public.site_calendar(kind,source_id,title,starts_at,ends_at,location,headliner,status)
 select 'meeting',id,title,starts_at,ends_at,location,is_headliner,status::text from public.meetings
 where meeting_type::text='general_body' and status::text='confirmed'
 on conflict(kind,source_id) do update set title=excluded.title,starts_at=excluded.starts_at,
  ends_at=excluded.ends_at,location=excluded.location,headliner=excluded.headliner,status=excluded.status,updated_at=now();
insert into public.site_calendar(kind,source_id,title,starts_at,ends_at,location,headliner,status)
 select 'event',id,name,starts_at,ends_at,location,false,stage::text from public.events
 where stage::text in ('confirmed','upcoming') and starts_at is not null
 on conflict(kind,source_id) do update set title=excluded.title,starts_at=excluded.starts_at,
  ends_at=excluded.ends_at,location=excluded.location,status=excluded.status,updated_at=now();
create or replace function public.site_events()
returns table(kind text,title text,starts_at timestamptz,ends_at timestamptz,location text,headliner boolean,status text)
language sql stable security definer set search_path=public,pg_temp as $$
 select c.kind,c.title,c.starts_at,c.ends_at,c.location,c.headliner,c.status
 from public.site_calendar c
 where (c.status in ('confirmed','upcoming') and coalesce(c.ends_at,c.starts_at+interval '2 hours')>now())
    or (c.status in ('postponed','cancelled') and c.starts_at>=now()-interval '30 days')
 order by c.starts_at,c.kind,c.source_id limit 100
$$;
revoke all on function public.site_events() from public;
grant execute on function public.site_events() to anon,authenticated;
notify pgrst,'reload schema';
commit;
