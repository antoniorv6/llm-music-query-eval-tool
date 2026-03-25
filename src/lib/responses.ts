import type { ResponsesData, QuestionEntry } from './types';
import { isThreadQuestion } from './types';

/**
 * Count the total number of individual model responses that need evaluation.
 * For thread questions, each sub-question's responses count separately.
 */
export function countTotalEvaluations(data: ResponsesData): number {
  let count = 0;
  for (const imageKey of Object.keys(data)) {
    for (const questionKey of Object.keys(data[imageKey])) {
      count += countEntryResponses(data[imageKey][questionKey]);
    }
  }
  return count;
}

export function getImageList(data: ResponsesData): string[] {
  return Object.keys(data);
}

export function countImageEvaluations(data: ResponsesData, imageFilename: string): number {
  const questions = data[imageFilename];
  if (!questions) return 0;
  let count = 0;
  for (const questionKey of Object.keys(questions)) {
    count += countEntryResponses(questions[questionKey]);
  }
  return count;
}

/** Count model responses inside a single question entry (simple or thread). */
function countEntryResponses(entry: QuestionEntry): number {
  if (isThreadQuestion(entry)) {
    return entry.thread.reduce((sum, sub) => sum + sub.respuestas.length, 0);
  }
  return entry.respuestas.length;
}

/**
 * Build a flat list of "evaluation unit" IDs for an image.
 * Simple question "2" → ["2"]
 * Thread question "3" with subs 3a,3b → ["3a","3b"]
 * Useful for progress tracking against Supabase evaluations.
 */
export function getEvalUnitIds(data: ResponsesData, imageFilename: string): string[] {
  const questions = data[imageFilename];
  if (!questions) return [];
  const ids: string[] = [];
  for (const qId of Object.keys(questions)) {
    const entry = questions[qId];
    if (isThreadQuestion(entry)) {
      for (const sub of entry.thread) {
        ids.push(sub.id);
      }
    } else {
      ids.push(qId);
    }
  }
  return ids;
}
