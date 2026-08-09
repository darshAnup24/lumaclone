create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;

create type public.user_role as enum ('student', 'admin');
create type public.event_type as enum ('official', 'solo');
create type public.event_source as enum ('email', 'student', 'admin');
create type public.event_category as enum (
  'hackathon', 'conference', 'workshop', 'seminar', 'competition',
  'club_activity', 'career_placement', 'social', 'sports', 'study',
  'networking', 'cultural', 'other', 'unknown'
);
create type public.event_status as enum (
  'draft', 'pending_review', 'published', 'rejected', 'cancelled', 'completed'
);
create type public.event_content_type as enum (
  'event', 'deadline', 'announcement', 'opportunity', 'other'
);
create type public.event_location_type as enum ('physical', 'online', 'hybrid', 'tbd');
create type public.event_request_status as enum ('pending', 'accepted', 'rejected', 'cancelled');
create type public.notification_type as enum (
  'new_request', 'request_accepted', 'request_rejected',
  'event_updated', 'event_cancelled', 'event_reminder'
);
create type public.email_processing_status as enum (
  'received', 'processing', 'extracted', 'needs_review',
  'published', 'rejected', 'failed'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email extensions.citext not null unique,
  name text,
  avatar_url text,
  bio text,
  role public.user_role not null default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_name_length check (name is null or char_length(name) between 1 and 120),
  constraint profiles_bio_length check (bio is null or char_length(bio) <= 500)
);

create table public.organizations (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  description text,
  logo_url text,
  email_patterns text[] not null default '{}',
  is_verified boolean not null default false,
  is_official boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_name_length check (char_length(name) between 1 and 160)
);

create unique index organizations_name_unique_idx on public.organizations (lower(name));
create index organizations_verified_idx on public.organizations (is_verified, is_official);
create index organizations_email_patterns_idx on public.organizations using gin (email_patterns);

