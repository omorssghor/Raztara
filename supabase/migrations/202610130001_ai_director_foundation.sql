-- RAZTARA AI Director foundation.
-- Additive only: does not alter existing chat/call tables or policies.
-- No user-facing access is granted. Server-side service role is required until
-- a dedicated owner authorization policy is reviewed and configured.

create table if not exists public.ai_director_tasks (
  id uuid primary key default gen_random_uuid(),
  task_type text not null check (task_type in (
    'diagnostic', 'user_feedback_summary', 'bug_report',
    'product_idea', 'business_report', 'owner_alert'
  )),
  status text not null default 'queued'
    check (status in ('queued', 'running', 'succeeded', 'failed', 'needs_owner')),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'critical')),
  title text not null,
  input_summary text,
  result_summary text,
  error_summary text,
  requires_owner_approval boolean not null default true,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create index if not exists ai_director_tasks_status_created_idx
  on public.ai_director_tasks (status, created_at desc);

create table if not exists public.ai_director_reports (
  id uuid primary key default gen_random_uuid(),
  report_type text not null
    check (report_type in ('health', 'security', 'usage', 'business', 'incident')),
  severity text not null default 'info'
    check (severity in ('info', 'warning', 'critical')),
  title text not null,
  summary text not null,
  evidence jsonb not null default '{}'::jsonb,
  requires_owner_action boolean not null default false,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists ai_director_reports_created_idx
  on public.ai_director_reports (created_at desc);

create table if not exists public.ai_director_audit_log (
  id bigint generated always as identity primary key,
  actor_type text not null check (actor_type in ('system', 'ai', 'owner')),
  action text not null,
  target_type text,
  target_id text,
  outcome text not null check (outcome in ('allowed', 'blocked', 'success', 'failure')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ai_director_audit_log_created_idx
  on public.ai_director_audit_log (created_at desc);

alter table public.ai_director_tasks enable row level security;
alter table public.ai_director_reports enable row level security;
alter table public.ai_director_audit_log enable row level security;

-- Intentionally no anon/authenticated policies: access is denied by default.
-- Add narrowly scoped owner policies only after the owner's auth UUID is verified.
-- Keep audit logs append-only for ordinary users; no client policy is added.

comment on table public.ai_director_tasks is
  'AI Director task queue; initially inaccessible to anon/authenticated clients.';
comment on table public.ai_director_reports is
  'AI Director reports and owner alerts; initially inaccessible to anon/authenticated clients.';
comment on table public.ai_director_audit_log is
  'Append-only audit trail for AI Director actions; initially inaccessible to clients.';
