<script lang="ts">
  import { onMount } from 'svelte';
  import { currentEvaluator, evaluations } from '../lib/stores';
  import { validateEvaluatorKey, getEvaluations, upsertEvaluation } from '../lib/supabase';
  import { countTotalEvaluations, countImageEvaluations } from '../lib/responses';
  import { isThreadQuestion } from '../lib/types';
  import ImageViewer from './ImageViewer.svelte';
  import QuestionTabs from './QuestionTabs.svelte';
  import GridView from './GridView.svelte';
  import CarouselView from './CarouselView.svelte';
  import ProgressBar from './ProgressBar.svelte';
  import type { ResponsesData, Evaluator, Evaluation, QuestionEntry, SimpleQuestion, ThreadSubQuestion, QuestionType } from '../lib/types';

  interface Props {
    imageFilename: string;
  }

  let { imageFilename }: Props = $props();

  let loading = $state(true);
  let evalData: Evaluator | null = $state(null);
  let responses: ResponsesData | null = $state(null);
  let userEvaluations: Evaluation[] = $state([]);

  /** The main question group id (e.g. "0", "3", "8"). */
  let activeGroupId = $state('');
  /** The effective question id used for evaluation storage.
   *  For simple questions: same as activeGroupId.
   *  For thread sub-questions: the sub id (e.g. "3a", "8b"). */
  let activeQuestionId = $state('');

  let viewMode = $state<'grid' | 'carousel'>('grid');

  // Derived
  let imageQuestions = $derived(responses?.[imageFilename] || {});
  let questionIds = $derived(Object.keys(imageQuestions).sort((a, b) => Number(a) - Number(b)));

  /** Resolve the active entry to the concrete question data to display. */
  let activeQuestionData = $derived((): { question: string; type: QuestionType; respuestas: import('../lib/types').ModelResponse[] } | null => {
    const entry = imageQuestions[activeGroupId];
    if (!entry) return null;
    if (isThreadQuestion(entry)) {
      const sub = entry.thread.find((s) => s.id === activeQuestionId);
      return sub || null;
    }
    return entry as SimpleQuestion;
  });

  let totalGlobal = $derived(responses ? countTotalEvaluations(responses) : 0);
  let completedGlobal = $derived(userEvaluations.length);

  let imageTotal = $derived(responses ? countImageEvaluations(responses, imageFilename) : 0);
  let imageCompleted = $derived(
    userEvaluations.filter((e) => e.image_filename === imageFilename).length
  );

  // Map of evaluations for current active question: modelName -> Evaluation
  let questionEvaluations = $derived(() => {
    const map = new Map<string, Evaluation>();
    for (const ev of userEvaluations) {
      if (ev.image_filename === imageFilename && ev.question_id === activeQuestionId) {
        map.set(ev.model_name, ev);
      }
    }
    return map;
  });

  // Set of question IDs (simple ids + thread sub ids) that are fully evaluated
  let completedQuestions = $derived(() => {
    const set = new Set<string>();
    for (const qId of questionIds) {
      const entry = imageQuestions[qId];
      if (!entry) continue;
      if (isThreadQuestion(entry)) {
        for (const sub of entry.thread) {
          const modelsInSub = sub.respuestas.length;
          const evaluated = userEvaluations.filter(
            (e) => e.image_filename === imageFilename && e.question_id === sub.id
          ).length;
          if (evaluated >= modelsInSub) set.add(sub.id);
        }
      } else {
        const modelsInQuestion = entry.respuestas.length;
        const evaluated = userEvaluations.filter(
          (e) => e.image_filename === imageFilename && e.question_id === qId
        ).length;
        if (evaluated >= modelsInQuestion) set.add(qId);
      }
    }
    return set;
  });

  onMount(async () => {
    const key = localStorage.getItem('evaluator_key');
    if (!key) {
      window.location.href = '/login';
      return;
    }

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
    userEvaluations = evals;
    evaluations.set(evals);

    // Set initial active question
    const qIds = Object.keys(responses[imageFilename] || {}).sort((a, b) => Number(a) - Number(b));
    if (qIds.length > 0) {
      const firstEntry = responses[imageFilename][qIds[0]];
      activeGroupId = qIds[0];
      if (isThreadQuestion(firstEntry)) {
        activeQuestionId = firstEntry.thread[0].id;
      } else {
        activeQuestionId = qIds[0];
      }
    }

    loading = false;
  });

  function handleTabSelect(groupId: string, questionId: string) {
    activeGroupId = groupId;
    activeQuestionId = questionId;
  }

  async function handleScore(modelName: string, score: number) {
    if (!evalData) return;

    const evalObj: Omit<Evaluation, 'id' | 'created_at' | 'updated_at'> = {
      evaluator_id: evalData.id,
      image_filename: imageFilename,
      question_id: activeQuestionId,
      model_name: modelName,
      score,
    };

    // Check if there's an existing comment
    const existing = userEvaluations.find(
      (e) =>
        e.image_filename === imageFilename &&
        e.question_id === activeQuestionId &&
        e.model_name === modelName
    );
    if (existing?.comment) {
      evalObj.comment = existing.comment;
    }

    const success = await upsertEvaluation(evalObj);
    if (success) {
      const idx = userEvaluations.findIndex(
        (e) =>
          e.evaluator_id === evalData!.id &&
          e.image_filename === imageFilename &&
          e.question_id === activeQuestionId &&
          e.model_name === modelName
      );
      const newEval = { ...evalObj } as Evaluation;
      if (idx >= 0) {
        userEvaluations[idx] = { ...userEvaluations[idx], ...newEval };
        userEvaluations = [...userEvaluations];
      } else {
        userEvaluations = [...userEvaluations, newEval];
      }
      evaluations.set(userEvaluations);
    }
  }

  async function handleComment(modelName: string, comment: string) {
    if (!evalData) return;

    const existing = userEvaluations.find(
      (e) =>
        e.image_filename === imageFilename &&
        e.question_id === activeQuestionId &&
        e.model_name === modelName
    );

    // Only save comment if there's already a score
    if (!existing) return;

    const evalObj = {
      evaluator_id: evalData.id,
      image_filename: imageFilename,
      question_id: activeQuestionId,
      model_name: modelName,
      score: existing.score,
      comment,
    };

    const success = await upsertEvaluation(evalObj);
    if (success) {
      const idx = userEvaluations.findIndex(
        (e) =>
          e.evaluator_id === evalData!.id &&
          e.image_filename === imageFilename &&
          e.question_id === activeQuestionId &&
          e.model_name === modelName
      );
      if (idx >= 0) {
        userEvaluations[idx] = { ...userEvaluations[idx], comment };
        userEvaluations = [...userEvaluations];
        evaluations.set(userEvaluations);
      }
    }
  }
