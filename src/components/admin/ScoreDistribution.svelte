<script lang="ts">
  import type { AnalyticsData } from '../../lib/analytics';
  import { shortModelName } from '../../lib/analytics';
  import ChartCanvas from './ChartCanvas.svelte';

  interface Props {
    data: AnalyticsData;
  }

  let { data }: Props = $props();

  const modelColors = [
    { bg: 'rgba(79, 70, 229, 0.5)', border: '#4F46E5' },
    { bg: 'rgba(245, 158, 11, 0.5)', border: '#F59E0B' },
    { bg: 'rgba(16, 185, 129, 0.5)', border: '#10B981' },
    { bg: 'rgba(239, 68, 68, 0.5)', border: '#EF4444' },
    { bg: 'rgba(139, 92, 246, 0.5)', border: '#8B5CF6' },
    { bg: 'rgba(6, 182, 212, 0.5)', border: '#06B6D4' },
    { bg: 'rgba(244, 63, 94, 0.5)', border: '#F43F5E' },
    { bg: 'rgba(34, 197, 94, 0.5)', border: '#22C55E' },
  ];

  // Ranking score distribution (0-5 buckets)
  const rankingChartData = $derived(() => {
    const labels = ['0', '1', '2', '3', '4', '5'];
    const datasets = data.models.map((model, i) => {
      const color = modelColors[i % modelColors.length];
      const buckets = new Array(6).fill(0);
      for (const score of model.rankingScores) {
        const bucket = Math.min(5, Math.max(0, Math.round(score)));
        buckets[bucket]++;
      }
      return {
        label: model.shortName,
        data: buckets,
        backgroundColor: color.bg,
        borderColor: color.border,
        borderWidth: 1.5,
        borderRadius: 3,
      };
    });
    return { labels, datasets };
  });

  const rankingOptions = {
    plugins: {
      legend: { position: 'bottom' as const },
      title: { display: true, text: 'Distribución de scores ranking (0-5)', color: '#334155', font: { size: 13, family: "'Crimson Pro', serif" } },
    },
    scales: {
      x: { title: { display: true, text: 'Score', color: '#64748B', font: { size: 11 } } },
      y: { beginAtZero: true, title: { display: true, text: 'Frecuencia', color: '#64748B', font: { size: 11 } } },
    },
  };

  // Binary accuracy (stacked bar)
  const binaryChartData = $derived(() => {
    const labels = data.models.map(m => m.shortName);
    return {
      labels,
      datasets: [
        {
          label: 'Correcto',
          data: data.models.map(m => m.binaryCorrect),
          backgroundColor: 'rgba(16, 185, 129, 0.6)',
          borderColor: '#10B981',
          borderWidth: 1.5,
          borderRadius: 3,
        },
        {
          label: 'Incorrecto',
          data: data.models.map(m => m.binaryTotal - m.binaryCorrect),
          backgroundColor: 'rgba(239, 68, 68, 0.5)',
          borderColor: '#EF4444',
          borderWidth: 1.5,
          borderRadius: 3,
        },
      ],
    };
  });

  const binaryOptions = {
    plugins: {
      legend: { position: 'bottom' as const },
      title: { display: true, text: 'Evaluaciones binarias: Correcto vs Incorrecto', color: '#334155', font: { size: 13, family: "'Crimson Pro', serif" } },
    },
    scales: {
      x: { stacked: true },
      y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Cantidad', color: '#64748B', font: { size: 11 } } },
    },
  };
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
  <!-- Ranking distribution -->
  <div class="bg-surface-900 border border-surface-700 rounded-lg overflow-hidden card-elevated">
    <div class="p-5">
      {#if data.models.some(m => m.rankingScores.length > 0)}
        <ChartCanvas type="bar" data={rankingChartData()} options={rankingOptions} height="280px" />
      {:else}
        <div class="py-12 text-center text-surface-500 font-serif italic">Sin datos de ranking</div>
      {/if}
    </div>
  </div>

  <!-- Binary accuracy -->
  <div class="bg-surface-900 border border-surface-700 rounded-lg overflow-hidden card-elevated">
    <div class="p-5">
      {#if data.models.some(m => m.binaryTotal > 0)}
        <ChartCanvas type="bar" data={binaryChartData()} options={binaryOptions} height="280px" />
      {:else}
        <div class="py-12 text-center text-surface-500 font-serif italic">Sin datos binarios</div>
      {/if}
    </div>
  </div>
</div>
