alter table public.notifications
  add column if not exists recipient_id uuid references public.profiles(id) on delete cascade,
  add column if not exists priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high'));

drop policy if exists "Circle members can add notifications" on public.notifications;
create policy "Circle members can add notifications"
  on public.notifications for insert to authenticated
  with check (
    care_circle_id = public.my_circle()
    and public.my_role() in ('family', 'caregiver')
  );

grant select, insert on public.notifications to authenticated;

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
      and tablename = 'notifications'
  ) then
    execute 'alter publication supabase_realtime add table public.notifications';
  end if;
end $$;

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  care_circle_id uuid not null references public.care_circles(id) on delete cascade,
  doctor text not null,
  specialty text not null,
  scheduled_at timestamptz not null,
  location text not null default '',
  notes text not null default '',
  status text not null default 'scheduled'
    check (status in ('scheduled', 'cancelled', 'completed')),
  reminder_24h_sent boolean not null default false,
  reminder_1h_sent boolean not null default false,
  visit_summary text null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists appointments_circle_scheduled_at_idx
  on public.appointments (care_circle_id, scheduled_at);

alter table public.appointments enable row level security;

drop policy if exists "Circle members can read appointments" on public.appointments;
create policy "Circle members can read appointments"
  on public.appointments for select to authenticated
  using (care_circle_id = public.my_circle());

drop policy if exists "Family can create appointments" on public.appointments;
create policy "Family can create appointments"
  on public.appointments for insert to authenticated
  with check (
    care_circle_id = public.my_circle()
    and public.my_role() = 'family'
    and created_by = auth.uid()
  );

drop policy if exists "Family and caregivers can update appointments" on public.appointments;
create policy "Family and caregivers can update appointments"
  on public.appointments for update to authenticated
  using (
    care_circle_id = public.my_circle()
    and public.my_role() in ('family', 'caregiver')
  )
  with check (
    care_circle_id = public.my_circle()
    and public.my_role() in ('family', 'caregiver')
  );

grant select, insert on public.appointments to authenticated;
grant update (doctor, specialty, scheduled_at, location, notes, status, visit_summary)
  on public.appointments to authenticated;

create or replace function public.guard_appointment_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.my_role() = 'admin'
    and coalesce(current_setting('carebridge.is_demo', true), 'false') = 'true' then
    return new;
  end if;

  if public.my_role() = 'caregiver' and (
    new.id is distinct from old.id
    or new.care_circle_id is distinct from old.care_circle_id
    or new.doctor is distinct from old.doctor
    or new.specialty is distinct from old.specialty
    or new.scheduled_at is distinct from old.scheduled_at
    or new.location is distinct from old.location
    or new.notes is distinct from old.notes
    or new.status is distinct from old.status
    or new.reminder_24h_sent is distinct from old.reminder_24h_sent
    or new.reminder_1h_sent is distinct from old.reminder_1h_sent
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at
  ) then
    raise exception 'Caregivers can only add an appointment visit summary.';
  end if;

  if public.my_role() not in ('family', 'caregiver') then
    raise exception 'Only family or caregivers can update appointments.';
  end if;
  return new;
end;
$$;

drop trigger if exists appointments_guard_update on public.appointments;
create trigger appointments_guard_update
before update on public.appointments
for each row execute function public.guard_appointment_update();

create or replace function public.record_appointment_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  event_action text;
  event_message text;
  demo_action boolean := coalesce(current_setting('carebridge.is_demo', true), 'false') = 'true';
begin
  if tg_op = 'INSERT' then
    event_action := 'appointment_created';
    event_message := 'Appointment scheduled with ' || new.doctor || '.';
  elsif new.care_circle_id is not distinct from old.care_circle_id
    and new.doctor is not distinct from old.doctor
    and new.specialty is not distinct from old.specialty
    and new.scheduled_at is not distinct from old.scheduled_at
    and new.location is not distinct from old.location
    and new.notes is not distinct from old.notes
    and new.status is not distinct from old.status
    and new.visit_summary is not distinct from old.visit_summary
    and new.created_by is not distinct from old.created_by
    and new.created_at is not distinct from old.created_at then
    return new;
  elsif new.status is distinct from old.status and new.status = 'cancelled' then
    event_action := 'appointment_cancelled';
    event_message := 'Appointment with ' || new.doctor || ' was cancelled.';
  elsif new.visit_summary is distinct from old.visit_summary then
    event_action := 'appointment_summary_added';
    event_message := 'Visit summary added for appointment with ' || new.doctor || '.';
  else
    event_action := 'appointment_updated';
    event_message := 'Appointment with ' || new.doctor || ' was updated.';
  end if;

  insert into public.timeline_events (care_circle_id, type, message, linked_id)
  values (new.care_circle_id, 'appointment', event_message, new.id);

  insert into public.notifications (
    care_circle_id, type, message, linked_id, recipient_id
  )
  select new.care_circle_id,
    'appointment',
    event_message,
    new.id,
    member.id
  from public.profiles member
  where member.care_circle_id = new.care_circle_id;

  insert into public.audit_log (actor, action, target, is_demo)
  values (
    coalesce(auth.uid(), new.created_by),
    event_action,
    'appointment:' || new.id::text,
    demo_action
  );

  return new;
