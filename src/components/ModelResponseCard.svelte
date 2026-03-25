<script lang="ts">
  import { marked } from 'marked';
  import DOMPurify from 'isomorphic-dompurify';
  import BinaryScoring from './BinaryScoring.svelte';
  import RankingScoring from './RankingScoring.svelte';
  import CommentField from './CommentField.svelte';
  import { getMinionName } from '../lib/minions';
  import type { ModelResponse, Evaluation, QuestionType } from '../lib/types';

  interface Props {
    response: ModelResponse;
    questionType: QuestionType;
    evaluation: Evaluation | null;
    onscore: (score: number) => void;
    oncomment: (comment: string) => void;
  }

  let { response, questionType, evaluation, onscore, oncomment }: Props = $props();

  let renderedMarkdown = $derived(
    DOMPurify.sanitize(marked.parse(response.respuesta) as string)
  );

  let minionName = $derived(getMinionName(response.modelo));

  let currentScore = $derived(evaluation?.score ?? null);
  let currentComment = $derived(evaluation?.comment ?? '');
</script>

<div class="bg-surface-900 rounded-lg border border-surface-700 overflow-hidden flex flex-col card-elevated {evaluation ? 'border-l-[3px] border-l-accent-600' : ''}">
  <!-- Header -->
  <div class="px-4 py-2.5 bg-surface-850 border-b border-surface-700 flex items-center justify-between">
    <div class="flex items-center gap-2.5 min-w-0">
      <span class="text-sm font-semibold text-surface-100 truncate">
        {minionName}
      </span>
    </div>
    <div class="flex items-center gap-2.5 shrink-0">
      <span class="text-xs text-surface-500 tabular-nums font-mono" title="Tiempo de respuesta">
        {response.tiempo_de_respuesta.toFixed(1)}s
      </span>
      {#if evaluation}
        <div class="w-1.5 h-1.5 rounded-full bg-accent-600" title="Evaluado"></div>
      {/if}
    </div>
  </div>

  <!-- Response body -->
  <div class="p-4 flex-1 overflow-y-auto max-h-[400px]">
    <div class="markdown-content text-sm leading-relaxed text-surface-300">
      {@html renderedMarkdown}
    </div>
  </div>

  <!-- Scoring footer -->
  <div class="px-4 py-3 border-t border-surface-700 bg-surface-850/60">
    <div>
      {#if questionType === 'binary'}
        <BinaryScoring score={currentScore} onchange={onscore} />
      {:else}
        <RankingScoring score={currentScore} onchange={onscore} />
      {/if}
    </div>
    <div class="mt-2.5">
      <CommentField comment={currentComment} onchange={oncomment} />
    </div>
  </div>
</div>
