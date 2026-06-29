-- ============================================================
-- session_db schema + seed
-- Active sessions reference seat_ids/branch_id by lookup,
-- but since this DB is isolated we generate UUIDs and rely on
-- the seed-sync script run by the session-service on boot
-- (auth_db is the source of truth for seat_id mapping).
-- For pure POC seed convenience we insert sessions with
-- deterministic UUIDs that the session-service backfills.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seat_id UUID NOT NULL,
  branch_id UUID NOT NULL,
  player_name TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_minutes INT,
  cost_per_hour NUMERIC(10,2) DEFAULT 5.00,
  total_cost NUMERIC(10,2),
  status TEXT CHECK (status IN ('active','completed')) DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  branch_id UUID NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT DEFAULT 'cash',
  settled_at TIMESTAMPTZ DEFAULT now()
);

-- Lookup table so workers/services can re-hydrate seeded UUIDs by seat_number.
CREATE TABLE IF NOT EXISTS seed_seat_map (
  seat_number INT PRIMARY KEY,
  seat_id UUID NOT NULL,
  branch_id UUID NOT NULL
);

-- Seed historical settlements + active sessions.
-- seat_id/branch_id placeholders are NULL UUIDs and the session-service
-- patches them on startup via /internal/sync-seed (see session-service boot).
DO $$
DECLARE
  v_zero UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  -- 3 active sessions, started_at in the past
  INSERT INTO sessions (id, seat_id, branch_id, player_name, started_at, cost_per_hour, status)
  VALUES
    (gen_random_uuid(), v_zero, v_zero, 'Player A', now() - interval '45 minutes', 5.00, 'active'),
    (gen_random_uuid(), v_zero, v_zero, 'Player B', now() - interval '30 minutes', 5.00, 'active'),
    (gen_random_uuid(), v_zero, v_zero, 'Player C', now() - interval '20 minutes', 5.00, 'active');

  -- 7 completed sessions with settlements over last 7 days
  FOR i IN 1..7 LOOP
    WITH s AS (
      INSERT INTO sessions (seat_id, branch_id, player_name, started_at, ended_at, duration_minutes, cost_per_hour, total_cost, status)
      VALUES (v_zero, v_zero, 'Historic Player ' || i,
              now() - (i || ' days')::interval - interval '2 hours',
              now() - (i || ' days')::interval - interval '1 hour',
              60, 5.00, (3 + (i * 1.5))::numeric(10,2), 'completed')
      RETURNING id, total_cost, branch_id
    )
    INSERT INTO settlements (session_id, branch_id, amount, payment_method, settled_at)
    SELECT id, branch_id, total_cost, 'cash', now() - (i || ' days')::interval FROM s;
  END LOOP;
END $$;
