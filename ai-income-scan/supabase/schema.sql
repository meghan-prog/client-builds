-- AI Income Scan — database schema
-- Voer dit uit in de Supabase SQL editor van je project.
-- Alle writes gebeuren via de service role key vanuit server-side API routes
-- (nooit vanuit de browser), dus Row Level Security kan dicht blijven.

create extension if not exists "pgcrypto";

create table if not exists scans (
  id uuid primary key,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  answers jsonb,
  scores jsonb,
  primary_route text,
  secondary_route text
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid references scans (id) on delete set null,
  first_name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid references scans (id) on delete set null,
  event_name text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_scans_completed_at on scans (completed_at);
create index if not exists idx_scans_primary_route on scans (primary_route);
create index if not exists idx_leads_scan_id on leads (scan_id);
create index if not exists idx_events_event_name on events (event_name);
create index if not exists idx_events_scan_id on events (scan_id);

-- Row Level Security: alleen de service role (server) mag lezen/schrijven.
alter table scans enable row level security;
alter table leads enable row level security;
alter table events enable row level security;
