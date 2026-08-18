do $$ begin create type public.report_target_type as enum ('post', 'comment', 'prayer', 'member', 'group'); exception when duplicate_object then null; end $$;
do $$ begin create type public.report_status as enum ('open', 'in_review', 'resolved', 'dismissed'); exception when duplicate_object then null; end $$;
do $$ begin create type public.safety_case_status as enum ('open', 'triage', 'active', 'resolved', 'closed'); exception when duplicate_object then null; end $$;
do $$ begin create type public.user_rights_request_status as enum ('requested', 'processing', 'completed', 'cancelled'); exception when duplicate_object then null; end $$;

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  target_type public.report_target_type not null,
  target_id uuid not null,
  category text not null,
  details text not null default '',
  status public.report_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reports_category_length check (char_length(category) between 1 and 80),
  constraint reports_details_length check (char_length(details) <= 4000)
);

create table if not exists public.safety_cases (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.reports(id) on delete set null,
  group_id uuid references public.groups(id) on delete set null,
  status public.safety_case_status not null default 'open',
  severity text not null default 'normal',
  assigned_to uuid references auth.users(id) on delete set null,
  resolution_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint safety_cases_resolution_length check (char_length(resolution_note) <= 4000)
);

create table if not exists public.safety_case_access (
  case_id uuid not null references public.safety_cases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  access_reason text not null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (case_id, user_id, granted_at)
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  group_id uuid references public.groups(id) on delete set null,
  event_type text not null,
  target_type text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_events_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint audit_events_metadata_no_sensitive_body check (not (metadata ?| array['body', 'content', 'private_text', 'ai_prompt']))
);

create table if not exists public.data_export_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.user_rights_request_status not null default 'requested',
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  download_expires_at timestamptz
);

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.user_rights_request_status not null default 'requested',
  requested_at timestamptz not null default now(),
  cooldown_until timestamptz not null default (now() + interval '7 days'),
  completed_at timestamptz
);

create index if not exists reports_group_status_idx on public.reports (group_id, status, created_at desc);
create index if not exists safety_cases_status_idx on public.safety_cases (status, created_at desc);
create index if not exists audit_events_target_idx on public.audit_events (target_user_id, group_id, created_at desc);
create index if not exists export_requests_owner_idx on public.data_export_requests (user_id, requested_at desc);
create index if not exists deletion_requests_owner_idx on public.account_deletion_requests (user_id, requested_at desc);

drop trigger if exists reports_touch_updated_at on public.reports;
create trigger reports_touch_updated_at before update on public.reports for each row execute function public.touch_updated_at();
drop trigger if exists safety_cases_touch_updated_at on public.safety_cases;
create trigger safety_cases_touch_updated_at before update on public.safety_cases for each row execute function public.touch_updated_at();

alter table public.reports enable row level security;
alter table public.safety_cases enable row level security;
alter table public.safety_case_access enable row level security;
alter table public.audit_events enable row level security;
alter table public.data_export_requests enable row level security;
alter table public.account_deletion_requests enable row level security;

create policy "reports_select_reporter" on public.reports for select to authenticated using (reporter_id = auth.uid());
create policy "reports_insert_active_member" on public.reports for insert to authenticated with check (reporter_id = auth.uid() and public.is_active_group_member(group_id, auth.uid()));
create policy "data_export_requests_owner" on public.data_export_requests for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "account_deletion_requests_owner" on public.account_deletion_requests for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on public.reports from anon, authenticated;
revoke all on public.safety_cases from anon, authenticated;
revoke all on public.safety_case_access from anon, authenticated;
revoke all on public.audit_events from anon, authenticated;
revoke all on public.data_export_requests from anon, authenticated;
revoke all on public.account_deletion_requests from anon, authenticated;
grant select, insert on public.reports to authenticated;
grant select, insert on public.data_export_requests to authenticated;
grant select, insert on public.account_deletion_requests to authenticated;
