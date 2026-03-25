-- Migration 003: Sample assignments
-- Assigns each image to exactly one evaluator (single reviewer per sample).
-- Run after 001_initial_schema.sql and 002_add_role.sql.

CREATE TABLE IF NOT EXISTS sample_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluator_id UUID REFERENCES evaluators(id) ON DELETE CASCADE NOT NULL,
  image_filename TEXT NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(image_filename)  -- enforces one reviewer per sample
);

CREATE INDEX idx_assignments_evaluator ON sample_assignments(evaluator_id);
CREATE INDEX idx_assignments_image ON sample_assignments(image_filename);

-- ─── Sample distribution (10 images across 4 evaluators) ─────────────────────
-- Jorge   → 1_1.png, 1_2.png, 1_3.png  (3 images)
-- Noelia  → 1_4.png, 1_5.png, 2_1.png  (3 images)
-- Guillermo    → 2_2.png, 2_3.png       (2 images)
-- José Manuel  → 2_4.png, 2_5.png       (2 images)

INSERT INTO sample_assignments (evaluator_id, image_filename)
SELECT id, '1_1.png' FROM evaluators WHERE name = 'Jorge'
UNION ALL
SELECT id, '1_2.png' FROM evaluators WHERE name = 'Jorge'
UNION ALL
SELECT id, '1_3.png' FROM evaluators WHERE name = 'Jorge'
UNION ALL
SELECT id, '1_4.png' FROM evaluators WHERE name = 'Noelia'
UNION ALL
SELECT id, '1_5.png' FROM evaluators WHERE name = 'Noelia'
UNION ALL
SELECT id, '2_1.png' FROM evaluators WHERE name = 'Noelia'
UNION ALL
SELECT id, '2_2.png' FROM evaluators WHERE name = 'Guillermo'
UNION ALL
SELECT id, '2_3.png' FROM evaluators WHERE name = 'Guillermo'
UNION ALL
SELECT id, '2_4.png' FROM evaluators WHERE name = 'José Manuel'
UNION ALL
SELECT id, '2_5.png' FROM evaluators WHERE name = 'José Manuel';
