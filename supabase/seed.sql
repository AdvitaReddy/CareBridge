-- Demo-only seed. Create the four confirmed demo accounts in Supabase Auth first.
do $$
declare
  circle_id uuid;
  admin_id uuid;
  account_count integer;
begin
  select count(*)
  into account_count
  from auth.users
  where email in (
    'elderly@demo.com',
    'family@demo.com',
    'caregiver@demo.com',
    'admin@demo.com'
  );

  if account_count <> 4 then
    raise exception
      'Expected all four Auth users: elderly@demo.com, family@demo.com, caregiver@demo.com, admin@demo.com. Found %.',
      account_count;
  end if;

  select id
  into circle_id
  from public.care_circles
  where name = 'Rao Family'
  order by id
  limit 1;

  if circle_id is null then
    insert into public.care_circles (name)
    values ('Rao Family')
    returning id into circle_id;
  end if;

  insert into public.profiles (id, full_name, role, care_circle_id)
  select
    users.id,
    case users.email
      when 'elderly@demo.com' then 'Venkat Rao'
      when 'family@demo.com' then 'Ananya Rao'
      when 'caregiver@demo.com' then 'Meera Nair'
      when 'admin@demo.com' then 'CareBridge Demo Admin'
    end,
    case users.email
      when 'elderly@demo.com' then 'elderly'
      when 'family@demo.com' then 'family'
      when 'caregiver@demo.com' then 'caregiver'
      when 'admin@demo.com' then 'admin'
    end,
    circle_id
  from auth.users as users
  where users.email in (
    'elderly@demo.com',
    'family@demo.com',
    'caregiver@demo.com',
    'admin@demo.com'
  )
  on conflict (id) do update
  set full_name = excluded.full_name,
      role = excluded.role,
      care_circle_id = excluded.care_circle_id;

  select id
  into admin_id
  from auth.users
  where email = 'admin@demo.com';

  insert into public.audit_log (actor, action, target, is_demo)
  select
    admin_id,
    'demo_seed',
    'demo:profile:' || users.email,
    true
  from auth.users as users
  where users.email in (
    'elderly@demo.com',
    'family@demo.com',
    'caregiver@demo.com',
    'admin@demo.com'
  )
  and not exists (
    select 1
    from public.audit_log as existing
    where existing.actor = admin_id
      and existing.action = 'demo_seed'
      and existing.target = 'demo:profile:' || users.email
      and existing.is_demo
  );

  insert into public.audit_log (actor, action, target, is_demo)
  select admin_id, 'demo_seed', 'demo:care_circle:Rao Family', true
  where not exists (
    select 1
    from public.audit_log as existing
    where existing.actor = admin_id
      and existing.action = 'demo_seed'
      and existing.target = 'demo:care_circle:Rao Family'
      and existing.is_demo
  );
end;
$$;