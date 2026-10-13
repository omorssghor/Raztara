-- RAZTARA AI Director foundation (additive, deny-by-default).
-- This migration is intentionally not applied to production automatically.
-- No client policies are created: browser roles have no access until a reviewed
-- owner-only access design is implemented. Server-side code must still validate
-- ownership and must never expose service-role credentials.

create table if not exists public.ai_director_tasks (
  id uuid primary key default gen_random_uuid(),
  task_type text not null check (task_type in ('audit', 'bug_report', 'business_report', 'code_proposal', 'maintenance')),
  title text not null check (char_length(title) between 1 and 180),
  description text not null default '' check (char_length(description) <= 12000),
  status text not null default 'queued' check (status in ('queued', 'running', 'needs_approval', 'completed', 'failed', 'cancelled')),
  requested_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  result_summary text check (result_summary is null or char_length(result_summary) <= 12000),
  metadata jsonb not null default '{}'::jsonb check (pg_column_size(metadata) <= 16384)
);

create index if not exists ai_director_tasks_status_created_idx
  on public.ai_director_tasks (status, created_at desc);

create table if not exists public.ai_director_reports (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.ai_director_tasks(id) on delete set null,
  report_type text not null check (report_type in ('security', 'health', 'usage', 'revenue', 'product', 'other')),
  title text not null check (char_length(title) between 1 and 180),
  body text not null check (char_length(body) <= 24000),
  confidence text not null default 'unknown' check (confidence in ('low', 'medium', 'high', 'unknown')),
  source_summary jsonb not null default '{}'::jsonb check (pg_column_size(source_summary) <= 16384),
  created_at timestamptz not null default now()
);

create index if not exists ai_director_reports_created_idx
  on public.ai_director_reports (created_at desc);

create table if not exists public.ai_director_audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null check (char_length(action) between 1 and 120),
  outcome text not null check (outcome in ('allowed', 'denied', 'success', 'failure', 'approval_required')),
  target_type text check (target_type is null or char_length(target_type) <= 120),
  target_id text check (target_id is null or char_length(target_id) <= 180),
  details jsonb not null default '{}'::jsonb check (pg_column_size(details) <= 8192),
  created_at timestamptz not null default now()
);

create index if not exists ai_director_audit_log_created_idx
  on public.ai_director_audit_log (created_at desc);

create table if not exists public.ai_director_settings (
  key text primary key check (key ~ '^[a-z][a-z0-9_]{0,79}$'),
  value jsonb not null default '{}'::jsonb check (pg_column_size(value) <= 8192),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.ai_director_tasks enable row level security;
alter table public.ai_director_reports enable row level security;
alter table public.ai_director_audit_log enable row level security;
alter table public.ai_director_settings enable row level security;

comment on table public.ai_director_tasks is 'Internal AI director task queue; RLS enabled and no client policies by design.';
comment on table public.ai_director_reports is 'Internal AI director reports; RLS enabled and no client policies by design.';
comment on table public.ai_director_audit_log is 'Security audit trail for AI director actions; do not store secrets or private message contents.';
comment on table public.ai_director_settings is 'Internal AI director settings; RLS enabled and no client policies by design.';
