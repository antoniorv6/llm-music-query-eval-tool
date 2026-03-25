import { writable } from 'svelte/store';
import type { Evaluator, Evaluation, ResponsesData } from './types';

export const currentEvaluator = writable<Evaluator | null>(null);
export const evaluations = writable<Evaluation[]>([]);
export const responsesData = writable<ResponsesData | null>(null);
export const viewMode = writable<'grid' | 'carousel'>('grid');
