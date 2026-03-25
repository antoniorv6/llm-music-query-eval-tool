<script lang="ts">
  import ModelResponseCard from './ModelResponseCard.svelte';
  import type { ModelResponse, Evaluation, QuestionType } from '../lib/types';

  interface Props {
    responses: ModelResponse[];
    questionType: QuestionType;
    evaluations: Map<string, Evaluation>;
    onscore: (modelName: string, score: number) => void;
    oncomment: (modelName: string, comment: string) => void;
  }

  let { responses, questionType, evaluations, onscore, oncomment }: Props = $props();
  let currentIndex = $state(0);

  let current = $derived(responses[currentIndex]);
  let total = $derived(responses.length);

  function prev() {
    currentIndex = (currentIndex - 1 + total) % total;
  }

  function next() {
    currentIndex = (currentIndex + 1) % total;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="max-w-4xl mx-auto">
  <!-- Navigation header -->
  <div class="flex items-center justify-between mb-3">
    <button
      onclick={prev}
      class="flex items-center gap-1.5 px-3 py-1.5 bg-surface-800/60 border border-surface-700/40 rounded-md text-surface-400 hover:text-surface-100 hover:border-accent-500/25 text-sm cursor-pointer transition-colors"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
      </svg>
      Anterior
    </button>

    <div class="flex items-center gap-3">
      <span class="text-xs text-surface-500 tabular-nums font-mono">
        {currentIndex + 1} / {total}
      </span>
      <div class="flex gap-1.5">
        {#each responses as _, i}
          <button
            onclick={() => { currentIndex = i; }}
            class="w-2 h-2 rounded-full cursor-pointer transition-colors
              {i === currentIndex
                ? 'bg-surface-300'
                : evaluations.has(responses[i].modelo)
                  ? 'bg-accent-500/50'
                  : 'bg-surface-700'}"
            aria-label="Ir al modelo {i + 1}"
          ></button>
        {/each}
      </div>
    </div>

    <button
      onclick={next}
      class="flex items-center gap-1.5 px-3 py-1.5 bg-surface-800/60 border border-surface-700/40 rounded-md text-surface-400 hover:text-surface-100 hover:border-accent-500/25 text-sm cursor-pointer transition-colors"
    >
      Siguiente
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
      </svg>
    </button>
  </div>

  <!-- Single card -->
  {#if current}
    <ModelResponseCard
      response={current}
      {questionType}
      evaluation={evaluations.get(current.modelo) || null}
      onscore={(score) => onscore(current.modelo, score)}
      oncomment={(comment) => oncomment(current.modelo, comment)}
    />
  {/if}
</div>
