create extension if not exists pgcrypto;

do $$
begin
  create type public.legal_document_type as enum (
    'mission',
    'beliefs',
    'boundaries',
    'privacy',
    'terms',
    'community_guidelines',
    'ai_notice',
    'leader_covenant'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.consent_type as enum (
    'terms',
    'privacy',
    'sensitive_data',
    'ai_notice',
    'marketing'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_path text,
  timezone text not null default 'Asia/Shanghai',
  locale text not null default 'zh-CN',
  adult_confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (char_length(display_name) <= 80),
  constraint profiles_timezone_length check (char_length(timezone) between 1 and 80),
  constraint profiles_locale_length check (char_length(locale) between 2 and 16)
);

create table if not exists public.legal_documents (
  id uuid primary key default gen_random_uuid(),
  document_type public.legal_document_type not null,
  version text not null,
  locale text not null default 'zh-CN',
  title text not null,
  content_hash text not null,
  published_at timestamptz,
  retired_at timestamptz,
  created_at timestamptz not null default now(),
  constraint legal_documents_hash_format check (content_hash ~ '^sha256:[a-f0-9]{64}$'),
  constraint legal_documents_unique_version unique (document_type, version, locale)
);

create table if not exists public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  legal_document_id uuid not null references public.legal_documents(id),
  consent_type public.consent_type not null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  evidence_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint user_consents_unique_active unique nulls not distinct (
    user_id,
    legal_document_id,
    consent_type,
    revoked_at
  ),
  constraint user_consents_evidence_object check (jsonb_typeof(evidence_meta) = 'object')
);

create index if not exists legal_documents_published_idx
  on public.legal_documents (document_type, locale, published_at)
  where published_at is not null and retired_at is null;

create index if not exists user_consents_user_active_idx
  on public.user_consents (user_id, consent_type)
  where revoked_at is null;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name, timezone, locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', ''),
    coalesce(new.raw_user_meta_data ->> 'timezone', 'Asia/Shanghai'),
    coalesce(new.raw_user_meta_data ->> 'locale', 'zh-CN')
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.confirm_adult_profile(
  display_name text,
  timezone text,
  locale text
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_profile public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  insert into public.profiles (
    user_id,
    display_name,
    timezone,
    locale,
    adult_confirmed_at
  )
  values (
    auth.uid(),
    left(trim(confirm_adult_profile.display_name), 80),
    confirm_adult_profile.timezone,
    confirm_adult_profile.locale,
    now()
  )
  on conflict (user_id) do update
    set display_name = excluded.display_name,
        timezone = excluded.timezone,
        locale = excluded.locale,
        adult_confirmed_at = coalesce(public.profiles.adult_confirmed_at, now());

  select * into updated_profile
  from public.profiles
  where user_id = auth.uid();

  return updated_profile;
end;
$$;

create or replace function public.grant_user_consent(
  document_type public.legal_document_type,
  document_version text,
  consent_type public.consent_type,
  evidence_meta jsonb default '{}'::jsonb
)
returns public.user_consents
language plpgsql
security definer
set search_path = public
as $$
declare
  target_document public.legal_documents;
  inserted_consent public.user_consents;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if jsonb_typeof(grant_user_consent.evidence_meta) <> 'object' then
    raise exception 'Evidence metadata must be a JSON object';
  end if;

  select *
  into target_document
  from public.legal_documents
  where legal_documents.document_type = grant_user_consent.document_type
    and legal_documents.version = grant_user_consent.document_version
    and legal_documents.locale = 'zh-CN'
    and legal_documents.published_at is not null
    and legal_documents.retired_at is null
  limit 1;

  if target_document.id is null then
    raise exception 'Published legal document not found';
  end if;

  insert into public.user_consents (
    user_id,
    legal_document_id,
    consent_type,
    granted_at,
    evidence_meta
  )
  values (
    auth.uid(),
    target_document.id,
    grant_user_consent.consent_type,
    now(),
    grant_user_consent.evidence_meta
  )
  on conflict (user_id, legal_document_id, consent_type, revoked_at)
  do update set granted_at = public.user_consents.granted_at
  returning * into inserted_consent;

  return inserted_consent;
end;
$$;

create or replace function public.revoke_user_consent(
  consent_id uuid
)
returns public.user_consents
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_consent public.user_consents;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update public.user_consents
  set revoked_at = now()
  where id = revoke_user_consent.consent_id
    and user_id = auth.uid()
    and revoked_at is null
  returning * into updated_consent;

  if updated_consent.id is null then
    raise exception 'Active consent not found';
  end if;

  return updated_consent;
end;
$$;

alter table public.profiles enable row level security;
alter table public.legal_documents enable row level security;
alter table public.user_consents enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "profiles_update_own_public_fields" on public.profiles;
create policy "profiles_update_own_public_fields"
on public.profiles
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "legal_documents_select_published" on public.legal_documents;
create policy "legal_documents_select_published"
on public.legal_documents
for select
to anon, authenticated
using (published_at is not null and retired_at is null);

drop policy if exists "user_consents_select_own" on public.user_consents;
create policy "user_consents_select_own"
on public.user_consents
for select
to authenticated
using (user_id = auth.uid());

revoke all on public.profiles from anon, authenticated;
revoke all on public.legal_documents from anon, authenticated;
revoke all on public.user_consents from anon, authenticated;

grant select on public.legal_documents to anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, avatar_path, timezone, locale) on public.profiles to authenticated;
grant select on public.user_consents to authenticated;

