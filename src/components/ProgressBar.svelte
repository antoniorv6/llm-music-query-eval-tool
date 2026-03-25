<script lang="ts">
  interface Props {
    completed: number;
    total: number;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
  }

  let { completed, total, size = 'md', showLabel = true }: Props = $props();

  let percentage = $derived(total > 0 ? Math.round((completed / total) * 100) : 0);
  let barHeight = $derived(size === 'sm' ? 'h-1.5' : size === 'md' ? 'h-2.5' : 'h-4');
  let barColor = $derived(
    percentage === 100
      ? 'bg-green-500'
      : 'bg-accent-500'
  );
</script>

<div class="w-full">
  {#if showLabel}
    <div class="flex justify-between items-center mb-1">
      <span class="text-xs text-surface-400 tabular-nums">{completed}/{total}</span>
      <span class="text-xs font-medium tabular-nums {percentage === 100 ? 'text-green-400' : 'text-surface-300'}">{percentage}%</span>
    </div>
  {/if}
  <div class="w-full bg-surface-800 rounded {barHeight} overflow-hidden">
    <div
      class="{barColor} {barHeight} rounded"
      style="width: {percentage}%"
    ></div>
  </div>
</div>
