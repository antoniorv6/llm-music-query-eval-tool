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
        whileTap={{ scale: 0.96 }}
        onClick={() => onChange(1)}
        className={cn(
          "flex items-center justify-center gap-1.5 flex-1 h-9 px-3 rounded-lg text-[13px] font-medium cursor-pointer border transition-all duration-150",
          score === 1
            ? "bg-green-500 text-white border-green-500 shadow-sm"
            : "bg-transparent text-surface-400 border-surface-700 hover:border-green-500/40 hover:text-green-500"
        )}
      >
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
        Correcto
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => onChange(0)}
        className={cn(
          "flex items-center justify-center gap-1.5 flex-1 h-9 px-3 rounded-lg text-[13px] font-medium cursor-pointer border transition-all duration-150",
          score === 0
            ? "bg-red-500 text-white border-red-500 shadow-sm"
            : "bg-transparent text-surface-400 border-surface-700 hover:border-red-500/40 hover:text-red-500"
        )}
      >
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
        Incorrecto
      </motion.button>
    </div>
  );
}
