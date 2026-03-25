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
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
  {#each responses as response (response.modelo)}
    <ModelResponseCard
      {response}
      {questionType}
      evaluation={evaluations.get(response.modelo) || null}
      onscore={(score) => onscore(response.modelo, score)}
      oncomment={(comment) => oncomment(response.modelo, comment)}
    />
  {/each}
</div>
