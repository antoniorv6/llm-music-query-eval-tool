<script lang="ts">
  import type { AnalyticsData } from '../../lib/analytics';
  import { shortModelName } from '../../lib/analytics';
  import ChartCanvas from './ChartCanvas.svelte';

  interface Props {
    data: AnalyticsData;
  }

  let { data }: Props = $props();

  // Color palette for models (up to 8)
  const modelColors = [
    { bg: 'rgba(79, 70, 229, 0.7)', border: '#4F46E5' },   // indigo
    { bg: 'rgba(245, 158, 11, 0.7)', border: '#F59E0B' },   // amber
    { bg: 'rgba(16, 185, 129, 0.7)', border: '#10B981' },    // emerald
    { bg: 'rgba(239, 68, 68, 0.7)', border: '#EF4444' },     // red
    { bg: 'rgba(139, 92, 246, 0.7)', border: '#8B5CF6' },    // violet
    { bg: 'rgba(6, 182, 212, 0.7)', border: '#06B6D4' },     // cyan
    { bg: 'rgba(244, 63, 94, 0.7)', border: '#F43F5E' },     // rose
    { bg: 'rgba(34, 197, 94, 0.7)', border: '#22C55E' },     // green
  ];

  const questionLabels: Record<string, string> = {
    '1': 'Q1: Tipo de notación',
    '2': 'Q2: Tonalidad',
    '3': 'Q3: Instrumento',
  };

  const modelNames = $derived(data.models.map(m => m.modelName));

  const chartData = $derived(() => {
    const labels = data.questions.map(q => questionLabels[q.questionId] || `Q${q.questionId}`);
    const datasets = modelNames.map((modelName, i) => {
      const color = modelColors[i % modelColors.length];
      return {
        label: shortModelName(modelName),
        data: data.questions.map(q => {
          const ms = q.modelStats[modelName];
          if (!ms || ms.scores.length === 0) return 0;
          if (q.type === 'binary') return ms.mean * 100; // percentage
          return ms.mean;
        }),
        backgroundColor: color.bg,
        borderColor: color.border,
        borderWidth: 1.5,
        borderRadius: 4,
      };
    });
    return { labels, datasets };
  });

  const chartOptions = $derived(() => {
    const hasBinaryAndRanking = data.questions.some(q => q.type === 'binary') &&
                                 data.questions.some(q => q.type === 'ranking');
    return {
      plugins: {
        legend: { position: 'bottom' as const },
        tooltip: {
          callbacks: {
            label: (ctx: any) => {
              const q = data.questions[ctx.dataIndex];
              const suffix = q?.type === 'binary' ? '%' : '/5';
              return `${ctx.dataset.label}: ${ctx.raw.toFixed(1)}${suffix}`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: hasBinaryAndRanking ? 'Score (% para binaria, 0-5 para ranking)' : 'Score',
            color: '#64748B',
            font: { size: 11 },
          },
        },
      },
    };
  });
</script>

<div class="bg-surface-900 border border-surface-700 rounded-lg overflow-hidden card-elevated">
  <div class="px-5 py-4 border-b border-surface-700/50">
    <h3 class="font-serif text-base font-semibold text-surface-100">Rendimiento por Pregunta</h3>
    <p class="text-xs text-surface-500 mt-1">Comparativa de modelos en cada tipo de pregunta</p>
  </div>

  <div class="p-5">
    {#if data.totalEvaluations > 0}
      <ChartCanvas type="bar" data={chartData()} options={chartOptions()} height="320px" />
    {:else}
      <div class="py-12 text-center text-surface-500 font-serif italic">
        Sin evaluaciones todavía
      </div>
    {/if}
  </div>

  {#if data.totalEvaluations > 0}
    <div class="px-5 pb-4">
      <div class="flex flex-wrap gap-4 text-xs text-surface-500">
        {#each data.questions as q}
          <span class="flex items-center gap-1.5">
            <span class="inline-block w-2 h-2 rounded-full {q.type === 'binary' ? 'bg-accent-400' : 'bg-amber-400'}"></span>
            {questionLabels[q.questionId] || `Q${q.questionId}`}
            <span class="text-surface-600">({q.type})</span>
          </span>
        {/each}
      </div>
    </div>
  {/if}
</div>
