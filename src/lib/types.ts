export interface ModelResponse {
  modelo: string;
  respuesta: string;
  tiempo_de_respuesta: number;
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  coste_usd?: number | null;
}

export type QuestionType = 'binary' | 'likert' | 'ranking' | 'transcription';

/** A standalone question (no sub-questions). */
export interface SimpleQuestion {
  question: string;
  type: QuestionType;
  respuestas: ModelResponse[];
}

/** A sub-question inside a thread. */
export interface ThreadSubQuestion {
  id: string;
  question: string;
  type: QuestionType;
  respuestas: ModelResponse[];
}

/** A question composed of multiple sub-questions. */
export interface ThreadQuestion {
  thread: ThreadSubQuestion[];
}

/** Union of both question shapes in responses.json. */
export type QuestionEntry = SimpleQuestion | ThreadQuestion;

/** Type guard: true when the entry contains a thread array. */
export function isThreadQuestion(q: QuestionEntry): q is ThreadQuestion {
  return 'thread' in q;
}

export interface ImageQuestions {
  [questionId: string]: QuestionEntry;
}

export interface ResponsesData {
  [imageFilename: string]: ImageQuestions;
}

export type UserRole = 'administrador' | 'evaluador' | 'dual';

export interface Evaluator {
  id: string;
  key: string;
  name: string;
  role: UserRole;
}

/** Returns true if the evaluator can access the admin panel (/admin). */
export function canAccessAdmin(ev: Evaluator): boolean {
  return ev.role === 'administrador' || ev.role === 'dual';
}

/** Returns true if the evaluator can access the evaluation dashboard (/dashboard). */
export function canAccessDashboard(ev: Evaluator): boolean {
  return ev.role === 'evaluador' || ev.role === 'dual';
}

export interface Evaluation {
  id?: string;
  evaluator_id: string;
  image_filename: string;
  question_id: string;
  model_name: string;
  score: number;
  comment?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EvaluatorProgress {
  name: string;
  completed: number;
  total: number;
  last_activity: string | null;
}

// ── Backwards-compatible alias ──────────────────────────
// Some components still reference "Question" expecting the simple shape.
export type Question = SimpleQuestion;

export interface SampleAssignment {
  id?: string;
  evaluator_id: string;
  image_filename: string;
  assigned_at?: string;
}
