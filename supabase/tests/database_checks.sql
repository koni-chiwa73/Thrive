-- Verifies row isolation, the savings rules, and cascade deletes.
-- 1. Replace the two PASTE-… values with the UUIDs of your two test users.
-- 2. Run in the SQL Editor.
--
-- PASS: the run ends with an error that starts with "ALL CHECKS PASSED".
-- FAIL: the run ends with an error that starts with "FAILED:".
-- The error is intentional: it rolls everything back so no test data is kept.

do $$
declare
  v_user_a constant uuid := '20e9f3be-7b2c-467c-ac24-8b1559ec9056';
  v_user_b constant uuid := 'c9470563-8a9f-426a-af7f-5c9a1670d48d';
  v_goal   constant uuid := '00000000-0000-4000-8000-00000000000a';
  n bigint;
begin
  ------------------------------------------------------------------
  -- User A creates a goal with an entry and a link
  ------------------------------------------------------------------
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_user_a, 'role', 'authenticated')::text, true);
  set local role authenticated;

  insert into public.goals (id, title) values (v_goal, 'RLS test goal');
  insert into public.savings_entries (goal_id, amount, entry_date)
    values (v_goal, 100, current_date);
  insert into public.goal_links (goal_id, url)
    values (v_goal, 'https://example.com/');

  select count(*) into n from public.goals where id = v_goal;
  if n <> 1 then raise exception 'FAILED: user A cannot see their own goal'; end if;

  ------------------------------------------------------------------
  -- User B must not see or change anything of A's
  ------------------------------------------------------------------
  reset role;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_user_b, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into n from public.goals where id = v_goal;
  if n <> 0 then raise exception 'FAILED: user B can read user A''s goal'; end if;

  select count(*) into n from public.savings_entries where goal_id = v_goal;
  if n <> 0 then raise exception 'FAILED: user B can read user A''s entries'; end if;

  select count(*) into n from public.goal_links where goal_id = v_goal;
  if n <> 0 then raise exception 'FAILED: user B can read user A''s links'; end if;

  update public.goals set title = 'hacked' where id = v_goal;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAILED: user B updated user A''s goal'; end if;

  delete from public.goals where id = v_goal;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAILED: user B deleted user A''s goal'; end if;

  -- B tries to attach an entry to A's goal: must be rejected.
  begin
    insert into public.savings_entries (goal_id, amount, entry_date)
      values (v_goal, 5, current_date);
    raise exception 'FAILED: user B attached an entry to user A''s goal';
  exception when others then
    if sqlerrm like 'FAILED:%' then raise; end if;
  end;

  -- B tries to attach a link to A's goal: must be rejected.
  begin
    insert into public.goal_links (goal_id, url)
      values (v_goal, 'https://example.com/');
    raise exception 'FAILED: user B attached a link to user A''s goal';
  exception when others then
    if sqlerrm like 'FAILED:%' then raise; end if;
  end;

  ------------------------------------------------------------------
  -- Back to user A: savings and validation rules
  ------------------------------------------------------------------
  reset role;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_user_a, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- Withdrawal larger than the balance (100) -> TH001
  begin
    insert into public.savings_entries (goal_id, amount, entry_date)
      values (v_goal, -500, current_date);
    raise exception 'FAILED: an overdrawing withdrawal was accepted';
  exception when others then
    if sqlerrm like 'FAILED:%' then raise; end if;
    if sqlstate <> 'TH001' then
      raise exception 'FAILED: expected TH001, got % (%)', sqlstate, sqlerrm;
    end if;
  end;

  -- Valid entries: 100 + 50 - 120 = 30
  insert into public.savings_entries (goal_id, amount, entry_date)
    values (v_goal, 50, current_date);
  insert into public.savings_entries (goal_id, amount, entry_date)
    values (v_goal, -120, current_date);

  -- Deleting the 100 deposit would leave -70 -> TH002
  begin
    delete from public.savings_entries where goal_id = v_goal and amount = 100;
    raise exception 'FAILED: deleting a needed deposit was accepted';
  exception when others then
    if sqlerrm like 'FAILED:%' then raise; end if;
    if sqlstate <> 'TH002' then
      raise exception 'FAILED: expected TH002, got % (%)', sqlstate, sqlerrm;
    end if;
  end;

  -- Future date -> TH003
  begin
    insert into public.savings_entries (goal_id, amount, entry_date)
      values (v_goal, 10, current_date + 5);
    raise exception 'FAILED: a future-dated entry was accepted';
  exception when others then
    if sqlerrm like 'FAILED:%' then raise; end if;
    if sqlstate <> 'TH003' then
      raise exception 'FAILED: expected TH003, got % (%)', sqlstate, sqlerrm;
    end if;
  end;

  -- Unsafe link -> check violation
  begin
    insert into public.goal_links (goal_id, url)
      values (v_goal, 'javascript:alert(1)');
    raise exception 'FAILED: a javascript: link was accepted';
  exception when others then
    if sqlerrm like 'FAILED:%' then raise; end if;
    if sqlstate <> '23514' then
      raise exception 'FAILED: expected 23514, got % (%)', sqlstate, sqlerrm;
    end if;
  end;

  -- Negative target amount -> check violation
  begin
    insert into public.goals (title, target_amount) values ('Bad goal', -5);
    raise exception 'FAILED: a negative target amount was accepted';
  exception when others then
    if sqlerrm like 'FAILED:%' then raise; end if;
    if sqlstate <> '23514' then
      raise exception 'FAILED: expected 23514, got % (%)', sqlstate, sqlerrm;
    end if;
  end;

  ------------------------------------------------------------------
  -- Completion timestamp is maintained by the database
  ------------------------------------------------------------------
  update public.goals set status = 'completed' where id = v_goal;
  select count(*) into n from public.goals
    where id = v_goal and completed_at is not null;
  if n <> 1 then raise exception 'FAILED: completed_at was not set'; end if;

  update public.goals set status = 'in_progress' where id = v_goal;
  select count(*) into n from public.goals
    where id = v_goal and completed_at is null;
  if n <> 1 then raise exception 'FAILED: completed_at was not cleared'; end if;

  ------------------------------------------------------------------
  -- Deleting a goal cascades, even though the entries are "needed"
  ------------------------------------------------------------------
  delete from public.goals where id = v_goal;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAILED: user A could not delete their goal'; end if;

  select count(*) into n from public.savings_entries where goal_id = v_goal;
  if n <> 0 then raise exception 'FAILED: entries survived the goal deletion'; end if;

  select count(*) into n from public.goal_links where goal_id = v_goal;
  if n <> 0 then raise exception 'FAILED: links survived the goal deletion'; end if;

  raise exception 'ALL CHECKS PASSED. (This error is intentional: it rolls everything back so no test data is kept.)';
end;
$$;