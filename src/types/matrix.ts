export type DecisionMatrix = {
  id: string;
  title: string;
  category: string;
  goal: string;
  constraints?: string;
  createdAt: string;
  updatedAt: string;
  options: MatrixOption[];
  criteria: Criterion[];
  scores: Score[];
  aiSummary?: string;
};

export type MatrixOption = {
  id: string;
  name: string;
  description?: string;
  notes?: string;
};

export type Criterion = {
  id: string;
  category: string;
  name: string;
  description?: string;
  weight: number;
  isMustHave?: boolean;
  aiGenerated?: boolean;
};

export type ScoreConfidence = "low" | "medium" | "high";

export type Score = {
  optionId: string;
  criterionId: string;
  value: number;
  note?: string;
  aiGenerated?: boolean;
  confidence?: ScoreConfidence;
};

export type AiSuggestion<T> = {
  id: string;
  type: "criteria" | "options" | "scores" | "summary" | "quality-review";
  data: T;
  createdAt: string;
};

export type AiAction =
  | "generateCriteria"
  | "suggestOptions"
  | "suggestScores"
  | "reviewMatrix"
  | "generateRecommendation";

export type CriteriaSuggestion = {
  criteria: Array<{
    category: string;
    name: string;
    description?: string;
    weight: number;
    isMustHave?: boolean;
  }>;
};

export type OptionSuggestion = {
  options: Array<{
    name: string;
    description?: string;
  }>;
};

export type ScoreSuggestion = {
  scores: Array<{
    optionName: string;
    criterionName: string;
    value: number;
    note?: string;
    confidence?: ScoreConfidence;
  }>;
};

export type MatrixReview = {
  strengths: string[];
  issues: string[];
  suggestions: string[];
};

export type Recommendation = {
  summary: string;
  winner: string;
  whyWinner: string[];
  tradeoffs: string[];
  risks: string[];
  nextSteps: string[];
};

export type CategoryScore = {
  category: string;
  score: number;
  maxScore: number;
  percentage: number;
};

export type MustHaveFailure = {
  criterionId: string;
  criterionName: string;
  optionId: string;
  optionName: string;
  score: number;
};

export type OptionResult = {
  option: MatrixOption;
  totalScore: number;
  maxPossibleScore: number;
  percentageFit: number;
  rank: number;
  categoryScores: CategoryScore[];
  mustHaveFailures: MustHaveFailure[];
  strengths: string[];
  weaknesses: string[];
};

export type MatrixResults = {
  rankings: OptionResult[];
  winner?: OptionResult;
  maxPossibleScore: number;
  categoryNames: string[];
  mustHaveFailures: MustHaveFailure[];
};
