import type {
  JsonRecord,
  NormalizedIndicatorResult,
  NormalizedSearchResult,
  QueryIntent,
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
import { inferQuestionIntent } from "./intent.js";

export type QueryPlanLane = "table" | "indicator" | "catalog";

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
  hints.push(
    ...uniqueStrings([
      ...tokens.filter((token) =>
        /(건수|금액|비율|지수|지표|률|율|인구|면적|소득|지출|생산|판매|재고|수출|수입)$/.test(
          token,
        ),
      ),
      ...tokens.flatMap((token, index) => {
        const next = tokens[index + 1];
        if (!next) {
          return [];
        }
        return /(건수|금액|비율|지수|지표|인구|면적|소득|지출|생산|판매|재고|수출|수입)$/.test(next)
          ? [`${token} ${next}`]
          : [];
      }),
    ]),
  );
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

  return uniqueStrings(hints);
}

function inferIntentHints(
  question: string,
  tokens: string[],
  intent: QueryIntent,
  lane: QueryPlanLane,
): string[] {
  const hints: string[] = [];
  const leading = tokens.slice(0, 3).join(" ");
  const firstToken = tokens[0];
  const measures = intent.measures;

  if (lane === "catalog" || intent.primaryIntent === "browse") {
    if (firstToken) {
      hints.push(`${firstToken} 통계`);
      hints.push(`${firstToken} 분야`);
    }
    if (question.includes("기관") && firstToken) {
      hints.push(`${firstToken} 기관별`);
    }
    if (intent.geographyScope === "regional" && firstToken) {
      hints.push(`지역통계 ${firstToken}`);
    }
    if (leading) {
      hints.push(`${leading} 자료`);
    }
  }

  if (lane === "indicator" || intent.primaryIntent === "explain") {
    for (const measure of measures) {
      hints.push(`${measure} 설명`);
      hints.push(`${measure} 의미`);
      hints.push(`${measure} 지표`);
    }
  }

  if (lane === "indicator" || intent.primaryIntent === "trend") {
    for (const measure of measures) {
      hints.push(`${measure} 추이`);
      hints.push(`${measure} 최근`);
      if (intent.geographyScope === "national") {
        hints.push(`대한민국 ${measure}`);
      }
    }
  }

  if (lane === "indicator" || intent.primaryIntent === "value") {
    for (const measure of measures) {
      hints.push(`${measure} 수치`);
      hints.push(`${measure} 값`);
    }
  }

  if (intent.primaryIntent === "compare" && measures.length >= 2) {
    hints.push(measures.join(" "));
    hints.push(`${measures.join(" ")} 비교`);
  }

  return hints;
}

function laneSpecificHints(
  question: string,
  tokens: string[],
  intent: QueryIntent,
  lane: QueryPlanLane,
): string[] {
  if (lane === "catalog") {
    const firstToken = tokens[0];
    return uniqueStrings([
      firstToken ? `${firstToken} 주제` : "",
      firstToken ? `${firstToken} 목록` : "",
      question.includes("기관") && firstToken ? `${firstToken} 기관별 통계` : "",
      intent.geographyScope === "regional" && firstToken ? `지역통계 ${firstToken}` : "",
    ]);
  }

  if (lane === "indicator") {
    return uniqueStrings([
      ...intent.measures.map((measure) => `${measure} 지표`),
      ...intent.measures.map((measure) => `${measure} 설명자료`),
      intent.primaryIntent === "trend"
        ? `${intent.measures[0] ?? tokens[0] ?? ""} 시계열`
        : "",
    ]);
  }

  return uniqueStrings([
    ...intent.measures.map((measure) => `${measure} 통계표`),
    ...intent.measures.map((measure) => `${measure} 통계자료`),
  ]);
}

function laneSeedQueries(
  question: string,
  keywords: string[],
  lane: QueryPlanLane,
): string[] {
  const compressedQuery = keywords.slice(0, 6).join(" ");
  if (lane === "catalog") {
    return uniqueStrings([
      keywords.slice(0, 2).join(" "),
      compressedQuery,
    ]).filter(Boolean);
  }
  if (lane === "indicator") {
    return uniqueStrings([
      keywords.slice(0, 3).join(" "),
      compressedQuery,
    ]).filter(Boolean);
  }
  return uniqueStrings([compressedQuery]).filter(Boolean);
}

