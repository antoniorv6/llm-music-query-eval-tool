import { useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";
import { motion } from "framer-motion";
import { BinaryScoring } from "./BinaryScoring";
import { RankingScoring } from "./RankingScoring";
import { CommentField } from "./CommentField";
import type { ModelResponse, Evaluation, QuestionType } from "../../lib/types";
import { cn } from "../../lib/cn";

interface ModelResponseCardProps {
  response: ModelResponse;
  index: number;
  questionType: QuestionType;
  evaluation: Evaluation | null;
  onScore: (score: number) => void;
  onComment: (comment: string) => void;
}

export function ModelResponseCard({
  response,
  index,
  questionType,
  evaluation,
  onScore,
  onComment,
}: ModelResponseCardProps) {
  const renderedMarkdown = useMemo(
    () => DOMPurify.sanitize(marked.parse(response.respuesta) as string),
    [response.respuesta]
  );

  const modelLabel = `Modelo ${index + 1}`;
  const currentScore = evaluation?.score ?? null;
  const currentComment = evaluation?.comment ?? "";
  const isEvaluated = evaluation !== null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={cn(
        "bg-surface-900 rounded-2xl border flex flex-col overflow-hidden card-elevated transition-all duration-200",
        isEvaluated
          ? "border-surface-700 border-l-[3px] border-l-amber-500/50"
          : "border-surface-700"
      )}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3.5 flex items-center justify-between gap-3">
        <span className="text-[13px] font-semibold tracking-wide text-surface-400 uppercase">
          {modelLabel}
        </span>
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono text-surface-500 tabular-nums" title="Tiempo de respuesta">
            {response.tiempo_de_respuesta.toFixed(1)}s
          </span>
          {isEvaluated && (
            <span
              className="inline-flex items-center justify-center w-4 h-4 rounded-full text-ui-teal"
              title="Evaluado"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </span>
          )}
        </div>
      </div>

      {/* Response body */}
      <div className="px-5 pb-4 flex-1 overflow-y-auto max-h-80">
        <div
          className="markdown-content text-[13.5px] leading-relaxed text-surface-300"
          dangerouslySetInnerHTML={{ __html: renderedMarkdown }}
        />
      </div>

      {/* Scoring area */}
      <div className="border-t border-surface-800 px-5 py-4 flex flex-col gap-3">
        {questionType === "binary" ? (
          <BinaryScoring score={currentScore} onChange={onScore} />
        ) : (
          <RankingScoring score={currentScore} onChange={onScore} />
        )}
        <CommentField comment={currentComment} onChange={onComment} />
      </div>
    </motion.div>
  );
}
