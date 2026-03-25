import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ModelResponseCard } from "./ModelResponseCard";
import type { ModelResponse, Evaluation, QuestionType } from "../../lib/types";
import { cn } from "../../lib/cn";

interface CarouselViewProps {
  responses: ModelResponse[];
  questionType: QuestionType;
  evaluations: Map<string, Evaluation>;
  onScore: (modelName: string, score: number) => void;
  onComment: (modelName: string, comment: string) => void;
}

export function CarouselView({
  responses,
  questionType,
  evaluations,
  onScore,
  onComment,
}: CarouselViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const total = responses.length;

  const prev = useCallback(
    () => setCurrentIndex((i) => (i - 1 + total) % total),
    [total]
  );
  const next = useCallback(
    () => setCurrentIndex((i) => (i + 1) % total),
    [total]
  );

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [prev, next]);

  const current = responses[currentIndex];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Navigation header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prev}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-800/60 border border-surface-700/40 rounded-md text-surface-400 hover:text-surface-100 hover:border-accent-500/25 text-sm cursor-pointer transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
          Anterior
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-surface-500 tabular-nums font-mono">
            {currentIndex + 1} / {total}
          </span>
          <div className="flex gap-1.5">
            {responses.map((r, i) => (
              <motion.button
                key={r.modelo}
                whileTap={{ scale: 0.8 }}
                onClick={() => setCurrentIndex(i)}
                className={cn(
                  "w-2 h-2 rounded-full cursor-pointer transition-colors",
                  i === currentIndex
                    ? "bg-surface-300"
                    : evaluations.has(responses[i].modelo)
                    ? "bg-accent-500/50"
                    : "bg-surface-700"
                )}
                aria-label={`Ir al modelo ${i + 1}`}
              />
            ))}
          </div>
        </div>

        <button
          onClick={next}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-800/60 border border-surface-700/40 rounded-md text-surface-400 hover:text-surface-100 hover:border-accent-500/25 text-sm cursor-pointer transition-colors"
        >
          Siguiente
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
        </button>
      </div>

      {/* Animated card */}
      <AnimatePresence mode="wait">
        {current && (
          <motion.div
            key={current.modelo}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <ModelResponseCard
              response={current}
              questionType={questionType}
              evaluation={evaluations.get(current.modelo) || null}
              onScore={(score) => onScore(current.modelo, score)}
              onComment={(comment) => onComment(current.modelo, comment)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
