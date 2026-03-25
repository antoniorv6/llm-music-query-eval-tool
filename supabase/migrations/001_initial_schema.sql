-- Migration 001: Initial schema for Music LLM Evaluation Framework
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Table: evaluators
-- Stores evaluator accounts. Each evaluator authenticates with a unique key.
CREATE TABLE IF NOT EXISTS evaluators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table: evaluations
-- Stores scores given by evaluators to model responses.
-- Identified by the composite (evaluator_id, image_filename, question_id, model_name).
CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluator_id UUID REFERENCES evaluators(id) ON DELETE CASCADE NOT NULL,
  image_filename TEXT NOT NULL,
  question_id TEXT NOT NULL,
  model_name TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(evaluator_id, image_filename, question_id, model_name)
);

-- Indexes for common query patterns
CREATE INDEX idx_evaluations_evaluator ON evaluations(evaluator_id);
CREATE INDEX idx_evaluations_image ON evaluations(image_filename);
CREATE INDEX idx_evaluations_lookup ON evaluations(evaluator_id, image_filename, question_id);

-- Function to auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER evaluations_updated_at
  BEFORE UPDATE ON evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
