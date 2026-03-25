import type { ResponsesData, Evaluation, QuestionType, ModelResponse, QuestionEntry } from './types';
import { isThreadQuestion } from './types';

// ─── Derived Types ──────────────────────────────────────────────

export interface ModelStats {
  modelName: string;
  shortName: string;
  provider: string;
  binaryAccuracy: number;
  binaryTotal: number;
  binaryCorrect: number;
  meanRankingScore: number;
  rankingScores: number[];
  avgResponseTime: number;
  responseTimes: number[];
  totalEvaluations: number;
  compositeScore: number;
  questionStats: Record<string, QuestionModelStats>;
}

export interface QuestionModelStats {
  questionId: string;
  questionText: string;
  type: QuestionType;
  mean: number;
  median: number;
  stdDev: number;
  scores: number[];
  evaluatorScores: Record<string, number>; // evaluatorId -> score
}

export interface QuestionOverview {
  questionId: string;
  questionText: string;
  type: QuestionType;
  modelStats: Record<string, { mean: number; scores: number[] }>;
}

export interface ImageStats {
  imageFilename: string;
  avgScore: number;
  modelScores: Record<string, number>;
  questionScores: Record<string, Record<string, number>>; // questionId -> model -> avg
  totalEvaluations: number;
}

export interface EvaluatorStats {
  id: string;
  name: string;
  completed: number;
  total: number;
  lastActivity: string | null;
  meanScore: number;
  stdDev: number;
  bias: number; // deviation from global mean
  scoreDistribution: number[]; // count per score bucket 0-5
}

export interface InterRaterStats {
  krippendorffAlpha: number;
  alphaPerQuestion: Record<string, number>;
  alphaPerQuestionType: Record<string, number>;
  pairwiseAgreement: { evaluator1: string; evaluator2: string; agreement: number }[];
}

export interface AnalyticsData {
  models: ModelStats[];
  questions: QuestionOverview[];
  images: ImageStats[];
  evaluators: EvaluatorStats[];
  interRater: InterRaterStats;
  totalEvaluations: number;
  globalMeanRanking: number;
  globalBinaryAccuracy: number;
}

// ─── Helpers ────────────────────────────────────────────────────

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / (arr.length - 1));
}

export function shortModelName(fullName: string): string {
  const parts = fullName.split('/');
  const name = parts[parts.length - 1];
  return name
    .replace(/-instruct$/, '')
    .replace(/-preview$/, '')
    .replace(/\d+b-\d+e-/, '')
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function providerName(fullName: string): string {
  const parts = fullName.split('/');
  if (parts.length < 2) return '';
  return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
}

// ─── Flatten helpers ────────────────────────────────────────────

/** A flattened evaluable unit: one question (or sub-question) with its responses. */
interface FlatQuestion {
  id: string;          // For simple: the question key ("2"). For thread sub: the sub id ("3a").
  question: string;
  type: QuestionType;
  respuestas: ModelResponse[];
}

/**
 * Flatten an image's questions into evaluable units.
 * Thread questions expand into their sub-questions.
 */
function flattenQuestions(questions: Record<string, QuestionEntry>): FlatQuestion[] {
  const result: FlatQuestion[] = [];
  for (const [qId, entry] of Object.entries(questions)) {
    if (isThreadQuestion(entry)) {
      for (const sub of entry.thread) {
        result.push({
          id: sub.id,
          question: sub.question,
          type: sub.type,
          respuestas: sub.respuestas,
        });
      }
    } else {
      result.push({
        id: qId,
        question: entry.question,
        type: entry.type,
        respuestas: entry.respuestas,
      });
    }
  }
  return result;
}

// ─── Krippendorff's Alpha (interval scale) ──────────────────────

/**
 * Computes Krippendorff's alpha for interval data.
 * @param ratings Matrix where rows = evaluators, cols = units (items).
 *                null = missing value.
 */
export function krippendorffsAlpha(ratings: (number | null)[][]): number {
  const nEvaluators = ratings.length;
  if (nEvaluators < 2) return 1;

  const nUnits = ratings[0]?.length ?? 0;
  if (nUnits === 0) return 1;

  // Collect paired values per unit
  let Do = 0; // observed disagreement
  let totalPairs = 0;

  const allValues: number[] = [];

  for (let u = 0; u < nUnits; u++) {
    const values: number[] = [];
    for (let e = 0; e < nEvaluators; e++) {
      const v = ratings[e][u];
      if (v !== null && v !== undefined) {
        values.push(v);
        allValues.push(v);
      }
    }

    const n_u = values.length;
    if (n_u < 2) continue;

    // Within-unit disagreement
    for (let i = 0; i < n_u; i++) {
      for (let j = i + 1; j < n_u; j++) {
        Do += (values[i] - values[j]) ** 2;
        totalPairs++;
      }
    }
  }

  if (totalPairs === 0) return 1;
  Do = Do / totalPairs;

  // Expected disagreement — all pairs across all values
  const N = allValues.length;
  if (N < 2) return 1;

  let De = 0;
  let expectedPairs = 0;
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      De += (allValues[i] - allValues[j]) ** 2;
      expectedPairs++;
    }
  }
  De = De / expectedPairs;

  if (De === 0) return 1; // perfect agreement on a single value
  return 1 - Do / De;
}