end;
$$;

drop trigger if exists appointments_record_changes on public.appointments;
create trigger appointments_record_changes
after insert or update on public.appointments
for each row execute function public.record_appointment_changes();

create or replace function public.refresh_appointment_reminders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  circle_id uuid := public.my_circle();
  appointment_row public.appointments%rowtype;
  reminder_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Sign in to refresh appointment reminders.';
  end if;
  if circle_id is null then
    return 0;
  end if;

  for appointment_row in
    select *
    from public.appointments appointment
    where appointment.care_circle_id = circle_id
      and appointment.status = 'scheduled'
      and appointment.scheduled_at > now()
      and (
        (not appointment.reminder_24h_sent and appointment.scheduled_at <= now() + interval '24 hours')
        or (not appointment.reminder_1h_sent and appointment.scheduled_at <= now() + interval '1 hour')
      )
    order by appointment.scheduled_at
    for update skip locked
  loop
    if not appointment_row.reminder_24h_sent
      and appointment_row.scheduled_at <= now() + interval '24 hours' then
      update public.appointments set reminder_24h_sent = true where id = appointment_row.id;
      insert into public.notifications (care_circle_id, type, message, linked_id, recipient_id)
      select appointment_row.care_circle_id,
        'appointment',
        'Reminder: appointment with ' || appointment_row.doctor || ' is within 24 hours.',
        appointment_row.id,
        member.id
      from public.profiles member
      where member.care_circle_id = appointment_row.care_circle_id;
      insert into public.timeline_events (care_circle_id, type, message, linked_id)
      values (
        appointment_row.care_circle_id,
        'appointment',
        '24-hour reminder sent for appointment with ' || appointment_row.doctor || '.',
        appointment_row.id
      );
      reminder_count := reminder_count + 1;
    end if;

    if not appointment_row.reminder_1h_sent
      and appointment_row.scheduled_at <= now() + interval '1 hour' then
      update public.appointments set reminder_1h_sent = true where id = appointment_row.id;
      insert into public.notifications (care_circle_id, type, message, linked_id, recipient_id)
      select appointment_row.care_circle_id,
        'appointment',
        'Reminder: appointment with ' || appointment_row.doctor || ' is within 1 hour.',
        appointment_row.id,
        member.id
      from public.profiles member
      where member.care_circle_id = appointment_row.care_circle_id;
      insert into public.timeline_events (care_circle_id, type, message, linked_id)
      values (
        appointment_row.care_circle_id,
        'appointment',
        '1-hour reminder sent for appointment with ' || appointment_row.doctor || '.',
        appointment_row.id
      );
      reminder_count := reminder_count + 1;
    end if;
  end loop;

  return reminder_count;
end;
$$;

create or replace function public.demo_make_next_appointment_due()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  appointment_id uuid;
begin
  if auth.uid() is null
    or public.my_role() is distinct from 'admin'
    or public.my_circle() is null then
    raise exception 'Admin access to a care circle is required.';
  end if;

  select id into appointment_id
  from public.appointments
  where care_circle_id = public.my_circle()
    and status = 'scheduled'
  order by scheduled_at
  limit 1
  for update;
  if not found then
    raise exception 'There is no scheduled appointment to update.';
  end if;

  perform set_config('carebridge.is_demo', 'true', true);
  update public.appointments
  set scheduled_at = now() + interval '1 hour',
      reminder_24h_sent = false,
      reminder_1h_sent = false
  where id = appointment_id;

  return appointment_id;
end;
$$;

revoke all on function public.refresh_appointment_reminders() from public;
revoke all on function public.demo_make_next_appointment_due() from public;
do $$
begin
  execute 'grant execute on function public.refresh_appointment_reminders() to authenticated';
  execute 'grant execute on function public.demo_make_next_appointment_due() to authenticated';
end $$;

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
      and tablename = 'appointments'
  ) then
    execute 'alter publication supabase_realtime add table public.appointments';
  end if;
end $$;
