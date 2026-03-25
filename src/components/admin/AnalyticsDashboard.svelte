<script lang="ts">
  import { onMount } from 'svelte';
  import { validateEvaluatorKey, getAllEvaluations, getAllEvaluators } from '../../lib/supabase';
  import { countTotalEvaluations } from '../../lib/responses';
  import { computeAnalytics, type AnalyticsData, type ModelStats } from '../../lib/analytics';
  import type { ResponsesData } from '../../lib/types';

  import KPICards from './KPICards.svelte';
  import ModelLeaderboard from './ModelLeaderboard.svelte';
  import QuestionPerformance from './QuestionPerformance.svelte';
  import ScoreDistribution from './ScoreDistribution.svelte';
  import ResponseTimeAnalysis from './ResponseTimeAnalysis.svelte';
  import InterRaterReliability from './InterRaterReliability.svelte';
  import ImageDifficulty from './ImageDifficulty.svelte';
  import EvaluatorActivity from './EvaluatorActivity.svelte';
  import ModelDrilldown from './ModelDrilldown.svelte';

  let loading = $state(true);
  let authorized = $state(false);
  let error = $state('');
  let analyticsData: AnalyticsData | null = $state(null);
  let totalPerEvaluator = $state(0);

  // Tab state
  type Tab = 'resumen' | 'modelos' | 'fiabilidad' | 'evaluadores';
  let activeTab: Tab = $state('resumen');

  // Drilldown state
  let selectedModel: ModelStats | null = $state(null);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'resumen', label: 'Resumen', icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z' },
    { id: 'modelos', label: 'Modelos', icon: 'M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z' },
    { id: 'fiabilidad', label: 'Fiabilidad', icon: 'M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z' },
    { id: 'evaluadores', label: 'Evaluadores', icon: 'M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z' },
  ];

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

    try {
      const [responsesRes, allEvals, allEvs] = await Promise.all([
        fetch('/api/responses').then(r => r.json()) as Promise<ResponsesData>,
        getAllEvaluations(),
        getAllEvaluators(),
      ]);

      totalPerEvaluator = countTotalEvaluations(responsesRes);

      const evaluatorNames: Record<string, string> = {};
      for (const ev of allEvs) {
        evaluatorNames[ev.id] = ev.name;
      }

      analyticsData = computeAnalytics(responsesRes, allEvals, evaluatorNames);
    } catch (e) {
      error = 'Error al cargar los datos de análisis';
      console.error(e);
    }

    loading = false;
  });

  function handleSelectModel(model: ModelStats) {
    selectedModel = model;
  }

  function handleCloseDrilldown() {
    selectedModel = null;
  }
</script>

{#if loading}
  <div class="flex items-center justify-center min-h-screen">
    <div class="flex flex-col items-center gap-3">
      <div class="w-6 h-6 border-2 border-accent-600 border-t-transparent rounded-full animate-spin"></div>
      <span class="text-surface-500 text-sm font-serif italic">Calculando métricas...</span>
    </div>
  </div>
{:else if error}
  <div class="flex items-center justify-center min-h-screen">
    <div class="bg-red-50 border border-red-200 rounded-lg px-6 py-4 text-red-700 text-sm">{error}</div>
  </div>
{:else if authorized && analyticsData}
  <div class="min-h-screen bg-surface-950">

    <!-- Header -->
    <header class="sticky top-0 z-30 bg-surface-900/95 backdrop-blur-sm border-b border-surface-700">
      <div class="max-w-7xl mx-auto px-6">
        <div class="h-14 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <a href="/dashboard" class="text-surface-500 hover:text-surface-300 transition-colors">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </a>
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-accent-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <h1 class="font-serif text-[15px] font-semibold text-surface-100 tracking-tight">Panel de Análisis</h1>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <span class="text-xs text-surface-500 tabular-nums hidden sm:inline">
              {analyticsData.totalEvaluations} evaluaciones · {analyticsData.models.length} modelos · {analyticsData.images.length} imágenes
            </span>
          </div>
        </div>

        <!-- Tabs -->
        <nav class="flex gap-0 -mb-px">
          {#each tabs as tab}
            <button
              onclick={() => activeTab = tab.id}
              class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer
                {activeTab === tab.id
                  ? 'border-accent-600 text-accent-600'
                  : 'border-transparent text-surface-500 hover:text-surface-300 hover:border-surface-600'}"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round" d={tab.icon} />
              </svg>
              <span class="hidden sm:inline">{tab.label}</span>
            </button>
          {/each}
        </nav>
      </div>
    </header>

    <!-- Content -->
    <main class="max-w-7xl mx-auto px-6 py-8 space-y-6">

      {#if activeTab === 'resumen'}
        <KPICards data={analyticsData} />

        <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div class="xl:col-span-2">
            <ModelLeaderboard models={analyticsData.models} onSelectModel={handleSelectModel} />
          </div>
          <div>
            <QuestionPerformance data={analyticsData} />
          </div>
        </div>

      {:else if activeTab === 'modelos'}
        <QuestionPerformance data={analyticsData} />
        <ScoreDistribution data={analyticsData} />
        <ResponseTimeAnalysis data={analyticsData} />
        <ModelLeaderboard models={analyticsData.models} onSelectModel={handleSelectModel} />

      {:else if activeTab === 'fiabilidad'}
        <InterRaterReliability data={analyticsData} />
        <ImageDifficulty data={analyticsData} />

      {:else if activeTab === 'evaluadores'}
        <EvaluatorActivity data={analyticsData} totalPerEvaluator={totalPerEvaluator} />
      {/if}

    </main>
  </div>

  <!-- Model drilldown overlay -->
  {#if selectedModel}
    <ModelDrilldown model={selectedModel} data={analyticsData} onClose={handleCloseDrilldown} />
  {/if}
{/if}
