create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  care_circle_id uuid not null references public.care_circles(id) on delete cascade,
  email text not null,
  role text not null check (role in ('family', 'caregiver')),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  invited_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists invitations_pending_email_idx
  on public.invitations (lower(email), created_at desc)
  where status = 'pending';

alter table public.care_circles
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_phone text;

alter table public.invitations enable row level security;

drop policy if exists "Circle members and invitees can read invitations" on public.invitations;
create policy "Circle members and invitees can read invitations"
  on public.invitations for select to authenticated
  using (
    care_circle_id = public.my_circle()
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

drop policy if exists "Family can create invitations" on public.invitations;
create policy "Family can create invitations"
  on public.invitations for insert to authenticated
  with check (
    care_circle_id = public.my_circle()
    and public.my_role() = 'family'
    and invited_by = auth.uid()
    and status = 'pending'
  );

drop policy if exists "Family can cancel circle invitations" on public.invitations;
create policy "Family can cancel circle invitations"
  on public.invitations for update to authenticated
  using (
    care_circle_id = public.my_circle()
    and public.my_role() = 'family'
    and status = 'pending'
  )
  with check (
    care_circle_id = public.my_circle()
    and public.my_role() = 'family'
    and status = 'cancelled'
  );

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select to authenticated
  using (id = auth.uid());

drop policy if exists "Family can update emergency contacts" on public.care_circles;
create policy "Family can update emergency contacts"
  on public.care_circles for update to authenticated
  using (id = public.my_circle() and public.my_role() = 'family')
  with check (id = public.my_circle() and public.my_role() = 'family');

grant select on public.invitations to authenticated;
grant select on public.care_circles, public.profiles to authenticated;

create or replace function public.handle_new_carebridge_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    'family'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists carebridge_create_profile on auth.users;
create trigger carebridge_create_profile
after insert on auth.users
for each row execute function public.handle_new_carebridge_user();

create or replace function public.invite_circle_member(invite_email text, invite_role text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  circle_id uuid;
  invitation_id uuid;
  normalized_email text := lower(trim(invite_email));
  role_name text := lower(trim(invite_role));
begin
  if auth.uid() is null or public.my_role() is distinct from 'family' then
    raise exception 'Only family members can invite people.';
  end if;
  if role_name is null or role_name not in ('family', 'caregiver') then
    raise exception 'Invitation role must be family or caregiver.';
  end if;
  if normalized_email is null or normalized_email = '' or position('@' in normalized_email) < 2 then
    raise exception 'Enter a valid email address.';
  end if;

  circle_id := public.my_circle();
  if circle_id is null then
    raise exception 'Your account is not linked to a care circle.';
  end if;

  if exists (
    select 1
    from public.profiles p
    join auth.users u on u.id = p.id
    where p.care_circle_id = circle_id
      and lower(u.email) = normalized_email
  ) then
    raise exception 'This person is already in the care circle.';
  end if;

  if exists (
    select 1 from public.invitations
    where care_circle_id = circle_id and lower(email) = normalized_email and status = 'pending'
  ) then
    raise exception 'A pending invitation already exists for this email.';
  end if;

  insert into public.invitations (care_circle_id, email, role, invited_by)
  values (circle_id, normalized_email, role_name, auth.uid())
  returning id into invitation_id;

  insert into public.timeline_events (care_circle_id, type, message, linked_id)
  values (circle_id, 'invitation_sent', 'An invitation was sent to ' || normalized_email || '.', invitation_id);
  insert into public.audit_log (actor, action, target, is_demo)
  values (auth.uid(), 'care_circle_invited', 'invitation:' || invitation_id::text, false);

  return invitation_id;
end;
$$;

create or replace function public.cancel_circle_invitation(invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation_row public.invitations%rowtype;
begin
  if auth.uid() is null or public.my_role() is distinct from 'family' then
    raise exception 'Only family members can cancel invitations.';
  end if;

  update public.invitations
  set status = 'cancelled'
  where id = invitation_id
    and care_circle_id = public.my_circle()
    and status = 'pending'
  returning * into invitation_row;
  if not found then
    raise exception 'Pending invitation not found.';
  end if;

  insert into public.timeline_events (care_circle_id, type, message, linked_id)
  values (invitation_row.care_circle_id, 'invitation_cancelled', 'The invitation to ' || invitation_row.email || ' was cancelled.', invitation_row.id);
  insert into public.audit_log (actor, action, target, is_demo)
  values (auth.uid(), 'care_circle_invitation_cancelled', 'invitation:' || invitation_row.id::text, false);
end;
$$;

create or replace function public.respond_to_circle_invitation(invitation_id uuid, accept_invitation boolean)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation_row public.invitations%rowtype;
  account_email text;
  account_name text;
  next_status text;
begin
  if auth.uid() is null then
    raise exception 'Sign in to respond to this invitation.';
  end if;

  select lower(email), coalesce(nullif(trim(raw_user_meta_data ->> 'full_name'), ''), split_part(email, '@', 1))
  into account_email, account_name
  from auth.users
  where id = auth.uid();

  select * into invitation_row
  from public.invitations
  where id = invitation_id
    and lower(email) = account_email
    and status = 'pending'
  for update;
  if not found then
    raise exception 'Pending invitation not found for this account.';
  end if;

  if accept_invitation then
    if exists (
      select 1 from public.profiles
      where id = auth.uid() and care_circle_id is not null and care_circle_id <> invitation_row.care_circle_id
    ) then
      raise exception 'This account is already linked to another care circle.';
    end if;
    insert into public.profiles (id, full_name, role, care_circle_id)
    values (auth.uid(), account_name, invitation_row.role, invitation_row.care_circle_id)
    on conflict (id) do update
      set role = excluded.role,
          care_circle_id = excluded.care_circle_id;
    next_status := 'accepted';
  else
    next_status := 'declined';
  end if;

  update public.invitations set status = next_status where id = invitation_row.id;
  insert into public.timeline_events (care_circle_id, type, message, linked_id)
  values (
    invitation_row.care_circle_id,
    'invitation_' || next_status,
    account_name || case when accept_invitation then ' joined the care circle.' else ' declined the invitation.' end,
    invitation_row.id
  );
  insert into public.audit_log (actor, action, target, is_demo)
  values (auth.uid(), 'care_circle_invitation_' || next_status, 'invitation:' || invitation_row.id::text, false);

  return invitation_row.care_circle_id;
end;
$$;

create or replace function public.remove_circle_member(member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  member_row public.profiles%rowtype;
  circle_id uuid;
begin
  if auth.uid() is null or public.my_role() is distinct from 'family' then
    raise exception 'Only family members can remove care circle members.';
  end if;

  circle_id := public.my_circle();
  select * into member_row
  from public.profiles
  where id = member_id and care_circle_id = circle_id
  for update;
  if not found or member_row.id = auth.uid() or member_row.role in ('elderly', 'admin') then
    raise exception 'This care circle member cannot be removed.';
  end if;

  update public.profiles set care_circle_id = null where id = member_row.id;
  insert into public.timeline_events (care_circle_id, type, message, linked_id)
  values (circle_id, 'member_removed', member_row.full_name || ' was removed from the care circle.', member_row.id);
  insert into public.audit_log (actor, action, target, is_demo)
  values (auth.uid(), 'care_circle_member_removed', 'profile:' || member_row.id::text, false);
end;
$$;

create or replace function public.update_circle_emergency_contact(contact_name text, contact_phone text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  circle_id uuid;
begin
  if auth.uid() is null or public.my_role() is distinct from 'family' then
    raise exception 'Only family members can update the emergency contact.';
  end if;
  circle_id := public.my_circle();
  if circle_id is null then
    raise exception 'Your account is not linked to a care circle.';
  end if;

  update public.care_circles
  set emergency_contact_name = nullif(trim(contact_name), ''),
      emergency_contact_phone = nullif(trim(contact_phone), '')
  where id = circle_id;
  insert into public.timeline_events (care_circle_id, type, message)
  values (circle_id, 'emergency_contact_updated', 'The emergency contact details were updated.');
  insert into public.audit_log (actor, action, target, is_demo)
  values (auth.uid(), 'emergency_contact_updated', 'care_circle:' || circle_id::text, false);
end;
$$;

revoke all on function public.invite_circle_member(text, text) from public;
revoke all on function public.cancel_circle_invitation(uuid) from public;
revoke all on function public.respond_to_circle_invitation(uuid, boolean) from public;
revoke all on function public.remove_circle_member(uuid) from public;
revoke all on function public.update_circle_emergency_contact(text, text) from public;

do $$
begin
  execute 'grant execute on function public.invite_circle_member(text, text) to authenticated';
  execute 'grant execute on function public.cancel_circle_invitation(uuid) to authenticated';
  execute 'grant execute on function public.respond_to_circle_invitation(uuid, boolean) to authenticated';
  execute 'grant execute on function public.remove_circle_member(uuid) to authenticated';
  execute 'grant execute on function public.update_circle_emergency_contact(text, text) to authenticated';
end $$;

do $$
begin
  if not exists (
    select 1 from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    raise exception 'The supabase_realtime publication is not available.';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'invitations'
  ) then
    execute 'alter publication supabase_realtime add table public.invitations';
  end if;
end $$;
