<script lang="ts">
  import type { AnalyticsData } from '../../lib/analytics';

  interface Props {
    data: AnalyticsData;
  }

  let { data }: Props = $props();

  const questionLabels: Record<string, string> = {
    '1': 'Q1: Notación',
    '2': 'Q2: Tonalidad',
    '3': 'Q3: Instrumento',
  };

  const typeLabels: Record<string, string> = {
    binary: 'Binaria',
    ranking: 'Ranking',
  };

  function alphaColor(alpha: number): string {
    if (alpha >= 0.8) return 'text-emerald-600';
    if (alpha >= 0.667) return 'text-accent-600';
    if (alpha >= 0.4) return 'text-amber-600';
    return 'text-red-500';
  }

  function alphaBg(alpha: number): string {
    if (alpha >= 0.8) return 'bg-emerald-100';
    if (alpha >= 0.667) return 'bg-accent-100';
    if (alpha >= 0.4) return 'bg-amber-100';
    return 'bg-red-100';
  }

  function agreementColor(agreement: number): string {
    if (agreement >= 0.8) return 'bg-emerald-500';
    if (agreement >= 0.6) return 'bg-emerald-400';
    if (agreement >= 0.4) return 'bg-amber-400';
    if (agreement >= 0.2) return 'bg-amber-500';
    return 'bg-red-400';
  }

  function agreementOpacity(agreement: number): string {
    return `opacity: ${0.3 + agreement * 0.7}`;
  }

  // Build evaluator pair matrix
  const evaluatorNames = $derived(
    [...new Set(data.interRater.pairwiseAgreement.flatMap(p => [p.evaluator1, p.evaluator2]))]
      .map(id => {
        const ev = data.evaluators.find(e => e.id === id);
        return { id, name: ev?.name || id.slice(0, 8) };
      })
  );

  const insufficientData = $derived(data.evaluators.length < 2);
</script>

