<script lang="ts">
  import type { AnalyticsData } from '../../lib/analytics';
  import { shortModelName } from '../../lib/analytics';

  interface Props {
    data: AnalyticsData;
  }

  let { data }: Props = $props();

  // Sort images by difficulty (lowest avg score = hardest)
  const sortedImages = $derived(
    [...data.images].sort((a, b) => a.avgScore - b.avgScore)
  );

  const modelNames = $derived(data.models.map(m => m.modelName));

  function cellColor(score: number, type: 'ranking' | 'any'): string {
    // For ranking: 0-5, for any mixed: normalize
    const max = 5;
    const pct = score / max;
    if (pct >= 0.8) return 'bg-emerald-100 text-emerald-700';
    if (pct >= 0.6) return 'bg-emerald-50 text-emerald-600';
    if (pct >= 0.4) return 'bg-amber-50 text-amber-700';
    if (pct >= 0.2) return 'bg-orange-50 text-orange-700';
    return 'bg-red-50 text-red-700';
  }

  function cellOpacity(score: number): string {
    const pct = Math.min(score / 5, 1);
    return `opacity: ${0.5 + pct * 0.5}`;
  }
</script>

<div class="bg-surface-900 border border-surface-700 rounded-lg overflow-hidden card-elevated">
  <div class="px-5 py-4 border-b border-surface-700/50">
    <h3 class="font-serif text-base font-semibold text-surface-100">Dificultad por Imagen</h3>
    <p class="text-xs text-surface-500 mt-1">Score medio por imagen y modelo — ordenado de más difícil a más fácil</p>
  </div>

  {#if sortedImages.length > 0 && data.totalEvaluations > 0}
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="bg-surface-850">
            <th class="text-left px-4 py-3 text-xs font-medium text-surface-500 uppercase tracking-widest sticky left-0 bg-surface-850 z-10">
              Imagen
            </th>
            {#each modelNames as modelName}
              <th class="text-center px-3 py-3 text-xs font-medium text-surface-500 uppercase tracking-widest">
                {shortModelName(modelName)}
              </th>
            {/each}
            <th class="text-center px-3 py-3 text-xs font-medium text-surface-500 uppercase tracking-widest">
              Media
            </th>
          </tr>
        </thead>
        <tbody>
          {#each sortedImages as image}
            <tr class="border-b border-surface-700/50 hover:bg-surface-850/40 transition-colors">
              <td class="px-4 py-2.5 sticky left-0 bg-surface-900 z-10">
                <span class="text-xs font-mono text-surface-400">{image.imageFilename}</span>
              </td>
              {#each modelNames as modelName}
                {@const score = image.modelScores[modelName]}
                <td class="px-3 py-2.5 text-center">
                  {#if score !== undefined && score > 0}
                    <span class="inline-flex items-center justify-center w-10 h-7 rounded text-xs font-mono font-semibold {cellColor(score, 'any')}">
                      {score.toFixed(1)}
                    </span>
                  {:else}
                    <span class="text-xs text-surface-600">—</span>
                  {/if}
                </td>
              {/each}
              <td class="px-3 py-2.5 text-center">
                <span class="inline-flex items-center justify-center w-10 h-7 rounded text-xs font-mono font-semibold bg-surface-850 text-surface-300">
                  {image.avgScore.toFixed(1)}
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Summary -->
    <div class="px-5 py-3 border-t border-surface-700/50 bg-surface-850/30">
      <div class="flex flex-wrap gap-4 text-xs text-surface-500">
        <span class="flex items-center gap-1.5">
          <span class="inline-block w-3 h-3 rounded bg-red-50 border border-red-200"></span>
          Difícil (0–1)
        </span>
        <span class="flex items-center gap-1.5">
          <span class="inline-block w-3 h-3 rounded bg-amber-50 border border-amber-200"></span>
          Moderada (2–3)
        </span>
        <span class="flex items-center gap-1.5">
          <span class="inline-block w-3 h-3 rounded bg-emerald-50 border border-emerald-200"></span>
          Fácil (4–5)
        </span>
      </div>
    </div>
  {:else}
    <div class="px-5 py-12 text-center text-surface-500 font-serif italic">
      Sin evaluaciones por imagen todavía
    </div>
  {/if}
</div>
