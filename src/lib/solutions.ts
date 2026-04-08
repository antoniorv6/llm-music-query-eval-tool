export interface BinarySolution {
  type: "binary";
  answer: string;
}

export interface RankingSolution {
  type: "ranking";
  rubric: Record<string, string>; // "0"–"5" → criteria text
}

export interface ThreadSolution {
  type: "thread";
  subQuestions: Record<string, BinarySolution>; // sub-id → binary solution
}

export type QuestionSolution = BinarySolution | RankingSolution | ThreadSolution;

export interface SolutionsData {
  [imageKey: string]: {
    [questionId: string]: QuestionSolution;
  };
}