// ─── Main Analytics Computation ─────────────────────────────────

export function computeAnalytics(
  responsesData: ResponsesData,
  evaluations: Evaluation[],
  evaluatorNames: Record<string, string> // evaluatorId -> name
): AnalyticsData {
  // ── Index evaluations ───────────────────────────────────
  // Key: image|question|model -> evaluations[]
  const evalIndex = new Map<string, Evaluation[]>();
  const evalByEvaluator = new Map<string, Evaluation[]>();

  for (const ev of evaluations) {
    const key = `${ev.image_filename}|${ev.question_id}|${ev.model_name}`;
    if (!evalIndex.has(key)) evalIndex.set(key, []);
    evalIndex.get(key)!.push(ev);

    if (!evalByEvaluator.has(ev.evaluator_id)) evalByEvaluator.set(ev.evaluator_id, []);
    evalByEvaluator.get(ev.evaluator_id)!.push(ev);
  }

  // ── Discover all models, questions, images ─────────────
  const modelSet = new Set<string>();
  const uniqueQuestionIds = new Set<string>();
  const imageList: string[] = [];

  // Pre-flatten all images for reuse
  const flatByImage = new Map<string, FlatQuestion[]>();

  for (const [imageFilename, questions] of Object.entries(responsesData)) {
    imageList.push(imageFilename);
    const flat = flattenQuestions(questions);
    flatByImage.set(imageFilename, flat);
    for (const fq of flat) {
      uniqueQuestionIds.add(fq.id);
      for (const resp of fq.respuestas) {
        modelSet.add(resp.modelo);
      }
    }
  }

  // ── Compute Model Stats ──────────────────────────────────
  const models: ModelStats[] = [];
  const allBinaryScores: number[] = [];
  const allRankingScores: number[] = [];

  for (const modelName of modelSet) {
    const binaryScores: number[] = [];
    const rankingScores: number[] = [];
    const responseTimes: number[] = [];
    const questionStats: Record<string, QuestionModelStats> = {};
    let totalEvals = 0;

    for (const [imageFilename] of Object.entries(responsesData)) {
      const flat = flatByImage.get(imageFilename) || [];
      for (const fq of flat) {
        const resp = fq.respuestas.find(r => r.modelo === modelName);
        if (!resp) continue;

        responseTimes.push(resp.tiempo_de_respuesta);
        const key = `${imageFilename}|${fq.id}|${modelName}`;
        const evals = evalIndex.get(key) || [];

        const scores = evals.map(e => e.score);
        totalEvals += scores.length;

        if (fq.type === 'binary') {
          binaryScores.push(...scores);
          allBinaryScores.push(...scores);
        } else {
          rankingScores.push(...scores);
          allRankingScores.push(...scores);
        }

        // Per-question stats
        if (!questionStats[fq.id]) {
          questionStats[fq.id] = {
            questionId: fq.id,
            questionText: fq.question,
            type: fq.type,
            mean: 0,
            median: 0,
            stdDev: 0,
            scores: [],
            evaluatorScores: {},
          };
        }
        questionStats[fq.id].scores.push(...scores);
        for (const e of evals) {
          questionStats[fq.id].evaluatorScores[e.evaluator_id] = e.score;
        }
      }
    }

    // Finalize per-question
    for (const qs of Object.values(questionStats)) {
      qs.mean = mean(qs.scores);
      qs.median = median(qs.scores);
      qs.stdDev = stdDev(qs.scores);
    }

    const binaryAcc = binaryScores.length > 0 ? mean(binaryScores) : 0;
    const meanRanking = rankingScores.length > 0 ? mean(rankingScores) : 0;
    const avgTime = responseTimes.length > 0 ? mean(responseTimes) : 0;

    // Composite: 40% binary accuracy + 40% ranking (normalized to 0-1) + 20% speed bonus
    const maxTime = Math.max(...[...modelSet].flatMap(m => {
      const times: number[] = [];
      for (const flat of flatByImage.values()) {
        for (const fq of flat) {
          const r = fq.respuestas.find(r => r.modelo === m);
          if (r) times.push(r.tiempo_de_respuesta);
        }
      }
      return times;
    }), 1);
    const speedScore = 1 - (avgTime / maxTime);
    const composite = binaryAcc * 0.4 + (meanRanking / 5) * 0.4 + speedScore * 0.2;

    models.push({
      modelName,
      shortName: shortModelName(modelName),
      provider: providerName(modelName),
      binaryAccuracy: binaryAcc,
      binaryTotal: binaryScores.length,
      binaryCorrect: binaryScores.filter(s => s === 1).length,
      meanRankingScore: meanRanking,
      rankingScores,
      avgResponseTime: avgTime,
      responseTimes,
      totalEvaluations: totalEvals,
      compositeScore: composite,
      questionStats,
    });
  }

  // Sort by composite descending
  models.sort((a, b) => b.compositeScore - a.compositeScore);

  // ── Question Overviews ─────────────────────────────────
  const questions: QuestionOverview[] = [];
  for (const qId of [...uniqueQuestionIds].sort()) {
    // Get first occurrence for text/type
    let questionText = '';
    let questionType: QuestionType = 'binary';
    for (const flat of flatByImage.values()) {
      const fq = flat.find(f => f.id === qId);
      if (fq) {
        questionText = fq.question;
        questionType = fq.type;
        break;
      }
    }

    const modelScores: Record<string, { mean: number; scores: number[] }> = {};
    for (const modelName of modelSet) {
      const scores: number[] = [];
      for (const [imageFilename] of Object.entries(responsesData)) {
        const key = `${imageFilename}|${qId}|${modelName}`;
        const evals = evalIndex.get(key) || [];
        scores.push(...evals.map(e => e.score));
      }
      modelScores[modelName] = { mean: mean(scores), scores };
    }

    questions.push({ questionId: qId, questionText, type: questionType, modelStats: modelScores });
  }

  // ── Image Stats ────────────────────────────────────────
  const images: ImageStats[] = [];
  for (const imageFilename of imageList) {
    const modelScores: Record<string, number> = {};
    const questionScores: Record<string, Record<string, number>> = {};
    const allScores: number[] = [];
    let imgTotalEvals = 0;

    const flat = flatByImage.get(imageFilename) || [];
    for (const fq of flat) {
      questionScores[fq.id] = {};
      for (const resp of fq.respuestas) {
        const key = `${imageFilename}|${fq.id}|${resp.modelo}`;
        const evals = evalIndex.get(key) || [];
        const scores = evals.map(e => e.score);
        imgTotalEvals += scores.length;
        allScores.push(...scores);

        const avg = mean(scores);
        questionScores[fq.id][resp.modelo] = avg;

        if (!modelScores[resp.modelo]) modelScores[resp.modelo] = 0;
        modelScores[resp.modelo] += avg;
      }
    }

    // Normalize model scores by number of flat questions
    const numQuestions = flat.length;
    for (const m of Object.keys(modelScores)) {
      modelScores[m] = numQuestions > 0 ? modelScores[m] / numQuestions : 0;
    }

    images.push({
      imageFilename,
      avgScore: mean(allScores),
      modelScores,
      questionScores,
      totalEvaluations: imgTotalEvals,
    });
  }

  // ── Evaluator Stats ────────────────────────────────────
  const totalPerEvaluator = countTotalExpected(responsesData);
  const globalMean = evaluations.length > 0 ? mean(evaluations.map(e => e.score)) : 0;
  const evaluators: EvaluatorStats[] = [];

  for (const [evalId, evals] of evalByEvaluator.entries()) {
    const scores = evals.map(e => e.score);
    const m = mean(scores);
    const lastActivity = evals.reduce<string | null>((latest, e) => {
      const t = e.updated_at || e.created_at || null;
      if (!t) return latest;
      return !latest || t > latest ? t : latest;
    }, null);

    const dist = new Array(6).fill(0); // 0-5
    for (const s of scores) {
      const bucket = Math.min(5, Math.max(0, Math.round(s)));
      dist[bucket]++;
    }

    evaluators.push({
      id: evalId,
      name: evaluatorNames[evalId] || evalId.slice(0, 8),
      completed: evals.length,
      total: totalPerEvaluator,
      lastActivity,
      meanScore: m,
      stdDev: stdDev(scores),
      bias: m - globalMean,
      scoreDistribution: dist,
    });
  }

  evaluators.sort((a, b) => b.completed - a.completed);

  // ── Inter-Rater Reliability ────────────────────────────
  const interRater = computeInterRater(flatByImage, evaluations, evalByEvaluator, uniqueQuestionIds);

  return {
    models,
    questions,
    images,
    evaluators,
    interRater,
    totalEvaluations: evaluations.length,
    globalMeanRanking: allRankingScores.length > 0 ? mean(allRankingScores) : 0,
    globalBinaryAccuracy: allBinaryScores.length > 0 ? mean(allBinaryScores) : 0,
  };
}

