import { useState, useEffect, useMemo, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  validateEvaluatorKey,
  getEvaluations,
  upsertEvaluation,
} from "../../lib/supabase";
import {
  countTotalEvaluations,
  countImageEvaluations,
} from "../../lib/responses";
import { isThreadQuestion } from "../../lib/types";
import { useAppStore } from "../../lib/store";
import { ImageViewer } from "./ImageViewer";
import { QuestionTabs } from "./QuestionTabs";
import { GridView } from "./GridView";
import { CarouselView } from "./CarouselView";
import { ProgressBar } from "./ProgressBar";
import { AnimatedShinyText } from "../magicui/animated-shiny-text";
import type {
  ResponsesData,
  Evaluator,
  Evaluation,
  SimpleQuestion,
  QuestionType,
} from "../../lib/types";
import { cn } from "../../lib/cn";

interface EvaluationViewProps {
  imageFilename: string;
}

export function EvaluationView({ imageFilename }: EvaluationViewProps) {
  const [loading, setLoading] = useState(true);
  const [evalData, setEvalData] = useState<Evaluator | null>(null);
  const [responses, setResponses] = useState<ResponsesData | null>(null);
  const [userEvaluations, setUserEvaluations] = useState<Evaluation[]>([]);
  const [activeGroupId, setActiveGroupId] = useState("");
  const [activeQuestionId, setActiveQuestionId] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "carousel">("grid");

  const { setCurrentEvaluator, setEvaluations } = useAppStore();

  const imageQuestions = useMemo(
    () => responses?.[imageFilename] || {},
    [responses, imageFilename]
  );

  const questionIds = useMemo(
    () => Object.keys(imageQuestions).sort((a, b) => Number(a) - Number(b)),
    [imageQuestions]
  );

  const activeQuestionData = useMemo((): {
    question: string;
    type: QuestionType;
    respuestas: import("../../lib/types").ModelResponse[];
  } | null => {
    const entry = imageQuestions[activeGroupId];
    if (!entry) return null;
    if (isThreadQuestion(entry)) {
      const sub = entry.thread.find((s) => s.id === activeQuestionId);
      return sub || null;
    }
    return entry as SimpleQuestion;
  }, [imageQuestions, activeGroupId, activeQuestionId]);

  const totalGlobal = useMemo(
    () => (responses ? countTotalEvaluations(responses) : 0),
    [responses]
  );
  const completedGlobal = userEvaluations.length;

  const imageTotal = useMemo(
    () => (responses ? countImageEvaluations(responses, imageFilename) : 0),
    [responses, imageFilename]
  );
  const imageCompleted = useMemo(
    () =>
      userEvaluations.filter((e) => e.image_filename === imageFilename).length,
    [userEvaluations, imageFilename]
  );

  const questionEvaluations = useMemo(() => {
    const map = new Map<string, Evaluation>();
    for (const ev of userEvaluations) {
      if (
        ev.image_filename === imageFilename &&
        ev.question_id === activeQuestionId
      ) {
        map.set(ev.model_name, ev);
      }
    }
    return map;
  }, [userEvaluations, imageFilename, activeQuestionId]);

  const completedQuestions = useMemo(() => {
    const set = new Set<string>();
    for (const qId of questionIds) {
      const entry = imageQuestions[qId];
      if (!entry) continue;
      if (isThreadQuestion(entry)) {
        for (const sub of entry.thread) {
          const modelsInSub = sub.respuestas.length;
          const evaluated = userEvaluations.filter(
            (e) =>
              e.image_filename === imageFilename && e.question_id === sub.id
          ).length;
          if (evaluated >= modelsInSub) set.add(sub.id);
        }
      } else {
        const modelsInQuestion = entry.respuestas.length;
        const evaluated = userEvaluations.filter(
          (e) =>
            e.image_filename === imageFilename && e.question_id === qId
        ).length;
        if (evaluated >= modelsInQuestion) set.add(qId);
      }
    }
    return set;
  }, [questionIds, imageQuestions, userEvaluations, imageFilename]);

  useEffect(() => {
    async function init() {
      const key = localStorage.getItem("evaluator_key");
      if (!key) {
        window.location.href = "/login";
        return;
      }

      const evaluator = await validateEvaluatorKey(key);
      if (!evaluator) {
        localStorage.removeItem("evaluator_key");
        window.location.href = "/login";
        return;
      }

      setEvalData(evaluator);
      setCurrentEvaluator(evaluator);

      const [responsesRes, evals] = await Promise.all([
        fetch("/api/responses").then((r) => r.json()),
        getEvaluations(evaluator.id),
      ]);

      const data = responsesRes as ResponsesData;
      setResponses(data);
      setUserEvaluations(evals);
      setEvaluations(evals);

      const qIds = Object.keys(data[imageFilename] || {}).sort(
        (a, b) => Number(a) - Number(b)
      );
      if (qIds.length > 0) {
        const firstEntry = data[imageFilename][qIds[0]];
        setActiveGroupId(qIds[0]);
        if (isThreadQuestion(firstEntry)) {
          setActiveQuestionId(firstEntry.thread[0].id);
        } else {
          setActiveQuestionId(qIds[0]);
        }
      }

      setLoading(false);
    }
    init();
  }, [imageFilename, setCurrentEvaluator, setEvaluations]);

  const handleTabSelect = useCallback(
    (groupId: string, questionId: string) => {
      setActiveGroupId(groupId);
      setActiveQuestionId(questionId);
    },
    []
  );

  const handleScore = useCallback(
    async (modelName: string, score: number) => {
      if (!evalData) return;

      const evalObj: Omit<Evaluation, "id" | "created_at" | "updated_at"> = {
        evaluator_id: evalData.id,
        image_filename: imageFilename,
        question_id: activeQuestionId,
        model_name: modelName,
        score,
      };

      const existing = userEvaluations.find(
        (e) =>
          e.image_filename === imageFilename &&
          e.question_id === activeQuestionId &&
          e.model_name === modelName
      );
      if (existing?.comment) evalObj.comment = existing.comment;

      const success = await upsertEvaluation(evalObj);
      if (success) {
        setUserEvaluations((prev) => {
          const idx = prev.findIndex(
            (e) =>
              e.evaluator_id === evalData.id &&
              e.image_filename === imageFilename &&
              e.question_id === activeQuestionId &&
              e.model_name === modelName
          );
          const newEval = { ...evalObj } as Evaluation;
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], ...newEval };
            return updated;
          }
          return [...prev, newEval];
        });
      }
    },
    [evalData, imageFilename, activeQuestionId, userEvaluations]
  );

  const handleComment = useCallback(
    async (modelName: string, comment: string) => {
      if (!evalData) return;

      const existing = userEvaluations.find(
        (e) =>
          e.image_filename === imageFilename &&
          e.question_id === activeQuestionId &&
          e.model_name === modelName
      );
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
        setUserEvaluations((prev) => {
          const idx = prev.findIndex(
            (e) =>
              e.evaluator_id === evalData.id &&
              e.image_filename === imageFilename &&
              e.question_id === activeQuestionId &&
              e.model_name === modelName
          );
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], comment };
            return updated;
          }
          return prev;
        });
      }
    },
    [evalData, imageFilename, activeQuestionId, userEvaluations]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="text-surface-500 text-base font-serif italic"
        >
          Cargando evaluación...
        </motion.div>
      </div>
    );
  }

  if (!evalData || !responses) return null;

  return (
    <div className="flex flex-col min-h-dvh lg:h-dvh">
      {/* Header */}
      <header className="shrink-0 bg-surface-900/95 backdrop-blur-sm border-b border-surface-700 z-30">
        <div className="px-5 py-2.5 flex items-center justify-between gap-3">
          {/* Left: back + image info */}
          <div className="flex items-center gap-3 min-w-0">
            <a
              href="/dashboard"
              className="flex items-center justify-center w-7 h-7 rounded-md bg-surface-850 border border-surface-700 text-surface-500 hover:text-surface-300 hover:border-surface-600 transition-all shrink-0"
              title="Volver al dashboard"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                />
              </svg>
            </a>

            {/* Logo brand */}
            <div className="hidden md:flex items-center gap-1.5 shrink-0">
              <svg className="w-3.5 h-3.5 text-accent-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <AnimatedShinyText shimmerWidth={100} className="font-serif text-[13px] font-semibold text-surface-100 tracking-tight">
                Music LLM
              </AnimatedShinyText>
            </div>

            <div className="hidden md:block w-px h-4 bg-surface-700 shrink-0" />

            {/* Image filename */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-mono text-accent-600 truncate max-w-45 lg:max-w-xs">
                {imageFilename}
              </span>
              <div className="w-20 shrink-0">
                <ProgressBar
                  completed={imageCompleted}
                  total={imageTotal}
                  size="sm"
                  showLabel={false}
                />
              </div>
              <span className="text-xs text-surface-500 tabular-nums shrink-0">
                {imageCompleted}/{imageTotal}
              </span>
            </div>
          </div>

          {/* Right: global progress + user */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2 text-xs text-surface-500">
              <span className="hidden sm:inline text-surface-600">Global</span>
              <div className="w-14">
                <ProgressBar
                  completed={completedGlobal}
                  total={totalGlobal}
                  size="sm"
                  showLabel={false}
                />
              </div>
              <span className="tabular-nums font-mono text-surface-400">
                {completedGlobal}/{totalGlobal}
              </span>
            </div>
            <span className="text-sm font-medium text-surface-400 hidden sm:inline">
              {evalData.name}
            </span>
          </div>
        </div>
      </header>

      {/* Two-column body */}
      <div className="flex flex-col lg:flex-row flex-1 lg:overflow-hidden">
        {/* Left panel */}
        <aside className="shrink-0 lg:w-[380px] xl:w-[420px] flex flex-col border-b border-surface-700 lg:border-b-0 lg:border-r lg:overflow-hidden bg-surface-900">
          {/* Image */}
          <div className="shrink-0">
            <ImageViewer
              src={`/api/images/${imageFilename}`}
              alt={imageFilename}
              height="38vh"
            />
          </div>

          {/* Question text */}
          <div className="flex-1 lg:overflow-y-auto px-5 pt-4 pb-3">
            <AnimatePresence mode="wait">
              {activeQuestionData && (
                <motion.div
                  key={activeQuestionId}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="bg-surface-850 border border-surface-700 rounded-lg px-4 py-4"
                >
                  {/* Header row: breadcrumb + type badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 text-xs text-surface-500">
                      {isThreadQuestion(imageQuestions[activeGroupId]) ? (
                        <>
                          <span className="font-mono font-semibold text-accent-600">P{activeGroupId}</span>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                          </svg>
                          <span className="font-mono font-semibold text-accent-500">{activeQuestionId}</span>
                        </>
                      ) : (
                        <span className="font-mono font-semibold text-accent-600">P{activeGroupId}</span>
                      )}
                    </div>
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold leading-none",
                      activeQuestionData.type === "binary"
                        ? "bg-green-100 text-green-700"
                        : "bg-indigo-100 text-indigo-700"
                    )}>
                      {activeQuestionData.type === "binary" ? "Binaria" : "Ranking 0–5"}
                    </span>
                  </div>
                  <p className="font-serif text-[15px] text-surface-200 leading-relaxed">
                    {activeQuestionData.question}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Question tabs */}
          <div className="shrink-0 px-5 py-3 border-t border-surface-700 flex flex-col gap-3">
            <QuestionTabs
              questions={imageQuestions}
              activeQuestionId={activeQuestionId}
              activeGroupId={activeGroupId}
              onSelect={handleTabSelect}
              completedQuestions={completedQuestions}
            />
            <div className="hidden lg:block">
              <a
                href="/dashboard"
                className="text-xs text-surface-500 hover:text-accent-600 transition-colors"
              >
                ← Volver al dashboard
              </a>
            </div>
          </div>
        </aside>

        {/* Right panel */}
        <main className="flex-1 flex flex-col lg:overflow-hidden bg-surface-950">
          {/* View toggle bar */}
          <div className="shrink-0 bg-surface-900 border-b border-surface-700 px-5 py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-surface-500 min-w-0">
              {activeQuestionData && (
                <>
                  <span className="tabular-nums font-medium text-surface-400">
                    {activeQuestionData.respuestas.length}
                  </span>
                  <span>respuestas</span>
                  <span className="text-surface-700">·</span>
                  <span className={cn(
                    "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold",
                    activeQuestionData.type === "binary"
                      ? "bg-green-100 text-green-700"
                      : "bg-indigo-100 text-indigo-700"
                  )}>
                    {activeQuestionData.type === "binary" ? "Binaria" : "Ranking 0–5"}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-0.5 bg-surface-850 border border-surface-700 rounded-lg p-0.5 shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-all duration-200",
                  viewMode === "grid"
                    ? "bg-accent-600 text-white shadow-sm"
                    : "text-surface-500 hover:text-surface-300 hover:bg-surface-800"
                )}
                title="Vista de cuadrícula"
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
                </svg>
                <span className="hidden sm:inline">Cuadrícula</span>
              </button>
              <button
                onClick={() => setViewMode("carousel")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-all duration-200",
                  viewMode === "carousel"
                    ? "bg-accent-600 text-white shadow-sm"
                    : "text-surface-500 hover:text-surface-300 hover:bg-surface-800"
                )}
                title="Vista enfocada"
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
                </svg>
                <span className="hidden sm:inline">Enfocado</span>
              </button>
            </div>
          </div>

          {/* Responses (independent scroll) */}
          <div className="flex-1 lg:overflow-y-auto p-5 pb-8">
            <AnimatePresence mode="wait">
              {activeQuestionData && (
                <motion.div
                  key={`${activeQuestionId}-${viewMode}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {viewMode === "grid" ? (
                    <GridView
                      responses={activeQuestionData.respuestas}
                      questionType={activeQuestionData.type}
                      evaluations={questionEvaluations}
                      onScore={handleScore}
                      onComment={handleComment}
                    />
                  ) : (
                    <CarouselView
                      responses={activeQuestionData.respuestas}
                      questionType={activeQuestionData.type}
                      evaluations={questionEvaluations}
                      onScore={handleScore}
                      onComment={handleComment}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="lg:hidden flex justify-center pt-6">
              <a
                href="/dashboard"
                className="text-sm text-surface-500 hover:text-accent-600 transition-colors"
              >
                ← Volver al dashboard
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
