do $$
begin
  create type public.ai_risk_category as enum ('normal', 'doctrine_core', 'denominational', 'divine_guidance', 'sacrament', 'mental_health', 'self_harm', 'abuse', 'financial_exploitation', 'other_high_risk', 'prompt_injection');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.ai_grounding_status as enum ('grounded', 'partial', 'insufficient');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.ai_message_role as enum ('user', 'assistant', 'system');
exception when duplicate_object then null;
end $$;

create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  content_block_id uuid not null references public.content_blocks(id) on delete cascade,
  chunk_text text not null,
  source_locator text not null,
  embedding jsonb,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  constraint knowledge_chunks_text_length check (char_length(chunk_text) between 1 and 12000),
  constraint knowledge_chunks_source_required check (char_length(source_locator) between 1 and 500),
  constraint knowledge_chunks_embedding_array check (embedding is null or jsonb_typeof(embedding) = 'array')
);

create table if not exists public.ai_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '课程学习对话',
  include_private_content boolean not null default false,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint ai_threads_title_length check (char_length(title) between 1 and 120),
  constraint ai_threads_private_default check (include_private_content = false)
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.ai_threads(id) on delete cascade,
  role public.ai_message_role not null,
  body text not null,
  risk_category public.ai_risk_category not null default 'normal',
  grounding_status public.ai_grounding_status not null default 'insufficient',
  citations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint ai_messages_body_length check (char_length(body) between 1 and 12000),
  constraint ai_messages_citations_array check (jsonb_typeof(citations) = 'array')
);

create index if not exists knowledge_chunks_content_block_idx on public.knowledge_chunks (content_block_id, status);
create index if not exists ai_threads_user_status_idx on public.ai_threads (user_id, status, created_at desc);
create index if not exists ai_messages_thread_created_idx on public.ai_messages (thread_id, created_at asc);

alter table public.knowledge_chunks enable row level security;
alter table public.ai_threads enable row level security;
alter table public.ai_messages enable row level security;

create policy "knowledge_chunks_select_reviewed_published" on public.knowledge_chunks
for select to authenticated
using (
  status = 'active'
  and exists (
    select 1 from public.content_blocks cb
    join public.lessons l on l.id = cb.lesson_id
    join public.modules m on m.id = l.module_id
    where cb.id = content_block_id
      and cb.ai_approved = true
      and cb.theology_status = 'approved'
      and cb.copyright_status = 'approved'
      and cb.safety_status = 'approved'
      and public.is_published_course_version(m.course_version_id)
  )
);

create policy "ai_threads_select_owner" on public.ai_threads
for select to authenticated using (user_id = auth.uid() and status <> 'deleted');
create policy "ai_threads_insert_owner" on public.ai_threads
for insert to authenticated with check (user_id = auth.uid() and include_private_content = false);
create policy "ai_threads_update_owner" on public.ai_threads
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and include_private_content = false);

create policy "ai_messages_select_thread_owner" on public.ai_messages
for select to authenticated using (exists (select 1 from public.ai_threads t where t.id = thread_id and t.user_id = auth.uid() and t.status <> 'deleted'));
create policy "ai_messages_insert_thread_owner" on public.ai_messages
for insert to authenticated with check (exists (select 1 from public.ai_threads t where t.id = thread_id and t.user_id = auth.uid() and t.status = 'active'));

revoke all on public.knowledge_chunks from anon, authenticated;
revoke all on public.ai_threads from anon, authenticated;
revoke all on public.ai_messages from anon, authenticated;
grant select on public.knowledge_chunks to authenticated;
grant select on public.ai_threads to authenticated;
grant select on public.ai_messages to authenticated;
