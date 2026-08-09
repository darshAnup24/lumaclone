alter table public.events
add column proposed_update_for_event_id uuid references public.events(id) on delete set null;

create unique index events_inbound_email_unique_idx
on public.events (inbound_email_id)
where inbound_email_id is not null;

create index events_update_proposal_idx
on public.events (proposed_update_for_event_id, status)
where proposed_update_for_event_id is not null;

create table public.event_history (
  id uuid primary key default extensions.gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  inbound_email_id uuid references public.inbound_emails(id) on delete set null,
  action text not null check (action in ('apply_update', 'create_new', 'reject')),
  previous_data jsonb not null default '{}'::jsonb,
  new_data jsonb not null default '{}'::jsonb,
  actor_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index event_history_event_created_idx
on public.event_history (event_id, created_at desc);

alter table public.event_history enable row level security;

create policy event_history_admin_select on public.event_history
for select to authenticated using (public.is_admin());

create or replace function public.resolve_event_proposal(
  proposal_id uuid,
  decision text
)
returns public.events
language plpgsql
security definer
set search_path = ''
as $$
declare
  proposal public.events;
  target public.events;
  result public.events;
begin
  if auth.role() <> 'service_role' and not public.is_admin() then
    raise exception 'Only an admin can resolve event proposals';
  end if;
  if decision not in ('apply_update', 'create_new', 'reject') then
    raise exception 'Invalid proposal decision';
  end if;

  select * into proposal from public.events
  where id = proposal_id and source = 'email' and possible_duplicate
    and proposed_update_for_event_id is not null and status in ('pending_review', 'rejected')
  for update;
  if not found then raise exception 'Reviewable proposal not found'; end if;

  select * into target from public.events
  where id = proposal.proposed_update_for_event_id
  for update;
  if not found then raise exception 'Target event not found'; end if;

  if decision = 'apply_update' then
    insert into public.event_history (
      event_id, inbound_email_id, action, previous_data, new_data, actor_user_id
    ) values (
      target.id, proposal.inbound_email_id, decision, to_jsonb(target), to_jsonb(proposal), auth.uid()
    );
    update public.events set
      title = proposal.title,
      description = proposal.description,
      content_type = proposal.content_type,
      category = proposal.category,
      organization_id = proposal.organization_id,
      source_email = proposal.source_email,
      start_time = proposal.start_time,
      end_time = proposal.end_time,
      timezone = proposal.timezone,
      location_type = proposal.location_type,
      location = proposal.location,
      meeting_url = proposal.meeting_url,
      capacity = proposal.capacity,
      registration_url = proposal.registration_url,
      registration_deadline = proposal.registration_deadline,
      confidence_score = proposal.confidence_score,
      possible_duplicate = false,
      updated_at = now()
    where id = target.id returning * into result;
    update public.events set status = 'rejected', updated_at = now() where id = proposal.id;
    update public.inbound_emails set processing_status = 'published', updated_at = now()
      where id = proposal.inbound_email_id;
  elsif decision = 'create_new' then
    insert into public.event_history (
      event_id, inbound_email_id, action, previous_data, new_data, actor_user_id
    ) values (
      proposal.id, proposal.inbound_email_id, decision, '{}'::jsonb, to_jsonb(proposal), auth.uid()
    );
    update public.events set
      proposed_update_for_event_id = null,
      possible_duplicate = false,
      status = 'published',
      published_at = coalesce(published_at, now()),
      updated_at = now()
    where id = proposal.id returning * into result;
    update public.inbound_emails set processing_status = 'published', updated_at = now()
      where id = proposal.inbound_email_id;
  else
    insert into public.event_history (
      event_id, inbound_email_id, action, previous_data, new_data, actor_user_id
    ) values (
      target.id, proposal.inbound_email_id, decision, to_jsonb(target), to_jsonb(proposal), auth.uid()
    );
    update public.events set status = 'rejected', updated_at = now()
      where id = proposal.id returning * into result;
    update public.inbound_emails set processing_status = 'rejected', updated_at = now()
      where id = proposal.inbound_email_id;
  end if;
  return result;
end;
$$;

revoke all on function public.resolve_event_proposal(uuid, text) from public;
grant execute on function public.resolve_event_proposal(uuid, text) to authenticated, service_role;
