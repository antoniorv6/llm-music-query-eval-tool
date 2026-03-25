<script lang="ts">
  import type { AnalyticsData } from '../../lib/analytics';
  import ProgressBar from '../ProgressBar.svelte';

  interface Props {
    data: AnalyticsData;
    totalPerEvaluator: number;
  }

  let { data, totalPerEvaluator }: Props = $props();

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return 'Sin actividad';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function timeSince(dateStr: string | null): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 60) return `hace ${diffMin}m`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `hace ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `hace ${diffDays}d`;
  }

  function biasLabel(bias: number): { text: string; class: string } {
    const abs = Math.abs(bias);
    if (abs < 0.3) return { text: 'Neutral', class: 'text-emerald-600 bg-emerald-50' };
    if (bias > 0) return { text: 'Generoso', class: 'text-accent-600 bg-accent-50' };
    return { text: 'Exigente', class: 'text-amber-600 bg-amber-50' };
  }
</script>

<div class="bg-surface-900 border border-surface-700 rounded-lg overflow-hidden card-elevated">
  <div class="px-5 py-4 border-b border-surface-700/50 flex items-center justify-between">
    <div>
      <h3 class="font-serif text-base font-semibold text-surface-100">Actividad de Evaluadores</h3>
      <p class="text-xs text-surface-500 mt-1">{totalPerEvaluator} evaluaciones requeridas por evaluador</p>
    </div>
    <div class="text-xs text-surface-500 tabular-nums">
      {data.evaluators.length} evaluador{data.evaluators.length !== 1 ? 'es' : ''}
    </div>
  </div>

  {#if data.evaluators.length > 0}
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="bg-surface-850">
            <th class="text-left px-5 py-3 text-xs font-medium text-surface-500 uppercase tracking-widest">Evaluador</th>
            <th class="text-left px-5 py-3 text-xs font-medium text-surface-500 uppercase tracking-widest w-40">Progreso</th>
            <th class="text-right px-5 py-3 text-xs font-medium text-surface-500 uppercase tracking-widest">Completadas</th>
            <th class="text-right px-5 py-3 text-xs font-medium text-surface-500 uppercase tracking-widest">%</th>
            <th class="text-right px-5 py-3 text-xs font-medium text-surface-500 uppercase tracking-widest">Score medio</th>
            <th class="text-center px-5 py-3 text-xs font-medium text-surface-500 uppercase tracking-widest">Tendencia</th>
            <th class="text-right px-5 py-3 text-xs font-medium text-surface-500 uppercase tracking-widest">Última actividad</th>
          </tr>
        </thead>
        <tbody>
          {#each data.evaluators as evaluator}
            {@const pct = totalPerEvaluator > 0 ? Math.round((evaluator.completed / totalPerEvaluator) * 100) : 0}
            {@const bl = biasLabel(evaluator.bias)}
            <tr class="border-b border-surface-700/50 hover:bg-surface-850/60 transition-colors">
              <td class="px-5 py-3.5">
                <span class="text-sm font-medium text-surface-100">{evaluator.name}</span>
              </td>
              <td class="px-5 py-3.5">
                <ProgressBar completed={evaluator.completed} total={totalPerEvaluator} size="sm" showLabel={false} />
              </td>
              <td class="px-5 py-3.5 text-right">
                <span class="text-sm text-surface-400 tabular-nums font-mono">{evaluator.completed}/{totalPerEvaluator}</span>
              </td>
              <td class="px-5 py-3.5 text-right">
                <span class="text-sm font-semibold tabular-nums {pct === 100 ? 'text-emerald-500' : pct > 50 ? 'text-accent-600' : 'text-surface-500'}">
                  {pct}%
                </span>
              </td>
              <td class="px-5 py-3.5 text-right">
                {#if evaluator.completed > 0}
                  <span class="text-sm font-mono tabular-nums text-surface-300">{evaluator.meanScore.toFixed(2)}</span>
                  <span class="text-xs text-surface-600 ml-1">±{evaluator.stdDev.toFixed(1)}</span>
                {:else}
                  <span class="text-sm text-surface-600">—</span>
                {/if}
              </td>
              <td class="px-5 py-3.5 text-center">
                {#if evaluator.completed > 0}
                  <span class="text-xs font-medium px-2 py-0.5 rounded {bl.class}">{bl.text}</span>
                {:else}
                  <span class="text-xs text-surface-600">—</span>
                {/if}
              </td>
              <td class="px-5 py-3.5 text-right">
                <div class="flex flex-col items-end">
                  <span class="text-xs text-surface-500 font-mono">{formatDate(evaluator.lastActivity)}</span>
                  {#if evaluator.lastActivity}
                    <span class="text-xs text-surface-600">{timeSince(evaluator.lastActivity)}</span>
                  {/if}
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <div class="px-5 py-12 text-center text-surface-500 font-serif italic">
      No hay evaluadores registrados
    </div>
  {/if}
</div>
