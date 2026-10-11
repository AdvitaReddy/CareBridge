insert into public.app_config (key, value)
values ('care_timezone', 'Asia/Kolkata')
on conflict (key) do nothing;

do $$
begin
  with duplicate_doses as (
    select id,
      row_number() over (
        partition by medicine_id, scheduled_at
        order by id
      ) as duplicate_number
    from public.doses
  )
  delete from public.doses as dose
  using duplicate_doses
  where dose.id = duplicate_doses.id
    and duplicate_doses.duplicate_number > 1;

  create unique index if not exists doses_medicine_scheduled_at_uidx
    on public.doses (medicine_id, scheduled_at);
end $$;

create or replace function public.generate_todays_doses()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer;
  care_timezone text;
  schedule_date date;
begin
  if auth.uid() is null or public.my_circle() is null then
    raise exception 'A signed-in care circle member is required.';
  end if;

  select coalesce((select value from public.app_config where key = 'care_timezone'), 'Asia/Kolkata')
  into care_timezone;
  schedule_date := (now() at time zone care_timezone)::date;

  insert into public.doses (medicine_id, care_circle_id, scheduled_at)
  select medicine.id,
    medicine.care_circle_id,
    (schedule_date + parsed.time_value) at time zone care_timezone
  from public.medicines as medicine
  cross join lateral unnest(medicine.times) as schedule(time_text)
  cross join lateral (select schedule.time_text::time as time_value) as parsed
  where medicine.care_circle_id = public.my_circle()
  on conflict (medicine_id, scheduled_at) do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

create or replace function public.refresh_dose_states()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  missed_window integer;
  newly_missed record;
  missed_count integer := 0;
  medicine_label text;
begin
  if auth.uid() is null or public.my_circle() is null then
    raise exception 'A signed-in care circle member is required.';
  end if;

  select coalesce(value::integer, 30)
  into missed_window
  from public.app_config
  where key = 'missed_window_minutes';
  missed_window := coalesce(missed_window, 30);

  update public.doses
  set status = 'due'
  where care_circle_id = public.my_circle()
    and status = 'scheduled'
    and scheduled_at <= now();

  for newly_missed in
    update public.doses
    set status = 'missed'
    where care_circle_id = public.my_circle()
      and status = 'due'
      and scheduled_at + make_interval(mins => missed_window) <= now()
    returning id, medicine_id, care_circle_id, scheduled_at
  loop
    select name || ' ' || dosage
    into medicine_label
    from public.medicines
    where id = newly_missed.medicine_id;

    insert into public.notifications (care_circle_id, type, message, linked_id)
    values (
      newly_missed.care_circle_id,
      'missed_dose',
      medicine_label || ' was not taken within the scheduled window.',
      newly_missed.id
    );

    insert into public.timeline_events (care_circle_id, type, message, linked_id)
    values (
      newly_missed.care_circle_id,
      'dose_missed',
      medicine_label || ' dose missed.',
      newly_missed.id
    );

    missed_count := missed_count + 1;
  end loop;

  return missed_count;
end;
$$;

