-- Migration 002: Replace is_admin boolean with role enum
-- Run this in your Supabase SQL Editor after 001_initial_schema.sql
--
-- Roles:
--   administrador  → only sees the admin panel (/admin)
--   evaluador      → only sees the evaluation dashboard (/dashboard)
--   dual           → sees both panels

ALTER TABLE evaluators
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'evaluador'
    CHECK (role IN ('administrador', 'evaluador', 'dual'));

-- Migrate existing data: is_admin=true → administrador, is_admin=false → evaluador
UPDATE evaluators SET role = 'administrador' WHERE is_admin = true;
UPDATE evaluators SET role = 'evaluador'     WHERE is_admin = false;

-- Drop the old column once data is migrated
ALTER TABLE evaluators DROP COLUMN IF EXISTS is_admin;
