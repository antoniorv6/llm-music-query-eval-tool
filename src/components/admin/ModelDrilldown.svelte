<script lang="ts">
  import type { ModelStats, AnalyticsData } from '../../lib/analytics';
  import ChartCanvas from './ChartCanvas.svelte';

  interface Props {
    model: ModelStats;
    data: AnalyticsData;
    onClose: () => void;
  }

  let { model, data, onClose }: Props = $props();

  const questionLabels: Record<string, string> = {
    '1': 'Q1: Tipo de notación',
    '2': 'Q2: Tonalidad',
    '3': 'Q3: Instrumento',
  };

  // Per-image scores for this model
  const imageScores = $derived(
    data.images.map(img => ({
      filename: img.imageFilename,
      score: img.modelScores[model.modelName] ?? 0,
      questionScores: Object.entries(img.questionScores).map(([qId, models]) => ({
        questionId: qId,
        label: questionLabels[qId] || `Q${qId}`,
        score: models[model.modelName] ?? 0,
      })),
    })).sort((a, b) => b.score - a.score)
  );

  // Radar chart: score per question type
  const radarData = $derived(() => {
    const labels = Object.entries(model.questionStats).map(([qId]) => questionLabels[qId] || `Q${qId}`);
    const scores = Object.values(model.questionStats).map(qs => qs.mean);
    return {
      labels,
      datasets: [{
        label: model.shortName,
        data: scores,
        backgroundColor: 'rgba(79, 70, 229, 0.2)',
        borderColor: '#4F46E5',
        borderWidth: 2,
        pointBackgroundColor: '#4F46E5',
        pointRadius: 4,
      }],
    };
  });

  const radarOptions = {
    scales: {
      r: {
        beginAtZero: true,
        max: 5,
        ticks: { stepSize: 1, color: '#64748B', font: { size: 10 }, backdropColor: 'transparent' },
        grid: { color: 'rgba(203, 213, 225, 0.3)' },
        pointLabels: { color: '#334155', font: { size: 12 } },
        angleLines: { color: 'rgba(203, 213, 225, 0.3)' },
      },
    },
    plugins: {
      legend: { display: false },
    },
  };

  // Strengths and weaknesses
  const sortedQuestions = $derived(
    Object.entries(model.questionStats)
      .map(([qId, qs]) => ({ qId, label: questionLabels[qId] || `Q${qId}`, ...qs }))
      .sort((a, b) => b.mean - a.mean)
  );

  const bestQuestion = $derived(sortedQuestions[0]);
  const worstQuestion = $derived(sortedQuestions[sortedQuestions.length - 1]);
</script>

