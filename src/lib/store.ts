import { create } from 'zustand';
import type { Evaluator, Evaluation, ResponsesData } from './types';

interface AppState {
  currentEvaluator: Evaluator | null;
  evaluations: Evaluation[];
  responsesData: ResponsesData | null;
  viewMode: 'grid' | 'carousel';
  assignedImages: string[];
  setCurrentEvaluator: (evaluator: Evaluator | null) => void;
  setEvaluations: (evaluations: Evaluation[]) => void;
  setResponsesData: (data: ResponsesData | null) => void;
  setViewMode: (mode: 'grid' | 'carousel') => void;
  setAssignedImages: (images: string[]) => void;
  addOrUpdateEvaluation: (evaluation: Evaluation) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentEvaluator: null,
  evaluations: [],
  responsesData: null,
  viewMode: 'grid',
  assignedImages: [],
  setCurrentEvaluator: (evaluator) => set({ currentEvaluator: evaluator }),
  setEvaluations: (evaluations) => set({ evaluations }),
  setResponsesData: (data) => set({ responsesData: data }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setAssignedImages: (images) => set({ assignedImages: images }),
  addOrUpdateEvaluation: (evaluation) =>
    set((state) => {
      const idx = state.evaluations.findIndex(
        (e) =>
          e.evaluator_id === evaluation.evaluator_id &&
          e.image_filename === evaluation.image_filename &&
          e.question_id === evaluation.question_id &&
          e.model_name === evaluation.model_name
      );
      if (idx >= 0) {
        const updated = [...state.evaluations];
        updated[idx] = { ...updated[idx], ...evaluation };
        return { evaluations: updated };
      }
      return { evaluations: [...state.evaluations, evaluation] };
    }),
}));
