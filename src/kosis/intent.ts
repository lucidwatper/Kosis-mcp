import type { QueryIntent } from "./types.js";
import { tokenizeQuestion, uniqueStrings } from "./utils.js";

interface MeasureRule {
  canonical: string;
  patterns: string[];
  searchHints: string[];
}

const REGION_KEYWORDS = [
  "전국",
  "대한민국",
  "한국",
  "국내",
];

const MEASURE_RULES: MeasureRule[] = [
  {
    canonical: "실업률",
    patterns: ["실업률", "실업"],
    searchHints: ["실업률", "경제활동인구조사"],
  },
  {
    canonical: "고용률",
    patterns: ["고용률", "고용"],
    searchHints: ["고용률", "경제활동인구조사"],
  },
  {
    canonical: "취업자",
    patterns: ["취업자", "취업"],
    searchHints: ["취업자", "경제활동인구조사"],
  },
  {
    canonical: "경제활동참가율",
    patterns: ["경제활동참가율"],
    searchHints: ["경제활동참가율", "경제활동인구조사"],
  },
  {
    canonical: "이용건수",
    patterns: ["이용건수", "사용건수", "건수"],
    searchHints: ["이용건수"],
  },
  {
    canonical: "이용금액",
    patterns: ["이용금액", "사용금액", "금액"],
    searchHints: ["이용금액"],
  },
  {
    canonical: "발급장수",
    patterns: ["발급장수", "발급"],
    searchHints: ["발급장수"],
  },
];

function resolvePeriodIntent(
  question: string,
  now = new Date(),
): Pick<QueryIntent, "preferredPrdSe" | "startPrdDe" | "endPrdDe" | "recentPeriods"> {
  const currentYear = now.getUTCFullYear();
  const yearMatch = question.match(/(?:지난|최근)\s*(\d+)\s*년/);
  if (yearMatch) {
    const years = Number.parseInt(yearMatch[1], 10);
    if (Number.isFinite(years) && years > 0) {
      const endYear = currentYear - 1;
      const startYear = endYear - years + 1;
      return {
        preferredPrdSe: "Y",
        startPrdDe: String(startYear),
        endPrdDe: String(endYear),
        recentPeriods: years,
      };
    }
  }

  const monthMatch = question.match(/(?:지난|최근)\s*(\d+)\s*개월/);
  if (monthMatch) {
    const months = Number.parseInt(monthMatch[1], 10);
    if (Number.isFinite(months) && months > 0) {
      return {
        preferredPrdSe: "M",
        recentPeriods: months,
      };
    }
  }

  if (question.includes("분기")) {
    return { preferredPrdSe: "Q", recentPeriods: 8 };
  }
  if (question.includes("월별") || question.includes("월간")) {
    return { preferredPrdSe: "M", recentPeriods: 12 };
  }
  if (question.includes("연도별") || question.includes("연간")) {
    return { preferredPrdSe: "Y", recentPeriods: 10 };
  }

  return {};
}

function extractMeasures(question: string, keywords: string[]): MeasureRule[] {
  return MEASURE_RULES.filter((rule) =>
    rule.patterns.some(
      (pattern) => question.includes(pattern) || keywords.includes(pattern),
    ),
  );
}

export function inferQuestionIntent(
  question: string,
  now = new Date(),
): QueryIntent {
  const lowered = question.toLowerCase();
  const keywords = tokenizeQuestion(question);
  const measureRules = extractMeasures(lowered, keywords);
  const periodIntent = resolvePeriodIntent(question, now);

  const searchHints = uniqueStrings(
    measureRules.flatMap((rule) => rule.searchHints),
  );

  const geographyScope =
    REGION_KEYWORDS.some((keyword) => question.includes(keyword))
      ? "national"
      : question.includes("지역") || question.includes("시도") || question.includes("행정구역")
        ? "regional"
        : question.includes("국가")
          ? "global"
          : "unspecified";

  const sexSelection = question.includes("남성") || question.includes("남자")
    ? "남자"
    : question.includes("여성") || question.includes("여자")
      ? "여자"
      : undefined;

  const ageSelection =
    question.includes("청년") || question.includes("15~29")
      ? "청년"
      : question.includes("고령")
        ? "고령"
        : undefined;

  return {
    question,
    keywords,
    measures: uniqueStrings(measureRules.map((rule) => rule.canonical)),
    searchHints,
    preferredPrdSe: periodIntent.preferredPrdSe,
    startPrdDe: periodIntent.startPrdDe,
    endPrdDe: periodIntent.endPrdDe,
    recentPeriods: periodIntent.recentPeriods,
    geographyScope,
    sexSelection: sexSelection ?? (geographyScope === "national" ? "계" : undefined),
    ageSelection,
    comparison:
      question.includes("비교") ||
      question.includes("같이") ||
      question.includes("대비"),
    wantsExplanation:
      question.includes("무엇") ||
      question.includes("뜻") ||
      question.includes("설명"),
  };
}
