import { motion } from "framer-motion";
import { cn } from "../../lib/cn";

interface BinaryScoringProps {
  score: number | null;
  onChange: (score: number) => void;
}

export function BinaryScoring({ score, onChange }: BinaryScoringProps) {
  return (
    <div className="flex gap-2">
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onChange(1)}
        className={cn(
          "flex items-center justify-center gap-2 flex-1 min-h-11 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer border transition-all duration-200",
          score === 1
            ? "bg-green-500/15 text-green-600 border-green-500/50 ring-2 ring-green-500/20 ring-offset-1 ring-offset-surface-850"
            : "bg-surface-800/60 text-surface-400 border-surface-700/50 hover:border-green-500/30 hover:bg-green-500/5 hover:text-green-500"
        )}
      >
        <svg
          className="w-4 h-4 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
        Correcto
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onChange(0)}
        className={cn(
          "flex items-center justify-center gap-2 flex-1 min-h-11 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer border transition-all duration-200",
          score === 0
            ? "bg-red-500/15 text-red-600 border-red-500/50 ring-2 ring-red-500/20 ring-offset-1 ring-offset-surface-850"
            : "bg-surface-800/60 text-surface-400 border-surface-700/50 hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-500"
        )}
      >
        <svg
          className="w-4 h-4 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
        Incorrecto
      </motion.button>
    </div>
  );
}
