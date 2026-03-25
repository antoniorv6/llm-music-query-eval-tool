/**
 * Anonymisation layer: fixed global registry of model → Minion name.
 * Add new models here as they are incorporated into the evaluation.
 *
 * Real model names are NEVER shown in the evaluator UI.
 * Supabase still stores the real model name — this is display-only.
 */

const MODEL_TO_MINION: Record<string, string> = {
  // Propietarios
  'anthropic/claude-sonnet-4.6': 'Bob',
  'google/gemini-3.1-pro-preview': 'Kevin',
  'x-ai/grok-4.20-beta': 'Stuart',
  'openai/gpt-5.4': 'Tim',
  // OSS
  'meta-llama/llama-4-maverick': 'Jerry',
  'moonshotai/kimi-k2.5': 'Dave',
  'qwen/qwen3.5-397b-a17b': 'Phil',
};

/**
 * Return the anonymous Minion name for a given model.
 * Throws if the model is not registered — add it to MODEL_TO_MINION above.
 */
export function getMinionName(modelName: string): string {
  const name = MODEL_TO_MINION[modelName];
  if (!name) {
    console.warn(`[minions] Modelo no registrado: "${modelName}". Añádelo a MODEL_TO_MINION en minions.ts`);
    return 'Minion desconocido';
  }
  return name;
}

