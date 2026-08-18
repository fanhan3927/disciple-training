do $$
begin
  create type public.group_role as enum (
    'leader',
    'co_leader',
    'member',
    'observer'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.membership_status as enum (
    'invited',
    'active',
    'paused',
    'left',
    'removed'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.group_lifecycle_status as enum (
    'active',
    'paused',
    'archived'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.group_safety_status as enum (
    'clear',
    'watch',
    'restricted',
    'frozen'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  timezone text not null default 'Asia/Shanghai',
  member_limit integer not null default 8,
  lifecycle_status public.group_lifecycle_status not null default 'active',
  safety_status public.group_safety_status not null default 'clear',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint groups_name_length check (char_length(name) between 1 and 80),
  constraint groups_description_length check (char_length(description) <= 500),
  constraint groups_member_limit_range check (member_limit between 2 and 20)
);

create table if not exists public.group_memberships (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.group_role not null default 'member',
  status public.membership_status not null default 'active',
  invited_by uuid references auth.users(id),
  joined_at timestamptz,
  left_at timestamptz,
  leader_covenant_version text,
  accepted_covenant_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (group_id, user_id),
  constraint group_memberships_leader_covenant_required check (
    role not in ('leader', 'co_leader')
    or status <> 'active'
    or accepted_covenant_at is not null
  )
);

create table if not exists public.group_invitations (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  token_hash text not null unique,
  role_to_grant public.group_role not null default 'member',
  expires_at timestamptz not null,
  max_uses integer not null default 1,
  use_count integer not null default 0,
  created_by uuid not null references auth.users(id),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint group_invitations_hash_format check (token_hash ~ '^sha256:[a-f0-9]{64}$'),
  constraint group_invitations_max_uses_range check (max_uses between 1 and 100),
  constraint group_invitations_use_count_range check (use_count >= 0 and use_count <= max_uses),
  constraint group_invitations_role_not_leader check (role_to_grant in ('member', 'observer'))
);

create index if not exists groups_created_by_idx on public.groups (created_by);
create index if not exists group_memberships_user_status_idx
  on public.group_memberships (user_id, status);
create index if not exists group_memberships_group_status_idx
  on public.group_memberships (group_id, status);
create index if not exists group_invitations_group_active_idx
  on public.group_invitations (group_id, expires_at)
  where revoked_at is null;

drop trigger if exists groups_touch_updated_at on public.groups;
create trigger groups_touch_updated_at
before update on public.groups
for each row execute function public.touch_updated_at();

drop trigger if exists group_memberships_touch_updated_at on public.group_memberships;
create trigger group_memberships_touch_updated_at
before update on public.group_memberships
for each row execute function public.touch_updated_at();

create or replace function public.is_active_group_member(target_group_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.group_memberships gm
    join public.groups g on g.id = gm.group_id
    where gm.group_id = target_group_id
      and gm.user_id = target_user_id
      and gm.status = 'active'
      and g.lifecycle_status <> 'archived'
  );
$$;

create or replace function public.is_group_leader(target_group_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.group_memberships gm
    join public.groups g on g.id = gm.group_id
    where gm.group_id = target_group_id
      and gm.user_id = target_user_id
      and gm.status = 'active'
      and gm.role in ('leader', 'co_leader')
      and g.lifecycle_status <> 'archived'
  );
$$;

create or replace function public.active_group_leader_count(target_group_id uuid)
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::integer
  from public.group_memberships
  where group_id = target_group_id
    and status = 'active'
    and role in ('leader', 'co_leader');
$$;

create or replace function public.prevent_last_leader_removal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'active'
    and old.role in ('leader', 'co_leader')
    and (
      new.status <> 'active'
      or new.role not in ('leader', 'co_leader')
    )
    and public.active_group_leader_count(old.group_id) <= 1
    and exists (
      select 1
      from public.groups
      where id = old.group_id
        and lifecycle_status <> 'archived'
    )
  then
    raise exception 'Cannot remove the only active leader from an active group';
  end if;

  return new;
end;
$$;

drop trigger if exists group_memberships_prevent_last_leader_removal on public.group_memberships;
create trigger group_memberships_prevent_last_leader_removal
before update on public.group_memberships
for each row execute function public.prevent_last_leader_removal();

alter table public.groups enable row level security;
alter table public.group_memberships enable row level security;
alter table public.group_invitations enable row level security;

drop policy if exists "groups_select_active_members" on public.groups;
create policy "groups_select_active_members"
on public.groups
for select
to authenticated
using (public.is_active_group_member(id, auth.uid()));

drop policy if exists "groups_update_group_leaders" on public.groups;
create policy "groups_update_group_leaders"
on public.groups
for update
to authenticated
using (public.is_group_leader(id, auth.uid()))
with check (public.is_group_leader(id, auth.uid()));

drop policy if exists "memberships_select_group_members" on public.group_memberships;
create policy "memberships_select_group_members"
on public.group_memberships
for select
to authenticated
using (public.is_active_group_member(group_id, auth.uid()));

drop policy if exists "memberships_update_self_leave" on public.group_memberships;
create policy "memberships_update_self_leave"
on public.group_memberships
for update
to authenticated
using (user_id = auth.uid() and status = 'active')
with check (user_id = auth.uid() and status in ('active', 'left'));

drop policy if exists "memberships_update_group_leaders" on public.group_memberships;
create policy "memberships_update_group_leaders"
on public.group_memberships
for update
to authenticated
using (public.is_group_leader(group_id, auth.uid()))
with check (public.is_group_leader(group_id, auth.uid()));

drop policy if exists "invitations_select_group_leaders" on public.group_invitations;
create policy "invitations_select_group_leaders"
on public.group_invitations
for select
to authenticated
using (public.is_group_leader(group_id, auth.uid()));

revoke all on public.groups from anon, authenticated;
revoke all on public.group_memberships from anon, authenticated;
revoke all on public.group_invitations from anon, authenticated;

grant select on public.groups to authenticated;
grant update (name, description, timezone, member_limit, lifecycle_status, archived_at) on public.groups to authenticated;
grant select on public.group_memberships to authenticated;
grant update (status, role, left_at, leader_covenant_version, accepted_covenant_at) on public.group_memberships to authenticated;
grant select on public.group_invitations to authenticated;
