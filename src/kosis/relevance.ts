import type {
  JsonRecord,
  NormalizedSearchResult,
  QueryPlanItem,
} from "./types.js";
import {
  overlapCount,
  readString,
  tableKey,
  textFromRecord,
  tokenizeQuestion,
  truncate,
  uniqueStrings,
} from "./utils.js";

function queryPairs(tokens: string[]): string[] {
  const pairs: string[] = [];
  for (let index = 0; index < tokens.length - 1; index += 1) {
    pairs.push(`${tokens[index]} ${tokens[index + 1]}`);
  }
  return pairs;
}

function isNaturalSentence(question: string): boolean {
  const trimmed = question.trim();
  return trimmed.length >= 20 || /\s/.test(trimmed);
}

function inferDomainHints(tokens: string[]): string[] {
  const hints: string[] = [];
  const hasEmployment = tokens.some((token) =>
    ["고용", "취업", "실업", "실업률", "고용률"].includes(token),
  );
  const hasYouth = tokens.some((token) => ["청년", "청소년", "청년층"].includes(token));

  if (hasEmployment) {
    hints.push("고용 취업 실업");
    hints.push("경제활동인구조사");
  }

  if (hasYouth) {
    hints.push("청년 취업 실업");
    hints.push("청년 고용");
  }

  if (tokens.includes("실업")) {
    hints.push("실업률");
  }

  if (tokens.includes("고용")) {
    hints.push("고용률");
    hints.push("취업자수");
  }

  const hasCard = tokens.some((token) => ["신용카드", "카드"].includes(token));
  const hasCount = tokens.some((token) => ["건수", "이용건수", "사용건수"].includes(token));
  const hasAmount = tokens.some((token) => ["금액", "이용금액", "사용금액"].includes(token));
  const hasKorea = tokens.some((token) => ["대한민국", "한국", "국내"].includes(token));

  if (hasCard) {
    if (hasCount && hasAmount) {
      hints.push("신용카드 이용건수 이용금액");
      hints.push("신용카드 건수 금액");
    } else if (hasCount) {
      hints.push("신용카드 이용건수");
    } else if (hasAmount) {
      hints.push("신용카드 이용금액");
    } else {
      hints.push("신용카드 이용실적");
    }
    hints.push(hasKorea ? "대한민국 신용카드" : "신용카드");
  }

  return hints;
}

export function buildQueryPlan(
  question: string,
  searchHints: string[] = [],
): { keywords: string[]; queryPlan: QueryPlanItem[] } {
  const keywords = tokenizeQuestion(question);
  const compressedQuery = keywords.slice(0, 6).join(" ");
  const generated = uniqueStrings([
    compressedQuery,
    ...inferDomainHints(keywords),
    ...queryPairs(keywords).slice(0, 2),
    ...searchHints,
    ...(!isNaturalSentence(question) ? [question.trim()] : []),
  ]).filter(Boolean);

  const queryPlan = generated.map((query, index) => ({
    query,
    reason:
      query === compressedQuery
        ? "핵심 키워드 압축"
        : queryPairs(keywords).includes(query)
          ? "연속 키워드 조합"
          : query === question.trim()
            ? "원문 질문"
            : "도메인 힌트",
  }));

  return { keywords, queryPlan };
}

function boostFromRecommendation(record: JsonRecord): number {
  const value = String(record.REC_TBL_SE ?? "").toLowerCase();
  return value === "y" || value === "yes" || value === "1" ? 12 : 0;
}

function containsAny(text: string, needles: string[]): boolean {
  return needles.some((needle) => text.includes(needle));
}

