alter table public.notifications
  add column if not exists recipient_id uuid references public.profiles(id) on delete cascade,
  add column if not exists priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high'));

insert into public.app_config (key, value)
values
  ('sos_cancel_seconds', '10'),
  ('sos_escalation_minutes', '5')
on conflict (key) do nothing;

do $$
begin
  create table if not exists public.sos_events (
    id uuid primary key default gen_random_uuid(),
    care_circle_id uuid not null references public.care_circles(id) on delete cascade,
    triggered_by uuid not null references public.profiles(id),
    status text not null default 'active'
      check (status in ('active', 'acknowledged', 'escalated', 'resolved', 'cancelled')),
    triggered_at timestamptz not null default now(),
    latitude double precision,
    longitude double precision,
    acknowledged_by uuid references public.profiles(id),
    acknowledged_at timestamptz,
    escalated_at timestamptz,
    resolved_by uuid references public.profiles(id),
    resolved_at timestamptz
  );
end $$;

create unique index if not exists sos_events_one_open_per_circle_uidx
  on public.sos_events (care_circle_id)
  where status in ('active', 'acknowledged', 'escalated');

create index if not exists sos_events_circle_triggered_at_idx
  on public.sos_events (care_circle_id, triggered_at desc);

alter table public.sos_events enable row level security;

drop policy if exists "Circle members and admins can read SOS events" on public.sos_events;
create policy "Circle members and admins can read SOS events"
  on public.sos_events for select to authenticated
  using (care_circle_id = public.my_circle() or public.my_role() = 'admin');

drop policy if exists "Elderly can trigger SOS events" on public.sos_events;
create policy "Elderly can trigger SOS events"
  on public.sos_events for insert to authenticated
  with check (
    care_circle_id = public.my_circle()
    and public.my_role() = 'elderly'
    and triggered_by = auth.uid()
    and status = 'active'
  );

drop policy if exists "Family and caregivers can acknowledge SOS events" on public.sos_events;
create policy "Family and caregivers can acknowledge SOS events"
  on public.sos_events for update to authenticated
  using (
    care_circle_id = public.my_circle()
    and public.my_role() in ('family', 'caregiver')
    and status in ('active', 'escalated')
  )
  with check (
    care_circle_id = public.my_circle()
    and public.my_role() in ('family', 'caregiver')
    and status = 'acknowledged'
    and acknowledged_by = auth.uid()
  );

drop policy if exists "Circle members and admins can read profiles" on public.profiles;
create policy "Circle members and admins can read profiles"
  on public.profiles for select to authenticated
  using (care_circle_id = public.my_circle() or public.my_role() = 'admin');

drop policy if exists "Circle members and admins can read notifications" on public.notifications;
create policy "Circle members and admins can read notifications"
  on public.notifications for select to authenticated
  using (care_circle_id = public.my_circle() or public.my_role() = 'admin');

grant select, insert on public.sos_events to authenticated;
grant update (status, acknowledged_by, acknowledged_at) on public.sos_events to authenticated;
grant select on public.notifications, public.profiles to authenticated;

