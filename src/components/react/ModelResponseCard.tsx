import { useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";
import { motion } from "framer-motion";
import { BinaryScoring } from "./BinaryScoring";
import { RankingScoring } from "./RankingScoring";
import { CommentField } from "./CommentField";
import { MagicCard } from "../magicui/magic-card";
import { getMinionName } from "../../lib/minions";
import type { ModelResponse, Evaluation, QuestionType } from "../../lib/types";
import { cn } from "../../lib/cn";

interface ModelResponseCardProps {
  response: ModelResponse;
  questionType: QuestionType;
  evaluation: Evaluation | null;
  onScore: (score: number) => void;
  onComment: (comment: string) => void;
}

export function ModelResponseCard({
  response,
  questionType,
  evaluation,
  onScore,
  onComment,
}: ModelResponseCardProps) {
  const renderedMarkdown = useMemo(
    () =>
      DOMPurify.sanitize(marked.parse(response.respuesta) as string),
    [response.respuesta]
  );

  const minionName = useMemo(
    () => getMinionName(response.modelo),
    [response.modelo]
  );

  // Derive a short provider prefix for the badge
  const providerPrefix = useMemo(() => {
    const modelo = response.modelo.toLowerCase();
    if (modelo.includes("gpt") || modelo.includes("openai")) return "GPT";
    if (modelo.includes("claude") || modelo.includes("anthropic")) return "Claude";
    if (modelo.includes("gemini") || modelo.includes("google")) return "Gemini";
    if (modelo.includes("llama") || modelo.includes("meta")) return "Llama";
    if (modelo.includes("mistral")) return "Mistral";
    if (modelo.includes("qwen")) return "Qwen";
    if (modelo.includes("deepseek")) return "DeepSeek";
    // Fallback: first word of model name
    return minionName.split(" ")[0];
  }, [response.modelo, minionName]);

  const currentScore = evaluation?.score ?? null;
  const currentComment = evaluation?.comment ?? "";
  const isEvaluated = evaluation !== null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <MagicCard
        gradientColor={isEvaluated ? "#4F46E5" : "#6366F1"}
        gradientOpacity={isEvaluated ? 0.14 : 0.08}
        className={cn(
          "relative bg-surface-900 border border-surface-700 overflow-hidden flex flex-col card-elevated rounded-lg",
          isEvaluated && "border-accent-500/30"
        )}
      >
        {/* Header */}
        <div className="px-4 py-2.5 bg-surface-850 border-b border-surface-700 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {/* Provider badge */}
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-accent-100 text-accent-700 shrink-0 leading-none">
              {providerPrefix}
            </span>
            <span className="text-sm font-semibold text-surface-100 truncate">
              {minionName}
            </span>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <span
              className="text-xs text-surface-500 tabular-nums font-mono"
              title="Tiempo de respuesta"
            >
              {response.tiempo_de_respuesta.toFixed(1)}s
            </span>
            {isEvaluated && (
              <div
                className="flex items-center gap-1 text-xs text-accent-500 font-medium"
                title="Evaluado"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Response body */}
        <div className="p-4 flex-1 overflow-y-auto max-h-100">
          <div
            className="markdown-content text-sm leading-relaxed text-surface-300"
            dangerouslySetInnerHTML={{ __html: renderedMarkdown }}
          />
        </div>

        {/* Scoring footer */}
        <div className="px-4 py-3 border-t border-surface-700 bg-surface-850/60">
          <div>
            {questionType === "binary" ? (
              <BinaryScoring score={currentScore} onChange={onScore} />
            ) : (
              <RankingScoring score={currentScore} onChange={onScore} />
            )}
          </div>
          <div className="mt-2.5">
            <CommentField comment={currentComment} onChange={onComment} />
          </div>
        </div>
      </MagicCard>
    </motion.div>
  );
}
