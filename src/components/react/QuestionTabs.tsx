import { useMemo } from "react";
import { motion } from "framer-motion";
import type { QuestionEntry } from "../../lib/types";
import { isThreadQuestion } from "../../lib/types";
import { cn } from "../../lib/cn";

interface QuestionTabsProps {
  questions: Record<string, QuestionEntry>;
  activeQuestionId: string;
  activeGroupId: string;
  onSelect: (groupId: string, questionId: string) => void;
  completedQuestions: Set<string>;
}

export function QuestionTabs({
  questions,
  activeQuestionId,
  activeGroupId,
  onSelect,
  completedQuestions,
}: QuestionTabsProps) {
  const questionIds = useMemo(
    () => Object.keys(questions).sort((a, b) => Number(a) - Number(b)),
    [questions]
  );

  function isGroupComplete(groupId: string): boolean {
    const entry = questions[groupId];
    if (!entry) return false;
    if (isThreadQuestion(entry)) {
      return entry.thread.every((sub) => completedQuestions.has(sub.id));
    }
    return completedQuestions.has(groupId);
  }

  function isGroupPartial(groupId: string): boolean {
    const entry = questions[groupId];
    if (!entry || !isThreadQuestion(entry)) return false;
    return (
      entry.thread.some((sub) => completedQuestions.has(sub.id)) &&
      !isGroupComplete(groupId)
    );
  }

  const activeEntry = questions[activeGroupId];

  return (
    <div className="flex flex-col gap-2">
      {/* Main group tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {questionIds.map((qId) => {
          const entry = questions[qId];
          const isThread = isThreadQuestion(entry);
          const isActive = qId === activeGroupId;
          const isComplete = isGroupComplete(qId);
          const isPartial = isGroupPartial(qId);

          return (
            <motion.button
              key={qId}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (isThread) {
                  onSelect(qId, entry.thread[0].id);
                } else {
                  onSelect(qId, qId);
                }
              }}
              className={cn(
                "shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium cursor-pointer border transition-colors",
                isActive
                  ? "bg-amber-600 text-white border-amber-700"
                  : "bg-surface-900 text-surface-400 border-surface-700 hover:border-amber-500/50 hover:text-surface-200"
              )}
            >
              <span className="font-mono text-xs">P{qId}</span>
              {isThread && (
                <svg
                  className={cn(
                    "w-3 h-3",
                    isActive ? "text-white/70" : "text-surface-500"
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              )}
              {isComplete && (
                <svg
                  className={cn(
                    "w-3 h-3",
                    isActive ? "text-white/70" : "text-ui-teal"
                  )}
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
              )}
              {isPartial && !isComplete && (
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    isActive ? "bg-white/50" : "bg-amber-400"
                  )}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Sub-question tabs for active thread group */}
      {activeEntry && isThreadQuestion(activeEntry) && (
        <div className="flex gap-1 overflow-x-auto pl-4">
          {activeEntry.thread.map((sub) => {
            const isSubActive = sub.id === activeQuestionId;
            const isSubComplete = completedQuestions.has(sub.id);

            return (
              <motion.button
                key={sub.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelect(activeGroupId, sub.id)}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium cursor-pointer border transition-colors",
                  isSubActive
                    ? "bg-amber-600/80 text-white border-amber-700"
                    : "bg-surface-850 text-surface-400 border-surface-700/60 hover:border-amber-500/50 hover:text-surface-200"
                )}
              >
                <span className="font-mono">{sub.id}</span>
                {isSubComplete && (
                  <svg
                    className={cn(
                      "w-2.5 h-2.5",
                      isSubActive ? "text-white/70" : "text-teal-400"
                    )}
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
                )}
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