create or replace function public.confirm_dose(dose_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  dose_row public.doses%rowtype;
  medicine_label text;
  next_status text;
begin
  if auth.uid() is null or public.my_circle() is null then
    raise exception 'A signed-in care circle member is required.';
  end if;

  if public.my_role() <> 'elderly' then
    raise exception 'Only the elderly care recipient can confirm a dose.';
  end if;

  select *
  into dose_row
  from public.doses
  where id = dose_id
    and care_circle_id = public.my_circle()
  for update;

  if not found then
    raise exception 'Dose not found in your care circle.';
  end if;

  if dose_row.status not in ('due', 'scheduled', 'missed') then
    raise exception 'This dose has already been confirmed.';
  end if;

  next_status := case when dose_row.status = 'missed' then 'taken_late' else 'taken' end;

  update public.doses
  set status = next_status,
      confirmed_at = now()
  where id = dose_row.id;

  select name || ' ' || dosage
  into medicine_label
  from public.medicines
  where id = dose_row.medicine_id;

  insert into public.timeline_events (care_circle_id, type, message, linked_id)
  values (
    dose_row.care_circle_id,
    case when next_status = 'taken_late' then 'dose_taken_late' else 'dose_taken' end,
    medicine_label || case when next_status = 'taken_late' then ' dose taken late.' else ' dose taken.' end,
    dose_row.id
  );

  insert into public.audit_log (actor, action, target, is_demo)
  values (auth.uid(), 'confirm_dose:' || next_status, 'dose:' || dose_row.id::text, false);

  return next_status;
end;
$$;

drop policy if exists "Circle members can mark notifications read" on public.notifications;
create policy "Circle members can mark notifications read"
  on public.notifications for update to authenticated
  using (care_circle_id = public.my_circle())
  with check (care_circle_id = public.my_circle());

grant update (read) on public.notifications to authenticated;
grant execute on function public.generate_todays_doses() to authenticated;
grant execute on function public.refresh_dose_states() to authenticated;
grant execute on function public.confirm_dose(uuid) to authenticated;

create or replace function public.demo_make_next_dose_due()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_dose uuid;
begin
  if auth.uid() is null or public.my_role() <> 'admin' or public.my_circle() is null then
    raise exception 'Admin access is required.';
  end if;

  update public.doses
  set scheduled_at = now(), status = 'due'
  where id = (
    select id
    from public.doses
    where care_circle_id = public.my_circle()
      and status = 'scheduled'
    order by scheduled_at
    limit 1
    for update
  )
  returning id into selected_dose;

  if selected_dose is null then
    raise exception 'No scheduled dose is available. Generate today''s doses first.';
  end if;

  insert into public.audit_log (actor, action, target, is_demo)
  values (auth.uid(), 'demo_make_next_dose_due', 'dose:' || selected_dose::text, true);

  return selected_dose;
end;
$$;

create or replace function public.demo_force_dose_missed()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_dose public.doses%rowtype;
  medicine_label text;
begin
  if auth.uid() is null or public.my_role() <> 'admin' or public.my_circle() is null then
    raise exception 'Admin access is required.';
  end if;

  select *
  into selected_dose
  from public.doses
  where care_circle_id = public.my_circle()
    and status in ('scheduled', 'due')
  order by scheduled_at
  limit 1
  for update;

  if not found then
    raise exception 'No uncompleted dose is available. Generate today''s doses first.';
  end if;

  update public.doses
  set status = 'missed'
  where id = selected_dose.id;

  select name || ' ' || dosage
  into medicine_label
  from public.medicines
  where id = selected_dose.medicine_id;

  insert into public.notifications (care_circle_id, type, message, linked_id)
  values (
    selected_dose.care_circle_id,
    'missed_dose',
    medicine_label || ' was marked missed for the demo.',
    selected_dose.id
  );

  insert into public.timeline_events (care_circle_id, type, message, linked_id)
  values (
    selected_dose.care_circle_id,
    'dose_missed',
    medicine_label || ' dose marked missed for the demo.',
    selected_dose.id
  );

  insert into public.audit_log (actor, action, target, is_demo)
  values (auth.uid(), 'demo_force_dose_missed', 'dose:' || selected_dose.id::text, true);

  return selected_dose.id;
end;
$$;

create or replace function public.reset_demo_data()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  removed_count integer;
  care_timezone text;
  care_date date;
  care_day_start timestamptz;
  care_day_end timestamptz;
begin
  if auth.uid() is null or public.my_role() <> 'admin' or public.my_circle() is null then
    raise exception 'Admin access is required.';
  end if;

  select coalesce((select value from public.app_config where key = 'care_timezone'), 'Asia/Kolkata')
  into care_timezone;
  care_date := (now() at time zone care_timezone)::date;
  care_day_start := care_date::timestamp at time zone care_timezone;
  care_day_end := (care_date + 1)::timestamp at time zone care_timezone;

  delete from public.notifications
  where care_circle_id = public.my_circle()
    and linked_id in (
      select id from public.doses
      where care_circle_id = public.my_circle()
        and scheduled_at >= care_day_start
        and scheduled_at < care_day_end
    );

  delete from public.timeline_events
  where care_circle_id = public.my_circle()
    and linked_id in (
      select id from public.doses
      where care_circle_id = public.my_circle()
        and scheduled_at >= care_day_start
        and scheduled_at < care_day_end
    );

  delete from public.doses
  where care_circle_id = public.my_circle()
    and scheduled_at >= care_day_start
    and scheduled_at < care_day_end;
  get diagnostics removed_count = row_count;

  perform public.generate_todays_doses();

  insert into public.audit_log (actor, action, target, is_demo)
  values (auth.uid(), 'reset_demo_data', 'care_circle:' || public.my_circle()::text, true);

  return removed_count;
end;
$$;

grant execute on function public.demo_make_next_dose_due() to authenticated;
grant execute on function public.demo_force_dose_missed() to authenticated;
grant execute on function public.reset_demo_data() to authenticated;