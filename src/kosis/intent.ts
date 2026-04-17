import type { IntentTarget, QueryIntent } from "./types.js";
import { orderedTokenizeQuestion, tokenizeQuestion, uniqueStrings } from "./utils.js";

interface MeasureRule {
  canonical: string;
  patterns: string[];
  searchHints: string[];
}

const GENERIC_MEASURE_SUFFIXES = [
  "건수",
  "금액",
  "비율",
  "지수",
  "지표",
  "률",
  "율",
  "인구",
  "면적",
  "소득",
  "지출",
  "생산",
  "판매",
  "재고",
  "수출",
  "수입",
];

const REGION_KEYWORDS = [
  "전국",
  "대한민국",
  "한국",
  "국내",
];

const REGION_TERMS = [
  "전국",
  "대한민국",
  "한국",
  "국내",
  "서울",
  "부산",
  "대구",
  "인천",
  "광주",
  "대전",
  "울산",
  "세종",
  "수도권",
  "비수도권",
];

const SEX_TERMS = ["남자", "여자", "남성", "여성", "남녀", "계", "전체"];
const AGE_TERMS = ["청년", "청년층", "고령", "고령층", "노년", "15~24", "15~29", "60세", "65세"];

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
  const ruleMeasures = MEASURE_RULES.filter((rule) =>
    rule.patterns.some(
      (pattern) => question.includes(pattern) || keywords.includes(pattern),
    ),
  );
  const orderedTokens = question
    .split(/[\s,./?!:;()[\]{}|"'`~\-_=+]+/)
    .map((token) => token.trim())
    .map((token) => {
      let normalized = token;
      for (const particle of ["으로", "에서", "에게", "까지", "부터", "처럼", "보다", "과", "와", "은", "는", "이", "가", "을", "를", "의", "로", "도", "만", "에"]) {
        if (normalized.length > particle.length + 1 && normalized.endsWith(particle)) {
          normalized = normalized.slice(0, -particle.length);
          break;
        }
      }
      return normalized;
    })
    .filter(Boolean);

  const genericMeasureStrings = uniqueStrings([
    ...keywords.filter((keyword) =>
      GENERIC_MEASURE_SUFFIXES.some(
        (suffix) => keyword.endsWith(suffix) || keyword.includes(suffix),
      ),
    ),
    ...orderedTokens.flatMap((token, index) => {
      const next = orderedTokens[index + 1];
      if (!next) {
        return [];
      }
      return GENERIC_MEASURE_SUFFIXES.includes(next) ? [`${token} ${next}`] : [];
    }),
  ]);

  const genericMeasures = genericMeasureStrings
    .filter(
      (candidate) =>
        !ruleMeasures.some((rule) => rule.canonical === candidate) &&
        candidate.length >= 2,
    )
    .map((candidate) => ({
      canonical: candidate,
      patterns: [candidate],
      searchHints: [candidate],
    }));

  return [...ruleMeasures, ...genericMeasures];
}

function extractIntentTargets(
  question: string,
  keywords: string[],
  measures: string[],
): IntentTarget[] {
  const orderedTokens = orderedTokenizeQuestion(question);
  const rawSegments = question
    .replace(/비교표|비교해줘|비교|대비/g, " ")
    .split(/(?:\s+대비\s+|\s*와\s+|\s*과\s+|\s+및\s+|\s+그리고\s+|,\s*|\/| vs\.? |·)/i)
    .map((segment) => segment.trim())
    .filter(Boolean);

  const measureCandidates = uniqueStrings([
    ...measures,
    ...keywords.filter((keyword) =>
      GENERIC_MEASURE_SUFFIXES.some(
        (suffix) => keyword.endsWith(suffix) || keyword.includes(suffix),
      ),
    ),
    ...orderedTokens.flatMap((token, index) => {
      const next = orderedTokens[index + 1];
      if (!next) {
        return [];
      }
      return GENERIC_MEASURE_SUFFIXES.includes(next) ? [`${token} ${next}`] : [];
    }),
  ]);

  const targets = rawSegments
    .map((segment) => tokenizeQuestion(segment))
    .filter((segmentKeywords) => segmentKeywords.length > 0)
    .flatMap((segmentKeywords) => {
      if (segmentKeywords.length === 1 && segmentKeywords[0] === "남녀") {
        return [["남자"], ["여자"]];
      }
      return [segmentKeywords];
    })
    .map((segmentKeywords) => {
      const regionTerms = REGION_TERMS.filter((term) =>
        segmentKeywords.some((keyword) => keyword.includes(term.toLowerCase())),
      );
      const sexTerms = SEX_TERMS.filter((term) =>
        segmentKeywords.some((keyword) => keyword.includes(term.toLowerCase())),
      );
      const ageTerms = AGE_TERMS.filter((term) =>
        segmentKeywords.some((keyword) => keyword.includes(term.toLowerCase())),
      );
      const existingText = segmentKeywords.join(" ");
      const suffix = measureCandidates.find(
        (candidate) =>
          !existingText.includes(candidate) &&
          !segmentKeywords.some((keyword) => candidate.includes(keyword)),
      );
      const label = uniqueStrings([
        ...segmentKeywords,
        suffix,
      ]).join(" ");

      return {
        label,
        keywords: tokenizeQuestion(label),
        regionTerms,
        sexTerms,
        ageTerms,
      };
    })
    .filter((target) => target.keywords.length > 0)
    .filter(
      (target, index, entries) =>
        entries.findIndex((entry) => entry.label === target.label) === index,
    );

  return targets.length >= 2
    ? targets
    : measureCandidates.slice(0, 3).map((candidate) => ({
        label: candidate,
        keywords: tokenizeQuestion(candidate),
        regionTerms: [],
        sexTerms: [],
        ageTerms: [],
      }));
}

function resolvePrimaryIntent(
  question: string,
  measureCount: number,
): QueryIntent["primaryIntent"] {
  if (
    question.includes("비교") ||
    question.includes("대비") ||
    question.includes("같이")
  ) {
    return "compare";
  }

  if (
    question.includes("무엇") ||
    question.includes("뜻") ||
    question.includes("의미") ||
    question.includes("설명")
  ) {
    return "explain";
  }

  if (
    question.includes("주제") ||
    question.includes("기관") ||
    question.includes("목록") ||
    question.includes("분야") ||
    question.includes("어떤 자료") ||
    question.includes("뭐가 있")
  ) {
    return "browse";
  }

  if (
    question.includes("추이") ||
    question.includes("변화") ||
    question.includes("최근") ||
    question.includes("월별") ||
    question.includes("분기") ||
    question.includes("연도별")
  ) {
    return "trend";
  }

  if (
    question.includes("수치") ||
    question.includes("값") ||
    question.includes("몇") ||
    question.includes("얼마")
  ) {
    return "value";
  }

  if (measureCount > 0) {
    return "trend";
  }

  return "search";
}

export function inferQuestionIntent(
  question: string,
  now = new Date(),
): QueryIntent {
  const lowered = question.toLowerCase();
  const keywords = tokenizeQuestion(question);
  const measureRules = extractMeasures(lowered, keywords);
  const periodIntent = resolvePeriodIntent(question, now);
  const primaryIntent = resolvePrimaryIntent(question, measureRules.length);

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
    targets: extractIntentTargets(question, keywords, uniqueStrings(measureRules.map((rule) => rule.canonical))),
    primaryIntent,
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
    wantsIndicators:
      primaryIntent === "explain" ||
      primaryIntent === "trend" ||
      primaryIntent === "value" ||
      question.includes("지표") ||
      question.includes("지수") ||
      question.includes("률") ||
      question.includes("추이") ||
      question.includes("최근") ||
      measureRules.length > 0,
  };
}
