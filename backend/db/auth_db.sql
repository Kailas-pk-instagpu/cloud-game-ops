-- ============================================================
-- auth_db schema + seed
-- Demo password for all users: Demo@1234
-- bcrypt hash (10 rounds) below was pre-generated
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK (role IN ('cafe_owner', 'manager')) NOT NULL,
  name TEXT,
  phone TEXT,
  address TEXT,
  avatar_url TEXT,
  two_fa_enabled BOOLEAN DEFAULT false,
  two_fa_secret TEXT,
  branch_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  status TEXT CHECK (status IN ('active','inactive')) DEFAULT 'active',
  owner_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id),
  seat_number INT NOT NULL,
  gpu_model TEXT NOT NULL,
  status TEXT CHECK (status IN ('available','occupied','maintenance')) DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Seed
-- ============================================================
DO $$
DECLARE
  v_owner UUID;
  v_mgr1  UUID;
  v_mgr2  UUID;
  v_branch UUID;
  -- bcrypt hash of 'Demo@1234' (rounds=10)
  v_hash TEXT := '$2b$10$E9p3oKj7d2fT8bQ1zVw1Z.6sxv8YqQyP4U8m2lkLs1y0E9Y6XK8/e';
BEGIN
  INSERT INTO users (email, password_hash, role, name)
  VALUES ('owner@demo.com', v_hash, 'cafe_owner', 'Alex Rivera')
  RETURNING id INTO v_owner;

  INSERT INTO branches (name, location, status, owner_id)
  VALUES ('Alpha Lounge', 'Downtown', 'active', v_owner)
  RETURNING id INTO v_branch;

  INSERT INTO users (email, password_hash, role, name, branch_id)
  VALUES ('manager1@demo.com', v_hash, 'manager', 'Sam Lee', v_branch)
  RETURNING id INTO v_mgr1;

  INSERT INTO users (email, password_hash, role, name, branch_id)
  VALUES ('manager2@demo.com', v_hash, 'manager', 'Jordan Kim', v_branch)
  RETURNING id INTO v_mgr2;

  -- Seats 1-6 RTX 4070, 7-12 RTX 4080
  INSERT INTO seats (branch_id, seat_number, gpu_model, status) VALUES
    (v_branch, 1,  'RTX 4070', 'occupied'),
    (v_branch, 2,  'RTX 4070', 'available'),
    (v_branch, 3,  'RTX 4070', 'available'),
    (v_branch, 4,  'RTX 4070', 'available'),
    (v_branch, 5,  'RTX 4070', 'occupied'),
    (v_branch, 6,  'RTX 4070', 'available'),
    (v_branch, 7,  'RTX 4080', 'available'),
    (v_branch, 8,  'RTX 4080', 'available'),
    (v_branch, 9,  'RTX 4080', 'occupied'),
    (v_branch, 10, 'RTX 4080', 'available'),
    (v_branch, 11, 'RTX 4080', 'maintenance'),
    (v_branch, 12, 'RTX 4080', 'available');

  -- Expose IDs via a temp config so session_db seed can reference (printed in logs)
  RAISE NOTICE 'branch_id=%', v_branch;
END $$;
