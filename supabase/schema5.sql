create or replace function public.demo_trigger_sos()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_circle_id uuid;
  sos_id uuid;
begin
  if auth.uid() is null or public.my_role() is distinct from 'admin' then
    raise exception 'Admin access is required.';
  end if;

  target_circle_id := public.my_circle();
  if target_circle_id is null then
    raise exception 'Admin access to a care circle is required.';
  end if;

  perform 1
  from public.sos_events
  where care_circle_id = target_circle_id
    and status in ('active', 'acknowledged', 'escalated')
  for update;

  if found then
    raise exception 'An SOS is already open';
  end if;

  perform set_config('carebridge.is_demo', 'true', true);

  begin
    insert into public.sos_events (care_circle_id, triggered_by, status)
    values (target_circle_id, auth.uid(), 'active')
    returning id into sos_id;
  exception
    when unique_violation then
      raise exception 'An SOS is already open';
  end;

  return sos_id;
end;
$$;

create or replace function public.demo_escalate_sos()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  sos_row public.sos_events%rowtype;
begin
  if auth.uid() is null or public.my_role() is distinct from 'admin' then
    raise exception 'Admin access is required.';
  end if;

  select *
  into sos_row
  from public.sos_events
  where care_circle_id = public.my_circle()
    and status = 'active'
  order by triggered_at desc
  limit 1
  for update;

  if not found then
    raise exception 'No active SOS to escalate';
  end if;

  perform set_config('carebridge.is_demo', 'true', true);

  update public.sos_events
  set status = 'escalated',
      escalated_at = now()
  where id = sos_row.id;

  return sos_row.id;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    raise exception 'The supabase_realtime publication is not available.';
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'sos_events'
  ) then
    execute 'alter publication supabase_realtime add table public.sos_events';
  end if;
end $$;

revoke all on function public.demo_trigger_sos() from public;
revoke all on function public.demo_escalate_sos() from public;

do $$
begin
  execute 'grant execute on function public.demo_trigger_sos() to authenticated';
  execute 'grant execute on function public.demo_escalate_sos() to authenticated';
end $$;
