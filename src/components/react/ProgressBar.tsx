import { motion } from "framer-motion";
import { cn } from "../../lib/cn";

interface ProgressBarProps {
  completed: number;
  total: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function ProgressBar({
  completed,
  total,
  size = "md",
  showLabel = true,
}: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const barHeight = size === "sm" ? "h-1.5" : size === "md" ? "h-2.5" : "h-4";
  const barColor = percentage === 100 ? "bg-green-500" : "bg-accent-500";

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-surface-400 tabular-nums">
            {completed}/{total}
          </span>
          <span
            className={cn(
              "text-xs font-medium tabular-nums",
              percentage === 100 ? "text-green-400" : "text-surface-300"
            )}
          >
            {percentage}%
          </span>
        </div>
      )}
      <div
        className={cn("w-full bg-surface-800 rounded overflow-hidden", barHeight)}
      >
        <motion.div
          className={cn(barColor, barHeight, "rounded")}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