<div class="space-y-4">
  <!-- Alpha overview -->
  <div class="bg-surface-900 border border-surface-700 rounded-lg overflow-hidden card-elevated">
    <div class="px-5 py-4 border-b border-surface-700/50">
      <h3 class="font-serif text-base font-semibold text-surface-100">Fiabilidad Inter-Evaluador</h3>
      <p class="text-xs text-surface-500 mt-1">Alpha de Krippendorff — concordancia entre evaluadores</p>
    </div>

    {#if insufficientData}
      <div class="px-5 py-12 text-center text-surface-500 font-serif italic">
        Se necesitan al menos 2 evaluadores para calcular la fiabilidad inter-evaluador
      </div>
    {:else}
      <div class="p-5">
        <!-- Global alpha -->
        <div class="flex items-center gap-4 mb-6">
          <div class="flex-1">
            <span class="text-xs text-surface-500 uppercase tracking-widest">Alpha global</span>
            <div class="flex items-baseline gap-2 mt-1">
              <span class="font-serif text-4xl font-semibold tabular-nums {alphaColor(data.interRater.krippendorffAlpha)}">
                {data.interRater.krippendorffAlpha.toFixed(3)}
              </span>
              <span class="text-sm {alphaBg(data.interRater.krippendorffAlpha)} {alphaColor(data.interRater.krippendorffAlpha)} px-2 py-0.5 rounded font-medium">
                {#if data.interRater.krippendorffAlpha >= 0.8}Excelente
                {:else if data.interRater.krippendorffAlpha >= 0.667}Aceptable
                {:else if data.interRater.krippendorffAlpha >= 0.4}Moderada
                {:else}Baja{/if}
              </span>
            </div>
          </div>

          <!-- Scale reference -->
          <div class="text-xs text-surface-500 space-y-1 border-l border-surface-700 pl-4">
            <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> ≥ 0.80 Excelente</div>
            <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-accent-500"></span> ≥ 0.67 Aceptable</div>
            <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-amber-500"></span> ≥ 0.40 Moderada</div>
            <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-red-400"></span> &lt; 0.40 Baja</div>
          </div>
        </div>

        <!-- Per-question and per-type alpha -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Per question -->
          <div>
            <span class="text-xs text-surface-500 uppercase tracking-widest block mb-2">Por pregunta</span>
            <div class="space-y-2">
              {#each Object.entries(data.interRater.alphaPerQuestion) as [qId, alpha]}
                <div class="flex items-center justify-between bg-surface-850 rounded px-3 py-2">
                  <span class="text-sm text-surface-300">{questionLabels[qId] || `Q${qId}`}</span>
                  <span class="text-sm font-mono font-semibold tabular-nums {alphaColor(alpha)}">{alpha.toFixed(3)}</span>
                </div>
              {/each}
            </div>
          </div>

          <!-- Per type -->
          <div>
            <span class="text-xs text-surface-500 uppercase tracking-widest block mb-2">Por tipo de pregunta</span>
            <div class="space-y-2">
              {#each Object.entries(data.interRater.alphaPerQuestionType) as [type, alpha]}
                <div class="flex items-center justify-between bg-surface-850 rounded px-3 py-2">
                  <span class="text-sm text-surface-300">{typeLabels[type] || type}</span>
                  <span class="text-sm font-mono font-semibold tabular-nums {alphaColor(alpha)}">{alpha.toFixed(3)}</span>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Pairwise agreement heatmap -->
  {#if !insufficientData && evaluatorNames.length > 1}
    <div class="bg-surface-900 border border-surface-700 rounded-lg overflow-hidden card-elevated">
      <div class="px-5 py-4 border-b border-surface-700/50">
        <h3 class="font-serif text-base font-semibold text-surface-100">Concordancia por Pares</h3>
        <p class="text-xs text-surface-500 mt-1">Porcentaje de acuerdo exacto entre evaluadores</p>
      </div>

      <div class="p-5 overflow-x-auto">
        <table class="mx-auto">
          <thead>
            <tr>
              <th class="px-2 py-1"></th>
              {#each evaluatorNames as ev}
                <th class="px-2 py-1 text-xs text-surface-500 font-medium text-center truncate max-w-[80px]">{ev.name}</th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each evaluatorNames as row}
              <tr>
                <td class="px-2 py-1 text-xs text-surface-500 font-medium truncate max-w-[80px]">{row.name}</td>
                {#each evaluatorNames as col}
                  {#if row.id === col.id}
                    <td class="px-1 py-1">
                      <div class="w-12 h-10 bg-surface-800 rounded flex items-center justify-center text-xs text-surface-600">—</div>
                    </td>
                  {:else}
                    {@const pair = data.interRater.pairwiseAgreement.find(
                      p => (p.evaluator1 === row.id && p.evaluator2 === col.id) ||
                           (p.evaluator1 === col.id && p.evaluator2 === row.id)
                    )}
                    {@const agreement = pair?.agreement ?? 0}
                    <td class="px-1 py-1">
                      <div class="w-12 h-10 rounded flex items-center justify-center text-xs font-mono font-semibold text-white {agreementColor(agreement)}"
                           style={agreementOpacity(agreement)}>
                        {(agreement * 100).toFixed(0)}%
                      </div>
                    </td>
                  {/if}
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}

  <!-- Evaluator bias detection -->
  {#if data.evaluators.length > 0}
    <div class="bg-surface-900 border border-surface-700 rounded-lg overflow-hidden card-elevated">
      <div class="px-5 py-4 border-b border-surface-700/50">
        <h3 class="font-serif text-base font-semibold text-surface-100">Detección de Sesgo</h3>
        <p class="text-xs text-surface-500 mt-1">Desviación de cada evaluador respecto a la media global</p>
      </div>

      <div class="p-5 space-y-3">
        {#each data.evaluators as evaluator}
          {@const bias = evaluator.bias}
          {@const absBias = Math.abs(bias)}
          {@const biasColor = absBias < 0.3 ? 'text-emerald-600' : absBias < 0.7 ? 'text-amber-600' : 'text-red-500'}
          {@const barColor = bias >= 0 ? 'bg-accent-500' : 'bg-amber-500'}
          <div class="flex items-center gap-3">
            <span class="text-sm text-surface-300 w-28 truncate shrink-0">{evaluator.name}</span>
            <div class="flex-1 flex items-center gap-2">
              <!-- Centered bar -->
              <div class="flex-1 h-3 bg-surface-800 rounded-full relative overflow-hidden">
                {#if bias >= 0}
                  <div class="absolute left-1/2 h-full {barColor} rounded-r-full"
                       style="width: {Math.min(absBias / 2 * 100, 50)}%"></div>
                {:else}
                  <div class="absolute right-1/2 h-full {barColor} rounded-l-full"
                       style="width: {Math.min(absBias / 2 * 100, 50)}%"></div>
                {/if}
                <div class="absolute left-1/2 top-0 bottom-0 w-px bg-surface-600"></div>
              </div>
              <span class="text-xs font-mono tabular-nums w-14 text-right {biasColor}">
                {bias >= 0 ? '+' : ''}{bias.toFixed(2)}
              </span>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
