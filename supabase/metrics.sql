-- Launch-gate metrics. Run in Supabase SQL editor. Filter to the cohort build with game_version like '%+crazygames'.
-- sittings = session_id groups; duration is in stats->>'duration' (seconds).
with r as (
  select player_id, session_id, played_at, (stats->>'duration')::float as dur, run_number, game_version
  from public.runs where game_version like '%+crazygames'
),
s as (  -- one row per sitting
  select player_id, session_id, min(played_at) as start_at, sum(dur) as play_s, count(*) as runs, min(run_number) as first_run
  from r group by player_id, session_id
),
first_s as (  -- each player's first sitting
  select distinct on (player_id) * from s order by player_id, start_at
)
select 'players' as metric, count(*)::float as value from first_s
union all select 'first sittings >= 60s (%)', 100.0 * avg((play_s >= 60)::int) from first_s
union all select 'median sitting minutes', (percentile_cont(0.5) within group (order by play_s) / 60) from s
union all select 'mean sitting minutes', avg(play_s) / 60 from s
union all select 'mean runs per sitting', avg(runs) from s
union all select 'median run seconds', percentile_cont(0.5) within group (order by dur) from r
union all select 'next-day return (%)', 100.0 * avg(exists (
  select 1 from s s2 where s2.player_id = f.player_id and s2.start_at::date = f.start_at::date + 1)::int) from first_s f;
