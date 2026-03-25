<script lang="ts">
  import { onMount } from 'svelte';
  import { validateEvaluatorKey, getAllEvaluatorsProgress } from '../lib/supabase';
  import { countTotalEvaluations } from '../lib/responses';
  import ProgressBar from './ProgressBar.svelte';
  import type { ResponsesData, EvaluatorProgress } from '../lib/types';

  let loading = $state(true);
  let authorized = $state(false);
  let progress: EvaluatorProgress[] = $state([]);
  let totalPerEvaluator = $state(0);

  onMount(async () => {
    const key = localStorage.getItem('evaluator_key');
    if (!key) {
      window.location.href = '/login';
      return;
    }

    const evaluator = await validateEvaluatorKey(key);
    if (!evaluator || !evaluator.is_admin) {
      window.location.href = '/dashboard';
      return;
    }

    authorized = true;

    const responsesRes = await fetch('/api/responses').then((r) => r.json()) as ResponsesData;
    totalPerEvaluator = countTotalEvaluations(responsesRes);

    progress = await getAllEvaluatorsProgress(totalPerEvaluator);
    loading = false;
  });

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
</script>

{#if loading}
  <div class="flex items-center justify-center min-h-screen">
    <div class="text-surface-500 text-base font-serif italic">Cargando panel de admin...</div>
  </div>
{:else if authorized}
  <div class="min-h-screen">
    <!-- Header -->
    <header class="bg-surface-900 border-b border-surface-700">
      <div class="max-w-5xl mx-auto px-6 py-3.5 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <a href="/dashboard" class="text-surface-500 hover:text-surface-300 transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </a>
          <h1 class="font-serif text-base font-semibold text-surface-100">Panel de Administración</h1>
        </div>
        <span class="text-xs text-surface-500 tabular-nums">{totalPerEvaluator} evaluaciones por evaluador</span>
      </div>
    </header>

    <!-- Content -->
    <main class="max-w-5xl mx-auto px-6 py-8">
      <div class="bg-surface-900 rounded-lg border border-surface-700 overflow-hidden card-elevated">
        <table class="w-full">
          <thead>
            <tr class="border-b border-surface-700/50 bg-surface-850">
              <th class="text-left px-6 py-4 text-xs font-medium text-surface-500 uppercase tracking-widest">Evaluador</th>
              <th class="text-left px-6 py-4 text-xs font-medium text-surface-500 uppercase tracking-widest">Progreso</th>
              <th class="text-right px-6 py-4 text-xs font-medium text-surface-500 uppercase tracking-widest">Completadas</th>
              <th class="text-right px-6 py-4 text-xs font-medium text-surface-500 uppercase tracking-widest">%</th>
              <th class="text-right px-6 py-4 text-xs font-medium text-surface-500 uppercase tracking-widest">Última actividad</th>
            </tr>
          </thead>
          <tbody>
            {#each progress as evaluator}
              {@const pct = totalPerEvaluator > 0 ? Math.round((evaluator.completed / evaluator.total) * 100) : 0}
              <tr class="border-b border-surface-700 hover:bg-surface-850 transition-colors">
                <td class="px-6 py-4">
                  <span class="text-sm font-medium text-surface-100">{evaluator.name}</span>
                </td>
                <td class="px-6 py-4 w-64">
                  <ProgressBar completed={evaluator.completed} total={evaluator.total} size="sm" showLabel={false} />
                </td>
                <td class="px-6 py-4 text-right">
                  <span class="text-sm text-surface-400 tabular-nums font-mono">{evaluator.completed}/{evaluator.total}</span>
                </td>
                <td class="px-6 py-4 text-right">
                  <span class="text-sm font-semibold tabular-nums {pct === 100 ? 'text-green-400' : pct > 50 ? 'text-accent-400' : 'text-surface-500'}">
                    {pct}%
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <span class="text-xs text-surface-500 font-mono">{formatDate(evaluator.last_activity)}</span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>

        {#if progress.length === 0}
          <div class="px-6 py-16 text-center text-surface-600 font-serif italic">
            No hay evaluadores registrados
          </div>
        {/if}
      </div>
    </main>
  </div>
{/if}
