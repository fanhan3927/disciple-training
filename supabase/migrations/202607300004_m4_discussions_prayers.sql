do $$
begin
  create type public.discussion_post_status as enum ('active', 'hidden', 'deleted');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.comment_status as enum ('active', 'hidden', 'deleted');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.reaction_type as enum ('encouragement', 'prayer');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.prayer_visibility as enum ('private', 'leader_only', 'group');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.prayer_status as enum ('open', 'continued', 'ended', 'responded');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.prayer_response_type as enum ('prayed', 'encouragement');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.notification_type as enum ('discussion_reply', 'prayer_response', 'weekly_reminder');
exception when duplicate_object then null;
end $$;

create table if not exists public.group_posts (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  week_number integer,
  title text not null,
  body text not null,
  status public.discussion_post_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  hidden_at timestamptz,
  deleted_at timestamptz,
  constraint group_posts_week_range check (week_number is null or week_number between 1 and 4),
  constraint group_posts_title_length check (char_length(title) between 1 and 160),
  constraint group_posts_body_length check (char_length(body) between 1 and 4000)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.group_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  status public.comment_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  hidden_at timestamptz,
  deleted_at timestamptz,
  constraint comments_body_length check (char_length(body) between 1 and 2000)
);

create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.group_posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction_type public.reaction_type not null,
  created_at timestamptz not null default now(),
  constraint reactions_one_target check ((post_id is null) <> (comment_id is null))
);

create table if not exists public.prayer_requests (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  visibility public.prayer_visibility not null default 'private',
  status public.prayer_status not null default 'open',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ended_at timestamptz,
  responded_at timestamptz,
  constraint prayer_requests_title_length check (char_length(title) between 1 and 160),
  constraint prayer_requests_body_length check (char_length(body) between 1 and 4000),
  constraint prayer_requests_expiry_after_creation check (expires_at is null or expires_at > created_at)
);

create table if not exists public.prayer_responses (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.prayer_requests(id) on delete cascade,
  responder_id uuid not null references auth.users(id) on delete cascade,
  response_type public.prayer_response_type not null,
  body text,
  created_at timestamptz not null default now(),
  constraint prayer_responses_body_length check (body is null or char_length(body) <= 1000)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  group_id uuid references public.groups(id) on delete cascade,
  notification_type public.notification_type not null,
  post_id uuid references public.group_posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  prayer_request_id uuid references public.prayer_requests(id) on delete cascade,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint notifications_metadata_keys check (
    not (metadata ?| array['body', 'content', 'prayer_body', 'private_text'])
  )
);

create unique index if not exists reactions_post_user_type_idx
  on public.reactions (post_id, user_id, reaction_type)
  where post_id is not null;
create unique index if not exists reactions_comment_user_type_idx
  on public.reactions (comment_id, user_id, reaction_type)
  where comment_id is not null;
create index if not exists group_posts_group_created_idx on public.group_posts (group_id, created_at desc);
create index if not exists comments_post_created_idx on public.comments (post_id, created_at asc);
create index if not exists prayer_requests_group_status_idx on public.prayer_requests (group_id, status, created_at desc);
create index if not exists notifications_user_unread_idx on public.notifications (user_id, read_at, created_at desc);

drop trigger if exists group_posts_touch_updated_at on public.group_posts;
create trigger group_posts_touch_updated_at
before update on public.group_posts
for each row execute function public.touch_updated_at();

drop trigger if exists comments_touch_updated_at on public.comments;
create trigger comments_touch_updated_at
before update on public.comments
for each row execute function public.touch_updated_at();

drop trigger if exists prayer_requests_touch_updated_at on public.prayer_requests;
create trigger prayer_requests_touch_updated_at
before update on public.prayer_requests
for each row execute function public.touch_updated_at();

alter table public.group_posts enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.prayer_requests enable row level security;
alter table public.prayer_responses enable row level security;
alter table public.notifications enable row level security;

create policy "group_posts_select_active_members" on public.group_posts
for select to authenticated
using (
  public.is_active_group_member(group_id, auth.uid())
  and (
    status = 'active'
    or author_id = auth.uid()
    or public.is_group_leader(group_id, auth.uid())
  )
);

create policy "group_posts_insert_active_members" on public.group_posts
for insert to authenticated
with check (
  author_id = auth.uid()
  and public.is_active_group_member(group_id, auth.uid())
);

create policy "group_posts_update_author_or_leader" on public.group_posts
for update to authenticated
using (
  public.is_active_group_member(group_id, auth.uid())
  and (author_id = auth.uid() or public.is_group_leader(group_id, auth.uid()))
)
with check (
  public.is_active_group_member(group_id, auth.uid())
  and (author_id = auth.uid() or public.is_group_leader(group_id, auth.uid()))
);

create policy "comments_select_active_group_members" on public.comments
for select to authenticated
using (
  status = 'active'
  and exists (
    select 1 from public.group_posts p
    where p.id = post_id
      and p.status = 'active'
      and public.is_active_group_member(p.group_id, auth.uid())
  )
);