</script>

{#if loading}
  <div class="flex items-center justify-center min-h-screen">
    <div class="text-surface-500 text-base font-serif italic">Cargando evaluación...</div>
  </div>
{:else if evalData && responses}
  <div class="flex flex-col min-h-dvh lg:h-dvh">

    <!-- ── Header: full-width ─────────────────────────────── -->
    <header class="shrink-0 bg-surface-900 border-b border-surface-700 z-30">
      <div class="px-5 py-2.5 flex items-center justify-between">
        <div class="flex items-center gap-3 min-w-0">
          <a href="/dashboard"
             class="text-surface-500 hover:text-surface-300 transition-colors shrink-0"
             title="Volver al dashboard">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </a>
          <span class="text-sm font-mono text-accent-700 truncate">{imageFilename}</span>
          <div class="w-24 shrink-0">
            <ProgressBar completed={imageCompleted} total={imageTotal} size="sm" showLabel={false} />
          </div>
          <span class="text-xs text-surface-600 tabular-nums shrink-0">{imageCompleted}/{imageTotal}</span>
        </div>
        <div class="flex items-center gap-4 shrink-0">
          <div class="flex items-center gap-2 text-xs text-surface-600">
            <span class="hidden sm:inline">Global</span>
            <div class="w-16">
              <ProgressBar completed={completedGlobal} total={totalGlobal} size="sm" showLabel={false} />
            </div>
            <span class="tabular-nums">{completedGlobal}/{totalGlobal}</span>
          </div>
          <span class="text-sm font-medium text-surface-400 hidden sm:inline">{evalData.name}</span>
        </div>
      </div>
    </header>

    <!-- ── Cuerpo: dos columnas ───────────────────────────── -->
    <div class="flex flex-col lg:flex-row flex-1 lg:overflow-hidden">

      <!-- ── Columna izquierda: imagen + pregunta + tabs ──── -->
      <aside class="shrink-0 lg:w-[380px] xl:w-[420px] flex flex-col
                    border-b border-surface-700 lg:border-b-0 lg:border-r
                    lg:overflow-hidden bg-surface-900">

        <!-- Imagen (altura fija, siempre visible) -->
        <div class="shrink-0">
          <ImageViewer
            src="/api/images/{imageFilename}"
            alt={imageFilename}
            height="38vh"
          />
        </div>

        <!-- Texto de la pregunta (scrollable si es larga) -->
        <div class="flex-1 lg:overflow-y-auto px-5 pt-5 pb-3">
          {#if activeQuestionData()}
            <div class="bg-surface-850 border border-surface-700 rounded-lg px-4 py-4">
              <!-- Thread breadcrumb when inside a thread -->
              {#if isThreadQuestion(imageQuestions[activeGroupId])}
                <div class="flex items-center gap-1.5 mb-2.5 text-xs text-surface-500">
                  <span class="font-mono font-semibold text-accent-600">P{activeGroupId}</span>
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                  <span class="font-mono font-semibold text-accent-500">{activeQuestionId}</span>
                </div>
              {/if}
              <p class="font-serif text-[15px] text-surface-200 leading-relaxed">{activeQuestionData()!.question}</p>
            </div>
          {/if}
        </div>

        <!-- Tabs de preguntas (siempre visibles, fuera del scroll) -->
        <div class="shrink-0 px-5 py-3 border-t border-surface-700 flex flex-col gap-3">
          <QuestionTabs
            questions={imageQuestions}
            {activeQuestionId}
            {activeGroupId}
            onselect={handleTabSelect}
            completedQuestions={completedQuestions()}
          />

          <!-- Volver (solo visible en el panel izquierdo en desktop) -->
          <div class="hidden lg:block">
            <a href="/dashboard"
               class="text-xs text-surface-500 hover:text-accent-600 transition-colors">
              ← Volver al dashboard
            </a>
          </div>
        </div>
      </aside>

      <!-- ── Columna derecha: respuestas de los modelos ───── -->
      <main class="flex-1 flex flex-col lg:overflow-hidden bg-surface-950">

        <!-- Barra superior derecha: toggle de vista -->
        <div class="shrink-0 bg-surface-900 border-b border-surface-700 px-5 py-2.5 flex items-center justify-between gap-3">
          <span class="text-xs text-surface-500">
            {#if activeQuestionData()}
              {@const aqd = activeQuestionData()!}
              {aqd.respuestas.length} respuestas
              · {aqd.type === 'binary' ? 'Binaria' : aqd.type === 'transcription' ? 'Transcripción 0–5' : 'Ranking 0–5'}
            {/if}
          </span>
          <!-- Toggle grid / enfocado -->
          <div class="flex items-center gap-0.5 bg-surface-800 border border-surface-700 rounded-md p-0.5 shrink-0">
            <button
              onclick={() => { viewMode = 'grid'; }}
              class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors
                {viewMode === 'grid'
                  ? 'bg-accent-600 text-white'
                  : 'text-surface-500 hover:text-surface-300'}"
              title="Vista de cuadrícula — ver todas las respuestas"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
              </svg>
              <span class="hidden sm:inline">Cuadrícula</span>
            </button>
            <button
              onclick={() => { viewMode = 'carousel'; }}
              class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors
                {viewMode === 'carousel'
                  ? 'bg-accent-600 text-white'
                  : 'text-surface-500 hover:text-surface-300'}"
              title="Vista enfocada — una respuesta a la vez"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
              </svg>
              <span class="hidden sm:inline">Enfocado</span>
            </button>
          </div>
        </div>

        <!-- Respuestas (scroll independiente) -->
        <div class="flex-1 lg:overflow-y-auto p-5 pb-8">
          {#if activeQuestionData()}
            {@const aqd = activeQuestionData()!}
            {#if viewMode === 'grid'}
              <GridView
                responses={aqd.respuestas}
                questionType={aqd.type}
                evaluations={questionEvaluations()}
                onscore={handleScore}
                oncomment={handleComment}
              />
            {:else}
              <CarouselView
                responses={aqd.respuestas}
                questionType={aqd.type}
                evaluations={questionEvaluations()}
                onscore={handleScore}
                oncomment={handleComment}
              />
            {/if}
          {/if}

          <!-- Volver (solo en móvil; en desktop está en el panel izquierdo) -->
          <div class="lg:hidden flex justify-center pt-6">
            <a href="/dashboard"
               class="text-sm text-surface-500 hover:text-accent-600 transition-colors">
              ← Volver al dashboard
            </a>
          </div>
        </div>
      </main>

    </div>
  </div>
{/if}
