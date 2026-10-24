-- Thrive: initial schema, constraints, triggers and Row Level Security.
-- Run once, in full, in the Supabase SQL Editor.

-- =====================================================================
-- 1. TABLES
-- =====================================================================

-- Minimal profile row per authenticated user (created automatically below).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  -- Defaults to the signed-in user, so the client never sends it.
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  title text not null,
  description text,
  category text,
  status text not null default 'todo',
  target_date date,
  target_month date,                 -- first day of the month, e.g. 2027-03-01
  target_amount numeric(12, 2),
  currency text not null default 'EUR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,          -- maintained by a trigger

  constraint goals_title_length
    check (char_length(btrim(title)) between 1 and 100),
  constraint goals_description_length
    check (description is null or char_length(description) <= 1000),
  constraint goals_category_valid
    check (category is null or category in ('Home', 'Personal', 'Learning', 'Other')),
  constraint goals_status_valid
    check (status in ('todo', 'in_progress', 'completed')),
  constraint goals_target_date_range
    check (target_date is null
           or target_date between date '2000-01-01' and date '2100-12-31'),
  constraint goals_target_month_valid
    check (target_month is null
           or (extract(day from target_month) = 1
               and target_month between date '2000-01-01' and date '2100-12-01')),
  -- A goal has a target date OR a target month, never both.
  constraint goals_single_target
    check (target_date is null or target_month is null),
  constraint goals_target_amount_valid
    check (target_amount is null
           or (target_amount > 0 and target_amount <= 10000000)),
  constraint goals_currency_eur
    check (currency = 'EUR'),
  -- completed_at is set exactly when the status is 'completed'.
  constraint goals_completed_at_matches_status
    check ((status = 'completed') = (completed_at is not null)),
  -- Lets child tables reference (id, user_id) so owners can never disagree.
  constraint goals_id_user_id_key unique (id, user_id)
);

create table public.savings_entries (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null,
  user_id uuid not null default auth.uid(),
  amount numeric(12, 2) not null,    -- positive = saved, negative = withdrawal
  entry_date date not null,
  note text,
  created_at timestamptz not null default now(),

  -- Deleting a goal (or user) deletes its entries.
  constraint savings_entries_goal_fk
    foreign key (goal_id, user_id)
    references public.goals (id, user_id) on delete cascade,
  constraint savings_entries_amount_valid
    check (amount <> 0 and abs(amount) <= 10000000),
  constraint savings_entries_date_range
    check (entry_date between date '2000-01-01' and date '2100-12-31'),
  constraint savings_entries_note_length
    check (note is null or char_length(note) <= 200)
);

create table public.goal_links (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null,
  user_id uuid not null default auth.uid(),
  title text,
  url text not null,
  note text,
  created_at timestamptz not null default now(),

  constraint goal_links_goal_fk
    foreign key (goal_id, user_id)
    references public.goals (id, user_id) on delete cascade,
  constraint goal_links_title_length
    check (title is null or char_length(title) <= 100),
  constraint goal_links_note_length
    check (note is null or char_length(note) <= 300),
  -- Backstop for the app's own validation: http(s) only, no whitespace,
  -- no user:password@ in the host. Blocks javascript:, data:, etc.
  constraint goal_links_url_valid
    check (char_length(url) <= 2000
           and url ~* '^https?://[^[:space:]/@?#]+([/?#][^[:space:]]*)?$')
);

-- =====================================================================
-- 2. INDEXES
-- =====================================================================

create index goals_user_status_idx on public.goals (user_id, status);
create index savings_entries_goal_date_idx
  on public.savings_entries (goal_id, entry_date desc);
create index goal_links_goal_idx on public.goal_links (goal_id);

-- =====================================================================
-- 3. TRIGGER FUNCTIONS
--    Custom error codes (read by the app to show friendly messages):
--      TH001  saved total would go below zero (add / edit)
--      TH002  deleting an entry would take the total below zero
--      TH003  entry dated in the future
-- =====================================================================

-- Goals: derive completed_at / updated_at; stop owner and created_at changes.
create or replace function public.goals_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.completed_at := case when new.status = 'completed' then now() else null end;
  else
    if new.user_id <> old.user_id then
      raise exception 'A goal cannot change owner' using errcode = '42501';
    end if;
    new.created_at := old.created_at;
    new.updated_at := now();
    if new.status = 'completed' then
      -- Keep the original completion time unless the goal was just completed.
      new.completed_at :=
        case when old.status = 'completed' then old.completed_at else now() end;
    else
      new.completed_at := null;
    end if;
  end if;
  return new;
end;
$$;

-- Children: an entry or link can never move to another goal or owner.
create or replace function public.forbid_ownership_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.goal_id <> old.goal_id or new.user_id <> old.user_id then
    raise exception 'A % cannot be moved to another goal or owner', tg_table_name
      using errcode = '42501';
  end if;
  return new;
