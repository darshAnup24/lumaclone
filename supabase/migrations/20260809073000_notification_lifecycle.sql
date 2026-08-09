create or replace function public.notify_organizer_of_new_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (user_id, event_id, type, title, message)
  select e.organizer_user_id, e.id, 'new_request', 'New join request',
         'A student requested to join ' || e.title || '.'
  from public.events e
  where e.id = new.event_id and e.organizer_user_id is not null;
  return new;
end;
$$;

create trigger event_requests_notify_organizer
after insert on public.event_requests
for each row execute function public.notify_organizer_of_new_request();

create or replace function public.notify_participants_of_event_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  notification_kind public.notification_type;
  notification_title text;
  notification_message text;
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    notification_kind := 'event_cancelled';
    notification_title := 'Event cancelled';
    notification_message := new.title || ' was cancelled by the organizer.';
  elsif row(
    new.title, new.description, new.start_time, new.end_time,
    new.location_type, new.location, new.meeting_url
  ) is distinct from row(
    old.title, old.description, old.start_time, old.end_time,
    old.location_type, old.location, old.meeting_url
  ) then
    notification_kind := 'event_updated';
    notification_title := 'Event updated';
    notification_message := new.title || ' has updated details.';
  else
    return new;
  end if;

  insert into public.notifications (user_id, event_id, type, title, message)
  select r.user_id, new.id, notification_kind, notification_title, notification_message
  from public.event_requests r
  where r.event_id = new.id and r.status = 'accepted';
  return new;
end;
$$;

create trigger events_notify_participants
after update on public.events
for each row execute function public.notify_participants_of_event_change();

create or replace function public.create_event_reminder(target_event_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_event public.events;
  inserted_count integer;
begin
  if auth.role() <> 'service_role' and not public.is_admin() then
    raise exception 'Only an admin can create reminders';
  end if;
  select * into target_event from public.events where id = target_event_id;
  if target_event.id is null or target_event.status <> 'published' then
    raise exception 'Published event not found';
  end if;
  insert into public.notifications (user_id, event_id, type, title, message)
  select r.user_id, target_event.id, 'event_reminder', 'Event reminder',
         target_event.title || ' is coming up soon.'
  from public.event_requests r
  where r.event_id = target_event.id and r.status = 'accepted';
  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

revoke all on function public.create_event_reminder(uuid) from public;
grant execute on function public.create_event_reminder(uuid) to authenticated, service_role;
