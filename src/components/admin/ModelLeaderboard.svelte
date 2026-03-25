<script lang="ts">
  import type { ModelStats } from '../../lib/analytics';

  interface Props {
    models: ModelStats[];
    onSelectModel?: (model: ModelStats) => void;
  }

  let { models, onSelectModel }: Props = $props();

  type SortKey = 'compositeScore' | 'binaryAccuracy' | 'meanRankingScore' | 'avgResponseTime';
  let sortKey: SortKey = $state('compositeScore');
  let sortAsc = $state(false);

  const sorted = $derived(
    [...models].sort((a, b) => {
      const diff = (a[sortKey] as number) - (b[sortKey] as number);
      return sortAsc ? diff : -diff;
    })
  );

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      sortAsc = !sortAsc;
    } else {
      sortKey = key;
      sortAsc = key === 'avgResponseTime'; // lower is better for time
    }
  }

  function sortIcon(key: SortKey): string {
    if (sortKey !== key) return '↕';
    return sortAsc ? '↑' : '↓';
  }

  function scoreColor(score: number, max: number): string {
    const pct = max > 0 ? score / max : 0;
    if (pct >= 0.8) return 'text-emerald-600';
    if (pct >= 0.6) return 'text-accent-600';
    if (pct >= 0.4) return 'text-amber-600';
    return 'text-red-500';
  }

  function barWidth(val: number, max: number): string {
    return max > 0 ? `${(val / max) * 100}%` : '0%';
  }
</script>

<div class="bg-surface-900 border border-surface-700 rounded-lg overflow-hidden card-elevated">
  <div class="px-5 py-4 border-b border-surface-700/50">
    <h3 class="font-serif text-base font-semibold text-surface-100">Leaderboard de Modelos</h3>
  </div>

  <div class="overflow-x-auto">
    <table class="w-full">
      <thead>
        <tr class="bg-surface-850">
          <th class="text-left px-5 py-3 text-xs font-medium text-surface-500 uppercase tracking-widest w-8">#</th>
          <th class="text-left px-5 py-3 text-xs font-medium text-surface-500 uppercase tracking-widest">Modelo</th>
          <th class="text-right px-5 py-3 text-xs font-medium text-surface-500 uppercase tracking-widest cursor-pointer hover:text-surface-300 select-none"
              onclick={() => toggleSort('binaryAccuracy')}>
            Accuracy {sortIcon('binaryAccuracy')}
          </th>
          <th class="text-right px-5 py-3 text-xs font-medium text-surface-500 uppercase tracking-widest cursor-pointer hover:text-surface-300 select-none"
              onclick={() => toggleSort('meanRankingScore')}>
            Score ranking {sortIcon('meanRankingScore')}
          </th>
          <th class="text-right px-5 py-3 text-xs font-medium text-surface-500 uppercase tracking-widest cursor-pointer hover:text-surface-300 select-none"
              onclick={() => toggleSort('avgResponseTime')}>
            Tiempo resp. {sortIcon('avgResponseTime')}
          </th>
          <th class="text-right px-5 py-3 text-xs font-medium text-surface-500 uppercase tracking-widest">Evals</th>
          <th class="text-right px-5 py-3 text-xs font-medium text-surface-500 uppercase tracking-widest cursor-pointer hover:text-surface-300 select-none"
              onclick={() => toggleSort('compositeScore')}>
            Compuesto {sortIcon('compositeScore')}
          </th>
        </tr>
      </thead>
      <tbody>
        {#each sorted as model, i}
          {@const rank = i + 1}
          <tr class="border-b border-surface-700/50 hover:bg-surface-850/60 transition-colors {onSelectModel ? 'cursor-pointer' : ''}"
              onclick={() => onSelectModel?.(model)}>
            <td class="px-5 py-3.5">
              <span class="text-sm font-semibold tabular-nums {rank === 1 ? 'text-amber-500' : rank === 2 ? 'text-surface-400' : rank === 3 ? 'text-amber-700' : 'text-surface-500'}">
                {rank}
              </span>
            </td>
            <td class="px-5 py-3.5">
              <div class="flex flex-col">
                <span class="text-sm font-medium text-surface-100">{model.shortName}</span>
                <span class="text-xs text-surface-500">{model.provider}</span>
              </div>
            </td>
            <td class="px-5 py-3.5 text-right">
              <div class="flex items-center justify-end gap-2.5">
                <div class="w-16 h-1.5 bg-surface-800 rounded-full overflow-hidden">
                  <div class="h-full bg-accent-500 rounded-full" style="width: {barWidth(model.binaryAccuracy, 1)}"></div>
                </div>
                <span class="text-sm font-mono tabular-nums {scoreColor(model.binaryAccuracy, 1)}">
                  {(model.binaryAccuracy * 100).toFixed(0)}%
                </span>
              </div>
            </td>
            <td class="px-5 py-3.5 text-right">
              <div class="flex items-center justify-end gap-2.5">
                <div class="w-16 h-1.5 bg-surface-800 rounded-full overflow-hidden">
                  <div class="h-full bg-amber-500 rounded-full" style="width: {barWidth(model.meanRankingScore, 5)}"></div>
                </div>
                <span class="text-sm font-mono tabular-nums {scoreColor(model.meanRankingScore, 5)}">
                  {model.meanRankingScore.toFixed(2)}
                </span>
              </div>
            </td>
            <td class="px-5 py-3.5 text-right">
              <span class="text-sm font-mono tabular-nums text-surface-400">
                {model.avgResponseTime.toFixed(1)}s
              </span>
            </td>
            <td class="px-5 py-3.5 text-right">
              <span class="text-sm font-mono tabular-nums text-surface-400">
                {model.totalEvaluations}
              </span>
            </td>
            <td class="px-5 py-3.5 text-right">
              <span class="text-sm font-semibold font-mono tabular-nums {scoreColor(model.compositeScore, 1)}">
                {(model.compositeScore * 100).toFixed(1)}
              </span>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if models.length === 0}
    <div class="px-5 py-12 text-center text-surface-500 font-serif italic">
      No hay datos de modelos disponibles
    </div>
  {/if}
</div>
