<script lang="ts">
  import type { QuestionEntry } from '../lib/types';
  import { isThreadQuestion } from '../lib/types';

  interface Props {
    questions: Record<string, QuestionEntry>;
    /** For simple questions: the question id ("2"). For thread sub-questions: the sub id ("3a"). */
    activeQuestionId: string;
    /** The main group id that is currently expanded (e.g. "3"). */
    activeGroupId: string;
    onselect: (groupId: string, questionId: string) => void;
    completedQuestions: Set<string>;
  }

  let { questions, activeQuestionId, activeGroupId, onselect, completedQuestions }: Props = $props();

  let questionIds = $derived(Object.keys(questions).sort((a, b) => Number(a) - Number(b)));

  /** Check if every evaluable unit inside a group is completed. */
  function isGroupComplete(groupId: string): boolean {
    const entry = questions[groupId];
    if (!entry) return false;
    if (isThreadQuestion(entry)) {
      return entry.thread.every((sub) => completedQuestions.has(sub.id));
    }
    return completedQuestions.has(groupId);
  }

  /** Check if at least one sub-question in a thread group is completed. */
  function isGroupPartial(groupId: string): boolean {
    const entry = questions[groupId];
    if (!entry || !isThreadQuestion(entry)) return false;
    return entry.thread.some((sub) => completedQuestions.has(sub.id)) && !isGroupComplete(groupId);
  }
</script>

<!-- Main question group tabs -->
<div class="flex flex-col gap-2">
  <div class="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
    {#each questionIds as qId}
      {@const entry = questions[qId]}
      {@const isThread = isThreadQuestion(entry)}
      {@const isActive = qId === activeGroupId}
      {@const isComplete = isGroupComplete(qId)}
      {@const isPartial = isGroupPartial(qId)}
      <button
        onclick={() => {
          if (isThread) {
            onselect(qId, entry.thread[0].id);
          } else {
            onselect(qId, qId);
          }
        }}
        class="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium cursor-pointer border transition-colors
          {isActive
            ? 'bg-accent-600 text-white border-accent-700'
            : 'bg-surface-900 text-surface-400 border-surface-700 hover:border-accent-500 hover:text-surface-200'}"
      >
        <span class="font-mono text-xs">P{qId}</span>
        {#if isThread}
          <!-- Thread indicator: stacked lines icon -->
          <svg class="w-3 h-3 {isActive ? 'text-white/70' : 'text-surface-500'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        {/if}
        {#if isComplete}
          <svg class="w-3 h-3 {isActive ? 'text-white/70' : 'text-green-500'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        {:else if isPartial}
          <div class="w-2 h-2 rounded-full {isActive ? 'bg-white/50' : 'bg-amber-400'}"></div>
        {/if}
      </button>
    {/each}
  </div>

  <!-- Sub-question tabs (only for active thread groups) -->
  {#if isThreadQuestion(questions[activeGroupId])}
    {@const thread = questions[activeGroupId].thread}
    <div class="flex gap-1 overflow-x-auto pl-4 scrollbar-hide">
      {#each thread as sub}
        {@const isSubActive = sub.id === activeQuestionId}
        {@const isSubComplete = completedQuestions.has(sub.id)}
        <button
          onclick={() => onselect(activeGroupId, sub.id)}
          class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium cursor-pointer border transition-colors
            {isSubActive
              ? 'bg-accent-500/80 text-white border-accent-600'
              : 'bg-surface-850 text-surface-400 border-surface-700/60 hover:border-accent-500/60 hover:text-surface-200'}"
        >
          <span class="font-mono">{sub.id}</span>
          {#if isSubComplete}
            <svg class="w-2.5 h-2.5 {isSubActive ? 'text-white/70' : 'text-green-500'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>
