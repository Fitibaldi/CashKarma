-- ============================================================
-- CashKarma Supabase Schema
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- Enable extensions
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLE: profiles
-- Auto-created via trigger when a user registers.
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  first_name  text not null,
  last_name   text not null,
  avatar_url  text,
  currency    text not null default '€',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- TABLE: groups
-- ============================================================
create table public.groups (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text not null default '',
  avatar_url   text,
  location     text not null default '',
  currency     text not null default '€',
  is_archived  boolean not null default false,
  is_deleted   boolean not null default false,
  created_by   uuid not null references public.profiles(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- TABLE: group_members
-- ============================================================
create table public.group_members (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role       text not null default 'member' check (role in ('admin', 'member')),
  joined_at  timestamptz not null default now(),
  unique(group_id, user_id)
);

-- ============================================================
-- TABLE: payments
-- split_between: array of profile UUIDs who share this expense
-- ============================================================
create table public.payments (
  id              uuid primary key default gen_random_uuid(),
  group_id        uuid not null references public.groups(id) on delete cascade,
  from_user_id    uuid not null references public.profiles(id),
  from_user_name  text not null,
  to_user_id      uuid references public.profiles(id),
  amount          numeric(12, 2) not null check (amount > 0),
  currency        text not null default '€',
  description     text not null,
  date            date not null,
  method          text not null default '',
  status          text not null default 'completed',
  split_type      text not null default 'equal' check (split_type in ('equal', 'specific')),
  split_between   uuid[] not null default '{}',
  paid_by         uuid not null references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- TABLE: settlements
-- ============================================================
create table public.settlements (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references public.groups(id) on delete cascade,
  from_user_id uuid not null references public.profiles(id),
  to_user_id   uuid not null references public.profiles(id),
  amount       numeric(12, 2) not null check (amount > 0),
  created_at   timestamptz not null default now()
);

-- ============================================================
-- TABLE: group_invitations
-- ============================================================
create table public.group_invitations (
  id               uuid primary key default gen_random_uuid(),
  group_id         uuid not null references public.groups(id) on delete cascade,
  invited_by       uuid not null references public.profiles(id),
  invited_user_id  uuid not null references public.profiles(id),
  status           text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at       timestamptz not null default now(),
  accepted_at      timestamptz,
  unique(group_id, invited_user_id)
);

-- ============================================================
-- TABLE: invite_codes
-- One code per group.
-- ============================================================
create table public.invite_codes (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups(id) on delete cascade,
  code       text not null unique,
  created_at timestamptz not null default now(),
  unique(group_id)
);

-- ============================================================
-- TABLE: group_leave_requests
-- ============================================================
create table public.group_leave_requests (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  status     text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default now(),
  unique(group_id, user_id)
);

-- ============================================================
-- TABLE: notifications
-- ============================================================
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       text not null check (type in (
               'payment_added', 'payment_edited', 'payment_deleted',
               'invitation_received', 'invitation_accepted',
               'settlement_recorded', 'member_joined',
               'leave_requested', 'leave_request_approved', 'leave_request_declined',
               'group_archived', 'member_removed'
             )),
  title      text not null,
  body       text not null,
  group_id   uuid references public.groups(id) on delete cascade,
  actor_id   uuid references public.profiles(id) on delete set null,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index on public.group_members(user_id);
create index on public.group_members(group_id);
create index on public.payments(group_id);
create index on public.settlements(group_id);
create index on public.group_invitations(invited_user_id);
create index on public.group_invitations(group_id);
create index on public.invite_codes(code);
create index on public.notifications(user_id);
create index on public.notifications(is_read);

-- ============================================================
-- TRIGGER: auto-create profile row on auth signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- TRIGGER: auto-update updated_at timestamps
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger set_groups_updated_at
  before update on public.groups
  for each row execute procedure public.set_updated_at();

create trigger set_payments_updated_at
  before update on public.payments
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles              enable row level security;
alter table public.groups                enable row level security;
alter table public.group_members         enable row level security;
alter table public.payments              enable row level security;
alter table public.settlements           enable row level security;
alter table public.group_invitations     enable row level security;
alter table public.invite_codes          enable row level security;
alter table public.group_leave_requests  enable row level security;

-- ============================================================
-- HELPER: is_group_member(group_id)
-- security definer avoids RLS recursion when checking membership
-- ============================================================
create or replace function public.is_group_member(gid uuid)
returns boolean
language sql
security definer stable
as $$
  select exists (
    select 1 from public.group_members
    where group_id = gid and user_id = auth.uid()
  );
$$;

-- ============================================================
-- RLS POLICIES: profiles
-- ============================================================
create policy "profiles: read all"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles: update own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ============================================================
-- RLS POLICIES: groups
-- ============================================================
create policy "groups: members can read"
  on public.groups for select
  to authenticated
  using (created_by = auth.uid() or public.is_group_member(id));

create policy "groups: authenticated can create"
  on public.groups for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "groups: creator can update"
  on public.groups for update
  to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- ============================================================
-- RLS POLICIES: group_members
-- ============================================================
create policy "group_members: members can read"
  on public.group_members for select
  to authenticated
  using (public.is_group_member(group_id));

create policy "group_members: self join or creator"
  on public.group_members for insert
  to authenticated
  with check (
    user_id = auth.uid()
    or exists (
      select 1 from public.groups g
      where g.id = group_id and g.created_by = auth.uid()
    )
  );

create policy "group_members: self can update own"
  on public.group_members for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "group_members: self can leave"
  on public.group_members for delete
  to authenticated
  using (user_id = auth.uid());

create policy "group_members: creator can remove members"
  on public.group_members for delete
  to authenticated
  using (
    exists (
      select 1 from public.groups g
      where g.id = group_id and g.created_by = auth.uid()
    )
  );

-- ============================================================
-- RLS POLICIES: payments
-- ============================================================
create policy "payments: members can read"
  on public.payments for select
  to authenticated
  using (public.is_group_member(group_id));

create policy "payments: members can insert"
  on public.payments for insert
  to authenticated
  with check (
    public.is_group_member(group_id)
    and from_user_id = auth.uid()
  );

create policy "payments: creator can update"
  on public.payments for update
  to authenticated
  using (from_user_id = auth.uid())
  with check (from_user_id = auth.uid());

-- ============================================================
-- RLS POLICIES: settlements
-- ============================================================
create policy "settlements: members can read"
  on public.settlements for select
  to authenticated
  using (public.is_group_member(group_id));

create policy "settlements: members can insert"
  on public.settlements for insert
  to authenticated
  with check (
    public.is_group_member(group_id)
    and from_user_id = auth.uid()
  );

-- ============================================================
-- RLS POLICIES: group_invitations
-- ============================================================
create policy "invitations: relevant parties can read"
  on public.group_invitations for select
  to authenticated
  using (
    invited_user_id = auth.uid()
    or invited_by = auth.uid()
    or public.is_group_member(group_id)
  );

create policy "invitations: members can invite"
  on public.group_invitations for insert
  to authenticated
  with check (
    invited_by = auth.uid()
    and public.is_group_member(group_id)
  );

create policy "invitations: invited user can update"
  on public.group_invitations for update
  to authenticated
  using (invited_user_id = auth.uid())
  with check (invited_user_id = auth.uid());

create policy "invitations: inviter can reset"
  on public.group_invitations for update
  to authenticated
  using (invited_by = auth.uid() and public.is_group_member(group_id))
  with check (invited_by = auth.uid());

-- ============================================================
-- RLS POLICIES: invite_codes
-- ============================================================
create policy "invite_codes: authenticated can read"
  on public.invite_codes for select
  to authenticated
  using (true);

create policy "invite_codes: creator can insert"
  on public.invite_codes for insert
  to authenticated
  with check (
    exists (
      select 1 from public.groups g
      where g.id = group_id and g.created_by = auth.uid()
    )
  );

-- ============================================================
-- RLS POLICIES: group_leave_requests
-- ============================================================
create policy "leave_requests: member or creator can read"
  on public.group_leave_requests for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.groups g
      where g.id = group_id and g.created_by = auth.uid()
    )
  );

create policy "leave_requests: member can insert"
  on public.group_leave_requests for insert
  to authenticated
  with check (user_id = auth.uid() and public.is_group_member(group_id));

create policy "leave_requests: creator can update"
  on public.group_leave_requests for update
  to authenticated
  using (
    exists (
      select 1 from public.groups g
      where g.id = group_id and g.created_by = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.groups g
      where g.id = group_id and g.created_by = auth.uid()
    )
  );

-- ============================================================
-- ENABLE RLS: notifications
-- ============================================================
alter table public.notifications enable row level security;

-- ============================================================
-- RLS POLICIES: notifications
-- ============================================================
create policy "notifications: user can read own"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

create policy "notifications: authenticated can insert"
  on public.notifications for insert
  to authenticated
  with check (true);

create policy "notifications: user can update own"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- MIGRATION: add is_deleted to groups (run if table already exists)
-- alter table public.groups add column if not exists is_deleted boolean not null default false;
-- ============================================================

-- ============================================================
-- MIGRATION: add currency to profiles (run if table already exists)
-- alter table public.profiles add column if not exists currency text not null default '€';
-- ============================================================
