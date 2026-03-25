<script lang="ts">
  import { onMount } from 'svelte';
  import { currentEvaluator, evaluations, responsesData } from '../lib/stores';
  import { validateEvaluatorKey, getEvaluations } from '../lib/supabase';
  import { countTotalEvaluations, getImageList, countImageEvaluations } from '../lib/responses';
  import ProgressBar from './ProgressBar.svelte';
  import type { ResponsesData, Evaluator, Evaluation } from '../lib/types';

  let loading = $state(true);
  let evalData: Evaluator | null = $state(null);
  let responses: ResponsesData | null = $state(null);
  let userEvaluations: Evaluation[] = $state([]);

  let totalRequired = $derived(responses ? countTotalEvaluations(responses) : 0);
  let totalCompleted = $derived(userEvaluations.length);
  let images = $derived(responses ? getImageList(responses) : []);
  let percentage = $derived(totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : 0);

  let countDone = $derived(images.filter((img) => getImageStatus(img) === 'done').length);
  let countPartial = $derived(images.filter((img) => getImageStatus(img) === 'partial').length);
  let countNone = $derived(images.filter((img) => getImageStatus(img) === 'none').length);

  function getImageProgress(imageFilename: string): { completed: number; total: number } {
    if (!responses) return { completed: 0, total: 0 };
    const total = countImageEvaluations(responses, imageFilename);
    const completed = userEvaluations.filter((e) => e.image_filename === imageFilename).length;
    return { completed, total };
  }

  function getImageStatus(imageFilename: string): 'none' | 'partial' | 'done' {
    const { completed, total } = getImageProgress(imageFilename);
    if (completed === 0) return 'none';
    if (completed >= total) return 'done';
    return 'partial';
  }

  let firstIncomplete = $derived(
    images.find((img) => getImageStatus(img) !== 'done') || null
  );

  onMount(async () => {
    const key = localStorage.getItem('evaluator_key');
    if (!key) { window.location.href = '/login'; return; }

    const evaluator = await validateEvaluatorKey(key);
    if (!evaluator) {
      localStorage.removeItem('evaluator_key');
      window.location.href = '/login';
      return;
    }

    evalData = evaluator;
    currentEvaluator.set(evaluator);

    const [responsesRes, evals] = await Promise.all([
      fetch('/api/responses').then((r) => r.json()),
      getEvaluations(evaluator.id),
    ]);

    responses = responsesRes as ResponsesData;
    responsesData.set(responses);
    userEvaluations = evals;
    evaluations.set(evals);
    loading = false;
  });

  function handleLogout() {
    localStorage.removeItem('evaluator_key');
    currentEvaluator.set(null);
    window.location.href = '/login';
  }
</script>

