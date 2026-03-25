<script lang="ts">
  import type { AnalyticsData } from '../../lib/analytics';
  import ChartCanvas from './ChartCanvas.svelte';

  interface Props {
    data: AnalyticsData;
  }

  let { data }: Props = $props();

  const modelColors = ['#4F46E5', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#06B6D4', '#F43F5E', '#22C55E'];

  // Bar chart: avg response time
  const barData = $derived(() => ({
    labels: data.models.map(m => m.shortName),
    datasets: [{
      label: 'Tiempo medio de respuesta (s)',
      data: data.models.map(m => m.avgResponseTime),
      backgroundColor: data.models.map((_, i) => `${modelColors[i % modelColors.length]}99`),
      borderColor: data.models.map((_, i) => modelColors[i % modelColors.length]),
      borderWidth: 1.5,
      borderRadius: 4,
    }],
  }));

  const barOptions = {
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Tiempo medio de respuesta por modelo',
        color: '#334155',
        font: { size: 13, family: "'Crimson Pro', serif" },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Segundos', color: '#64748B', font: { size: 11 } },
      },
    },
  };

  // Scatter: response time vs quality
  const scatterData = $derived(() => ({
    datasets: data.models.map((model, i) => {
      // Build points: for each question, response time + mean score
      const points: { x: number; y: number }[] = [];
      for (const [qId, qs] of Object.entries(model.questionStats)) {
        if (qs.type === 'ranking' && qs.scores.length > 0) {
          // Find matching response time
          const timeIdx = model.responseTimes.length > 0 ? i : 0;
          points.push({ x: model.avgResponseTime, y: qs.mean });
        }
      }
      // If no per-question data, use overall
      if (points.length === 0 && model.meanRankingScore > 0) {
        points.push({ x: model.avgResponseTime, y: model.meanRankingScore });
      }
      return {
        label: model.shortName,
        data: points,
        backgroundColor: `${modelColors[i % modelColors.length]}AA`,
        borderColor: modelColors[i % modelColors.length],
        borderWidth: 2,
        pointRadius: 8,
        pointHoverRadius: 10,
      };
    }),
  }));

  const scatterOptions = {
    plugins: {
      legend: { position: 'bottom' as const },
      title: {
        display: true,
        text: 'Tiempo de respuesta vs Calidad (ranking)',
        color: '#334155',
        font: { size: 13, family: "'Crimson Pro', serif" },
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ${ctx.raw.x.toFixed(1)}s → ${ctx.raw.y.toFixed(2)}/5`,
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Tiempo (s)', color: '#64748B', font: { size: 11 } },
        beginAtZero: true,
      },
      y: {
        title: { display: true, text: 'Score medio', color: '#64748B', font: { size: 11 } },
        min: 0,
        max: 5,
      },
    },
  };
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
  <div class="bg-surface-900 border border-surface-700 rounded-lg overflow-hidden card-elevated">
    <div class="p-5">
      <ChartCanvas type="bar" data={barData()} options={barOptions} height="280px" />
    </div>
  </div>

  <div class="bg-surface-900 border border-surface-700 rounded-lg overflow-hidden card-elevated">
    <div class="p-5">
      <ChartCanvas type="scatter" data={scatterData()} options={scatterOptions} height="280px" />
    </div>
  </div>
</div>
