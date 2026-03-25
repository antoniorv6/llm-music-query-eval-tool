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

function getScoreColor(value: number, isActive: boolean): string {
  if (!isActive)
    return "bg-surface-850 text-surface-400 border-surface-700 hover:border-accent-600/40 hover:text-surface-200";
  if (value === 0) return "bg-red-100 text-red-700 border-red-400";
  if (value === 1) return "bg-red-50 text-red-600 border-red-300";
  if (value === 2) return "bg-orange-100 text-orange-700 border-orange-400";
  if (value === 3) return "bg-amber-100 text-amber-700 border-amber-400";
  if (value === 4) return "bg-indigo-100 text-indigo-700 border-indigo-400";
  return "bg-green-100 text-green-700 border-green-400";
}

export function RankingScoring({ score, onChange }: RankingScoringProps) {
  return (
    <div>
      <div className="flex gap-1.5 w-full relative">
        {scores.map((value) => (
          <motion.button
            key={value}
            whileTap={{ scale: 0.88 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => onChange(value)}
            title={SCORE_LABELS[value]}
            className={cn(
              "flex-1 h-11 flex items-center justify-center rounded-lg text-sm font-bold border cursor-pointer transition-all duration-200 relative",
              getScoreColor(value, score === value),
              score === value && "shadow-sm"
            )}
          >
            {score === value && (
              <motion.div
                layoutId="ranking-indicator"
                className="absolute inset-0 rounded-lg ring-2 ring-accent-500/50 ring-offset-1 ring-offset-surface-850"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className="relative z-10">{value}</span>
          </motion.button>
        ))}
      </div>

      {/* Score label */}
      <div className="flex items-center justify-between mt-1.5 px-0.5 h-5">
        {score !== null ? (
          <motion.span
            key={score}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="text-xs font-medium text-surface-400"
          >
            {SCORE_LABELS[score]}
          </motion.span>
        ) : (
          <span className="text-xs text-surface-600">Sin puntuar</span>
        )}
        <span className="text-xs text-surface-600">0 – 5</span>
      </div>
    </div>
  );
}
