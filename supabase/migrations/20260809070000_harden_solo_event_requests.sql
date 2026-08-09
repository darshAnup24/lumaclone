drop policy if exists event_requests_requester_insert on public.event_requests;

create policy event_requests_requester_insert on public.event_requests
for insert to authenticated
with check (
  user_id = auth.uid()
  and status = 'pending'
  and exists (
    select 1
    from public.events e
    where e.id = event_id
      and e.event_type = 'solo'
      and e.status = 'published'
      and e.organizer_user_id is distinct from auth.uid()
  )
);

create or replace function public.respond_to_event_request(
  request_id uuid,
  decision public.event_request_status
)
returns public.event_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_request public.event_requests;
  target_event public.events;
  accepted_count integer;
begin
  if decision not in ('accepted', 'rejected') then
    raise exception 'Decision must be accepted or rejected';
  end if;

  select * into target_request
  from public.event_requests
  where id = request_id
  for update;

  if target_request.id is null or target_request.status <> 'pending' then
    raise exception 'Pending request not found';
  end if;

  select * into target_event
  from public.events
  where id = target_request.event_id
  for update;

  if target_event.id is null or target_event.event_type <> 'solo' then
    raise exception 'Solo activity not found';
  end if;
  if target_event.organizer_user_id is distinct from auth.uid() and not public.is_admin() then
    raise exception 'Only the organizer can respond';
  end if;
  if target_request.user_id = auth.uid() then
    raise exception 'Organizers cannot accept their own request';
  end if;
  if target_event.status in ('cancelled', 'completed') then
    raise exception 'Event is not accepting responses';
  end if;

  if decision = 'accepted' and target_event.capacity is not null then
    select count(*) into accepted_count
    from public.event_requests
    where event_id = target_event.id and status = 'accepted';
    if accepted_count >= target_event.capacity then
      raise exception 'Event capacity reached';
    end if;
  end if;

  update public.event_requests
  set status = decision, responded_at = now()
  where id = target_request.id
  returning * into target_request;

  insert into public.notifications (user_id, event_id, type, title, message)
  values (
    target_request.user_id,
    target_request.event_id,
    case when decision = 'accepted'
      then 'request_accepted'::public.notification_type
      else 'request_rejected'::public.notification_type
    end,
    case when decision = 'accepted' then 'Request accepted' else 'Request rejected' end,
    case when decision = 'accepted'
      then 'Your request to join this event was accepted.'
      else 'Your request to join this event was rejected.'
    end
  );

  return target_request;
end;
$$;

revoke all on function public.respond_to_event_request(uuid, public.event_request_status) from public;
grant execute on function public.respond_to_event_request(uuid, public.event_request_status) to authenticated;
