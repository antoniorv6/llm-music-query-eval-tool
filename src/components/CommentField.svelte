<script lang="ts">
  interface Props {
    comment: string;
    onchange: (comment: string) => void;
  }

  let { comment, onchange }: Props = $props();
  let expanded = $state(comment.length > 0);
  let draft = $state(comment);

  function handleSave() {
    onchange(draft);
    if (!draft.trim()) expanded = false;
  }

  function handleCancel() {
    draft = comment;
    expanded = false;
  }
</script>

{#if !expanded}
  <button
    onclick={() => { expanded = true; }}
    class="text-xs text-accent-400/50 hover:text-accent-400/80 transition-colors cursor-pointer font-medium"
  >
    + Agregar comentario
  </button>
{:else}
  <div class="flex flex-col gap-2">
    <textarea
      bind:value={draft}
      placeholder="Comentario opcional..."
      rows="2"
      class="w-full px-3 py-2 bg-surface-800 border border-surface-700 rounded-md text-surface-200 text-sm placeholder-surface-600 focus:outline-none focus:border-accent-500/40 focus:ring-1 focus:ring-accent-500/15 resize-y min-h-[56px]"
    ></textarea>
    <div class="flex gap-2">
      <button
        onclick={handleSave}
        class="px-3 py-1.5 bg-accent-600 hover:bg-accent-700 text-white text-xs font-medium rounded cursor-pointer transition-colors"
      >
        Guardar
      </button>
      <button
        onclick={handleCancel}
        class="px-3 py-1.5 bg-surface-850 hover:bg-surface-800 border border-surface-700 text-surface-400 hover:text-surface-200 text-xs font-medium rounded cursor-pointer transition-colors"
      >
        Cancelar
      </button>
    </div>
  </div>
{/if}
