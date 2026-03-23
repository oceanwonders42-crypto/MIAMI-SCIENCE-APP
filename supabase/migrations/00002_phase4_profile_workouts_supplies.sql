-- Phase 4: Profile onboarding, workout tracker, supply tracker fields
-- Run after 00001_initial_schema.sql

-- Profiles: onboarding fields
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS fitness_goal TEXT,
  ADD COLUMN IF NOT EXISTS preferred_units TEXT DEFAULT 'metric',
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York';

-- Workouts: type, duration, optional bodyweight and scores
ALTER TABLE workouts
  ADD COLUMN IF NOT EXISTS workout_type TEXT,
  ADD COLUMN IF NOT EXISTS duration_minutes INT,
  ADD COLUMN IF NOT EXISTS bodyweight_kg DECIMAL(6,2),
  ADD COLUMN IF NOT EXISTS energy_score INT,
  ADD COLUMN IF NOT EXISTS recovery_score INT;

-- Supplies: notes, daily use for days-left estimate, starting quantity
ALTER TABLE supplies
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS daily_use_estimate DECIMAL(6,2),
  ADD COLUMN IF NOT EXISTS starting_quantity INT;