function computeDomainScore(tokens: string[], record: JsonRecord): number {
  const title = `${readString(record, "TBL_NM") ?? ""} ${readString(record, "STAT_NM") ?? ""}`.toLowerCase();
  const path = `${readString(record, "MT_ATITLE") ?? ""} ${readString(record, "FULL_PATH_ID") ?? ""}`.toLowerCase();
  const contents = `${readString(record, "CONTENTS") ?? ""} ${readString(record, "ITEM03") ?? ""}`.toLowerCase();

  let score = 0;
  const hasCardIntent = tokens.some((token) => ["신용카드", "카드"].includes(token));
  const hasCountIntent = tokens.some((token) => ["건수", "이용건수", "사용건수"].includes(token));
  const hasAmountIntent = tokens.some((token) => ["금액", "이용금액", "사용금액"].includes(token));
  const hasKoreaIntent = tokens.some((token) => ["대한민국", "한국", "국내"].includes(token));

  if (hasCardIntent) {
    if (title.trim() === "신용카드" || title.startsWith("신용카드 ")) {
      score += 46;
    } else if (containsAny(title, ["신용카드"])) {
      score += 28;
    } else if (containsAny(path, ["신용카드", "지급결제"])) {
      score += 12;
    } else if (containsAny(contents, ["신용카드"])) {
      score -= 18;
    }

    if (containsAny(title, ["소득공제", "연말정산"])) {
      score -= 28;
    }
    if (containsAny(contents, ["소득공제", "연말정산"])) {
      score -= 18;
    }
  }

  if (hasCountIntent) {
    if (containsAny(title, ["이용건수", "건수"])) {
      score += 14;
    } else if (containsAny(contents, ["이용건수", "건수"])) {
      score += 4;
    }
  }

  if (hasAmountIntent) {
    if (containsAny(title, ["이용금액", "금액"])) {
      score += 14;
    } else if (containsAny(contents, ["이용금액", "금액"])) {
      score += 4;
    }
  }

  if (hasKoreaIntent && containsAny(path, ["금융", "지급결제"])) {
    score += 10;
  }

  return score;
}

function resultWhyMatched(
  tokens: string[],
  query: string,
  record: JsonRecord,
  overlap: number,
  queryIndex: number,
): string[] {
  const reasons: string[] = [];
  if (queryIndex === 0) {
    reasons.push("원문 질문 결과에서 상위에 노출됨");
  }
  if (boostFromRecommendation(record) > 0) {
    reasons.push("KOSIS 추천 통계표로 표시됨");
  }
  if (overlap > 0) {
    reasons.push(`질문 키워드 ${overlap}개와 제목/설명/경로가 겹침`);
  }
  if ((readString(record, "STAT_ID") ?? "").trim()) {
    reasons.push("통계조사 ID가 있어 설명자료 연결 가능");
  }
  if (readString(record, "STRT_PRD_DE") || readString(record, "END_PRD_DE")) {
    reasons.push("수록기간 정보가 있어 시계열 범위 판단 가능");
  }
  reasons.push(`검색 질의 "${truncate(query, 40)}"로 탐색됨`);
  return reasons;
}

export function scoreSearchRecord(
  tokens: string[],
  query: string,
  queryIndex: number,
  rankIndex: number,
  record: JsonRecord,
): { score: number; whyMatched: string[] } {
  const haystack = textFromRecord(record);
  const overlap = overlapCount(tokens, haystack);

  let score = 100 - queryIndex * 10 - rankIndex * 4;
  score += overlap * 6;
  score += boostFromRecommendation(record);
  score += computeDomainScore(tokens, record);

  const title = `${readString(record, "TBL_NM") ?? ""} ${readString(record, "STAT_NM") ?? ""}`.toLowerCase();
  if (query && title.includes(query.toLowerCase())) {
    score += 8;
  }

  return {
    score,
    whyMatched: resultWhyMatched(tokens, query, record, overlap, queryIndex),
  };
}

export function normalizeSearchRecord(
  record: JsonRecord,
  score: number,
  whyMatched: string[],
): NormalizedSearchResult | null {
  const orgId = readString(record, "ORG_ID");
  const tblId = readString(record, "TBL_ID");
  const tblNm = readString(record, "TBL_NM");

  if (!orgId || !tblId || !tblNm) {
    return null;
  }

  return {
    tableKey: tableKey(orgId, tblId),
    orgId,
    tblId,
    statId: readString(record, "STAT_ID"),
    tblNm,
    statNm: readString(record, "STAT_NM"),
    organization: readString(record, "ORG_NM"),
    period: {
      start: readString(record, "STRT_PRD_DE"),
      end: readString(record, "END_PRD_DE"),
    },
    path: readString(record, "MT_ATITLE") ?? readString(record, "FULL_PATH_ID"),
    score,
    whyMatched: uniqueStrings(whyMatched),
    raw: record,
  };
}
