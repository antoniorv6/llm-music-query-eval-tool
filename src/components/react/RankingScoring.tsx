import { motion } from "framer-motion";
import { cn } from "../../lib/cn";

interface RankingScoringProps {
  score: number | null;
  onChange: (score: number) => void;
}

const scores = [0, 1, 2, 3, 4, 5];

const SCORE_LABELS: Record<number, string> = {
  0: "Nulo",
  1: "Malo",
  2: "Regular",
  3: "Bueno",
  4: "Muy bueno",
  5: "Excelente",
};

function getActiveClass(value: number): string {
  return `score-active-${value}`;
}

export function RankingScoring({ score, onChange }: RankingScoringProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Segmented control */}
      <div className="flex bg-surface-850 rounded-xl p-1 gap-1">
        {scores.map((value) => {
          const isActive = score === value;
          return (
            <motion.button
              key={value}
              whileTap={{ scale: 0.92 }}
              onClick={() => onChange(value)}
              title={SCORE_LABELS[value]}
              className={cn(
                "flex-1 h-11 flex items-center justify-center rounded-lg text-[13px] font-medium cursor-pointer border transition-all duration-300 relative",
                isActive
                  ? getActiveClass(value)
                  : "bg-transparent text-surface-500 border-transparent hover:text-surface-300"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="ranking-indicator"
                  className="absolute inset-0 rounded-md"
                  style={{ zIndex: -1 }}
                  transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
                />
              )}
              <span className="relative z-10">{value}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Label */}
      <div className="h-4 flex items-center">
        {score !== null ? (
          <motion.span
            key={score}
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="text-[11px] font-medium text-surface-400"
          >
            {SCORE_LABELS[score]}
          </motion.span>
        ) : (
          <span className="text-[11px] text-surface-600">Sin puntuar</span>
        )}
      </div>
    </div>
  );
}
