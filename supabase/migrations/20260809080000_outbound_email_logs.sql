create table public.outbound_email_logs (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  notification_type public.notification_type not null,
  recipient extensions.citext not null,
  provider_message_id text,
  status text not null check (status in ('sent', 'failed', 'skipped')),
  error_message text,
  created_at timestamptz not null default now()
);
create index outbound_email_logs_event_idx on public.outbound_email_logs (event_id, created_at desc);
alter table public.outbound_email_logs enable row level security;
create policy outbound_email_logs_admin_select on public.outbound_email_logs
for select to authenticated using (public.is_admin());
grant select on public.outbound_email_logs to authenticated;
grant all on public.outbound_email_logs to service_role;
