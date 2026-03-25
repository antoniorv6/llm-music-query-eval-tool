import { motion } from "framer-motion";
import { ModelResponseCard } from "./ModelResponseCard";
import type { ModelResponse, Evaluation, QuestionType } from "../../lib/types";

interface GridViewProps {
  responses: ModelResponse[];
  questionType: QuestionType;
  evaluations: Map<string, Evaluation>;
  onScore: (modelName: string, score: number) => void;
  onComment: (modelName: string, comment: string) => void;
}

const container = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

export function GridView({
  responses,
  questionType,
  evaluations,
  onScore,
  onComment,
}: GridViewProps) {
  return (
    <motion.div
      className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {responses.map((response, i) => (
        <ModelResponseCard
          key={response.modelo}
          response={response}
          index={i}
          questionType={questionType}
          evaluation={evaluations.get(response.modelo) || null}
          onScore={(score) => onScore(response.modelo, score)}
          onComment={(comment) => onComment(response.modelo, comment)}
        />
      ))}
    </motion.div>
  );
}
