-- Core tables
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  verification_tier text not null default 'unverified',
  zipcode text,
  ward text,
  neighborhood text,
  constraint verification_tier_check check (verification_tier in ('unverified', 'light', 'strong'))
);

create table if not exists public.issues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  body text not null,
  category text not null,
  scope text not null,
  ward text,
  neighborhood text,
  status text not null default 'Submitted',
  image_url text,
  created_at timestamptz not null default now(),
  constraint scope_check check (scope in ('citywide', 'ward', 'local')),
  constraint status_check check (status in ('Submitted', 'Under review', 'Responded', 'In progress', 'Resolved'))
);

create table if not exists public.supports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  issue_id uuid not null references public.issues (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, issue_id)
);

create table if not exists public.impacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  issue_id uuid not null references public.issues (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, issue_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  parent_id uuid references public.comments (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users (id) on delete cascade,
  target_type text not null,
  target_id uuid not null,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.status_events (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues (id) on delete cascade,
  actor_id uuid not null references public.users (id) on delete cascade,
  from_status text,
  to_status text not null,
  note text,
  created_at timestamptz not null default now(),
  constraint status_events_check check (to_status in ('Submitted', 'Under review', 'Responded', 'In progress', 'Resolved'))
);

create index if not exists idx_supports_issue on public.supports (issue_id);
create index if not exists idx_impacts_issue on public.impacts (issue_id);
create index if not exists idx_comments_issue on public.comments (issue_id);
create index if not exists idx_status_events_issue on public.status_events (issue_id);

-- Enable RLS
alter table public.users enable row level security;
alter table public.issues enable row level security;
alter table public.supports enable row level security;
alter table public.impacts enable row level security;
alter table public.comments enable row level security;
alter table public.reports enable row level security;
alter table public.status_events enable row level security;

-- Users policies
create policy "Users can view their profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can insert their profile"
  on public.users for insert
  with check (auth.uid() = id);

create policy "Users can update their profile"
  on public.users for update
  using (auth.uid() = id);

-- Issues policies
create policy "Public can read issues"
  on public.issues for select
  using (true);

create policy "Verified users can create issues"
  on public.issues for insert
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.verification_tier in ('light', 'strong')
    )
  );

create policy "Owners can edit issues"
  on public.issues for update
  using (auth.uid() = user_id);

-- Supports policies
create policy "Public can read supports"
  on public.supports for select
  using (true);

create policy "Verified users can support"
  on public.supports for insert
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.verification_tier in ('light', 'strong')
    )
  );

create policy "Users can remove their supports"
  on public.supports for delete
  using (auth.uid() = user_id);

-- Impacts policies
create policy "Public can read impacts"
  on public.impacts for select
  using (true);

create policy "Verified users can add impacts"
  on public.impacts for insert
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.verification_tier in ('light', 'strong')
    )
  );

create policy "Users can remove their impacts"
  on public.impacts for delete
  using (auth.uid() = user_id);

-- Comments policies
create policy "Public can read comments"
  on public.comments for select
  using (true);

create policy "Authenticated users can comment"
  on public.comments for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their comments"
  on public.comments for delete
  using (auth.uid() = user_id);

-- Reports policies
create policy "Authenticated users can report"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

-- Status events policies
create policy "Public can read status events"
  on public.status_events for select
  using (true);

create policy "Service role can write status events"
  on public.status_events for insert
  with check (auth.role() = 'service_role');

-- Column-level grants to prevent status changes outside admin flow
revoke all on public.issues from anon, authenticated;
revoke all on public.supports from anon, authenticated;
revoke all on public.impacts from anon, authenticated;
revoke all on public.comments from anon, authenticated;
revoke all on public.reports from anon, authenticated;
revoke all on public.status_events from anon, authenticated;
revoke all on public.users from anon, authenticated;

grant select on public.issues to anon, authenticated;
grant insert on public.issues to authenticated;
grant update (title, body, category, scope, ward, neighborhood, image_url) on public.issues to authenticated;

grant select on public.supports to anon, authenticated;
grant insert, delete on public.supports to authenticated;

grant select on public.impacts to anon, authenticated;
grant insert, delete on public.impacts to authenticated;

grant select on public.comments to anon, authenticated;
grant insert, delete on public.comments to authenticated;

grant insert on public.reports to authenticated;

grant select on public.status_events to anon, authenticated;

grant select, insert, update on public.users to authenticated;

-- Storage bucket for issue images (run once in Supabase SQL editor)
-- insert into storage.buckets (id, name, public) values ('issue-images', 'issue-images', true);
