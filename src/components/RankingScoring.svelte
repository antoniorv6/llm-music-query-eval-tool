<script lang="ts">
  interface Props {
    score: number | null;
    onchange: (score: number) => void;
  }

  let { score, onchange }: Props = $props();

  const scores = [0, 1, 2, 3, 4, 5];

  function getScoreColor(value: number, isActive: boolean): string {
    if (!isActive) return 'bg-surface-850 text-surface-400 border-surface-700 hover:border-accent-600/40 hover:text-surface-200';
    if (value <= 1) return 'bg-red-100 text-red-700 border-red-400';
    if (value <= 2) return 'bg-orange-100 text-orange-700 border-orange-400';
    if (value <= 3) return 'bg-amber-100 text-amber-700 border-amber-400';
    if (value <= 4) return 'bg-indigo-100 text-indigo-700 border-indigo-400';
    return 'bg-green-100 text-green-700 border-green-400';
  }
</script>

<div>
  <div class="flex gap-1.5 w-full">
    {#each scores as value}
      <button
        onclick={() => onchange(value)}
        class="flex-1 h-10 flex items-center justify-center rounded-full text-sm font-bold border cursor-pointer transition-colors
          {getScoreColor(value, score === value)}"
      >
        {value}
      </button>
    {/each}
  </div>
  <div class="flex justify-between mt-1.5 px-1">
    <span class="text-xs text-surface-400">Sin mérito</span>
    <span class="text-xs text-surface-400">Excelente</span>
  </div>
</div>