export function buildQueryPlan(
  question: string,
  searchHints: string[] = [],
  intent = inferQuestionIntent(question),
  lane: QueryPlanLane = "table",
): { keywords: string[]; queryPlan: QueryPlanItem[] } {
  const keywords = tokenizeQuestion(question);
  const seedQueries = laneSeedQueries(question, keywords, lane);
  const intentHints = inferIntentHints(question, keywords, intent, lane);
  const laneHints = laneSpecificHints(question, keywords, intent, lane);
  const pairQueries =
    lane === "catalog" ? queryPairs(keywords).slice(0, 1) : queryPairs(keywords).slice(0, 2);
  const generated = uniqueStrings([
    ...seedQueries,
    ...(lane === "catalog" ? [] : inferDomainHints(keywords)),
    ...intentHints,
    ...laneHints,
    ...pairQueries,
    ...searchHints,
    ...(!isNaturalSentence(question) ? [question.trim()] : []),
  ]).filter(Boolean);

  const queryPlan = generated.map((query, index) => ({
    query,
    reason:
      seedQueries.includes(query)
        ? "핵심 키워드 압축"
        : intentHints.includes(query)
          ? "질문 유형 보정"
        : laneHints.includes(query)
          ? "lane 보정"
        : pairQueries.includes(query)
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

function indicatorKey(record: JsonRecord): string | null {
  const id = readString(record, "statJipyoId");
  const name = readString(record, "statJipyoNm");
  if (id) {
    return `indicator:${id}`;
  }
  if (name) {
    return `indicator-name:${name}`;
  }
  return null;
}

function resultWhyMatchedIndicator(
  query: string,
  record: JsonRecord,
  overlap: number,
  queryIndex: number,
): string[] {
  const reasons: string[] = [];
  if (queryIndex === 0) {
    reasons.push("질문 핵심 질의에서 지표가 포착됨");
  }
  if (overlap > 0) {
    reasons.push(`질문 키워드 ${overlap}개와 지표명/설명이 겹침`);
  }
  if (readString(record, "prdDe") || readString(record, "endPrdDe")) {
    reasons.push("수록 시점 정보가 있어 최근 추이 질문에 연결 가능");
  }
  reasons.push(`지표 질의 "${truncate(query, 40)}"로 탐색됨`);
  return reasons;
}

export function scoreIndicatorRecord(
  tokens: string[],
  query: string,
  queryIndex: number,
  rankIndex: number,
  record: JsonRecord,
): { score: number; whyMatched: string[] } {
  const haystack = textFromRecord(record);
  const overlap = overlapCount(tokens, haystack);
  const indicatorName = (readString(record, "statJipyoNm") ?? "").toLowerCase();
  const prdSeName = (readString(record, "prdSeName") ?? "").toLowerCase();
  const areaTypeName = (readString(record, "areaTypeName") ?? "").toLowerCase();
  const wantsAnnual = tokens.some(
    (token) =>
      token.includes("년") ||
      token.includes("연간") ||
      token.includes("증감") ||
      token.includes("비율"),
  );
  const wantsNational = tokens.some((token) =>
    ["대한민국", "한국", "국내"].includes(token),
  );
  const wantsSexSpecific = tokens.some((token) =>
    ["남자", "남성", "여자", "여성"].includes(token),
  );
  const wantsYouth = tokens.some((token) =>
    token.includes("청년") || token.includes("15~24") || token.includes("15~29"),
  );

  let score = 92 - queryIndex * 10 - rankIndex * 3;
  score += overlap * 8;

  const name = `${readString(record, "statJipyoNm") ?? ""} ${readString(record, "jipyoExplan") ?? ""}`.toLowerCase();
  if (query && name.includes(query.toLowerCase())) {
    score += 10;
  }
  if (readString(record, "val")) {
    score += 6;
  }
  if (readString(record, "jipyoExplan1")) {
    score += 8;
  }
  if (wantsAnnual) {
    if (prdSeName.includes("년")) {
      score += 24;
    }
    if (prdSeName.includes("월")) {
      score -= 18;
    }
  }
  if (!wantsSexSpecific && (indicatorName.includes("여자") || indicatorName.includes("남자"))) {
    score -= 20;
  }
  if (!wantsYouth && indicatorName.includes("청년")) {
    score -= 16;
  }
  if (wantsNational && areaTypeName.includes("국가")) {
    score += 8;
  }
  if (indicatorName === "실업률") {
    score += 18;
  }
  if (wantsAnnual && indicatorName.includes("시계열보정")) {
    score -= 8;
  }

  return {
    score,
    whyMatched: resultWhyMatchedIndicator(query, record, overlap, queryIndex),
  };
}

export function normalizeIndicatorRecord(
  record: JsonRecord,
  score: number,
  whyMatched: string[],
  matchedQuery: string,
  matchedStrategy: string,
): NormalizedIndicatorResult | null {
  const key = indicatorKey(record);
  const indicatorName = readString(record, "statJipyoNm");

  if (!key || !indicatorName) {
    return null;
  }

  return {
    indicatorKey: key,
    indicatorId: readString(record, "statJipyoId"),
    indicatorName,
    unit: readString(record, "unit"),
    period: {
      start: readString(record, "strtPrdDe"),
      end: readString(record, "endPrdDe"),
      latest: readString(record, "prdDe"),
      prdSeName: readString(record, "prdSeName"),
    },
    score,
    whyMatched: uniqueStrings(whyMatched),
    matchedQueries: uniqueStrings([matchedQuery]),
    matchedStrategies: uniqueStrings([matchedStrategy]),
    raw: record,
  };
}
