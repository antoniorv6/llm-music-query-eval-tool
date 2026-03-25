<script lang="ts">
  interface Props {
    score: number | null;
    onchange: (score: number) => void;
  }

  let { score, onchange }: Props = $props();
</script>

<div class="flex gap-2">
  <button
    onclick={() => onchange(1)}
    class="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium cursor-pointer border transition-colors
      {score === 1
        ? 'bg-green-500/12 text-green-300 border-green-500/35'
        : 'bg-surface-800/60 text-surface-400 border-surface-700/50 hover:border-green-500/30 hover:text-green-400'}"
  >
    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
      <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
    Correcto
  </button>
  <button
    onclick={() => onchange(0)}
    class="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium cursor-pointer border transition-colors
      {score === 0
        ? 'bg-red-500/12 text-red-300 border-red-500/35'
        : 'bg-surface-800/60 text-surface-400 border-surface-700/50 hover:border-red-500/30 hover:text-red-400'}"
  >
    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
    Incorrecto
  </button>
</div>