create policy "comments_insert_active_group_members" on public.comments
for insert to authenticated
with check (
  author_id = auth.uid()
  and exists (
    select 1 from public.group_posts p
    where p.id = post_id
      and p.status = 'active'
      and public.is_active_group_member(p.group_id, auth.uid())
  )
);

create policy "comments_update_author_or_leader" on public.comments
for update to authenticated
using (
  exists (
    select 1 from public.group_posts p
    where p.id = post_id
      and public.is_active_group_member(p.group_id, auth.uid())
      and (author_id = auth.uid() or public.is_group_leader(p.group_id, auth.uid()))
  )
)
with check (author_id = auth.uid() or exists (
  select 1 from public.group_posts p
  where p.id = post_id and public.is_group_leader(p.group_id, auth.uid())
));

create policy "reactions_select_active_group_members" on public.reactions
for select to authenticated
using (
  (post_id is not null and exists (
    select 1 from public.group_posts p
    where p.id = post_id and public.is_active_group_member(p.group_id, auth.uid())
  ))
  or (comment_id is not null and exists (
    select 1 from public.comments c
    join public.group_posts p on p.id = c.post_id
    where c.id = comment_id and public.is_active_group_member(p.group_id, auth.uid())
  ))
);

create policy "reactions_insert_active_group_members" on public.reactions
for insert to authenticated
with check (
  user_id = auth.uid()
  and (
    (post_id is not null and exists (
      select 1 from public.group_posts p
      where p.id = post_id and p.status = 'active' and public.is_active_group_member(p.group_id, auth.uid())
    ))
    or (comment_id is not null and exists (
      select 1 from public.comments c
      join public.group_posts p on p.id = c.post_id
      where c.id = comment_id and c.status = 'active' and p.status = 'active'
        and public.is_active_group_member(p.group_id, auth.uid())
    ))
  )
);

create policy "reactions_delete_author" on public.reactions
for delete to authenticated
using (user_id = auth.uid());

create policy "prayer_requests_select_author_or_allowed_scope" on public.prayer_requests
for select to authenticated
using (
  (
    visibility = 'private' and author_id = auth.uid()
  )
  or (
    visibility = 'leader_only' and public.is_group_leader(group_id, auth.uid())
  )
  or (
    visibility = 'group' and public.is_active_group_member(group_id, auth.uid())
  )
);

create policy "prayer_requests_insert_author_member" on public.prayer_requests
for insert to authenticated
with check (
  author_id = auth.uid()
  and public.is_active_group_member(group_id, auth.uid())
);

create policy "prayer_requests_update_author" on public.prayer_requests
for update to authenticated
using (author_id = auth.uid() and public.is_active_group_member(group_id, auth.uid()))
with check (author_id = auth.uid() and public.is_active_group_member(group_id, auth.uid()));

create policy "prayer_responses_select_allowed_request" on public.prayer_responses
for select to authenticated
using (
  exists (
    select 1 from public.prayer_requests r
    where r.id = request_id
      and (
        (r.visibility = 'private' and r.author_id = auth.uid())
        or (r.visibility = 'leader_only' and public.is_group_leader(r.group_id, auth.uid()))
        or (r.visibility = 'group' and public.is_active_group_member(r.group_id, auth.uid()))
      )
  )
);

create policy "prayer_responses_insert_allowed_request" on public.prayer_responses
for insert to authenticated
with check (
  responder_id = auth.uid()
  and exists (
    select 1 from public.prayer_requests r
    where r.id = request_id
      and r.status in ('open', 'continued')
      and (
        (r.visibility = 'private' and r.author_id = auth.uid())
        or (r.visibility = 'leader_only' and public.is_group_leader(r.group_id, auth.uid()))
        or (r.visibility = 'group' and public.is_active_group_member(r.group_id, auth.uid()))
      )
  )
);

create policy "prayer_responses_delete_author" on public.prayer_responses
for delete to authenticated
using (responder_id = auth.uid());

create policy "notifications_select_owner" on public.notifications
for select to authenticated
using (user_id = auth.uid());

create policy "notifications_update_owner" on public.notifications
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

revoke all on public.group_posts from anon, authenticated;
revoke all on public.comments from anon, authenticated;
revoke all on public.reactions from anon, authenticated;
revoke all on public.prayer_requests from anon, authenticated;
revoke all on public.prayer_responses from anon, authenticated;
revoke all on public.notifications from anon, authenticated;

grant select, insert on public.group_posts to authenticated;
grant update (title, body, status, hidden_at, deleted_at) on public.group_posts to authenticated;
grant select, insert on public.comments to authenticated;
grant update (body, status, hidden_at, deleted_at) on public.comments to authenticated;
grant select, insert, delete on public.reactions to authenticated;
grant select, insert on public.prayer_requests to authenticated;
grant update (title, body, visibility, status, expires_at, ended_at, responded_at) on public.prayer_requests to authenticated;
grant select, insert, delete on public.prayer_responses to authenticated;
grant select, update (read_at) on public.notifications to authenticated;
