import type { Criterion } from "../types/matrix";

export type CriteriaQualityWarning = {
  criterionId: string;
  criterionName: string;
  issue: string;
  suggestion: string;
  explanation: string;
};

type AmbiguousPattern = {
  terms: string[];
  suggestion: string;
  allowedDirectionWords: string[];
};

const patterns: AmbiguousPattern[] = [
  {
    terms: ["cost"],
    suggestion: "Rename to \"Low cost\" or \"Affordability\".",
    allowedDirectionWords: ["low cost", "lower cost", "affordable", "affordability", "value"]
  },
  {
    terms: ["price"],
    suggestion: "Rename to \"Low price\" or \"Value for money\".",
    allowedDirectionWords: ["low price", "lower price", "value", "value for money", "affordable"]
  },
  {
    terms: ["difficulty"],
    suggestion: "Rename to \"Ease of implementation\".",
    allowedDirectionWords: ["ease", "easy", "easier", "low difficulty"]
  },
  {
    terms: ["risk"],
    suggestion: "Rename to \"Low risk\".",
    allowedDirectionWords: ["low risk", "lower risk", "safe", "safety", "secure", "security"]
  },
  {
    terms: ["time required", "time needed"],
    suggestion: "Rename to \"Speed\" or \"Low time required\".",
    allowedDirectionWords: ["speed", "fast", "faster", "quick", "low time"]
  },
  {
    terms: ["resources required", "resource requirement", "resources needed"],
    suggestion: "Rename to \"Low resource need\".",
    allowedDirectionWords: ["low resource", "resource efficiency", "efficient"]
  },
  {
    terms: ["complexity"],
    suggestion: "Rename to \"Simplicity\".",
    allowedDirectionWords: ["simplicity", "simple", "low complexity", "ease"]
  },
  {
    terms: ["effort"],
    suggestion: "Rename to \"Low effort\" or \"Ease\".",
    allowedDirectionWords: ["low effort", "ease", "easy", "easier"]
  }
];

const normalize = (value: string | undefined): string =>
  value?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";

const hasAnyTerm = (value: string, terms: string[]): boolean =>
  terms.some((term) => value.includes(term));

export const inspectCriteriaQuality = (criteria: Criterion[]): CriteriaQualityWarning[] =>
  criteria.flatMap((criterion) => {
    const name = normalize(criterion.name);
    const description = normalize(criterion.description);
    const combinedText = `${name} ${description}`.trim();
    const matchedPattern = patterns.find(
      (pattern) =>
        hasAnyTerm(combinedText, pattern.terms) &&
        !hasAnyTerm(name, pattern.allowedDirectionWords)
    );

    if (!matchedPattern) return [];

    return [
      {
        criterionId: criterion.id,
        criterionName: criterion.name,
        issue: "Higher scores may be unclear.",
        suggestion: matchedPattern.suggestion,
        explanation:
          "In a decision matrix, higher scores should always point toward the option you would prefer."
      }
    ];
  });
