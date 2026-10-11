create extension if not exists pgcrypto;

create table if not exists public.care_circles (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('elderly', 'family', 'caregiver', 'admin')),
  care_circle_id uuid references public.care_circles(id) on delete set null
);

create table if not exists public.medicines (
  id uuid primary key default gen_random_uuid(),
  care_circle_id uuid not null references public.care_circles(id) on delete cascade,
  name text not null,
  dosage text not null,
  times text[] not null default '{}',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.doses (
  id uuid primary key default gen_random_uuid(),
  medicine_id uuid not null references public.medicines(id) on delete cascade,
  care_circle_id uuid not null references public.care_circles(id) on delete cascade,
  scheduled_at timestamptz not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'due', 'taken', 'missed', 'taken_late')),
  confirmed_at timestamptz
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  care_circle_id uuid not null references public.care_circles(id) on delete cascade,
  type text not null,
  message text not null,
  linked_id uuid,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  care_circle_id uuid not null references public.care_circles(id) on delete cascade,
  type text not null,
  message text not null,
  linked_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor uuid not null,
  action text not null,
  target text not null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.app_config (
  key text primary key,
  value text not null
);

insert into public.app_config (key, value) values
  ('missed_window_minutes', '30'),
  ('sos_cancel_seconds', '10'),
  ('sos_escalation_minutes', '5')
on conflict (key) do nothing;

create or replace function public.my_circle()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select care_circle_id
  from public.profiles
  where id = auth.uid()
$$;

create or replace function public.my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
$$;

grant execute on function public.my_circle() to authenticated;
grant execute on function public.my_role() to authenticated;

alter table public.care_circles enable row level security;
alter table public.profiles enable row level security;
alter table public.medicines enable row level security;
alter table public.doses enable row level security;
alter table public.notifications enable row level security;
alter table public.timeline_events enable row level security;
alter table public.audit_log enable row level security;
alter table public.app_config enable row level security;

drop policy if exists "Circle members can read their circle" on public.care_circles;
create policy "Circle members can read their circle"
  on public.care_circles for select to authenticated
  using (id = public.my_circle());

drop policy if exists "Circle members can read profiles" on public.profiles;
create policy "Circle members can read profiles"
  on public.profiles for select to authenticated
  using (care_circle_id = public.my_circle());

drop policy if exists "Circle members can read medicines" on public.medicines;
create policy "Circle members can read medicines"
  on public.medicines for select to authenticated
  using (care_circle_id = public.my_circle());
drop policy if exists "Family can add medicines" on public.medicines;
create policy "Family can add medicines"
  on public.medicines for insert to authenticated
  with check (care_circle_id = public.my_circle() and public.my_role() = 'family');
drop policy if exists "Family can update medicines" on public.medicines;
create policy "Family can update medicines"
  on public.medicines for update to authenticated
  using (care_circle_id = public.my_circle() and public.my_role() = 'family')
  with check (care_circle_id = public.my_circle() and public.my_role() = 'family');
drop policy if exists "Family can delete medicines" on public.medicines;
create policy "Family can delete medicines"
  on public.medicines for delete to authenticated
  using (care_circle_id = public.my_circle() and public.my_role() = 'family');

drop policy if exists "Circle members can read doses" on public.doses;
create policy "Circle members can read doses"
  on public.doses for select to authenticated
  using (care_circle_id = public.my_circle());
drop policy if exists "Elderly can update doses" on public.doses;
create policy "Elderly can update doses"
  on public.doses for update to authenticated
  using (care_circle_id = public.my_circle() and public.my_role() = 'elderly')
  with check (care_circle_id = public.my_circle() and public.my_role() = 'elderly');

drop policy if exists "Circle members can read notifications" on public.notifications;
create policy "Circle members can read notifications"
  on public.notifications for select to authenticated
  using (care_circle_id = public.my_circle());
drop policy if exists "Circle members can add notifications" on public.notifications;
create policy "Circle members can add notifications"
  on public.notifications for insert to authenticated
  with check (care_circle_id = public.my_circle());

drop policy if exists "Circle members can read timeline events" on public.timeline_events;
create policy "Circle members can read timeline events"
  on public.timeline_events for select to authenticated
  using (care_circle_id = public.my_circle());
drop policy if exists "Circle members can add timeline events" on public.timeline_events;
create policy "Circle members can add timeline events"
  on public.timeline_events for insert to authenticated
  with check (care_circle_id = public.my_circle());

drop policy if exists "Admins can read audit log" on public.audit_log;
create policy "Admins can read audit log"
  on public.audit_log for select to authenticated
  using (public.my_role() = 'admin');
drop policy if exists "Users can log their own actions" on public.audit_log;
create policy "Users can log their own actions"
  on public.audit_log for insert to authenticated
  with check (actor = auth.uid());

drop policy if exists "Authenticated users can read app config" on public.app_config;
create policy "Authenticated users can read app config"
  on public.app_config for select to authenticated
  using (auth.uid() is not null);

grant select on public.care_circles, public.profiles, public.medicines,
  public.doses, public.notifications, public.timeline_events, public.app_config
  to authenticated;
grant insert, update, delete on public.medicines to authenticated;
grant update on public.doses to authenticated;
grant insert on public.notifications, public.timeline_events, public.audit_log to authenticated;
grant select on public.audit_log to authenticated;