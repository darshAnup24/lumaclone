-- Reproducible demonstration data for Campus Luma.
-- Apply to the intended linked cloud project with:
--   supabase db push --linked --include-seed
-- Fixed IDs and upserts make this safe to run more than once. Runtime event creation
-- continues to use the authenticated application and its RLS policies.

insert into public.organizations (
  id, name, description, email_patterns, is_verified, is_official
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    'Coding Club',
    'The official student developer community for practical software engineering and competitive programming.',
    array['codingclub@campus.edu'],
    true,
    true
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'AI Club',
    'The campus artificial intelligence community connecting students with research and industry.',
    array['aiclub@campus.edu'],
    true,
    true
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'Photography Club',
    'The official campus collective for photography, visual storytelling, and photo walks.',
    array['photography@campus.edu'],
    true,
    true
  ),
  (
    '10000000-0000-4000-8000-000000000004',
    'E-Cell',
    'The campus entrepreneurship cell supporting student founders, ideas, and startup learning.',
    array['ecell@campus.edu'],
    true,
    true
  )
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  email_patterns = excluded.email_patterns,
  is_verified = excluded.is_verified,
  is_official = excluded.is_official;

insert into public.events (
  id,
  title,
  description,
  event_type,
  source,
  content_type,
  category,
  organization_id,
  start_time,
  end_time,
  timezone,
  location_type,
  location,
  capacity,
  registration_deadline,
  status,
  requires_approval,
  published_at
)
values
  (
    '20000000-0000-4000-8000-000000000001',
    'Full Stack Web Development Workshop',
    'Build and deploy a complete web application in a guided, hands-on workshop covering modern frontend patterns, APIs, databases, and practical deployment fundamentals. Bring a laptop with Node.js installed.',
    'official',
    'admin',
    'event',
    'workshop',
    '10000000-0000-4000-8000-000000000001',
    '2026-08-22 10:00:00+05:30',
    '2026-08-22 16:00:00+05:30',
    'Asia/Kolkata',
    'physical',
    'Software Systems Lab, Academic Block B',
    80,
    '2026-08-20 18:00:00+05:30',
    'published',
    false,
    '2026-08-09 12:00:00+05:30'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    'AI/ML Career Conference',
    'Meet machine-learning engineers, researchers, and hiring teams for technical talks, career panels, portfolio reviews, and a discussion on responsible AI careers for new graduates.',
    'official',
    'admin',
    'event',
    'career_placement',
    '10000000-0000-4000-8000-000000000002',
    '2026-08-28 09:30:00+05:30',
    '2026-08-28 17:00:00+05:30',
    'Asia/Kolkata',
    'physical',
    'Main Auditorium',
    350,
    '2026-08-25 23:59:00+05:30',
    'published',
    false,
    '2026-08-09 12:00:00+05:30'
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    '24-Hour Campus Hackathon',
    'Form a team and build a working solution for campus life in 24 hours. Mentors will be available throughout the event, with final demos and prizes on Sunday morning.',
    'official',
    'admin',
    'event',
    'hackathon',
    '10000000-0000-4000-8000-000000000001',
    '2026-09-05 09:00:00+05:30',
    '2026-09-06 09:00:00+05:30',
    'Asia/Kolkata',
    'physical',
    'Innovation Centre',
    160,
    '2026-09-01 20:00:00+05:30',
    'published',
    false,
    '2026-08-09 12:00:00+05:30'
  ),
  (
    '20000000-0000-4000-8000-000000000004',
    'Golden Hour Photography Walk',
    'Explore the campus through composition, light, and visual storytelling. All cameras and experience levels are welcome; a short peer critique will follow the walk.',
    'official',
    'admin',
    'event',
    'club_activity',
    '10000000-0000-4000-8000-000000000003',
    '2026-09-12 06:30:00+05:30',
    '2026-09-12 09:00:00+05:30',
    'Asia/Kolkata',
    'physical',
    'Main Gate',
    40,
    '2026-09-10 18:00:00+05:30',
    'published',
    false,
    '2026-08-09 12:00:00+05:30'
  ),
  (
    '20000000-0000-4000-8000-000000000005',
    'Startup & Entrepreneurship Meetup',
    'An evening for aspiring founders to exchange ideas, hear candid lessons from alumni entrepreneurs, and meet potential collaborators across design, technology, and business.',
    'official',
    'admin',
    'event',
    'networking',
    '10000000-0000-4000-8000-000000000004',
    '2026-09-19 16:00:00+05:30',
    '2026-09-19 18:30:00+05:30',
    'Asia/Kolkata',
    'physical',
    'Campus Incubation Hub',
    120,
    '2026-09-17 18:00:00+05:30',
    'published',
    false,
    '2026-08-09 12:00:00+05:30'
  )
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  event_type = excluded.event_type,
  source = excluded.source,
  content_type = excluded.content_type,
  category = excluded.category,
  organization_id = excluded.organization_id,
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  timezone = excluded.timezone,
  location_type = excluded.location_type,
  location = excluded.location,
  capacity = excluded.capacity,
  registration_deadline = excluded.registration_deadline,
  status = excluded.status,
  requires_approval = excluded.requires_approval,
  published_at = excluded.published_at;
