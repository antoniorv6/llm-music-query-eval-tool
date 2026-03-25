-- Seed: Initial evaluators
-- Run this AFTER the migration (001_initial_schema.sql)
--
-- Keys are random UUIDs used as access tokens.
-- Share each key privately with the corresponding evaluator.
--
-- Roles:
--   administrador → only sees /admin panel
--   evaluador     → only sees /dashboard and /evaluate/*
--   dual          → sees both panels

-- Administrador
INSERT INTO evaluators (key, name, role) VALUES
  ('adm-a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Antonio', 'administrador');

-- Duales (acceso a evaluación + panel de análisis)
INSERT INTO evaluators (key, name, role) VALUES
  (gen_random_uuid(), 'Jorge', 'dual');

INSERT INTO evaluators (key, name, role) VALUES
  (gen_random_uuid(), 'Noelia', 'dual');

-- Evaluadores
INSERT INTO evaluators (key, name, role) VALUES
  (gen_random_uuid(), 'Guillermo', 'evaluador');

INSERT INTO evaluators (key, name, role) VALUES
  (gen_random_uuid(), 'José Manuel', 'evaluador');


-- ⚠️  IMPORTANT: Change the keys above before deploying to production.
--    You can generate new ones with: SELECT gen_random_uuid();