create table public.inbound_emails (
  id uuid primary key default extensions.gen_random_uuid(),
  message_id text not null unique,
  from_email extensions.citext not null,
  from_name text,
  to_email extensions.citext not null,
  subject text not null default '',
  text_body text,
  html_body text,
  received_at timestamptz not null,
  processing_status public.email_processing_status not null default 'received',
  extraction_result jsonb,
  attachment_metadata jsonb not null default '[]'::jsonb,
  error_message text,
  organization_id uuid references public.organizations(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inbound_attachment_metadata_array check (jsonb_typeof(attachment_metadata) = 'array')
);

create index inbound_emails_status_received_idx on public.inbound_emails (processing_status, received_at desc);
create index inbound_emails_sender_idx on public.inbound_emails (from_email, received_at desc);
create index inbound_emails_organization_idx on public.inbound_emails (organization_id);

create table public.events (
  id uuid primary key default extensions.gen_random_uuid(),
  title text not null,
  description text,
  event_type public.event_type not null,
  source public.event_source not null,
  content_type public.event_content_type not null default 'event',
  category public.event_category not null default 'unknown',
  organizer_user_id uuid references auth.users(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  inbound_email_id uuid references public.inbound_emails(id) on delete set null,
  source_email extensions.citext,
  start_time timestamptz,
  end_time timestamptz,
  timezone text not null default 'Asia/Kolkata',
  location_type public.event_location_type not null default 'tbd',
  location text,
  meeting_url text,
  capacity integer,
  registration_url text,
  registration_deadline timestamptz,
  cover_image_url text,
  status public.event_status not null default 'draft',
  requires_approval boolean not null default false,
  confidence_score numeric(4, 3),
  possible_duplicate boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  constraint events_title_length check (char_length(title) between 1 and 240),
  constraint events_capacity_positive check (capacity is null or capacity > 0),
  constraint events_confidence_range check (confidence_score is null or confidence_score between 0 and 1),
  constraint events_time_order check (end_time is null or start_time is null or end_time >= start_time),
  constraint events_online_location check (location_type <> 'online' or meeting_url is not null),
  constraint events_student_shape check (
    source <> 'student' or (event_type = 'solo' and organizer_user_id is not null and organization_id is null)
  ),
  constraint events_email_shape check (
    source <> 'email' or (event_type = 'official' and inbound_email_id is not null)
  ),
  constraint events_published_timestamp check (
    status <> 'published' or published_at is not null
  )
);

create index events_public_discovery_idx on public.events (status, start_time);
create index events_category_idx on public.events (category, status, start_time);
create index events_organizer_idx on public.events (organizer_user_id, created_at desc);
create index events_organization_idx on public.events (organization_id, start_time);
create index events_inbound_email_idx on public.events (inbound_email_id);
create index events_registration_url_idx on public.events (registration_url) where registration_url is not null;
create index events_normalized_title_idx on public.events (lower(regexp_replace(title, '[^[:alnum:]]+', '', 'g')));

create table public.event_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.event_request_status not null default 'pending',
  requested_at timestamptz not null default now(),
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_requests_event_user_unique unique (event_id, user_id),
  constraint event_requests_response_time check (
    (status = 'pending' and responded_at is null) or status = 'cancelled' or responded_at is not null
  )
);

create index event_requests_event_status_idx on public.event_requests (event_id, status, requested_at);
create index event_requests_user_status_idx on public.event_requests (user_id, status, requested_at desc);

create table public.notifications (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_unread_idx on public.notifications (user_id, is_read, created_at desc);
create index notifications_event_idx on public.notifications (event_id);

create table public.organization_followers (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index organization_followers_user_idx on public.organization_followers (user_id, created_at desc);

create table public.user_interests (
  user_id uuid not null references auth.users(id) on delete cascade,
  interest text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, interest),
  constraint user_interests_normalized check (interest = lower(trim(interest)) and char_length(interest) between 1 and 60)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger organizations_set_updated_at before update on public.organizations
for each row execute function public.set_updated_at();
create trigger inbound_emails_set_updated_at before update on public.inbound_emails
for each row execute function public.set_updated_at();
create trigger events_set_updated_at before update on public.events
for each row execute function public.set_updated_at();
create trigger event_requests_set_updated_at before update on public.event_requests
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'username'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.role = 'admin' from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.role() <> 'service_role' and not public.is_admin() then
    new.id := old.id;
    new.email := old.email;
    new.role := old.role;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_privileged_fields
before update on public.profiles
for each row execute function public.protect_profile_privileged_fields();

create or replace function public.protect_event_ownership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.role() <> 'service_role' and not public.is_admin() then
    new.organizer_user_id := old.organizer_user_id;
    new.organization_id := old.organization_id;
    new.event_type := old.event_type;
    new.source := old.source;
    new.inbound_email_id := old.inbound_email_id;
    new.source_email := old.source_email;
  end if;
  return new;
end;
$$;

create trigger events_protect_ownership
before update on public.events
for each row execute function public.protect_event_ownership();

create or replace function public.protect_request_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.id := old.id;
  new.event_id := old.event_id;
  new.user_id := old.user_id;
  new.requested_at := old.requested_at;
  return new;
end;
$$;

create trigger event_requests_protect_identity
before update on public.event_requests
for each row execute function public.protect_request_identity();

create or replace function public.protect_notification_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.id := old.id;
  new.user_id := old.user_id;
  new.event_id := old.event_id;
  new.type := old.type;
  new.title := old.title;
  new.message := old.message;
  new.created_at := old.created_at;
  return new;
end;
$$;

create trigger notifications_protect_fields
before update on public.notifications
for each row execute function public.protect_notification_fields();

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.inbound_emails enable row level security;
alter table public.events enable row level security;
alter table public.event_requests enable row level security;
alter table public.notifications enable row level security;
alter table public.organization_followers enable row level security;
alter table public.user_interests enable row level security;

create policy profiles_select_self_or_admin on public.profiles
for select to authenticated
using (id = auth.uid() or public.is_admin());
create policy profiles_update_self_or_admin on public.profiles
for update to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

create policy organizations_select_verified_or_admin on public.organizations
for select to anon, authenticated
using ((is_verified and is_official) or public.is_admin());
create policy organizations_admin_insert on public.organizations
for insert to authenticated with check (public.is_admin());
create policy organizations_admin_update on public.organizations
for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy organizations_admin_delete on public.organizations
for delete to authenticated using (public.is_admin());

create policy inbound_emails_admin_select on public.inbound_emails
for select to authenticated using (public.is_admin());
create policy inbound_emails_admin_insert on public.inbound_emails
for insert to authenticated with check (public.is_admin());
create policy inbound_emails_admin_update on public.inbound_emails
for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy inbound_emails_admin_delete on public.inbound_emails
for delete to authenticated using (public.is_admin());

create policy events_select_visible on public.events
for select to anon, authenticated
using (status = 'published' or organizer_user_id = auth.uid() or public.is_admin());
create policy events_student_insert on public.events
for insert to authenticated
with check (
  public.is_admin()
  or (
    organizer_user_id = auth.uid()
    and event_type = 'solo'
    and source = 'student'
    and organization_id is null
    and inbound_email_id is null
    and status in ('draft', 'published')
  )
);
create policy events_student_update on public.events
for update to authenticated
using (public.is_admin() or (organizer_user_id = auth.uid() and event_type = 'solo' and source = 'student'))
with check (
  public.is_admin()
  or (
    organizer_user_id = auth.uid()
    and event_type = 'solo'
    and source = 'student'
    and status in ('draft', 'published', 'cancelled', 'completed')
  )
);
create policy events_student_delete on public.events
for delete to authenticated
using (public.is_admin() or (organizer_user_id = auth.uid() and event_type = 'solo' and source = 'student'));

create policy event_requests_select_related on public.event_requests
for select to authenticated
using (
  user_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1 from public.events e
    where e.id = event_id and e.organizer_user_id = auth.uid()
  )
);
create policy event_requests_requester_insert on public.event_requests
for insert to authenticated
with check (
  user_id = auth.uid()
  and status = 'pending'
  and exists (
    select 1 from public.events e
    where e.id = event_id
      and e.status = 'published'
      and e.organizer_user_id is distinct from auth.uid()
  )
);
create policy event_requests_requester_cancel on public.event_requests
for update to authenticated
using (user_id = auth.uid() and status = 'pending')
with check (user_id = auth.uid() and status = 'cancelled');

create policy notifications_select_own on public.notifications
for select to authenticated using (user_id = auth.uid());
create policy notifications_update_own on public.notifications
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notifications_admin_insert on public.notifications
for insert to authenticated with check (public.is_admin());

create policy organization_followers_select_own on public.organization_followers
for select to authenticated using (user_id = auth.uid());
create policy organization_followers_insert_own on public.organization_followers
for insert to authenticated with check (user_id = auth.uid());
create policy organization_followers_delete_own on public.organization_followers
for delete to authenticated using (user_id = auth.uid());

create policy user_interests_select_own on public.user_interests
for select to authenticated using (user_id = auth.uid());
create policy user_interests_insert_own on public.user_interests
for insert to authenticated with check (user_id = auth.uid());
create policy user_interests_delete_own on public.user_interests
for delete to authenticated using (user_id = auth.uid());

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
grant execute on function public.is_admin() to anon, authenticated, service_role;

grant usage on schema public to anon, authenticated, service_role;
grant select on public.organizations, public.events to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
