-- Seed: Initial evaluators
-- Run this AFTER the migration (001_initial_schema.sql)
--
-- Keys are random UUIDs used as access tokens.
-- Share each key privately with the corresponding evaluator.

-- Admin (Antonio)
INSERT INTO evaluators (key, name, is_admin) VALUES
  ('adm-a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Antonio', true);

-- Evaluator 1
INSERT INTO evaluators (key, name, is_admin) VALUES
  (gen_random_uuid(), 'Noelia', true);

-- Evaluator 2
INSERT INTO evaluators (key, name, is_admin) VALUES
  (gen_random_uuid(), 'Guillermo', false);

INSERT INTO evaluators (key, name, is_admin) VALUES
  (gen_random_uuid(), 'José Manuel', false);


-- ⚠️  IMPORTANT: Change the keys above before deploying to production.
--    You can generate new ones with: SELECT gen_random_uuid();