function countTotalExpected(data: ResponsesData): number {
  let count = 0;
  for (const questions of Object.values(data)) {
    const flat = flattenQuestions(questions);
    for (const fq of flat) {
      count += fq.respuestas.length;
    }
  }
  return count;
}

function computeInterRater(
  flatByImage: Map<string, FlatQuestion[]>,
  evaluations: Evaluation[],
  evalByEvaluator: Map<string, Evaluation[]>,
  uniqueQuestionIds: Set<string>
): InterRaterStats {
  const evaluatorIds = [...evalByEvaluator.keys()].sort();
  if (evaluatorIds.length < 2) {
    return {
      krippendorffAlpha: 1,
      alphaPerQuestion: {},
      alphaPerQuestionType: {},
      pairwiseAgreement: [],
    };
  }

  // Build units: each unit is (image, questionId, model)
  type Unit = { image: string; question: string; model: string };
  const units: Unit[] = [];
  for (const [img, flat] of flatByImage.entries()) {
    for (const fq of flat) {
      for (const r of fq.respuestas) {
        units.push({ image: img, question: fq.id, model: r.modelo });
      }
    }
  }

  // Build eval lookup: evaluatorId|image|question|model -> score
  const evalLookup = new Map<string, number>();
  for (const ev of evaluations) {
    const key = `${ev.evaluator_id}|${ev.image_filename}|${ev.question_id}|${ev.model_name}`;
    evalLookup.set(key, ev.score);
  }

  // Build ratings matrix for overall alpha
  const ratings: (number | null)[][] = evaluatorIds.map(eId =>
    units.map(u => {
      const key = `${eId}|${u.image}|${u.question}|${u.model}`;
      return evalLookup.get(key) ?? null;
    })
  );

  const krippendorffAlpha = krippendorffsAlpha(ratings);

  // Alpha per question id
  const alphaPerQuestion: Record<string, number> = {};
  for (const qId of uniqueQuestionIds) {
    const qUnits = units.filter(u => u.question === qId);
    if (qUnits.length === 0) continue;
    const qRatings: (number | null)[][] = evaluatorIds.map(eId =>
      qUnits.map(u => {
        const key = `${eId}|${u.image}|${u.question}|${u.model}`;
        return evalLookup.get(key) ?? null;
      })
    );
    alphaPerQuestion[qId] = krippendorffsAlpha(qRatings);
  }

  // Alpha per question type
  const alphaPerQuestionType: Record<string, number> = {};
  // Build a map of questionId -> type from flat data
  const qIdTypeMap = new Map<string, QuestionType>();
  for (const flat of flatByImage.values()) {
    for (const fq of flat) {
      qIdTypeMap.set(fq.id, fq.type);
    }
  }

  const allTypes = new Set(qIdTypeMap.values());
  for (const qType of allTypes) {
    const typeQIds = new Set<string>();
    for (const [id, t] of qIdTypeMap.entries()) {
      if (t === qType) typeQIds.add(id);
    }
    const typeUnits = units.filter(u => typeQIds.has(u.question));
    if (typeUnits.length === 0) continue;
    const typeRatings: (number | null)[][] = evaluatorIds.map(eId =>
      typeUnits.map(u => {
        const key = `${eId}|${u.image}|${u.question}|${u.model}`;
        return evalLookup.get(key) ?? null;
      })
    );
    alphaPerQuestionType[qType] = krippendorffsAlpha(typeRatings);
  }

  // Pairwise agreement (correlation of scores)
  const pairwiseAgreement: { evaluator1: string; evaluator2: string; agreement: number }[] = [];
  for (let i = 0; i < evaluatorIds.length; i++) {
    for (let j = i + 1; j < evaluatorIds.length; j++) {
      const e1 = evaluatorIds[i];
      const e2 = evaluatorIds[j];
      // Find units both have scored
      const pairs: [number, number][] = [];
      for (const u of units) {
        const k1 = `${e1}|${u.image}|${u.question}|${u.model}`;
        const k2 = `${e2}|${u.image}|${u.question}|${u.model}`;
        const s1 = evalLookup.get(k1);
        const s2 = evalLookup.get(k2);
        if (s1 !== undefined && s2 !== undefined) {
          pairs.push([s1, s2]);
        }
      }

      if (pairs.length < 2) {
        pairwiseAgreement.push({ evaluator1: e1, evaluator2: e2, agreement: 0 });
        continue;
      }

      // Percentage of exact agreement
      const exact = pairs.filter(([a, b]) => a === b).length;
      const agreement = exact / pairs.length;
      pairwiseAgreement.push({ evaluator1: e1, evaluator2: e2, agreement });
    }
  }

  return { krippendorffAlpha, alphaPerQuestion, alphaPerQuestionType, pairwiseAgreement };
}
