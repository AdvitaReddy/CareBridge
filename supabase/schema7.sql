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