{#if loading}
  <div class="flex items-center justify-center min-h-screen bg-surface-950">
    <div class="text-surface-400 text-sm font-serif italic">Cargando...</div>
  </div>
{:else if evalData && responses}
  <div class="min-h-screen bg-surface-950">

    <!-- ── Header ──────────────────────────────────────────── -->
    <header class="sticky top-0 z-20 bg-surface-900/95 backdrop-blur-sm border-b border-surface-700">
      <div class="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <!-- Logo -->
        <div class="flex items-center gap-2.5">
          <svg class="w-4 h-4 text-accent-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <span class="font-serif text-[15px] font-semibold text-surface-100 tracking-tight">Music LLM Eval</span>
        </div>

        <!-- Right side -->
        <div class="flex items-center gap-5">
          <span class="text-sm text-surface-400 hidden sm:inline">{evalData.name}</span>
          {#if evalData.is_admin}
            <a href="/admin"
               class="text-xs text-accent-600 hover:text-accent-500 font-medium uppercase tracking-widest transition-colors">
              Admin
            </a>
          {/if}
          <button
            onclick={handleLogout}
            class="text-xs text-surface-500 hover:text-surface-300 cursor-pointer uppercase tracking-widest transition-colors">
            Salir
          </button>
        </div>
      </div>
    </header>

    <!-- ── Main ────────────────────────────────────────────── -->
    <main class="max-w-6xl mx-auto px-6 py-10">

      <!-- ── Hero de progreso ─────────────────────────────── -->
      <div class="bg-surface-900 border border-surface-700 rounded-xl overflow-hidden card-elevated mb-10">
        <div class="p-7 flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-10">

          <!-- Porcentaje grande -->
          <div class="shrink-0">
            <div class="font-serif text-6xl font-semibold text-surface-100 leading-none tabular-nums">
              {percentage}<span class="text-3xl text-surface-400 ml-1">%</span>
            </div>
            <p class="text-sm text-surface-500 mt-2">
              {totalCompleted} de {totalRequired} evaluaciones
            </p>
          </div>

          <!-- Separador vertical -->
          <div class="hidden sm:block w-px self-stretch bg-surface-700"></div>

          <!-- Stats por imagen -->
          <div class="flex flex-col justify-center gap-2.5 flex-1">
            <div class="flex items-center gap-2.5">
              <span class="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
              <span class="text-sm text-surface-300">
                <span class="font-medium tabular-nums text-surface-100">{countDone}</span>
                {countDone === 1 ? 'partitura completa' : 'partituras completas'}
              </span>
            </div>
            <div class="flex items-center gap-2.5">
              <span class="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
              <span class="text-sm text-surface-300">
                <span class="font-medium tabular-nums text-surface-100">{countPartial}</span>
                en progreso
              </span>
            </div>
            <div class="flex items-center gap-2.5">
              <span class="w-2 h-2 rounded-full bg-surface-600 shrink-0"></span>
              <span class="text-sm text-surface-300">
                <span class="font-medium tabular-nums text-surface-100">{countNone}</span>
                sin empezar
              </span>
            </div>
          </div>

          <!-- CTA -->
          <div class="flex items-center sm:ml-auto">
            {#if firstIncomplete}
              <a
                href="/evaluate/{encodeURIComponent(firstIncomplete)}"
                class="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-600 hover:bg-accent-700 text-white text-sm font-semibold rounded-lg cursor-pointer transition-colors"
              >
                Continuar
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </a>
            {:else}
              <div class="inline-flex items-center gap-2 px-5 py-2.5 bg-green-500/10 border border-green-500/25 text-green-600 text-sm font-semibold rounded-lg">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                Completado
              </div>
            {/if}
          </div>
        </div>

        <!-- Barra de progreso full-width en el pie de la card -->
        <div class="h-1 bg-surface-800">
          <div
            class="h-1 transition-all duration-500 {percentage === 100 ? 'bg-green-500' : 'bg-accent-600'}"
            style="width: {percentage}%"
          ></div>
        </div>
      </div>

      <!-- ── Cabecera de la cuadrícula ────────────────────── -->
      <div class="flex items-center gap-3 mb-5">
        <h2 class="font-serif text-lg font-semibold text-surface-200 shrink-0">Partituras</h2>
        <span class="text-surface-600 text-sm tabular-nums shrink-0">({images.length})</span>
        <div class="flex-1 h-px bg-surface-700"></div>
      </div>

      <!-- ── Grid de imágenes ─────────────────────────────── -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {#each images as imageFilename}
          {@const progress = getImageProgress(imageFilename)}
          {@const status = getImageStatus(imageFilename)}
          <a
            href="/evaluate/{encodeURIComponent(imageFilename)}"
            class="group relative bg-surface-900 rounded-lg border overflow-hidden transition-all duration-200 card-elevated
              {status === 'done'
                ? 'border-green-500/30 hover:border-green-500/60'
                : status === 'partial'
                  ? 'border-amber-400/30 hover:border-amber-400/60'
                  : 'border-surface-700 hover:border-accent-600/40'}"
          >
            <!-- Thumbnail -->
            <div class="aspect-[4/3] bg-surface-850 overflow-hidden flex items-center justify-center p-3">
              <img
                src="/api/images/{imageFilename}"
                alt={imageFilename}
                class="max-w-full max-h-full object-contain transition-opacity duration-200
                  {status === 'done' ? 'opacity-70 group-hover:opacity-90' : 'opacity-85 group-hover:opacity-100'}"
                loading="lazy"
              />
            </div>

            <!-- Info footer -->
            <div class="px-3.5 py-3 border-t
              {status === 'done'
                ? 'border-green-500/20 bg-green-500/[0.03]'
                : status === 'partial'
                  ? 'border-amber-400/20 bg-amber-400/[0.03]'
                  : 'border-surface-700'}">
              <div class="flex items-center justify-between gap-2 mb-2">
                <span class="text-xs font-mono text-surface-500 truncate leading-tight">
                  {imageFilename}
                </span>
                {#if status === 'done'}
                  <div class="shrink-0 flex items-center gap-1">
                    <svg class="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    <span class="text-xs font-medium text-green-500">Completa</span>
                  </div>
                {:else if status === 'partial'}
                  <span class="shrink-0 text-xs font-medium text-amber-500">
                    {progress.completed}/{progress.total}
                  </span>
                {:else}
                  <span class="shrink-0 text-xs text-surface-600">—</span>
                {/if}
              </div>

              <!-- Progress track -->
              <div class="w-full h-1 bg-surface-800 rounded-full overflow-hidden">
                <div
                  class="h-1 rounded-full transition-all duration-300
                    {status === 'done' ? 'bg-green-500' : 'bg-accent-600'}"
                  style="width: {progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0}%"
                ></div>
              </div>
            </div>
          </a>
        {/each}
      </div>

    </main>
  </div>
{/if}
