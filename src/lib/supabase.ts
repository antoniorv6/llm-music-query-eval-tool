import { createClient } from '@supabase/supabase-js';
import type { Evaluator, Evaluation, EvaluatorProgress, SampleAssignment } from './types';

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

export async function getAssignedImages(evaluatorId: string): Promise<string[]> {
  const { data, error } = await getClient()
    .from('sample_assignments')
    .select('image_filename')
    .eq('evaluator_id', evaluatorId);

  if (error || !data) return [];
  return data.map((row: Pick<SampleAssignment, 'image_filename'>) => row.image_filename);
}

export async function getAllEvaluators(): Promise<{ id: string; name: string; role: string }[]> {
  const { data, error } = await getClient()
    .from('evaluators')
    .select('id, name, role');

  if (error || !data) return [];
  return data;
}

export async function getAllEvaluatorsWithKeys(): Promise<Evaluator[]> {
  const { data, error } = await getClient()
    .from('evaluators')
    .select('*')
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return data as Evaluator[];
}

export async function createEvaluator(name: string, role: string): Promise<{ evaluator: Evaluator; key: string } | null> {
  const key = crypto.randomUUID();
  const { data, error } = await getClient()
    .from('evaluators')
    .insert({ key, name, role })
    .select()
    .single();
  if (error || !data) return null;
  return { evaluator: data as Evaluator, key };
}

export async function deleteEvaluator(id: string): Promise<boolean> {
  const { error } = await getClient()
    .from('evaluators')
    .delete()
    .eq('id', id);
  return !error;
}

export async function resetEvaluatorKey(id: string): Promise<string | null> {
  const newKey = crypto.randomUUID();
  const { error } = await getClient()
    .from('evaluators')
    .update({ key: newKey })
    .eq('id', id);
  if (error) return null;
  return newKey;
}

export async function getAllSampleAssignments(): Promise<Array<{ image_filename: string; evaluator_id: string; evaluator_name: string }>> {
  const { data, error } = await getClient()
    .from('sample_assignments')
    .select('image_filename, evaluator_id, evaluators(name)')
    .order('image_filename', { ascending: true });
  if (error || !data) return [];
  return (data as any[]).map((row) => ({
    image_filename: row.image_filename,
    evaluator_id: row.evaluator_id,
    evaluator_name: (row.evaluators as { name?: string } | null)?.name ?? '',
  }));
}

export async function assignImage(imageFilename: string, evaluatorId: string): Promise<boolean> {
  const { error } = await getClient()
    .from('sample_assignments')
    .upsert(
      { image_filename: imageFilename, evaluator_id: evaluatorId },
      { onConflict: 'evaluator_id,image_filename' }
    );
  return !error;
}

export async function unassignImage(imageFilename: string, evaluatorId: string): Promise<boolean> {
  const { error } = await getClient()
    .from('sample_assignments')
    .delete()
    .eq('image_filename', imageFilename)
    .eq('evaluator_id', evaluatorId);
  return !error;
}

export async function getAllEvaluatorsProgress(): Promise<EvaluatorProgress[]> {
  const { data: evaluators, error: evalError } = await getClient()
    .from('evaluators')
    .select('id, name');

  if (evalError || !evaluators) return [];

  const { data: counts, error: countError } = await getClient()
    .from('evaluations')
    .select('evaluator_id, updated_at');

  const { data: assignments, error: assignError } = await getClient()
    .from('sample_assignments')
    .select('evaluator_id, image_filename');

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

  // Build a map: evaluator_id → number of assigned images
  const assignedCountMap = new Map<string, number>();
  for (const row of assignments || []) {
    assignedCountMap.set(row.evaluator_id, (assignedCountMap.get(row.evaluator_id) || 0) + 1);
  }

  return evaluators.map((ev) => {
    const stats = countMap.get(ev.id) || { count: 0, lastActivity: null };
    const assignedImages = assignedCountMap.get(ev.id) || 0;
    return {
      name: ev.name,
      completed: stats.count,
      total: assignedImages,
      last_activity: stats.lastActivity,
    };
  });
}
