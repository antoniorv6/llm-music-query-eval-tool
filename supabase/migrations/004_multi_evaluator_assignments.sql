-- Migration 004: Allow multiple evaluators per image
-- Drops the UNIQUE(image_filename) constraint and replaces it with
-- UNIQUE(evaluator_id, image_filename) so each image can have multiple reviewers.

-- Remove old unique constraint on image_filename
ALTER TABLE sample_assignments DROP CONSTRAINT IF EXISTS sample_assignments_image_filename_key;

-- Add new constraint: same evaluator can't be assigned to the same image twice
ALTER TABLE sample_assignments ADD CONSTRAINT sample_assignments_evaluator_image_unique UNIQUE (evaluator_id, image_filename);
