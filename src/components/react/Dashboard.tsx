import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { validateEvaluatorKey, getEvaluations, getAssignedImages } from "../../lib/supabase";
import {
  countTotalEvaluations,
  getImageList,
  countImageEvaluations,
} from "../../lib/responses";
import { useAppStore } from "../../lib/store";
import { BlurFade } from "../magicui/blur-fade";
import { MagicCard } from "../magicui/magic-card";
import { NumberTicker } from "../magicui/number-ticker";
import { ThemeToggle } from "./ThemeToggle";
import { Toaster } from "sileo";
import type { ResponsesData, Evaluator, Evaluation } from "../../lib/types";
import { canAccessAdmin, canAccessDashboard } from "../../lib/types";
import { cn } from "../../lib/cn";

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [evalData, setEvalData] = useState<Evaluator | null>(null);
  const [responses, setResponses] = useState<ResponsesData | null>(null);
  const [userEvaluations, setUserEvaluations] = useState<Evaluation[]>([]);

  const { setCurrentEvaluator, setEvaluations, setResponsesData, setAssignedImages } = useAppStore();

  const [assignedImages, setLocalAssignedImages] = useState<string[]>([]);

  const images = useMemo(
    () => (responses ? getImageList(responses).filter((img) => assignedImages.includes(img)) : []),
    [responses, assignedImages]
  );
  const totalRequired = useMemo(() => {
    if (!responses || assignedImages.length === 0) return 0;
    return assignedImages.reduce((sum, img) => sum + countImageEvaluations(responses, img), 0);
  }, [responses, assignedImages]);
  const totalCompleted = userEvaluations.length;
  const percentage = useMemo(
    () => totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : 0,
    [totalCompleted, totalRequired]
  );

  function getImageProgress(imageFilename: string) {
    if (!responses) return { completed: 0, total: 0 };
    const total = countImageEvaluations(responses, imageFilename);
    const completed = userEvaluations.filter(
      (e) => e.image_filename === imageFilename
    ).length;
    return { completed, total };
  }

  function getImageStatus(imageFilename: string): "none" | "partial" | "done" {
    const { completed, total } = getImageProgress(imageFilename);
    if (completed === 0) return "none";
    if (completed >= total) return "done";
    return "partial";
  }

  const countDone = useMemo(
    () => images.filter((img) => getImageStatus(img) === "done").length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [images, userEvaluations]
  );
  const countPartial = useMemo(
    () => images.filter((img) => getImageStatus(img) === "partial").length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [images, userEvaluations]
  );
  const countNone = useMemo(
    () => images.filter((img) => getImageStatus(img) === "none").length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [images, userEvaluations]
  );

  const firstIncomplete = useMemo(
    () => images.find((img) => getImageStatus(img) !== "done") || null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [images, userEvaluations]
  );

  useEffect(() => {
    async function init() {
      const key = localStorage.getItem("evaluator_key");
      if (!key) { window.location.href = "/login"; return; }

      const evaluator = await validateEvaluatorKey(key);
      if (!evaluator) {
        localStorage.removeItem("evaluator_key");
        window.location.href = "/login";
        return;
      }

      // Administradores puros no tienen acceso al dashboard de evaluación
      if (!canAccessDashboard(evaluator)) {
        window.location.href = "/admin";
        return;
      }

      setEvalData(evaluator);
      setCurrentEvaluator(evaluator);

      const [responsesRes, evals, assigned] = await Promise.all([
        fetch("/api/responses").then((r) => r.json()),
        getEvaluations(evaluator.id),
        getAssignedImages(evaluator.id),
      ]);

      setResponses(responsesRes as ResponsesData);
      setResponsesData(responsesRes);
      setUserEvaluations(evals);
      setEvaluations(evals);
      setLocalAssignedImages(assigned);
      setAssignedImages(assigned);
      setLoading(false);
    }
    init();
  }, [setCurrentEvaluator, setEvaluations, setResponsesData]);

  function handleLogout() {
    localStorage.removeItem("evaluator_key");
    setCurrentEvaluator(null);
    window.location.href = "/login";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-950">
        <div className="w-5 h-5 rounded-full border-2 border-surface-700 border-t-amber-500 animate-spin" />
      </div>
    );
  }

  if (!evalData || !responses) return null;

  return (
    <div className="min-h-screen bg-surface-950">
      <Toaster position="bottom-right" />
      {/* Header */}
      <header className="sticky top-0 z-20 bg-surface-900/90 backdrop-blur-md border-b border-surface-700/40">
        <div className="max-w-6xl mx-auto px-6 h-[52px] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-6 h-6 rounded icon-badge-amber border shrink-0">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <span className="font-serif text-[15px] font-normal text-surface-100 tracking-tight">
              Music LLM Eval
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-surface-400 hidden sm:inline">{evalData.name}</span>
            {canAccessAdmin(evalData) && (
              <a href="/admin" className="text-xs text-ui-amber font-medium uppercase tracking-widest transition-colors opacity-80 hover:opacity-100">
                Admin
              </a>
            )}
            <ThemeToggle />
            <button onClick={handleLogout} className="text-xs text-surface-500 hover:text-surface-300 cursor-pointer uppercase tracking-widest transition-colors">
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Progress hero */}
        <BlurFade delay={0.05} duration={0.5} inView>
          <MagicCard
            gradientColor="#C8A85A"
            gradientOpacity={0.06}
            className="card-glass rounded-[20px] overflow-hidden mb-10"
          >
            <div className="p-8 flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10">
              {/* Big percentage */}
              <div className="shrink-0">
                <div className="font-serif text-6xl font-semibold text-surface-100 leading-none tabular-nums flex items-baseline gap-1">
                  <NumberTicker value={percentage} className="font-serif text-6xl font-semibold text-surface-100" />
                  <span className="text-3xl text-surface-400 ml-1">%</span>
                </div>
                <p className="text-sm text-surface-500 mt-2">
                  {totalCompleted} de {totalRequired} evaluaciones
                </p>
              </div>

              <div className="hidden sm:block w-px self-stretch bg-surface-700/60" />

              {/* Stats */}
              <div className="flex flex-col justify-center gap-3 flex-1">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-teal-500/15 shrink-0">
                    <svg className="w-3 h-3 text-ui-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </div>
                  <span className="text-sm text-surface-300">
                    <NumberTicker value={countDone} className="font-medium tabular-nums text-surface-100" />{" "}
                    {countDone === 1 ? "partitura completa" : "partituras completas"}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-400/15 shrink-0">
                    <svg className="w-3 h-3 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  </div>
                  <span className="text-sm text-surface-300">
                    <NumberTicker value={countPartial} className="font-medium tabular-nums text-surface-100" />{" "}
                    en progreso
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-surface-700/50 shrink-0">
                    <svg className="w-3 h-3 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                    </svg>
                  </div>
                  <span className="text-sm text-surface-300">
                    <NumberTicker value={countNone} className="font-medium tabular-nums text-surface-100" />{" "}
                    sin empezar
                  </span>
                </div>
              </div>

              {/* CTA */}
              <div className="flex items-center sm:ml-auto">
                {firstIncomplete ? (
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => { window.location.href = `/evaluate/${encodeURIComponent(firstIncomplete)}`; }}
                    className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-accent-500 hover:bg-accent-600 border border-amber-500/40 text-white text-[13px] font-medium cursor-pointer shadow-sm shadow-amber-500/20 transition-all duration-150"
                  >
                    Continuar
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </motion.button>
                ) : (
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 cta-teal border text-sm font-medium rounded-full">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    Completado
                  </div>
                )}
              </div>
            </div>

            {/* Full-width progress bar */}
            <div className="h-[3px] bg-surface-800">
              <motion.div
                className={cn("h-[3px]", percentage === 100 ? "bg-teal-500" : "bg-amber-500")}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.25 }}
              />
            </div>
          </MagicCard>
        </BlurFade>

        {/* Bento grid header */}
        <BlurFade delay={0.15} duration={0.4} inView>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="font-serif text-lg font-semibold text-surface-200 shrink-0">Partituras</h2>
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full badge-amber text-xs font-medium tabular-nums border">
              {images.length}
            </span>
            <div className="flex-1 h-px bg-surface-700" />
            <div className="hidden sm:flex items-center gap-4 shrink-0">
              <span className="flex items-center gap-1.5 text-xs text-surface-500">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />Completas
              </span>
              <span className="flex items-center gap-1.5 text-xs text-surface-500">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />En progreso
              </span>
            </div>
          </div>
        </BlurFade>

        {/* Cards grid */}
        <BlurFade delay={0.2} duration={0.5} inView>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {images.map((imageFilename, i) => {
              const progress = getImageProgress(imageFilename);
              const status = getImageStatus(imageFilename);
              const pct = progress.total > 0
                ? Math.round((progress.completed / progress.total) * 100)
                : 0;

              const borderClass = status === "done"
                ? "border-teal-500/25 hover:border-teal-500/45"
                : status === "partial"
                ? "border-amber-400/25 hover:border-amber-400/45"
                : "border-surface-700/60 hover:border-amber-500/20";

              return (
                <motion.a
                  key={imageFilename}
                  href={`/evaluate/${encodeURIComponent(imageFilename)}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3, ease: "easeOut" }}
                  whileHover={{ y: -3, transition: { duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] } }}
                  whileTap={{ scale: 0.97 }}
                >
                  <div
                    className={cn(
                      "group h-full bg-surface-900/80 backdrop-blur-sm border rounded-[18px] overflow-hidden card-elevated flex flex-col transition-all duration-200",
                      borderClass
                    )}
                  >
                    {/* Thumbnail */}
                    <div className="relative flex-1 bg-surface-850 overflow-hidden flex items-center justify-center aspect-4/3">
                      <img
                        src={`/api/images/${imageFilename}`}
                        alt={imageFilename}
                        className={cn(
                          "w-full h-full object-contain p-3 transition-all duration-300 group-hover:scale-[1.03]",
                          status === "done" ? "opacity-75 group-hover:opacity-95" : "opacity-90 group-hover:opacity-100"
                        )}
                        loading="lazy"
                      />
                      {/* Status badge */}
                      {status === "done" && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-teal-500/90 backdrop-blur-sm rounded-full">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                          <span className="text-[10px] font-semibold text-white leading-none">Completa</span>
                        </div>
                      )}
                      {status === "partial" && (
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-amber-400/90 backdrop-blur-sm rounded-full">
                          <span className="text-[10px] font-semibold text-white leading-none">{progress.completed}/{progress.total}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className={cn(
                      "shrink-0 border-t px-3 py-2.5",
                      status === "done" ? "border-teal-500/15 bg-teal-500/[0.03]"
                        : status === "partial" ? "border-amber-400/15 bg-amber-400/[0.03]"
                        : "border-surface-700/50"
                    )}>
                      <p className="text-[11px] font-mono text-surface-500 truncate leading-tight mb-1.5">
                        {imageFilename}
                      </p>
                      <div className="w-full h-[2px] bg-surface-800 rounded-full overflow-hidden">
                        <motion.div
                          className={cn("h-[2px] rounded-full", status === "done" ? "bg-teal-500" : "bg-amber-500")}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 + i * 0.02 }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.a>
              );
            })}
          </div>
        </BlurFade>
      </main>
    </div>
  );
}
