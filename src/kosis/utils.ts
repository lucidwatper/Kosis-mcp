import type { JsonRecord } from "./types.js";

const STOP_WORDS = new Set([
  "통계",
  "자료",
  "데이터",
  "정보",
  "알고",
  "알려줘",
  "보여줘",
  "찾고",
  "찾아줘",
  "궁금해",
  "궁금한",
  "상황",
  "기준",
  "관련",
  "비교",
  "분석",
  "보고",
  "싶어",
  "싶다",
  "요즘",
  "어떤지",
  "있는",
  "관련",
  "볼",
  "수",
  "찾아",
  "통계를",
  "자료를",
  "관련된",
  "please",
  "show",
  "find",
  "about",
  "data",
  "지난",
  "어떻게",
  "변했는지",
  "추이",
  "비교분석",
  "비교분석해줘",
  "변화",
  "얼마나",
  "동안",
  "알려달라",
  "알려줘",
  "말해줘",
]);

const TRAILING_PARTICLES = [
  "으로",
  "에서",
  "에게",
  "까지",
  "부터",
  "처럼",
  "보다",
  "과",
  "와",
  "은",
  "는",
  "이",
  "가",
  "을",
  "를",
  "의",
  "로",
  "도",
  "만",
  "에",
];

export function uniqueStrings(values: Array<string | undefined | null>): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    if (!value) {
      continue;
    }
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    result.push(trimmed);
  }

  return result;
}

function normalizeLabel(value: string | undefined): string {
  return (value ?? "").toLowerCase().replace(/\s+/g, "");
}

function findByPatterns(
  values: Array<{ id: string; name?: string }>,
  patterns: string[],
): string | undefined {
  return values.find((value) => {
    const normalizedName = normalizeLabel(value.name);
    const normalizedId = normalizeLabel(value.id);
    return patterns.some(
      (pattern) =>
        normalizedName.includes(pattern) || normalizedId === pattern,
    );
  })?.id;
}

export function guessDefaultDimensionValue(
  dimensionName: string | undefined,
  dimensionId: string | undefined,
  values: Array<{ id: string; name?: string }>,
): string | undefined {
  if (values.length === 0) {
    return undefined;
  }

  const normalizedName = normalizeLabel(dimensionName);
  const normalizedId = normalizeLabel(dimensionId);
  const isCountryDimension =
    normalizedName.includes("국가") ||
    normalizedId === "a" ||
    normalizedId.includes("country");
  const isRegionDimension =
    normalizedName.includes("지역") ||
    normalizedName.includes("행정구역") ||
    normalizedId.includes("region");
  const isSexDimension =
    normalizedName.includes("성별") || normalizedId.includes("sex");

  if (isCountryDimension) {
    return findByPatterns(values, [
      "대한민국",
      "한국",
      "korearep.of",
      "korearep.of.",
      "korearepof",
      "korea,rep.of",
      "republicofkorea",
      "1005",
    ]);
  }

  if (isRegionDimension) {
    return findByPatterns(values, [
      "전국",
      "대한민국",
      "한국",
      "전체",
      "계",
    ]);
  }

  if (isSexDimension) {
    return findByPatterns(values, ["전체", "계", "bothsex", "total", "00", "tot"]);
  }

  return undefined;
}

export function tokenizeQuestion(question: string): string[] {
  return uniqueStrings(
    question
      .toLowerCase()
      .split(/[\s,./?!:;()[\]{}|"'`~\-_=+]+/)
      .map((token) => token.trim())
      .map((token) => {
        let normalized = token;
        for (const particle of TRAILING_PARTICLES) {
          if (normalized.length > particle.length + 1 && normalized.endsWith(particle)) {
            normalized = normalized.slice(0, -particle.length);
            break;
          }
        }
        return normalized;
      })
      .filter((token) => {
        if (token.length < 2 || STOP_WORDS.has(token)) {
          return false;
        }
        if (/^\d+년(간|동안)?$/.test(token)) {
          return false;
        }
        if (/^\d+개월(간|동안)?$/.test(token)) {
          return false;
        }
        return true;
      }),
  );
}

export function textFromRecord(record: JsonRecord): string {
  return Object.values(record)
    .filter((value) => typeof value === "string")
    .join(" ")
    .toLowerCase();
}

export function overlapCount(tokens: string[], targetText: string): number {
  return tokens.filter((token) => targetText.includes(token)).length;
}

export function coerceRecordArray(payload: unknown): JsonRecord[] {
  if (Array.isArray(payload)) {
    return payload.filter(
      (entry): entry is JsonRecord =>
        typeof entry === "object" && entry !== null && !Array.isArray(entry),
    );
  }

  if (typeof payload === "object" && payload !== null) {
    const record = payload as JsonRecord;
    const nestedArray = ["result", "results", "data", "rows"]
      .map((key) => record[key])
      .find((value) => Array.isArray(value));

    if (Array.isArray(nestedArray)) {
      return coerceRecordArray(nestedArray);
    }

    return [record];
  }

  return [];
}

export function readString(record: JsonRecord, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

export function tableKey(orgId: string, tblId: string): string {
  return `${orgId}:${tblId}`;
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1)}…`;
}