end;
$$;

-- Savings: no future dates. One day of slack covers users ahead of UTC.
create or replace function public.savings_entries_check_date()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.entry_date is not distinct from old.entry_date then
      return new;
    end if;
  end if;
  if new.entry_date > current_date + 1 then
    raise exception 'Entries cannot be dated in the future' using errcode = 'TH003';
  end if;
  return new;
end;
$$;

-- Savings: the total for a goal can never fall below zero.
create or replace function public.savings_entries_check_balance()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  affected_goal uuid;
  total numeric;
begin
  affected_goal := case when tg_op = 'DELETE' then old.goal_id else new.goal_id end;

  -- Serialise concurrent changes to the same goal so two requests can't
  -- each pass the check and together overdraw it.
  perform pg_advisory_xact_lock(hashtextextended(affected_goal::text, 0));

  -- If the goal itself is being deleted, the cascade removes its entries
  -- one by one. Nothing to protect, so let it through.
  if tg_op = 'DELETE'
     and not exists (select 1 from public.goals where id = affected_goal) then
    return null;
  end if;

  select coalesce(sum(amount), 0) into total
  from public.savings_entries
  where goal_id = affected_goal;

  if total < 0 then
    if tg_op = 'DELETE' then
      raise exception 'Removing this entry would take the saved total below zero'
        using errcode = 'TH002';
    else
      raise exception 'This entry would take the saved total below zero'
        using errcode = 'TH001';
    end if;
  end if;

  return null; -- AFTER trigger: the return value is ignored
end;
$$;

-- Auth: create a profile row for every new user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- =====================================================================
-- 4. TRIGGERS
-- =====================================================================

create trigger goals_before_write
  before insert or update on public.goals
  for each row execute function public.goals_before_write();

create trigger savings_entries_forbid_ownership_change
  before update on public.savings_entries
  for each row execute function public.forbid_ownership_change();

create trigger goal_links_forbid_ownership_change
  before update on public.goal_links
  for each row execute function public.forbid_ownership_change();

create trigger savings_entries_check_date
  before insert or update on public.savings_entries
  for each row execute function public.savings_entries_check_date();

create trigger savings_entries_check_balance
  after insert or update of amount or delete on public.savings_entries
  for each row execute function public.savings_entries_check_balance();

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Profiles for users that already exist (the two you created by hand).
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

-- =====================================================================
-- 5. ROW LEVEL SECURITY
--    Enabled on every table. With no matching policy, access is denied.
--    (select auth.uid()) is wrapped so Postgres evaluates it once per query.
-- =====================================================================

alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.goal_links enable row level security;
alter table public.savings_entries enable row level security;

-- profiles: read-only for the owner. Rows are created by the trigger above.
create policy "Users can read their own profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

-- goals
create policy "Users can read their own goals"
  on public.goals for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can create their own goals"
  on public.goals for insert to authenticated
  with check (user_id = (select auth.uid()));

-- USING limits which existing rows can be updated.
-- WITH CHECK limits what the row may look like afterwards (no reassigning).
create policy "Users can update their own goals"
  on public.goals for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can delete their own goals"
  on public.goals for delete to authenticated
  using (user_id = (select auth.uid()));

-- savings_entries: the row's user_id must be the caller AND the parent goal
-- must belong to the caller. (The composite foreign key enforces the same
-- thing structurally; this makes the rule explicit and double-checked.)
create policy "Users can read their own savings entries"
  on public.savings_entries for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can add savings to their own goals"
  on public.savings_entries for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.goals g
      where g.id = savings_entries.goal_id
        and g.user_id = (select auth.uid())
    )
  );

create policy "Users can update their own savings entries"
  on public.savings_entries for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.goals g
      where g.id = savings_entries.goal_id
        and g.user_id = (select auth.uid())
    )
  );

create policy "Users can delete their own savings entries"
  on public.savings_entries for delete to authenticated
  using (user_id = (select auth.uid()));

-- goal_links: same pattern.
create policy "Users can read their own links"
  on public.goal_links for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can add links to their own goals"
  on public.goal_links for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.goals g
      where g.id = goal_links.goal_id
        and g.user_id = (select auth.uid())
    )
  );

create policy "Users can update their own links"
  on public.goal_links for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.goals g
      where g.id = goal_links.goal_id
        and g.user_id = (select auth.uid())
    )
  );

create policy "Users can delete their own links"
  on public.goal_links for delete to authenticated
  using (user_id = (select auth.uid()));

-- =====================================================================
-- 6. TABLE PRIVILEGES
--    RLS decides which rows; grants decide which operations are possible
--    at all. Signed-out visitors (anon) get nothing.
-- =====================================================================

revoke all on public.profiles, public.goals, public.goal_links,
  public.savings_entries from anon;

grant select on public.profiles to authenticated;
grant select, insert, update, delete
  on public.goals, public.goal_links, public.savings_entries
  to authenticated;