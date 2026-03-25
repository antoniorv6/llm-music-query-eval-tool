<script lang="ts">
  import type { AnalyticsData } from '../../lib/analytics';

  interface Props {
    data: AnalyticsData;
  }

  let { data }: Props = $props();

  const kpis = $derived([
    {
      label: 'Accuracy binaria',
      value: data.totalEvaluations > 0 ? `${(data.globalBinaryAccuracy * 100).toFixed(1)}%` : '—',
      sublabel: `${data.models.reduce((s, m) => s + m.binaryCorrect, 0)} / ${data.models.reduce((s, m) => s + m.binaryTotal, 0)} correctas`,
      color: 'accent',
    },
    {
      label: 'Score medio ranking',
      value: data.totalEvaluations > 0 ? data.globalMeanRanking.toFixed(2) : '—',
      sublabel: `de 5.00 posibles`,
      color: 'amber',
    },
    {
      label: 'Evaluaciones totales',
      value: data.totalEvaluations.toLocaleString('es-ES'),
      sublabel: `${data.evaluators.length} evaluador${data.evaluators.length !== 1 ? 'es' : ''}`,
      color: 'emerald',
    },
    {
      label: 'Alpha de Krippendorff',
      value: data.evaluators.length >= 2 ? data.interRater.krippendorffAlpha.toFixed(3) : '—',
      sublabel: alphaInterpretation(data.interRater.krippendorffAlpha, data.evaluators.length),
      color: 'violet',
    },
  ]);

  function alphaInterpretation(alpha: number, nEvaluators: number): string {
    if (nEvaluators < 2) return 'Requiere 2+ evaluadores';
    if (alpha >= 0.8) return 'Fiabilidad excelente';
    if (alpha >= 0.667) return 'Fiabilidad aceptable';
    if (alpha >= 0.4) return 'Fiabilidad moderada';
    return 'Fiabilidad baja';
  }

  const colorMap: Record<string, { bg: string; border: string; text: string; dot: string }> = {
    accent: { bg: 'bg-accent-50', border: 'border-accent-200', text: 'text-accent-700', dot: 'bg-accent-500' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    violet: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', dot: 'bg-violet-500' },
  };
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {#each kpis as kpi}
    {@const c = colorMap[kpi.color] || colorMap.accent}
    <div class="bg-surface-900 border border-surface-700 rounded-lg p-5 card-elevated">
      <div class="flex items-center gap-2 mb-3">
        <span class="w-1.5 h-1.5 rounded-full {c.dot}"></span>
        <span class="text-xs font-medium text-surface-500 uppercase tracking-widest">{kpi.label}</span>
      </div>
      <div class="font-serif text-3xl font-semibold text-surface-100 tabular-nums leading-none">
        {kpi.value}
      </div>
      <p class="text-xs text-surface-500 mt-2">{kpi.sublabel}</p>
    </div>
  {/each}
</div>
