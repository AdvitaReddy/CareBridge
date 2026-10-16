create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  care_circle_id uuid not null references public.care_circles(id) on delete cascade,
  title text not null check (length(btrim(title)) > 0),
  description text,
  assigned_to uuid not null references public.profiles(id),
  assigned_by uuid not null references public.profiles(id),
  due_at timestamptz,
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'completed')),
  completed_at timestamptz null,
  created_at timestamptz not null default now()
);

create table if not exists public.visit_notes (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  care_circle_id uuid not null references public.care_circles(id) on delete cascade,
  author uuid not null references public.profiles(id),
  note text not null check (length(btrim(note)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists tasks_circle_due_at_idx
  on public.tasks (care_circle_id, due_at);
create index if not exists tasks_assigned_to_status_idx
  on public.tasks (assigned_to, status);
create index if not exists visit_notes_task_created_at_idx
  on public.visit_notes (task_id, created_at desc);

alter table public.tasks enable row level security;
alter table public.visit_notes enable row level security;

drop policy if exists "Circle members and admins can read tasks" on public.tasks;
create policy "Circle members and admins can read tasks"
  on public.tasks for select to authenticated
  using (care_circle_id = public.my_circle() or public.my_role() = 'admin');

drop policy if exists "Family and admins can create tasks" on public.tasks;
create policy "Family and admins can create tasks"
  on public.tasks for insert to authenticated
  with check (
    care_circle_id = public.my_circle()
    and public.my_role() in ('family', 'admin')
    and assigned_by = auth.uid()
    and exists (
      select 1
      from public.profiles caregiver
      where caregiver.id = assigned_to
        and caregiver.care_circle_id = public.my_circle()
        and caregiver.role = 'caregiver'
    )
  );

drop policy if exists "Assigned caregivers can update task status" on public.tasks;
create policy "Assigned caregivers can update task status"
  on public.tasks for update to authenticated
  using (
    care_circle_id = public.my_circle()
    and assigned_to = auth.uid()
    and public.my_role() = 'caregiver'
  )
  with check (
    care_circle_id = public.my_circle()
    and assigned_to = auth.uid()
    and public.my_role() = 'caregiver'
  );

drop policy if exists "Circle members and admins can read visit notes" on public.visit_notes;
create policy "Circle members and admins can read visit notes"
  on public.visit_notes for select to authenticated
  using (care_circle_id = public.my_circle() or public.my_role() = 'admin');

drop policy if exists "Assigned caregivers can add visit notes" on public.visit_notes;
create policy "Assigned caregivers can add visit notes"
  on public.visit_notes for insert to authenticated
  with check (
    care_circle_id = public.my_circle()
    and author = auth.uid()
    and public.my_role() = 'caregiver'
    and exists (
      select 1
      from public.tasks task
      where task.id = task_id
        and task.care_circle_id = public.my_circle()
        and task.assigned_to = auth.uid()
        and task.status = 'completed'
    )
  );

grant select, insert on public.tasks to authenticated;
grant update (status) on public.tasks to authenticated;
grant select, insert on public.visit_notes to authenticated;

create or replace function public.guard_task_status_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.id is distinct from old.id
    or new.care_circle_id is distinct from old.care_circle_id
    or new.title is distinct from old.title
    or new.description is distinct from old.description
    or new.assigned_to is distinct from old.assigned_to
    or new.assigned_by is distinct from old.assigned_by
    or new.due_at is distinct from old.due_at
    or new.created_at is distinct from old.created_at then
    raise exception 'Caregivers can only change a task status.';
  end if;

  if auth.uid() is distinct from old.assigned_to
    or public.my_role() is distinct from 'caregiver' then
    raise exception 'Only the assigned caregiver can change this task status.';
  end if;

  if new.status is distinct from old.status
    and not (
      (old.status = 'pending' and new.status = 'in_progress')
      or (old.status = 'in_progress' and new.status = 'completed')
    ) then
    raise exception 'Tasks can only be started or completed in order.';
  end if;

  new.completed_at := case
    when new.status = 'completed' then coalesce(old.completed_at, now())
    else null
  end;
  return new;
end;
$$;

drop trigger if exists tasks_guard_status_update on public.tasks;
create trigger tasks_guard_status_update
before update on public.tasks
for each row execute function public.guard_task_status_update();

create or replace function public.record_task_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.timeline_events (care_circle_id, type, message, linked_id)
    values (
      new.care_circle_id,
      'task',
      'Task assigned: ' || new.title,
      new.id
    );

    insert into public.notifications (
      care_circle_id, type, message, linked_id, recipient_id
    ) values (
      new.care_circle_id,
      'Caregiver Task',
      'A new task was assigned: ' || new.title,
      new.id,
      new.assigned_to
    );

    insert into public.audit_log (actor, action, target, is_demo)
    values (auth.uid(), 'task_created', 'task:' || new.id::text, false);
    return new;
  end if;

  if old.status is distinct from new.status then
    insert into public.timeline_events (care_circle_id, type, message, linked_id)
    values (
      new.care_circle_id,
      'task',
      'Task "' || new.title || '" status changed to ' || replace(new.status, '_', ' ') || '.',
      new.id
    );

    if new.status = 'completed' then
      insert into public.notifications (
        care_circle_id, type, message, linked_id, recipient_id
      )
      select new.care_circle_id,
        'Caregiver Task',
        'Task completed: ' || new.title,
        new.id,
        member.id
      from public.profiles member
      where member.care_circle_id = new.care_circle_id
        and member.role = 'family';
    end if;

    insert into public.audit_log (actor, action, target, is_demo)
    values (
      auth.uid(),
      'task_status_changed:' || new.status,
      'task:' || new.id::text,
      false
    );
  end if;
  return new;
end;
$$;

drop trigger if exists tasks_record_changes on public.tasks;
create trigger tasks_record_changes
after insert or update on public.tasks
for each row execute function public.record_task_changes();

create or replace function public.record_visit_note()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  task_title text;
begin
  select title into task_title
  from public.tasks
  where id = new.task_id;

  insert into public.timeline_events (care_circle_id, type, message, linked_id)
  values (
    new.care_circle_id,
    'visit',
    'Visit note added for: ' || coalesce(task_title, 'care task') || '.',
    new.id
  );

  insert into public.notifications (
    care_circle_id, type, message, linked_id, recipient_id
  )
  select new.care_circle_id,
    'Visit',
    'A visit note was added for: ' || coalesce(task_title, 'care task') || '.',
    new.id,
    member.id
  from public.profiles member
  where member.care_circle_id = new.care_circle_id
    and member.role = 'family';

  insert into public.audit_log (actor, action, target, is_demo)
  values (auth.uid(), 'visit_note_added', 'visit_note:' || new.id::text, false);
  return new;
end;
$$;

drop trigger if exists visit_notes_record_changes on public.visit_notes;
create trigger visit_notes_record_changes
after insert on public.visit_notes
for each row execute function public.record_visit_note();

drop policy if exists "Admins can read audit logs" on public.audit_log;
create policy "Admins can read audit logs"
  on public.audit_log for select to authenticated
  using (public.my_role() = 'admin');
grant select on public.audit_log to authenticated;

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
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'tasks'
  ) then
    execute 'alter publication supabase_realtime add table public.tasks';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'visit_notes'
  ) then
    execute 'alter publication supabase_realtime add table public.visit_notes';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'audit_log'
  ) then
    execute 'alter publication supabase_realtime add table public.audit_log';
  end if;
end $$;
