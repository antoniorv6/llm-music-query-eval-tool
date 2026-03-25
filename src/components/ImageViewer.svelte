<script lang="ts">
  interface Props {
    src: string;
    alt: string;
    height?: string;
  }

  let { src, alt, height = '30vh' }: Props = $props();
  let zoomed = $state(false);

  function toggleZoom() {
    zoomed = !zoomed;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && zoomed) {
      zoomed = false;
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Image container -->
<div class="bg-surface-850 border-b border-surface-700 flex items-center justify-center p-3 overflow-hidden cursor-zoom-in"
     style="height: {height}; min-height: 140px;"
     role="button"
     tabindex="0"
     onclick={toggleZoom}
     onkeydown={(e) => e.key === 'Enter' && toggleZoom()}>
  <img
    {src}
    {alt}
    class="max-w-full max-h-full object-contain select-none"
    draggable="false"
  />
</div>

<!-- Zoomed overlay -->
{#if zoomed}
  <div
    class="fixed inset-0 z-50 bg-black/92 flex items-center justify-center cursor-zoom-out p-8"
    role="button"
    tabindex="0"
    onclick={toggleZoom}
    onkeydown={(e) => e.key === 'Enter' && toggleZoom()}>
    <img
      {src}
      {alt}
      class="max-w-full max-h-full object-contain select-none"
      draggable="false"
    />
    <div class="absolute top-4 right-4 text-white/50 text-xs font-mono">
      ESC o click para cerrar
    </div>
  </div>
{/if}
