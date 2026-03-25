import type { ResponsesData } from './types';
import { isThreadQuestion } from './types';

export interface ModelPricing {
  inputPer1M: number;
  outputPer1M: number;
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  'moonshotai/kimi-k2.5':           { inputPer1M: 0.45,  outputPer1M: 2.20  },
  'google/gemini-3.1-pro-preview':  { inputPer1M: 2.00,  outputPer1M: 12.00 },
  'openai/gpt-5.4':                 { inputPer1M: 2.50,  outputPer1M: 15.00 },
  'anthropic/claude-sonnet-4.6':    { inputPer1M: 3.00,  outputPer1M: 15.00 },
};

export function estimateResponseCost(
  modelName: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[modelName];
  if (!pricing) return 0;
  return (inputTokens / 1_000_000) * pricing.inputPer1M
       + (outputTokens / 1_000_000) * pricing.outputPer1M;
}

export function estimateTotalModelCost(
  modelName: string,
  responsesData: ResponsesData
): number {
  let total = 0;
  for (const questions of Object.values(responsesData)) {
    for (const entry of Object.values(questions)) {
      const respuestas = isThreadQuestion(entry)
        ? entry.thread.flatMap(sub => sub.respuestas)
        : entry.respuestas;
      for (const r of respuestas) {
        if (r.modelo === modelName) {
          total += estimateResponseCost(
            modelName,
            r.input_tokens ?? 0,
            r.output_tokens ?? 0
          );
        }
      }
    }
  }
  return total;
}

export function estimateTotalTokens(
  modelName: string,
  responsesData: ResponsesData
): { input: number; output: number; total: number } {
  let input = 0;
  let output = 0;
  for (const questions of Object.values(responsesData)) {
    for (const entry of Object.values(questions)) {
      const respuestas = isThreadQuestion(entry)
        ? entry.thread.flatMap(sub => sub.respuestas)
        : entry.respuestas;
      for (const r of respuestas) {
        if (r.modelo === modelName) {
          input += r.input_tokens ?? 0;
          output += r.output_tokens ?? 0;
        }
      }
    }
  }
  return { input, output, total: input + output };
}

export function costEfficiency(
  compositeScore: number,
  totalCostUsd: number
): number | null {
  if (totalCostUsd === 0) return null;
  return compositeScore / totalCostUsd;
}

export function hasPricing(modelName: string): boolean {
  return modelName in MODEL_PRICING;
}