grant execute on function public.confirm_adult_profile(text, text, text) to authenticated;
grant execute on function public.grant_user_consent(
  public.legal_document_type,
  text,
  public.consent_type,
  jsonb
) to authenticated;
grant execute on function public.revoke_user_consent(uuid) to authenticated;

insert into public.legal_documents (
  document_type,
  version,
  locale,
  title,
  content_hash,
  published_at
)
values
  (
    'mission',
    '2026-07-30.m1',
    'zh-CN',
    '产品使命',
    'sha256:7c160cb7470b77eca11ee7d8ba07c7d33f786d9ca40fd26db133741338475361',
    now()
  ),
  (
    'beliefs',
    '2026-07-30.m1',
    'zh-CN',
    '信仰宣言',
    'sha256:d2b24cc2c4f488c96883fa07a914911fc122990526250c22b32a2c3804fd723e',
    now()
  ),
  (
    'boundaries',
    '2026-07-30.m1',
    'zh-CN',
    '平台边界',
    'sha256:e0775b39c00fb06b024a75303cdb4a27c96a6ac2e06cf1d526ab4ef6e58c8173',
    now()
  ),
  (
    'privacy',
    '2026-07-30.m1',
    'zh-CN',
    '隐私政策',
    'sha256:676661589919605852f77996011b64b194942d7c23643161a92e88b10f23dfc9',
    now()
  ),
  (
    'terms',
    '2026-07-30.m1',
    'zh-CN',
    '服务条款',
    'sha256:3e9d8c3f3a32762dbad97f1d2737e0df5a91114608ed2d9d9b7a6c5a6515684a',
    now()
  ),
  (
    'community_guidelines',
    '2026-07-30.m1',
    'zh-CN',
    '社区守则',
    'sha256:24f6d943043496260433d9a11233e8f7743567132166964ecb82f2e68a0210d5',
    now()
  ),
  (
    'ai_notice',
    '2026-07-30.m1',
    'zh-CN',
    'AI 使用说明',
    'sha256:60ccfb794669c36573b66bd7c021e552453209a382ced21612c2358f2887d819',
    now()
  )
on conflict (document_type, version, locale)
do update set
  title = excluded.title,
  content_hash = excluded.content_hash,
  published_at = coalesce(public.legal_documents.published_at, excluded.published_at);
