do $$
begin
  create type public.course_status as enum ('draft', 'active', 'retired');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.course_version_status as enum ('draft', 'review', 'published', 'retired');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.review_type as enum ('theology', 'editorial', 'copyright', 'safety');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.review_decision as enum ('pending', 'approved', 'changes_requested', 'rejected');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.lesson_risk_level as enum ('low', 'medium', 'high');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.content_block_type as enum ('overview', 'reading', 'reflection_prompt', 'practice', 'memory_ref', 'local_church_notice', 'boundary_notice');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.content_review_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.task_type as enum ('reading', 'reflection', 'practice', 'scripture_memory', 'self_assessment');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.task_completion_status as enum ('completed', 'skipped', 'reset');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.cohort_status as enum ('draft', 'active', 'paused', 'completed', 'archived');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.entry_type as enum ('reflection', 'devotional_note', 'prayer', 'testimony');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.entry_visibility as enum ('private', 'leader_only', 'group');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.entry_status as enum ('active', 'deleted');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.share_scope as enum ('leader_only', 'group');
exception when duplicate_object then null;
end $$;

create table if not exists public.content_sources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  source_file_ref text,
  license_scope text not null default 'pending_confirmation',
  license_evidence_path text,
  language text not null default 'zh-CN',
  created_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  audience text not null default 'invited_groups',
  status public.course_status not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists public.ai_policies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  risk_level public.lesson_risk_level not null default 'low',
  allowed_topics text[] not null default '{}',
  blocked_topics text[] not null default '{}',
  required_notice text not null default '',
  referral_rule text not null default '',
  version text not null,
  created_at timestamptz not null default now(),
  unique (name, version)
);

create table if not exists public.course_versions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  version text not null,
  locale text not null default 'zh-CN',
  status public.course_version_status not null default 'draft',
  source_id uuid not null references public.content_sources(id),
  published_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (course_id, version, locale),
  constraint course_versions_published_at_required check (
    status <> 'published' or published_at is not null
  )
);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  course_version_id uuid not null references public.course_versions(id) on delete cascade,
  sequence integer not null,
  title text not null,
  estimated_minutes integer not null default 60,
  created_at timestamptz not null default now(),
  unique (course_version_id, sequence)
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  sequence integer not null,
  title text not null,
  risk_level public.lesson_risk_level not null default 'low',
  local_church_notice text not null default '',
  ai_policy_id uuid references public.ai_policies(id),
  created_at timestamptz not null default now(),
  unique (module_id, sequence)
);

create table if not exists public.content_blocks (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  sequence integer not null,
  block_type public.content_block_type not null,
  body_json jsonb not null default '{}'::jsonb,
  source_locator text not null,
  ai_approved boolean not null default false,
  theology_status public.content_review_status not null default 'pending',
  copyright_status public.content_review_status not null default 'pending',
  safety_status public.content_review_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (lesson_id, sequence),
  constraint content_blocks_body_object check (jsonb_typeof(body_json) = 'object')
);

create table if not exists public.scripture_refs (
  id uuid primary key default gen_random_uuid(),
  content_block_id uuid not null references public.content_blocks(id) on delete cascade,
  osis_ref text not null,
  display_label text not null,
  translation_key text,
  licensed_text text,
  created_at timestamptz not null default now()
);

create table if not exists public.content_reviews (
  id uuid primary key default gen_random_uuid(),
  content_block_id uuid references public.content_blocks(id) on delete cascade,
  course_version_id uuid references public.course_versions(id) on delete cascade,
  review_type public.review_type not null,
  reviewer_id uuid references auth.users(id),
  decision public.review_decision not null default 'pending',
  notes text not null default '',
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint content_reviews_target_present check (
    content_block_id is not null or course_version_id is not null
  )
);

create table if not exists public.cohorts (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  course_version_id uuid not null references public.course_versions(id),
  starts_on date not null,
  status public.cohort_status not null default 'active',
  meeting_url text,
  meeting_schedule text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, course_version_id)
);

