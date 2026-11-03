-- Scroll Game: balance-testing telemetry
-- Paste into Supabase: SQL Editor -> New query -> Run.

create table if not exists public.runs (
  id            uuid primary key default gen_random_uuid(),
  received_at   timestamptz not null default now(),
  played_at     timestamptz,
  player_id     text not null,          -- random anonymous id, generated on the device
  session_id    text,                   -- groups runs played in one sitting
  game_version  text,
  device        text,                   -- coarse: e.g. "iPhone / Safari", screen size
  run_number    int,                    -- this player's nth run
  settings      jsonb not null,         -- every tuning value used for this run
  stats         jsonb not null,         -- duration, time-in-zones, collisions, cause of death, etc.
  fun_rating    smallint check (fun_rating between 1 and 3),  -- 1 = meh, 2 = ok, 3 = fun (null = skipped)
  ended_by      text check (ended_by in ('death','quit','abandoned'))
);

create index if not exists runs_player_idx on public.runs (player_id, played_at);

-- Security: the game (using the public "anon"/publishable key) may ONLY add rows.
-- It can never read, change or delete anything.
alter table public.runs enable row level security;

drop policy if exists "game can insert runs" on public.runs;
create policy "game can insert runs"
  on public.runs for insert
  to anon
  with check (
    length(player_id) between 8 and 64
    and pg_column_size(settings) < 8000
    and pg_column_size(stats) < 16000
  );