create or replace function public.notify_sos_recipients(
  target_circle_id uuid,
  notification_type text,
  notification_message text,
  target_sos_id uuid,
  notification_priority text default 'normal'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (
    care_circle_id, type, message, linked_id, recipient_id, priority
  )
  select target_circle_id,
    notification_type,
    notification_message,
    target_sos_id,
    members.id,
    notification_priority
  from (
    select distinct profile.id
    from public.profiles as profile
    where profile.care_circle_id = target_circle_id
       or profile.role = 'admin'
  ) as members;
end;
$$;

create or replace function public.handle_sos_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_name text;
  transition_type text;
  transition_message text;
  transition_priority text := 'normal';
  action_actor uuid;
  demo_transition boolean := coalesce(current_setting('carebridge.is_demo', true), 'false') = 'true';
begin
  if tg_op = 'INSERT' then
    select full_name into actor_name
    from public.profiles
    where id = new.triggered_by;

    transition_type := 'sos_triggered';
    transition_message := coalesce(actor_name, 'A care circle member') || ' triggered an SOS alert.';
    action_actor := coalesce(auth.uid(), new.triggered_by);
  elsif new.status is distinct from old.status then
    action_actor := coalesce(auth.uid(), new.acknowledged_by, new.resolved_by, new.triggered_by);

    case new.status
      when 'acknowledged' then
        select full_name into actor_name
        from public.profiles
        where id = new.acknowledged_by;
        transition_type := 'sos_acknowledged';
        transition_message := coalesce(actor_name, 'A care circle member') || ' acknowledged the SOS. Help is on the way.';
      when 'escalated' then
        transition_type := 'sos_escalated';
        transition_message := 'No response received. The SOS has been escalated.';
        transition_priority := 'high';
      when 'resolved' then
        select full_name into actor_name
        from public.profiles
        where id = new.resolved_by;
        transition_type := 'sos_resolved';
        transition_message := 'The SOS was resolved by ' || coalesce(actor_name, 'a care circle responder') || '.';
      when 'cancelled' then
        transition_type := 'sos_cancelled';
        transition_message := 'The SOS event was cancelled.';
      else
        return new;
    end case;
  else
    return new;
  end if;

  insert into public.timeline_events (care_circle_id, type, message, linked_id)
  values (new.care_circle_id, transition_type, transition_message, new.id);

  perform public.notify_sos_recipients(
    new.care_circle_id,
    transition_type,
    transition_message,
    new.id,
    transition_priority
  );

  insert into public.audit_log (actor, action, target, is_demo)
  values (
    action_actor,
    transition_type,
    'sos:' || new.id::text,
    demo_transition
  );

  return new;
end;
$$;

revoke all on function public.notify_sos_recipients(uuid, text, text, uuid, text) from public;
revoke all on function public.notify_sos_recipients(uuid, text, text, uuid, text) from authenticated;

drop trigger if exists sos_transition_side_effects on public.sos_events;
create trigger sos_transition_side_effects
after insert or update of status on public.sos_events
for each row execute function public.handle_sos_transition();

create or replace function public.refresh_sos_states()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  escalation_minutes integer;
  escalated_count integer;
begin
  if auth.uid() is null or (public.my_circle() is null and coalesce(public.my_role(), '') <> 'admin') then
    raise exception 'A signed-in care circle member is required.';
  end if;

  select coalesce((select value::integer from public.app_config where key = 'sos_escalation_minutes'), 5)
  into escalation_minutes;

  update public.sos_events
  set status = 'escalated', escalated_at = now()
  where status = 'active'
    and triggered_at + make_interval(mins => escalation_minutes) <= now()
    and (care_circle_id = public.my_circle() or public.my_role() = 'admin');

  get diagnostics escalated_count = row_count;
  return escalated_count;
end;
$$;

create or replace function public.acknowledge_sos(sos_id uuid)
returns public.sos_events
language plpgsql
security definer
set search_path = public
as $$
declare
  sos_row public.sos_events%rowtype;
begin
  if auth.uid() is null or public.my_role() not in ('family', 'caregiver') then
    raise exception 'Only family members and caregivers can acknowledge an SOS.';
  end if;

  select * into sos_row
  from public.sos_events
  where id = sos_id and care_circle_id = public.my_circle()
  for update;

  if not found then
    raise exception 'SOS event not found in your care circle.';
  end if;
  if sos_row.status not in ('active', 'escalated') then
    raise exception 'This SOS is no longer waiting for acknowledgment.';
  end if;

  update public.sos_events
  set status = 'acknowledged', acknowledged_by = auth.uid(), acknowledged_at = now()
  where id = sos_row.id
  returning * into sos_row;

  return sos_row;
end;
$$;

create or replace function public.resolve_sos(sos_id uuid)
returns public.sos_events
language plpgsql
security definer
set search_path = public
as $$
declare
  sos_row public.sos_events%rowtype;
begin
  if auth.uid() is null then
    raise exception 'A signed-in user is required.';
  end if;

  select * into sos_row
  from public.sos_events
  where id = sos_id
    and (care_circle_id = public.my_circle() or public.my_role() = 'admin')
  for update;

  if not found then
    raise exception 'SOS event not found.';
  end if;
  if sos_row.status not in ('active', 'acknowledged', 'escalated') then
    raise exception 'This SOS is already closed.';
  end if;
  if public.my_role() <> 'admin'
    and (sos_row.status <> 'acknowledged' or sos_row.acknowledged_by <> auth.uid()) then
    raise exception 'Only the responder can resolve this SOS.';
  end if;

  update public.sos_events
  set status = 'resolved', resolved_by = auth.uid(), resolved_at = now()
  where id = sos_row.id
  returning * into sos_row;

  return sos_row;
end;
$$;

create or replace function public.demo_trigger_test_sos()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  elderly_id uuid;
  sos_id uuid;
begin
  if auth.uid() is null or public.my_role() <> 'admin' or public.my_circle() is null then
    raise exception 'Admin access to a care circle is required.';
  end if;

  select id into elderly_id
  from public.profiles
  where care_circle_id = public.my_circle() and role = 'elderly'
  order by id
  limit 1;

  if elderly_id is null then
    raise exception 'No elderly profile exists in this care circle.';
  end if;

  perform set_config('carebridge.is_demo', 'true', true);
  insert into public.sos_events (care_circle_id, triggered_by)
  values (public.my_circle(), elderly_id)
  returning id into sos_id;

  return sos_id;
end;
$$;

create or replace function public.demo_skip_sos_to_escalation()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  sos_row public.sos_events%rowtype;
begin
  if auth.uid() is null or public.my_role() <> 'admin' or public.my_circle() is null then
    raise exception 'Admin access to a care circle is required.';
  end if;

  select * into sos_row
  from public.sos_events
  where care_circle_id = public.my_circle()
    and status = 'active'
  order by triggered_at desc
  limit 1
  for update;

  if not found then
    raise exception 'No active SOS is available to escalate.';
  end if;

  perform set_config('carebridge.is_demo', 'true', true);
  update public.sos_events
  set status = 'escalated', escalated_at = now()
  where id = sos_row.id;

  return sos_row.id;
end;
$$;

grant execute on function public.refresh_sos_states() to authenticated;
grant execute on function public.acknowledge_sos(uuid) to authenticated;
grant execute on function public.resolve_sos(uuid) to authenticated;
grant execute on function public.demo_trigger_test_sos() to authenticated;
grant execute on function public.demo_skip_sos_to_escalation() to authenticated;