create table if not exists public.cohort_lessons (
  cohort_id uuid not null references public.cohorts(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  week_number integer not null,
  unlock_at timestamptz not null,
  due_at timestamptz,
  primary key (cohort_id, lesson_id),
  constraint cohort_lessons_week_range check (week_number between 1 and 4)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  task_type public.task_type not null,
  title text not null,
  prompt_json jsonb not null default '{}'::jsonb,
  is_core boolean not null default true,
  sequence integer not null,
  estimated_minutes integer not null default 10,
  created_at timestamptz not null default now(),
  unique (lesson_id, sequence),
  constraint tasks_prompt_object check (jsonb_typeof(prompt_json) = 'object')
);

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  group_id uuid references public.groups(id) on delete set null,
  cohort_id uuid references public.cohorts(id) on delete set null,
  lesson_id uuid references public.lessons(id) on delete set null,
  task_id uuid references public.tasks(id) on delete set null,
  entry_type public.entry_type not null default 'reflection',
  visibility public.entry_visibility not null default 'private',
  body text not null,
  status public.entry_status not null default 'active',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint entries_body_length check (char_length(body) <= 8000)
);

create table if not exists public.task_completions (
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  cohort_id uuid not null references public.cohorts(id) on delete cascade,
  status public.task_completion_status not null,
  completed_at timestamptz,
  reflection_entry_id uuid references public.entries(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (task_id, user_id, cohort_id)
);

create table if not exists public.content_shares (
  entry_id uuid not null references public.entries(id) on delete cascade,
  target_group_id uuid not null references public.groups(id) on delete cascade,
  share_scope public.share_scope not null,
  shared_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (entry_id, target_group_id, share_scope, shared_at)
);

create index if not exists course_versions_published_idx
  on public.course_versions (status, locale)
  where status = 'published';
create index if not exists lessons_module_sequence_idx on public.lessons (module_id, sequence);
create index if not exists tasks_lesson_sequence_idx on public.tasks (lesson_id, sequence);
create index if not exists cohorts_group_status_idx on public.cohorts (group_id, status);
create index if not exists entries_author_status_idx on public.entries (author_id, status);
create index if not exists content_shares_target_active_idx
  on public.content_shares (target_group_id, share_scope)
  where revoked_at is null;

drop trigger if exists cohorts_touch_updated_at on public.cohorts;
create trigger cohorts_touch_updated_at
before update on public.cohorts
for each row execute function public.touch_updated_at();

drop trigger if exists entries_touch_updated_at on public.entries;
create trigger entries_touch_updated_at
before update on public.entries
for each row execute function public.touch_updated_at();

drop trigger if exists task_completions_touch_updated_at on public.task_completions;
create trigger task_completions_touch_updated_at
before update on public.task_completions
for each row execute function public.touch_updated_at();

create or replace function public.is_published_course_version(target_course_version_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.course_versions cv
    where cv.id = target_course_version_id
      and cv.status = 'published'
      and cv.published_at is not null
  );
$$;

create or replace function public.is_group_cohort_member(target_cohort_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.cohorts c
    where c.id = target_cohort_id
      and c.status <> 'archived'
      and public.is_published_course_version(c.course_version_id)
      and public.is_active_group_member(c.group_id, target_user_id)
  );
$$;

create or replace function public.is_group_cohort_leader(target_cohort_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.cohorts c
    where c.id = target_cohort_id
      and public.is_group_leader(c.group_id, target_user_id)
  );
$$;

create or replace function public.can_read_entry(target_entry_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.entries e
    where e.id = target_entry_id
      and e.status = 'active'
      and e.deleted_at is null
      and e.author_id = target_user_id
  )
  or exists (
    select 1
    from public.entries e
    join public.content_shares cs on cs.entry_id = e.id
    where e.id = target_entry_id
      and e.status = 'active'
      and e.deleted_at is null
      and cs.revoked_at is null
      and (e.expires_at is null or e.expires_at > now())
      and (
        (cs.share_scope = 'group' and public.is_active_group_member(cs.target_group_id, target_user_id))
        or
        (cs.share_scope = 'leader_only' and public.is_group_leader(cs.target_group_id, target_user_id))
      )
  );
$$;

alter table public.content_sources enable row level security;
alter table public.courses enable row level security;
alter table public.course_versions enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.content_blocks enable row level security;
alter table public.scripture_refs enable row level security;
alter table public.content_reviews enable row level security;
alter table public.ai_policies enable row level security;
alter table public.cohorts enable row level security;
alter table public.cohort_lessons enable row level security;
alter table public.tasks enable row level security;
alter table public.task_completions enable row level security;
alter table public.entries enable row level security;
alter table public.content_shares enable row level security;

create policy "courses_select_active" on public.courses
for select to authenticated
using (status = 'active');

create policy "course_versions_select_published" on public.course_versions
for select to authenticated
using (status = 'published' and published_at is not null);

create policy "modules_select_published_versions" on public.modules
for select to authenticated
using (public.is_published_course_version(course_version_id));

create policy "lessons_select_published_versions" on public.lessons
for select to authenticated
using (
  exists (
    select 1 from public.modules m
    where m.id = module_id
      and public.is_published_course_version(m.course_version_id)
  )
);

create policy "content_blocks_select_reviewed_published" on public.content_blocks
for select to authenticated
using (
  theology_status = 'approved'
  and copyright_status = 'approved'
  and safety_status = 'approved'
  and exists (
    select 1
    from public.lessons l
    join public.modules m on m.id = l.module_id
    where l.id = lesson_id
      and public.is_published_course_version(m.course_version_id)
  )
);

create policy "scripture_refs_select_reviewed_blocks" on public.scripture_refs
for select to authenticated
using (
  exists (
    select 1 from public.content_blocks cb
    where cb.id = content_block_id
      and cb.theology_status = 'approved'
      and cb.copyright_status = 'approved'
      and cb.safety_status = 'approved'
  )
);

create policy "cohorts_select_group_members" on public.cohorts
for select to authenticated
using (
  public.is_active_group_member(group_id, auth.uid())
  and public.is_published_course_version(course_version_id)
);

create policy "cohort_lessons_select_group_members" on public.cohort_lessons
for select to authenticated
using (public.is_group_cohort_member(cohort_id, auth.uid()));

create policy "tasks_select_published_lessons" on public.tasks
for select to authenticated
using (
  exists (
    select 1
    from public.lessons l
    join public.modules m on m.id = l.module_id
    where l.id = lesson_id
      and public.is_published_course_version(m.course_version_id)
  )
);

create policy "task_completions_select_own_or_leader_summary" on public.task_completions
for select to authenticated
using (
  user_id = auth.uid()
  or public.is_group_cohort_leader(cohort_id, auth.uid())
);

create policy "entries_select_author_or_shared" on public.entries
for select to authenticated
using (public.can_read_entry(id, auth.uid()));

create policy "entries_update_author" on public.entries
for update to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

create policy "content_shares_select_author_or_target" on public.content_shares
for select to authenticated
using (
  exists (
    select 1 from public.entries e
    where e.id = entry_id and e.author_id = auth.uid()
  )
  or (
    revoked_at is null
    and (share_scope = 'group' and public.is_active_group_member(target_group_id, auth.uid()))
  )
  or (
    revoked_at is null
    and (share_scope = 'leader_only' and public.is_group_leader(target_group_id, auth.uid()))
  )
);

revoke all on public.content_sources from anon, authenticated;
revoke all on public.courses from anon, authenticated;
revoke all on public.course_versions from anon, authenticated;
revoke all on public.modules from anon, authenticated;
revoke all on public.lessons from anon, authenticated;
revoke all on public.content_blocks from anon, authenticated;
revoke all on public.scripture_refs from anon, authenticated;
revoke all on public.content_reviews from anon, authenticated;
revoke all on public.ai_policies from anon, authenticated;
revoke all on public.cohorts from anon, authenticated;
revoke all on public.cohort_lessons from anon, authenticated;
revoke all on public.tasks from anon, authenticated;
revoke all on public.task_completions from anon, authenticated;
revoke all on public.entries from anon, authenticated;
revoke all on public.content_shares from anon, authenticated;

grant select on public.courses to authenticated;
grant select on public.course_versions to authenticated;
grant select on public.modules to authenticated;
grant select on public.lessons to authenticated;
grant select on public.content_blocks to authenticated;
grant select on public.scripture_refs to authenticated;
grant select on public.cohorts to authenticated;
grant select on public.cohort_lessons to authenticated;
grant select on public.tasks to authenticated;
grant select on public.task_completions to authenticated;
grant select on public.entries to authenticated;
grant update (visibility, body, status, deleted_at, updated_at) on public.entries to authenticated;
grant select on public.content_shares to authenticated;

insert into public.content_sources (title, author, source_file_ref, license_scope, language)
values (
  '大使命门徒训练——新生活',
  '授权待最终确认',
  'authorized_source:new-life:first-four-lessons',
  'pending_final_review_productized_seed_only',
  'zh-CN'
)
on conflict do nothing;

insert into public.ai_policies (name, risk_level, allowed_topics, blocked_topics, required_notice, referral_rule, version)
values (
  'M3 default no-ai',
  'low',
  '{}',
  array['private_entries', 'sacrament_decision', 'divine_guidance'],
  'M3 不开放 AI；内容块默认不进入 AI。',
  '涉及圣礼、危机或神旨意裁决时转向本地教会和合格帮助。',
  '2026-07-30.m3'
)
on conflict (name, version) do nothing;

with source_row as (
  select id from public.content_sources
  where source_file_ref = 'authorized_source:new-life:first-four-lessons'
  limit 1
),
course_row as (
  insert into public.courses (slug, title, audience, status)
  values ('new-life-restart', '新生活重启营', 'invited_groups', 'active')
  on conflict (slug) do update set title = excluded.title, status = excluded.status
  returning id
),
version_row as (
  insert into public.course_versions (course_id, version, locale, status, source_id, published_at)
  select course_row.id, '2026-07-30.m3-seed', 'zh-CN', 'published', source_row.id, now()
  from course_row, source_row
  on conflict (course_id, version, locale) do update set status = excluded.status, published_at = excluded.published_at
  returning id
),
policy_row as (
  select id from public.ai_policies
  where name = 'M3 default no-ai' and version = '2026-07-30.m3'
  limit 1
),
module_rows as (
  insert into public.modules (course_version_id, sequence, title, estimated_minutes)
  select version_row.id, gs, ('第 ' || gs || ' 周'), 70
  from version_row, generate_series(1, 4) as gs
  on conflict (course_version_id, sequence) do update set title = excluded.title
  returning id, course_version_id, sequence
),
lesson_rows as (
  insert into public.lessons (module_id, sequence, title, risk_level, local_church_notice, ai_policy_id)
  select
    module_rows.id,
    1,
    case module_rows.sequence
      when 1 then '身份：在基督里的新开始'
      when 2 then '圣经：学习聆听与遵行'
      when 3 then '祷告：真实来到神面前'
      else '灵修：建立稳定节奏'
    end,
    'low',
    '请把本周操练带回真实本地教会生活，与可信任的属灵同伴同行。',
    policy_row.id
  from module_rows, policy_row
  on conflict (module_id, sequence) do update
    set title = excluded.title,
        local_church_notice = excluded.local_church_notice
  returning id, module_id, title
),
block_rows as (
  insert into public.content_blocks (
    lesson_id,
    sequence,
    block_type,
    body_json,
    source_locator,
    ai_approved,
    theology_status,
    copyright_status,
    safety_status
  )
  select
    lesson_rows.id,
    block_sequence,
    block_type::public.content_block_type,
    jsonb_build_object('text', body_text),
    'new-life:first-four-lessons:productized:' || block_sequence,
    false,
    'approved',
    'approved',
    'approved'
  from lesson_rows
  cross join (
    values
      (1, 'overview', '本课是产品化学习提示，不包含教材全文。'),
      (2, 'reading', '阅读本课摘要，留意一个与你今天生活相关的关键词。'),
      (3, 'reflection_prompt', '用自己的话写下今天的回应；默认仅自己可见。'),
      (4, 'local_church_notice', '平台辅助学习，不替代本地教会的敬拜、牧养和服事。')
  ) as blocks(block_sequence, block_type, body_text)
  on conflict (lesson_id, sequence) do update
    set body_json = excluded.body_json,
        theology_status = excluded.theology_status,
        copyright_status = excluded.copyright_status,
        safety_status = excluded.safety_status
  returning id, lesson_id, sequence
)
insert into public.tasks (lesson_id, task_type, title, prompt_json, is_core, sequence, estimated_minutes)
select
  lesson_rows.id,
  task_type::public.task_type,
  title,
  jsonb_build_object('prompt', prompt),
  true,
  task_sequence,
  estimated_minutes
from lesson_rows
cross join (
  values
    (1, 'reading', '阅读摘要', '阅读本课产品化摘要，不需要记录敏感正文。', 5),
    (2, 'reflection', '私人反思', '写下一个今天愿意操练的回应。', 8),
    (3, 'practice', '本周操练', '选择一个可以在本地教会或日常生活中实践的小行动。', 10),
    (4, 'self_assessment', '简短自评', '用一句话描述今天是否完成操练。', 3)
) as task_seed(task_sequence, task_type, title, prompt, estimated_minutes)
on conflict (lesson_id, sequence) do update
  set title = excluded.title,
      prompt_json = excluded.prompt_json;
