import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/cn";
import type {
  SolutionsData,
  BinarySolution,
  RankingSolution,
} from "../../lib/solutions";

interface SolutionPanelProps {
  imageKey: string;
  activeGroupId: string;
  activeQuestionId: string;
  solutions: SolutionsData | null;
}

const SCORE_LABELS: Record<number, string> = {
  0: "Nulo",
  1: "Malo",
  2: "Regular",
  3: "Bueno",
  4: "Muy bueno",
  5: "Excelente",
};

export function SolutionPanel({
  imageKey,
  activeGroupId,
  activeQuestionId,
  solutions,
}: SolutionPanelProps) {
  const [visible, setVisible] = useState(false);

  // Collapse when question changes
  useEffect(() => {
    setVisible(false);
  }, [activeQuestionId]);

  const activeSolution = useMemo(() => {
    const groupSol = solutions?.[imageKey]?.[activeGroupId];
    if (!groupSol) return null;
    if (groupSol.type === "thread") {
      return groupSol.subQuestions[activeQuestionId] ?? null;
    }
    return groupSol;
  }, [solutions, imageKey, activeGroupId, activeQuestionId]);

  if (!activeSolution) return null;

  return (
    <div className="flex flex-col gap-2">
      {/* Toggle button */}
      <button
        onClick={() => setVisible((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all duration-200 cursor-pointer",
          visible
            ? "badge-amber"
            : "bg-surface-800 border-surface-700 text-surface-500 hover:text-surface-300 hover:border-surface-600"
        )}
      >
        <svg
          className="w-3 h-3 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          {visible ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
            />
          )}
        </svg>
        {visible ? "Ocultar rúbrica" : "Ver rúbrica"}
      </button>

      {/* Content */}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {activeSolution.type === "binary" && (
              <BinaryAnswer answer={(activeSolution as BinarySolution).answer} />
            )}
            {activeSolution.type === "ranking" && (
              <RankingRubric
                rubric={(activeSolution as RankingSolution).rubric}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BinaryAnswer({ answer }: { answer: string }) {
  return (
    <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-surface-800 border border-surface-700">
      <svg
        className="w-3.5 h-3.5 mt-0.5 text-green-400 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m4.5 12.75 6 6 9-13.5"
        />
      </svg>
      <div>
        <span className="text-[10px] font-medium text-surface-500 uppercase tracking-wider block mb-0.5">
          Respuesta correcta
        </span>
        <span className="text-sm text-surface-200 leading-snug">{answer}</span>
      </div>
    </div>
  );
}

function RankingRubric({ rubric }: { rubric: Record<string, string> }) {
  return (
    <div className="flex flex-col gap-1">
      {[5, 4, 3, 2, 1, 0].map((score) => (
        <div
          key={score}
          className={cn(
            "flex items-start gap-2 px-2.5 py-1.5 rounded-md border text-[11px]",
            `score-active-${score}`
          )}
        >
          <span className="font-mono font-bold text-xs mt-0.5 shrink-0 w-3 text-center">
            {score}
          </span>
          <span className="shrink-0 mt-0.5 opacity-60 min-w-[52px] text-[10px] font-medium">
            {SCORE_LABELS[score]}
          </span>
          <span className="leading-snug flex-1 opacity-90">
            {rubric[String(score)] ?? "—"}
          </span>
        </div>
      ))}
    </div>
  );
}
