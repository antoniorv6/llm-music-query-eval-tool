import { createClient } from '@supabase/supabase-js';
import type { Evaluator, Evaluation, EvaluatorProgress } from './types';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

function getClient() {
  if (!supabase) throw new Error('Supabase not configured. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY in .env');
  return supabase;
}

export async function validateEvaluatorKey(key: string): Promise<Evaluator | null> {
  const { data, error } = await getClient()
    .from('evaluators')
    .select('*')
    .eq('key', key)
    .single();

  if (error || !data) return null;
  return data as Evaluator;
}

export async function getEvaluations(evaluatorId: string): Promise<Evaluation[]> {
  const { data, error } = await getClient()
    .from('evaluations')
    .select('*')
    .eq('evaluator_id', evaluatorId);

  if (error) return [];
  return data as Evaluation[];
}

export async function upsertEvaluation(evaluation: Omit<Evaluation, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
  const { error } = await getClient()
    .from('evaluations')
    .upsert(
      {
        ...evaluation,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'evaluator_id,image_filename,question_id,model_name',
      }
    );

  return !error;
}

export async function getAllEvaluations(): Promise<Evaluation[]> {
  const { data, error } = await getClient()
    .from('evaluations')
    .select('*');

  if (error) return [];
  return data as Evaluation[];
}

export async function getAllEvaluators(): Promise<{ id: string; name: string; is_admin: boolean }[]> {
  const { data, error } = await getClient()
    .from('evaluators')
    .select('id, name, is_admin');

  if (error || !data) return [];
  return data;
}

export async function getAllEvaluatorsProgress(totalPerEvaluator: number): Promise<EvaluatorProgress[]> {
  const { data: evaluators, error: evalError } = await getClient()
    .from('evaluators')
    .select('id, name');

  if (evalError || !evaluators) return [];

  const { data: counts, error: countError } = await getClient()
    .from('evaluations')
    .select('evaluator_id, updated_at');

  if (countError) return [];

  const countMap = new Map<string, { count: number; lastActivity: string | null }>();
  for (const row of counts || []) {
    const existing = countMap.get(row.evaluator_id);
    if (!existing) {
      countMap.set(row.evaluator_id, { count: 1, lastActivity: row.updated_at });
    } else {
      existing.count++;
      if (row.updated_at && (!existing.lastActivity || row.updated_at > existing.lastActivity)) {
        existing.lastActivity = row.updated_at;
      }
    }
  }

  return evaluators.map((ev) => {
    const stats = countMap.get(ev.id) || { count: 0, lastActivity: null };
    return {
      name: ev.name,
      completed: stats.count,
      total: totalPerEvaluator,
      last_activity: stats.lastActivity,
    };
  });
}