<!-- Overlay backdrop -->
<div class="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto"
     onclick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
  <div class="bg-surface-950 border border-surface-700 rounded-xl shadow-2xl w-full max-w-4xl mx-4 card-elevated">

    <!-- Header -->
    <div class="px-6 py-5 border-b border-surface-700 flex items-center justify-between">
      <div>
        <h2 class="font-serif text-xl font-semibold text-surface-100">{model.shortName}</h2>
        <span class="text-sm text-surface-500">{model.provider} — {model.modelName}</span>
      </div>
      <button onclick={onClose}
              class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-850 text-surface-500 hover:text-surface-300 transition-colors cursor-pointer">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Stats grid -->
    <div class="px-6 py-5 grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-surface-700/50">
      <div>
        <span class="text-xs text-surface-500 uppercase tracking-widest">Accuracy</span>
        <div class="text-2xl font-serif font-semibold text-surface-100 tabular-nums mt-1">
          {(model.binaryAccuracy * 100).toFixed(0)}%
        </div>
        <span class="text-xs text-surface-500">{model.binaryCorrect}/{model.binaryTotal}</span>
      </div>
      <div>
        <span class="text-xs text-surface-500 uppercase tracking-widest">Score ranking</span>
        <div class="text-2xl font-serif font-semibold text-surface-100 tabular-nums mt-1">
          {model.meanRankingScore.toFixed(2)}
        </div>
        <span class="text-xs text-surface-500">de 5.00</span>
      </div>
      <div>
        <span class="text-xs text-surface-500 uppercase tracking-widest">Tiempo medio</span>
        <div class="text-2xl font-serif font-semibold text-surface-100 tabular-nums mt-1">
          {model.avgResponseTime.toFixed(1)}s
        </div>
        <span class="text-xs text-surface-500">{model.responseTimes.length} respuestas</span>
      </div>
      <div>
        <span class="text-xs text-surface-500 uppercase tracking-widest">Compuesto</span>
        <div class="text-2xl font-serif font-semibold text-accent-600 tabular-nums mt-1">
          {(model.compositeScore * 100).toFixed(1)}
        </div>
        <span class="text-xs text-surface-500">{model.totalEvaluations} evaluaciones</span>
      </div>
    </div>

    <!-- Content -->
    <div class="p-6 space-y-6">

      <!-- Radar + Strengths -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <!-- Radar -->
        <div>
          <h4 class="text-sm font-medium text-surface-300 mb-3">Perfil por pregunta</h4>
          {#if Object.keys(model.questionStats).length > 0}
            <ChartCanvas type="radar" data={radarData()} options={radarOptions} height="240px" />
          {:else}
            <div class="py-8 text-center text-surface-500 text-sm italic">Sin datos</div>
          {/if}
        </div>

        <!-- Strengths / Weaknesses -->
        <div class="space-y-4">
          <h4 class="text-sm font-medium text-surface-300">Fortalezas y Debilidades</h4>

          {#if bestQuestion}
            <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <div class="flex items-center gap-2 mb-1">
                <svg class="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
                </svg>
                <span class="text-xs font-medium text-emerald-700 uppercase tracking-widest">Mejor rendimiento</span>
              </div>
              <span class="text-sm text-emerald-800 font-medium">{bestQuestion.label}</span>
              <span class="text-sm text-emerald-600 ml-2">— {bestQuestion.mean.toFixed(2)}/5</span>
            </div>
          {/if}

          {#if worstQuestion && worstQuestion.qId !== bestQuestion?.qId}
            <div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div class="flex items-center gap-2 mb-1">
                <svg class="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
                </svg>
                <span class="text-xs font-medium text-amber-700 uppercase tracking-widest">A mejorar</span>
              </div>
              <span class="text-sm text-amber-800 font-medium">{worstQuestion.label}</span>
              <span class="text-sm text-amber-600 ml-2">— {worstQuestion.mean.toFixed(2)}/5</span>
            </div>
          {/if}

          <!-- Per-question breakdown -->
          <div class="space-y-2">
            {#each sortedQuestions as q}
              <div class="flex items-center gap-3">
                <span class="text-xs text-surface-500 w-32 shrink-0">{q.label}</span>
                <div class="flex-1 h-2 bg-surface-800 rounded-full overflow-hidden">
                  <div class="h-full bg-accent-500 rounded-full" style="width: {(q.mean / 5) * 100}%"></div>
                </div>
                <span class="text-xs font-mono tabular-nums text-surface-400 w-10 text-right">{q.mean.toFixed(2)}</span>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Per-image scores -->
      <div>
        <h4 class="text-sm font-medium text-surface-300 mb-3">Scores por Imagen</h4>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-surface-850">
                <th class="text-left px-4 py-2 text-xs font-medium text-surface-500 uppercase tracking-widest">Imagen</th>
                {#each imageScores[0]?.questionScores || [] as qs}
                  <th class="text-center px-3 py-2 text-xs font-medium text-surface-500 uppercase tracking-widest">{qs.label}</th>
                {/each}
                <th class="text-center px-3 py-2 text-xs font-medium text-surface-500 uppercase tracking-widest">Media</th>
              </tr>
            </thead>
            <tbody>
              {#each imageScores as img}
                <tr class="border-b border-surface-700/50">
                  <td class="px-4 py-2">
                    <span class="text-xs font-mono text-surface-400">{img.filename}</span>
                  </td>
                  {#each img.questionScores as qs}
                    <td class="px-3 py-2 text-center">
                      <span class="text-xs font-mono tabular-nums {qs.score >= 4 ? 'text-emerald-600' : qs.score >= 2.5 ? 'text-surface-300' : qs.score > 0 ? 'text-amber-600' : 'text-surface-600'}">
                        {qs.score > 0 ? qs.score.toFixed(1) : '—'}
                      </span>
                    </td>
                  {/each}
                  <td class="px-3 py-2 text-center">
                    <span class="text-xs font-mono font-semibold tabular-nums text-surface-200">
                      {img.score > 0 ? img.score.toFixed(1) : '—'}
                    </span>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</div>
