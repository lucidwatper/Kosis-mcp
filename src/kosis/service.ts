import { FileCache } from "./cache.js";
import { KosisClient } from "./client.js";
import { KosisApiError } from "./errors.js";
import { fetchHtmlPreviewFallback } from "./html-fallback.js";
import { inferQuestionIntent } from "./intent.js";
import {
  availablePeriodCodes,
  mapPeriodCode,
  resolvePreferredPeriodCode,
} from "./period.js";
import { buildQuestionPlan } from "./planner.js";
import {
  buildCoveragePeriods,
  buildTableIdentity,
  buildValueComparisonMatrix,
  derivePreviewPlanWithSelections,
  detectReadiness,
  estimateCellCount,
  inferPreviewOptions,
  normalizeDimensions,
  normalizeUnits,
  PreviewPlan,
  toWeightMetaParams,
} from "./preview-support.js";
import {
  buildQueryPlan,
  normalizeIndicatorRecord,
  normalizeSearchRecord,
  scoreIndicatorRecord,
  scoreSearchRecord,
} from "./relevance.js";
import {
  appendBudgetStopNote,
  buildCatalogSearchAttempts,
  buildIndicatorAttempts,
  buildIndicatorCoverage,
  buildIndicatorIdentity,
  buildTableSearchAttempts,
  catalogKeyFromRecord,
  CatalogSearchAttempt,
  chooseBestIndicatorRecord,
  classifyKosisError,
  DEFAULT_CATALOG_VIEWS,
  firstUsableRecord,
  IndicatorSearchAttempt,
  intersectStrings,
  mergeCatalogResults,
  mergeIndicatorSearchResults,
  mergeQueryPlanItems,
  mergeTopicSearchResults,
  shouldUseStaleBecauseOutputIsNotUsable,
  summaryRow,
  summarizeIndicatorAttempts,
  TableSearchAttempt,
} from "./search-support.js";
import type {
  AnswerProvenance,
  AnswerBundle,
  BrowseCatalogResult,
  CacheStatus,
  CatalogResult,
  CatalogView,
  CompareTableInput,
  ComparisonResult,
  DataPreviewRow,
  IndicatorBundle,
  IndicatorSearchAttemptLog,
  JsonRecord,
  KosisMetaBundle,
  KosisTableBundle,
  NormalizedIndicatorResult,
  NormalizedSearchResult,
  PlannerExecutionLog,
  PlannedDatasetCandidate,
  ProviderAttemptLog,
  PreviewAttemptLog,
  PreviewRequestOptions,
  QuestionPlan,
  QueryPlanItem,
  QueryIntent,
  SearchIndicatorsResult,
  SearchAttemptLog,
  SearchTopicsResult,
} from "./types.js";
import {
  overlapCount,
  readString,
  tableKey,
  textFromRecord,
  tokenizeQuestion,
  uniqueStrings,
} from "./utils.js";

interface CachedLoadResult<T> {
  value: T;
  cacheStatus: Exclude<CacheStatus, "bypass">;
  staleError?: unknown;
}

const BUNDLE_CACHE_VERSION = "v4";
const INDICATOR_BUNDLE_CACHE_VERSION = "v2";
const TABLE_ATTEMPT_LIMIT = 14;
const TABLE_RESULT_TARGET = 6;
const TABLE_SEARCH_BUDGET_MS = 8_000;
const CATALOG_ATTEMPT_LIMIT = 24;
const CATALOG_RESULT_TARGET = 6;
const CATALOG_SEARCH_BUDGET_MS = 10_000;
const INDICATOR_EXACT_QUERY_LIMIT = 5;
const INDICATOR_SANITIZED_QUERY_LIMIT = 4;
const INDICATOR_DISCOVERED_ID_LIMIT = 4;
const INDICATOR_ATTEMPT_LIMIT = 36;
const INDICATOR_RESULT_TARGET = 4;
const INDICATOR_SEARCH_BUDGET_MS = 18_000;

function computeQuestionBonus(
  bundle: KosisTableBundle,
  intent: QueryIntent,
): number {
  let bonus = 0;
  const title = bundle.table.title;
  const optionNames = bundle.previewGuide.itemOptions.map((option) => option.name);
  const dimensionNames = bundle.previewGuide.dimensions.map((dimension) => dimension.name);
  const dimensionValueNames = bundle.previewGuide.dimensions.flatMap((dimension) =>
    dimension.values.map((value) => value.name),
  );
  const contextText = [
    title,
    ...optionNames,
    ...dimensionValueNames,
    ...bundle.meta.comments.map((comment) => readString(comment, "CMMT_DC") ?? ""),
    readString(bundle.explanation ?? {}, "statsNm") ?? "",
  ]
    .join(" ")
    .toLowerCase();
  const hasKeyword = (needle: string) =>
    intent.keywords.some((keyword) => keyword.includes(needle));
  const hasNeetSignal =
    contextText.includes("neet") ||
    ((contextText.includes("교육") || contextText.includes("고용")) &&
      contextText.includes("훈련") &&
      (contextText.includes("참여하지") || contextText.includes("있지 않는")));

  if (hasKeyword("실업")) {
    if (
      title.includes("실업") ||
      optionNames.some((name) => name.includes("실업")) ||
      dimensionValueNames.some((name) => name.includes("실업"))
    ) {
      bonus += 24;
    }
    if (title.includes("고용보조지표")) {
      bonus -= 14;
    }
  }

  if (
    intent.measures.some((measure) =>
      dimensionValueNames.some((name) => name === measure),
    )
  ) {
    bonus += 12;
  }

  if (hasKeyword("고용") || hasKeyword("취업")) {
    if (
      title.includes("고용") ||
      title.includes("취업") ||
      optionNames.some(
        (name) => name.includes("고용") || name.includes("취업"),
      ) ||
      dimensionValueNames.some(
        (name) => name.includes("고용") || name.includes("취업"),
      )
    ) {
      bonus += 18;
    }
  }

  if (hasKeyword("청년")) {
    if (
      title.includes("청년") ||
      dimensionNames.some((name) => name.includes("연령")) ||
      bundle.previewGuide.dimensions.some((dimension) =>
        dimension.values.some((value) => value.name.includes("15 - 29세")),
      )
    ) {
      bonus += 12;
    }
  }

  if (hasKeyword("neet")) {
    if (hasNeetSignal) {
      bonus += 60;
    } else if (title.includes("실업")) {
      bonus -= 18;
    }
  }

  if (title.includes("비경제활동") && !hasKeyword("비경제활동")) {
    bonus -= 6;
  }

  if (intent.geographyScope === "national") {
    if (contextText.includes("세계") || contextText.includes("ilo") || contextText.includes("국제")) {
      bonus -= 34;
    }
    if (dimensionNames.some((name) => name.includes("시도"))) {
      bonus -= 8;
    }
    if (dimensionNames.some((name) => name.includes("성별"))) {
      bonus += 4;
    }
    if (title.includes("총괄")) {
      bonus += 6;
    }
    const hasNationalValue = dimensionValueNames.some((name) =>
      ["대한민국", "전국", "한국", "계"].some((candidate) => name.includes(candidate)),
    );
    if (!hasNationalValue && dimensionNames.some((name) => name.includes("국가") || name.includes("지역"))) {
      bonus -= 28;
    }
  }

  if (!intent.sexSelection && (title.includes("여성") || title.includes("남성"))) {
    bonus -= 36;
  }

  if (hasKeyword("실업") && contextText.includes("경제활동인구조사")) {
    bonus += 14;
  }

  if (intent.measures.includes("실업률")) {
    if (dimensionValueNames.some((name) => name === "실업률")) {
      bonus += 18;
    }
    if (title.includes("경제활동인구 총괄")) {
      bonus += 10;
    }
  }

  if (intent.preferredPrdSe === "Y") {
    const periodCodes = availablePeriodCodes(bundle.meta);
    if (periodCodes.includes("년") || periodCodes.includes("Y")) {
      bonus += 12;
    } else if (periodCodes.includes("월") || periodCodes.includes("M")) {
      bonus -= 6;
    }
  }

  return bonus;
}

function computeSelectionBonus(
  bundle: KosisTableBundle,
  intent: QueryIntent,
  autoSelections?: PreviewRequestOptions,
): number {
  if (!autoSelections) {
    return 0;
  }

  let bonus = 0;
  const selectedItem = autoSelections.itemSelection ?? "";
  const selectedDimensions = Object.values(autoSelections.dimensionSelections ?? {})
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .join(" ");

  const selectionText = `${selectedItem} ${selectedDimensions}`.toLowerCase();

  for (const measure of intent.measures) {
    if (selectionText.includes(measure.toLowerCase())) {
      bonus += 18;
    }
  }

  if (intent.geographyScope === "national" && /전국|대한민국|한국|계|합계/.test(selectionText)) {
    bonus += 10;
  }

  if (intent.sexSelection && selectionText.includes(intent.sexSelection.toLowerCase())) {
    bonus += 6;
  }

  if (
    intent.preferredPrdSe === "Y" &&
    autoSelections.startPrdDe &&
    autoSelections.endPrdDe
  ) {
    bonus += 6;
  }

  if (bundle.dataPreview.length > 0) {
    bonus += 4;
  }

  return bonus;
}

function computeBundleReliabilityBonus(bundle: KosisTableBundle): number {
  let bonus = 0;

  if (bundle.provenance.previewSource === "openapi") {
    bonus += 10;
  } else if (bundle.provenance.previewSource === "html-fallback") {
    bonus += 3;
  }

  if (bundle.provenance.explanationSource === "statId") {
    bonus += 6;
  } else if (bundle.provenance.explanationSource === "orgTbl") {
    bonus += 3;
  }

  if (bundle.meta.weights.length > 0) {
    bonus += 4;
  }

  if (bundle.warnings.length > 0) {
    bonus -= Math.min(bundle.warnings.length * 2, 6);
  }

  return bonus;
}

function computeIndicatorBonus(
  bundle: IndicatorBundle,
  intent: QueryIntent,
): number {
  let bonus = 0;
  const contextText = [
    bundle.indicator.indicatorName,
    bundle.indicator.unit ?? "",
    readString(bundle.explanation ?? {}, "jipyoExplan") ?? "",
    readString(bundle.explanation ?? {}, "jipyoExplan1") ?? "",
    ...bundle.detailRows.map((row) => textFromRecord(row)),
  ]
    .join(" ")
    .toLowerCase();

  for (const measure of intent.measures) {
    if (contextText.includes(measure.toLowerCase())) {
      bonus += 18;
    }
  }

  if (intent.wantsExplanation && bundle.explanation) {
    bonus += 12;
  }

  if (intent.preferredPrdSe && bundle.detailRows.length > 0) {
    bonus += 8;
  }

  if (intent.ageSelection && contextText.includes(intent.ageSelection.toLowerCase())) {
    bonus += 6;
  }

  if (intent.sexSelection && contextText.includes(intent.sexSelection.toLowerCase())) {
    bonus += 4;
  }

  if (bundle.detailRows.length > 0) {
    bonus += 8;
  }

  return bonus;
}

function computeIndicatorReliabilityBonus(bundle: IndicatorBundle): number {
  let bonus = 0;

  if (bundle.provenance.explanationSource !== "none") {
    bonus += 6;
  }
  if (bundle.provenance.detailSource !== "none") {
    bonus += 8;
  }
  if (bundle.provenance.listSource !== "none") {
    bonus += 4;
  }
  if (bundle.warnings.length > 0) {
    bonus -= Math.min(bundle.warnings.length * 2, 6);
  }

  return bonus;
}

function computeTableSelectionPolicyBonus(
  intent: QueryIntent,
  result: NormalizedSearchResult,
  bundle: KosisTableBundle,
): number {
  let bonus = 0;
  const title = bundle.table.title;
  const context = tableContextText(result, bundle);
  const hasNationalDirectness = ["대한민국", "한국", "전국"].some((term) =>
    context.includes(term.toLowerCase()),
  );
  const hasSexAxis = ["성별", "남녀", "남성", "여성", "남자", "여자"].some((term) =>
    context.includes(term.toLowerCase()),
  );
  const hasGapLanguage = ["격차", "차이", "gap"].some((term) =>
    context.includes(term.toLowerCase()),
  );

  if (intent.primaryIntent === "browse") {
    if (String(result.raw.__sourceLane ?? "") === "catalog") {
      bonus += 10;
    }
    if ((result.path ?? "").includes("주제별") || (result.path ?? "").includes("기관별")) {
      bonus += 4;
    }
  }

  if (intent.primaryIntent === "explain") {
    bonus -= 10;
  }

  if (intent.primaryIntent === "trend" || intent.primaryIntent === "value") {
    if (bundle.dataPreview.length > 0) {
      bonus += 6;
    }
  }

  if (intent.geographyScope === "national") {
    bonus += hasNationalDirectness ? 24 : -18;
  }
  if (intent.comparisonAxes.includes("sex")) {
    bonus += hasSexAxis ? 16 : -14;
  }
  if (intent.operationTerms.some((term) => ["격차", "차이"].includes(term))) {
    bonus += hasGapLanguage ? 18 : -12;
  }

  if (intent.primaryIntent === "compare") {
    const targets = compareTargets(intent);
    if (targets.length >= 2) {
      if (title.includes("시군구") || title.includes("시도") || title.includes("읍면동")) {
        bonus -= 36;
      }
      if (title.includes("성별")) {
        bonus -= 8;
      }
      if (intent.keywords.some((keyword) => keyword.includes("건수")) && title.includes("건수")) {
        bonus += 18;
      }
      for (const target of targets) {
        if (target.keywords.every((keyword) => context.includes(keyword))) {
          bonus += 8;
        }
        if (title.includes(target.label) || title.includes(target.label.replace(/\s+/g, ""))) {
          bonus += 48;
        }
      }
      if (
        targets.every((target) =>
          target.keywords.every((keyword) => title.toLowerCase().includes(keyword)),
        ) &&
        title.includes("추이")
      ) {
        bonus += 28;
      }
    }
  }

  return bonus;
}

function computeIndicatorSelectionPolicyBonus(
  intent: QueryIntent,
  bundle: IndicatorBundle,
): number {
  let bonus = 0;
  const prdSeName = bundle.coverage.prdSeName ?? "";
  const indicatorName = bundle.indicator.indicatorName;
  const contextText = [
    indicatorName,
    ...bundle.listMatches.map((row) => textFromRecord(row)),
    ...bundle.detailRows.slice(0, 10).map((row) => textFromRecord(row)),
  ].join(" ").toLowerCase();

  if (intent.primaryIntent === "explain") {
    bonus += 20;
  }

  if (intent.primaryIntent === "trend" || intent.primaryIntent === "value") {
    bonus += 12;
    if (bundle.detailRows.length > 0) {
      bonus += 6;
    }
  }
  if (intent.preferredPrdSe === "Y") {
    if (prdSeName.includes("년") || bundle.coverage.prdSe === "Y") {
      bonus += 24;
    }
    if (prdSeName.includes("월") || bundle.coverage.prdSe === "M") {
      bonus -= 20;
    }
  }
  if (!intent.sexSelection && (indicatorName.includes("여자") || indicatorName.includes("남자"))) {
    bonus -= 24;
  }
  if (!intent.ageSelection && indicatorName.includes("청년")) {
    bonus -= 16;
  }
  if (intent.geographyScope === "national") {
    if (contextText.includes("국가")) {
      bonus += 6;
    }
    if (contextText.includes("시도")) {
      bonus -= 8;
    }
  }
  if (intent.measures.length === 1 && indicatorName === intent.measures[0]) {
    bonus += 18;
  }
  if (indicatorName === "실업률") {
    bonus += 10;
  }

  if (intent.primaryIntent === "browse") {
    bonus -= 8;
  }

  return bonus;
}

function computeCatalogSelectionPolicyBonus(
  intent: QueryIntent,
  result: CatalogResult,
): number {
  let bonus = 0;

  if (intent.primaryIntent === "browse") {
    if (!result.tblId && result.depth === 0) {
      bonus += 12;
    }
    if (result.depth >= 2) {
      bonus += 10;
    }
    if (result.tblId) {
      bonus += 4;
    }
  }

  if (intent.primaryIntent === "explain") {
    bonus -= 10;
  }

  return bonus;
}

interface CompareTarget {
  label: string;
  keywords: string[];
  regionTerms: string[];
  sexTerms: string[];
  ageTerms: string[];
}

function compareTargets(intent: QueryIntent): CompareTarget[] {
  return intent.primaryIntent === "compare" ? intent.targets : [];
}

function compareSearchHints(intent: QueryIntent): string[] {
  const targets = compareTargets(intent);
  if (targets.length < 2) {
    return [];
  }

  return uniqueStrings(
    targets.flatMap((target) => [
      target.label,
      target.label.replace(/\s+/g, ""),
    ]),
  );
}

function compareTopicQueries(intent: QueryIntent): string[] {
  const targets = compareTargets(intent);
  if (targets.length < 2) {
    return [];
  }

  return uniqueStrings(targets.map((target) => target.label));
}

function tableContextText(
  result: NormalizedSearchResult,
  bundle: KosisTableBundle,
): string {
  return [
    bundle.table.title,
    bundle.table.survey ?? "",
    result.tblNm,
    result.statNm ?? "",
    result.path ?? "",
    ...bundle.meta.items.map((row) => readString(row, "ITM_NM") ?? ""),
    ...bundle.meta.comments.map((row) => readString(row, "CMMT_DC") ?? ""),
  ]
    .join(" ")
    .toLowerCase();
}

function coversCompareSubject(
  result: NormalizedSearchResult,
  bundle: KosisTableBundle,
  target: CompareTarget,
): boolean {
  const context = tableContextText(result, bundle);
  return target.keywords.every((keyword) => context.includes(keyword));
}

function compareSubjectSpecificityScore(
  result: NormalizedSearchResult,
  bundle: KosisTableBundle,
  target: CompareTarget,
  allTargets: CompareTarget[],
): number {
  if (!coversCompareSubject(result, bundle, target)) {
    return Number.NEGATIVE_INFINITY;
  }

  const title = bundle.table.title;
  const context = tableContextText(result, bundle);
  const matchedTargetCount = allTargets.filter((candidate) =>
    coversCompareSubject(result, bundle, candidate),
  ).length;
  let score = 0;

  if (title.includes(target.label)) {
    score += 60;
  }
  if (title.includes(target.label.replace(/\s+/g, ""))) {
    score += 48;
  }
  score += overlapCount(target.keywords, title.toLowerCase()) * 14;
  score += overlapCount(target.keywords, context) * 8;
  if (matchedTargetCount > 1) {
    score -= (matchedTargetCount - 1) * 24;
  }
  if (title.includes("조혼인율") || title.includes("조이혼율")) {
    score += 6;
  }
  if (title.includes("시군구") || title.includes("시도") || title.includes("읍면동")) {
    score -= 32;
  }
  if (title.includes("성별")) {
    score -= 8;
  }
  if (title.includes("추이") && matchedTargetCount > 1) {
    score -= 10;
  }

  return score;
}

function selectTableEntries(
  entries: Array<{
    result: NormalizedSearchResult;
    bundle: KosisTableBundle;
    finalScore: number;
    autoSelections?: PreviewRequestOptions;
  }>,
  intent: QueryIntent,
  limit: number,
): Array<{
  result: NormalizedSearchResult;
  bundle: KosisTableBundle;
  finalScore: number;
  autoSelections?: PreviewRequestOptions;
}> {
  if (intent.primaryIntent !== "compare") {
    return entries.slice(0, limit);
  }

  const targets = compareTargets(intent);
  if (targets.length < 2) {
    return entries.slice(0, limit);
  }

  const selected: typeof entries = [];
  const seen = new Set<string>();

  for (const target of targets) {
    const candidate = entries
      .filter((entry) => !seen.has(entry.bundle.table.tableKey))
      .map((entry) => ({
        entry,
        subjectScore: compareSubjectSpecificityScore(
          entry.result,
          entry.bundle,
          target,
          targets,
        ),
      }))
      .filter((entry) => Number.isFinite(entry.subjectScore))
      .sort(
        (left, right) =>
          right.subjectScore - left.subjectScore ||
          right.entry.finalScore - left.entry.finalScore,
      )[0]?.entry;

    if (candidate) {
      selected.push(candidate);
      seen.add(candidate.bundle.table.tableKey);
    }
  }

  if (selected.length >= targets.length) {
    return selected.slice(0, Math.min(limit, selected.length));
  }

  for (const entry of entries) {
    if (selected.length >= limit) {
      break;
    }
    if (seen.has(entry.bundle.table.tableKey)) {
      continue;
    }
    selected.push(entry);
    seen.add(entry.bundle.table.tableKey);
  }

  return selected.slice(0, limit);
}

function preferredSelectionCounts(
  intent: QueryIntent,
  comparisonMode: "auto" | "none" | "pairwise",
): { tables: number; indicators: number; catalogs: number } {
  if (comparisonMode === "pairwise") {
    return { tables: 2, indicators: 2, catalogs: 3 };
  }

  switch (intent.primaryIntent) {
    case "browse":
      return { tables: 2, indicators: 1, catalogs: 4 };
    case "explain":
      return { tables: 1, indicators: 3, catalogs: 2 };
    case "trend":
    case "value":
      return { tables: 2, indicators: 3, catalogs: 2 };
    case "compare":
      return { tables: 3, indicators: 2, catalogs: 3 };
    default:
      return { tables: 3, indicators: 2, catalogs: 3 };
  }
}

function buildAnswerEvidence(input: {
  intent: QueryIntent;
  selectedTables: Array<{
    title: string;
    previewRows: number;
    warnings: string[];
  }>;
  selectedIndicators: Array<{
    indicatorName: string;
    detailRows: number;
    coverage: IndicatorBundle["coverage"];
    warnings: string[];
  }>;
  selectedCatalogs: Array<{
    listName?: string;
    tblNm?: string;
    depth: number;
  }>;
  comparison: ComparisonResult | null;
}): string[] {
  const { intent, selectedTables, selectedIndicators, selectedCatalogs, comparison } = input;

  if (intent.primaryIntent === "explain") {
    return uniqueStrings([
      ...selectedIndicators.flatMap((indicator) => [
        `${indicator.indicatorName} 설명 후보를 확보했습니다.`,
        indicator.detailRows > 0
          ? `${indicator.indicatorName} 상세 수치 ${indicator.detailRows}건을 함께 확보했습니다.`
          : "",
      ]),
      ...selectedTables.slice(0, 1).map((table) =>
        `${table.title} 통계표 설명/preview도 함께 확인 가능합니다.`,
      ),
    ]);
  }

  if (intent.primaryIntent === "browse") {
    return uniqueStrings([
      ...selectedCatalogs.map((catalog) =>
        catalog.tblNm
          ? `목록 탐색에서 통계표 "${catalog.tblNm}"까지 도달했습니다.`
          : catalog.listName
            ? `목록 탐색에서 카테고리 "${catalog.listName}"를 찾았습니다.`
            : "",
      ),
      ...selectedTables.slice(0, 2).map((table) =>
        `${table.title} 통계표를 후속 조회 후보로 확보했습니다.`,
      ),
    ]);
  }

  if (intent.primaryIntent === "trend" || intent.primaryIntent === "value") {
    return uniqueStrings([
      ...selectedIndicators.flatMap((indicator) => [
        indicator.coverage.latest
          ? `${indicator.indicatorName} 최신 시점은 ${indicator.coverage.latest}입니다.`
          : "",
        indicator.detailRows > 0
          ? `${indicator.indicatorName} 상세 수치 ${indicator.detailRows}건을 확보했습니다.`
          : "",
      ]),
      ...selectedTables.slice(0, 2).map((table) =>
        table.previewRows > 0
          ? `${table.title} 통계표 preview ${table.previewRows}건을 확보했습니다.`
          : `${table.title} 통계표는 찾았지만 preview는 비어 있습니다.`,
      ),
    ]);
  }

  if (intent.primaryIntent === "compare") {
    return uniqueStrings([
      comparison ? `비교 가능한 표 ${comparison.summary.tableCount}개를 묶었습니다.` : "",
      ...selectedTables.slice(0, 2).map((table) =>
        `${table.title} 비교 후보를 확보했습니다.`,
      ),
    ]);
  }

  return uniqueStrings([
    ...selectedTables.slice(0, 2).map((table) =>
      `${table.title} 통계표를 찾았습니다.`,
    ),
    ...selectedIndicators.slice(0, 1).map((indicator) =>
      `${indicator.indicatorName} 지표 후보를 찾았습니다.`,
    ),
  ]);
}

function buildNextQuestionsByIntent(input: {
  intent: QueryIntent;
  selectedTables: Array<{
    title: string;
    warnings: string[];
  }>;
  selectedIndicators: Array<{
    indicatorName: string;
    warnings: string[];
  }>;
  selectedCatalogs: Array<{
    listName?: string;
    depth: number;
  }>;
  comparison: ComparisonResult | null;
  searchResultCount: number;
  indicatorResultCount: number;
  catalogResultCount: number;
}): string[] {
  const {
    intent,
    selectedTables,
    selectedIndicators,
    selectedCatalogs,
    comparison,
    searchResultCount,
    indicatorResultCount,
    catalogResultCount,
  } = input;

  const generic = uniqueStrings([
    searchResultCount === 0 && indicatorResultCount === 0
      ? "비교하려는 대상, 기간, 지역을 더 구체적으로 알려주세요."
      : "",
    selectedTables.some((entry) => entry.warnings.length > 0)
      ? "preview가 필요한 경우 기간이나 지역을 좁혀 다시 조회하세요."
      : "",
    selectedIndicators.some((entry) => entry.warnings.length > 0)
      ? "지표 수치가 비면 기간이나 지표명을 더 구체적으로 지정해 다시 조회하세요."
      : "",
    comparison?.warnings.includes("단위가 일치하지 않아 직접 비교가 제한됩니다.")
      ? "단위를 맞출 수 있는 지표나 동일 계열 표만 다시 골라 비교할까요?"
      : "",
    comparison?.warnings.includes("공통 분류 차원을 찾지 못했습니다.")
      ? "지역, 성별, 연령처럼 공통 분류 기준을 지정해 다시 비교할까요?"
      : "",
  ]);

  if (intent.primaryIntent === "browse") {
    return uniqueStrings([
      catalogResultCount > 0 && selectedCatalogs[0]?.listName
        ? `"${selectedCatalogs[0].listName}" 아래로 더 내려가 볼까요?`
        : "",
      "주제, 기관, 지역 중 어느 축으로 더 좁힐지 정하면 바로 후속 탐색하겠습니다.",
      ...generic,
    ]);
  }

  if (intent.primaryIntent === "explain") {
    return uniqueStrings([
      selectedIndicators[0]?.indicatorName
        ? `${selectedIndicators[0].indicatorName}의 최근 수치나 시계열도 이어서 볼까요?`
        : "",
      "정의 다음에는 보통 기간, 지역, 성별 기준으로 좁히면 바로 쓸 수 있습니다.",
      ...generic,
    ]);
  }

  if (intent.primaryIntent === "trend" || intent.primaryIntent === "value") {
    return uniqueStrings([
      "기간, 지역, 성별 중 하나만 더 정하면 결과가 훨씬 또렷해집니다.",
      selectedTables[0]?.title
        ? `${selectedTables[0].title} 기준으로 최근 3개 시점만 다시 볼까요?`
        : "",
      ...generic,
    ]);
  }

  if (intent.primaryIntent === "compare") {
    return uniqueStrings([
      "비교 기준을 기간, 지역, 성별 중 하나로 고정하면 결과 해석이 훨씬 쉬워집니다.",
      ...generic,
    ]);
  }

  return generic;
}

function buildAnswerSummary(input: {
  intent: QueryIntent;
  selectedTables: Array<{
    title: string;
    previewRows: number;
  }>;
  selectedIndicators: Array<{
    indicatorName: string;
    detailRows: number;
    coverage: IndicatorBundle["coverage"];
  }>;
  selectedCatalogs: Array<{
    listName?: string;
    tblNm?: string;
    depth: number;
  }>;
  comparison: ComparisonResult | null;
}): AnswerBundle["summary"] {
  const { intent, selectedTables, selectedIndicators, selectedCatalogs, comparison } = input;

  if (intent.primaryIntent === "explain") {
    const indicator = selectedIndicators[0];
    return {
      headline: indicator
        ? `${indicator.indicatorName} 설명 자료를 우선 확보했습니다.`
        : "설명형 질문으로 해석했지만 핵심 지표 설명은 약합니다.",
      takeaway: indicator
        ? `${indicator.indicatorName}의 정의와 연결 수치를 함께 볼 수 있는 상태입니다.`
        : "지표명이나 조사명을 더 구체적으로 주면 설명 정확도가 올라갑니다.",
      recommendedFocus: indicator?.indicatorName,
    };
  }

  if (intent.primaryIntent === "browse") {
    const catalog = selectedCatalogs[0];
    return {
      headline: catalog?.listName
        ? `"${catalog.listName}" 중심으로 후속 탐색 후보를 확보했습니다.`
        : "탐색형 질문으로 보고 카탈로그 후보를 확보했습니다.",
      takeaway: selectedTables[0]
        ? `${selectedTables[0].title} 같은 통계표까지 연결할 수 있습니다.`
        : "카테고리부터 좁혀 들어가는 방식이 가장 안정적입니다.",
      recommendedFocus: catalog?.listName ?? selectedTables[0]?.title,
    };
  }

  if (intent.primaryIntent === "trend" || intent.primaryIntent === "value") {
    const indicator = selectedIndicators[0];
    const table = selectedTables[0];
    return {
      headline: indicator
        ? `${indicator.indicatorName} 수치/시계열 후보를 우선 확보했습니다.`
        : table
          ? `${table.title} 통계표 preview를 우선 확보했습니다.`
          : "수치형 질문으로 해석했지만 바로 쓸 수 있는 값은 약합니다.",
      takeaway: indicator?.coverage.latest
        ? `현재 확보한 최신 시점은 ${indicator.coverage.latest}입니다.`
        : table?.previewRows
          ? `통계표 preview ${table.previewRows}건을 바로 확인할 수 있습니다.`
          : "기간이나 지역을 더 좁히면 바로 usable output으로 갈 수 있습니다.",
      recommendedFocus: indicator?.indicatorName ?? table?.title,
    };
  }

  if (intent.primaryIntent === "compare") {
    return {
      headline: comparison
        ? `비교 가능한 후보 ${comparison.summary.tableCount}개를 묶었습니다.`
        : "비교형 질문으로 해석했지만 비교 가능한 표는 제한적입니다.",
      takeaway: comparison?.summary.comparable
        ? "단위와 공통 차원이 어느 정도 맞아서 후속 비교 해석이 가능합니다."
        : "비교 기준을 더 좁혀야 해석 가능한 비교가 됩니다.",
      recommendedFocus: selectedTables[0]?.title,
    };
  }

  return {
    headline: selectedTables[0]
      ? `${selectedTables[0].title} 통계표를 우선 후보로 잡았습니다.`
      : selectedIndicators[0]
        ? `${selectedIndicators[0].indicatorName} 지표를 우선 후보로 잡았습니다.`
        : "질문에 맞는 후보는 찾았지만 아직 요약이 약합니다.",
    takeaway: selectedIndicators[0]
      ? "표와 지표를 함께 보면서 질문을 좁혀가는 흐름이 적절합니다."
      : "후속 기간/지역 조건을 주면 바로 더 좁힐 수 있습니다.",
    recommendedFocus: selectedTables[0]?.title ?? selectedIndicators[0]?.indicatorName,
  };
}

function wantsCatalogBrowse(question: string, intent: QueryIntent): boolean {
  return (
    intent.primaryIntent === "browse" ||
    question.includes("주제") ||
    question.includes("기관") ||
    question.includes("목록") ||
    question.includes("분야") ||
    question.includes("어떤 자료") ||
    question.includes("뭐가 있") ||
    intent.geographyScope === "regional"
  );
}

function selectCatalogViews(question: string, intent: QueryIntent): CatalogView[] {
  const views = [...DEFAULT_CATALOG_VIEWS];

  if (intent.geographyScope === "regional") {
    return views.filter((view) =>
      ["MT_ATITLE01", "MT_ATITLE02", "MT_GTITLE01", "MT_ZTITLE"].includes(view.vwCd),
    );
  }

  if (question.includes("기관")) {
    return views.filter((view) =>
      ["MT_OTITLE", "MT_ATITLE02", "MT_ZTITLE"].includes(view.vwCd),
    );
  }

  if (question.includes("영문") || intent.geographyScope === "global") {
    return views.filter((view) => ["MT_ETITLE", "MT_ZTITLE"].includes(view.vwCd));
  }

  return views.filter((view) =>
    ["MT_ZTITLE", "MT_OTITLE", "MT_ATITLE01"].includes(view.vwCd),
  );
}

function maxCatalogDepth(intent: QueryIntent): number {
  if (intent.primaryIntent === "browse") {
    return 2;
  }
  if (intent.geographyScope === "regional") {
    return 2;
  }
  return 1;
}

function scoreCatalogRecord(
  tokens: string[],
  query: string,
  view: CatalogView,
  record: JsonRecord,
  depth: number,
  queryIndex: number,
  rankIndex: number,
): { score: number; whyMatched: string[] } {
  const haystack = textFromRecord(record);
  const overlap = overlapCount(tokens, haystack);
  const listName = readString(record, "LIST_NM") ?? "";
  const tableName = readString(record, "TBL_NM") ?? "";
  const displayName = tableName || listName;
  let score = 84 - queryIndex * 10 - rankIndex * 3 - depth * 2;
  score += overlap * 8;

  if (displayName.toLowerCase().includes(query.toLowerCase())) {
    score += 10;
  }
  if (tableName) {
    score += 8;
  }
  if (depth > 0 && tableName) {
    score += 6;
  }
  if (view.name.includes("지역") && tokens.some((token) => ["지역", "시도", "행정구역"].includes(token))) {
    score += 6;
  }
  if (view.name.includes("기관") && tokens.some((token) => ["기관", "부처", "통계청"].includes(token))) {
    score += 6;
  }

  const whyMatched = uniqueStrings([
    overlap > 0 ? `질문 키워드 ${overlap}개와 목록명/통계표명이 겹침` : "",
    tableName ? "목록 탐색 중 실제 통계표 후보로 확인됨" : "목록 탐색 중 관련 카테고리로 확인됨",
    `${view.name} 뷰에서 탐색됨`,
    depth > 0 ? "하위 목록까지 확장 탐색함" : "",
  ]);

  return { score, whyMatched };
}

function normalizeCatalogRecord(
  view: CatalogView,
  record: JsonRecord,
  score: number,
  whyMatched: string[],
  depth: number,
): CatalogResult | null {
  const catalogKey = catalogKeyFromRecord(view, record);
  if (!catalogKey) {
    return null;
  }

  return {
    catalogKey,
    vwCd: view.vwCd,
    viewName: view.name,
    listId: readString(record, "LIST_ID"),
    listName: readString(record, "LIST_NM"),
    orgId: readString(record, "ORG_ID"),
    tblId: readString(record, "TBL_ID"),
    tblNm: readString(record, "TBL_NM"),
    statId: readString(record, "STAT_ID"),
    score,
    whyMatched,
    depth,
    raw: record,
  };
}

function catalogToSearchResult(result: CatalogResult): NormalizedSearchResult | null {
  if (!result.orgId || !result.tblId || !result.tblNm) {
    return null;
  }

  return {
    tableKey: tableKey(result.orgId, result.tblId),
    orgId: result.orgId,
    tblId: result.tblId,
    statId: result.statId,
    tblNm: result.tblNm,
    statNm: undefined,
    organization: undefined,
    period: {},
    path: `${result.viewName}${result.listName ? ` > ${result.listName}` : ""}`,
    score: result.score,
    whyMatched: result.whyMatched,
    raw: {
      ...result.raw,
      __sourceLane: "catalog",
    },
  };
}

function buildComparisonResult(
  bundles: KosisTableBundle[],
  options?: { focus?: string; timeRange?: string; regions?: string[] },
): ComparisonResult {
  const commonDimensions = intersectStrings(
    bundles.map((bundle) => bundle.dimensions),
  );
  const commonPeriods = intersectStrings(
    bundles.map((bundle) => bundle.coverage.periods),
  );
  const commonUnits = intersectStrings(bundles.map((bundle) => bundle.units));
  const valueComparisonMatrix = buildValueComparisonMatrix(bundles);
  const hasNumericMatrix = valueComparisonMatrix.length > 0;

  const warnings: string[] = [];
  if (commonDimensions.length === 0) {
    warnings.push("공통 분류 차원을 찾지 못했습니다.");
  }
  if (commonUnits.length === 0 && !hasNumericMatrix) {
    warnings.push("단위가 일치하지 않아 직접 비교가 제한됩니다.");
  }
  if (!hasNumericMatrix) {
    warnings.push("연도별 수치 비교표를 만들 수 있는 preview 수치가 부족합니다.");
  }

  const comparisonMatrix =
    valueComparisonMatrix.length > 0
      ? valueComparisonMatrix
      : bundles.map((bundle) => ({
          tableKey: bundle.table.tableKey,
          title: bundle.table.title,
          organization: bundle.table.organization,
          survey: bundle.table.survey,
          lastPeriod: bundle.table.period,
          units: bundle.units,
          dimensions: bundle.dimensions,
          previewRows: bundle.dataPreview.length,
          warnings: bundle.warnings,
        }));

  const keyDifferences = uniqueStrings([
    ...bundles.flatMap((bundle) =>
      bundle.units.length > 0
        ? [`${bundle.table.title}: 단위 ${bundle.units.join(", ")}`]
        : [],
    ),
    ...bundles.flatMap((bundle) =>
      bundle.coverage.periods.length > 0
        ? [
            `${bundle.table.title}: 수록시점 ${bundle.coverage.periods
              .slice(0, 4)
              .join(", ")}`,
          ]
        : [],
    ),
  ]);

  const analysisHints = uniqueStrings([
    hasNumericMatrix
      ? "연도별 수치 비교표를 바로 사용할 수 있습니다."
      : "",
    commonDimensions.length > 0
      ? `공통 차원 ${commonDimensions.join(", ")} 기준으로 후속 질의를 좁히세요.`
      : "행정구역, 연령, 산업 등 비교 기준 차원을 직접 지정하면 더 정확해집니다.",
    commonPeriods.length > 0
      ? `공통 수록시점 ${commonPeriods.slice(-3).join(", ")} 중심 비교가 가능합니다.`
      : "공통 시점이 없으면 동일 기간을 지정해 다시 조회하는 것이 좋습니다.",
    options?.focus ? `비교 초점 "${options.focus}" 기준으로 해석을 이어가면 됩니다.` : "",
    options?.timeRange ? `planner가 잡은 기간 축은 ${options.timeRange}입니다.` : "",
    options?.regions && options.regions.length > 0
      ? `planner가 잡은 지역 축은 ${options.regions.join(", ")}입니다.`
      : "",
  ]);

  return {
    tables: bundles.map(summaryRow),
    summary: {
      tableCount: bundles.length,
      comparable:
        hasNumericMatrix ||
        (commonDimensions.length > 0 && commonUnits.length > 0),
      sharedUnitCount: commonUnits.length,
      sharedDimensionCount: commonDimensions.length,
      sharedPeriodCount: commonPeriods.length,
    },
    commonDimensions,
    comparisonMatrix,
    keyDifferences,
    warnings,
    analysisHints,
    evidence: uniqueStrings([
      options?.timeRange ? `기간 계획: ${options.timeRange}` : "",
      options?.regions && options.regions.length > 0
        ? `지역 계획: ${options.regions.join(", ")}`
        : "",
      ...bundles.flatMap((bundle) => bundle.warnings),
      ...bundles.flatMap((bundle) =>
        bundle.dataPreview.slice(0, 3).map((row) => textFromRecord(row)),
      ),
    ]),
  };
}

export class KosisService {
  constructor(
    private readonly client: KosisClient,
    private readonly cache: FileCache,
    private readonly defaultLimit: number,
  ) {}

  private async loadWithCache<T>(
    namespace: string,
    key: string,
    loader: () => Promise<T>,
    shouldUseStaleOnError?: (error: unknown) => boolean,
  ): Promise<CachedLoadResult<T>> {
    const cached = await this.cache.getWithStatus<T>(namespace, key);
    if (cached.status === "fresh" && cached.value !== null) {
      return {
        value: cached.value,
        cacheStatus: "fresh-hit",
      };
    }

    try {
      const value = await loader();
      await this.cache.set(namespace, key, value);
      return {
        value,
        cacheStatus:
          cached.status === "stale" ? "expired-revalidate-success" : "miss",
      };
    } catch (error) {
      if (
        cached.status === "stale" &&
        cached.value !== null &&
        shouldUseStaleOnError?.(error)
      ) {
        return {
          value: cached.value,
          cacheStatus: "expired-revalidate-failed-stale-used",
          staleError: error,
        };
      }
      throw error;
    }
  }

  private buildCacheFallbackAttempt(
    provider: string,
    note: string,
  ): ProviderAttemptLog {
    return {
      provider,
      strategy: "stale-cache-fallback",
      cacheStatus: "expired-revalidate-failed-stale-used",
      outcome: "stale-ok",
      rowCount: 0,
      notes: [note],
    };
  }

  private async resolveTablePreview(input: {
    orgId: string;
    tblId: string;
    tableKey: string;
    prdSe?: string;
    previewPlan: PreviewPlan;
    previewOptions?: PreviewRequestOptions;
    meta: KosisMetaBundle;
    resolvedSelections: Record<string, string | undefined>;
  }): Promise<{
    dataPreview: DataPreviewRow[];
    previewSource: KosisTableBundle["provenance"]["previewSource"];
    effectivePreviewPrdSe: string;
    previewAttempts: PreviewAttemptLog[];
    warning?: string;
  }> {
    const previewAttempts: PreviewAttemptLog[] = [];
    let dataPreview: DataPreviewRow[] = [];
    let previewSource: KosisTableBundle["provenance"]["previewSource"] = "none";
    let effectivePreviewPrdSe = input.previewPlan.prdSe;
    let lastFailureNote = "미상";

    for (const [attemptIndex, objParams] of input.previewPlan.attempts.entries()) {
      try {
        const preview = await this.client.getStatisticsData({
          orgId: input.orgId,
          tblId: input.tblId,
          prdSe: input.previewPlan.prdSe,
          itmId: input.previewPlan.itemId,
          newEstPrdCnt: input.previewOptions?.newEstPrdCnt ?? 5,
          startPrdDe: input.previewOptions?.startPrdDe,
          endPrdDe: input.previewOptions?.endPrdDe,
          objParams,
        });
        dataPreview = preview.slice(0, 50).map((row) => ({
          ...row,
          tableKey: input.tableKey,
        }));
        previewAttempts.push({
          provider: "statisticsData",
          strategy: `preview-openapi-${attemptIndex + 1}`,
          cacheStatus: "bypass",
          outcome: dataPreview.length > 0 ? "ok" : "empty",
          rowCount: dataPreview.length,
          itemId: input.previewPlan.itemId,
          prdSe: input.previewPlan.prdSe,
          attemptIndex,
          notes: [
            `obj params: ${JSON.stringify(objParams)}`,
            dataPreview.length > 0
              ? "usable preview를 확보했습니다."
              : "응답은 왔지만 preview가 비었습니다.",
          ],
        });
        if (dataPreview.length > 0) {
          previewSource = "openapi";
          break;
        }
      } catch (error) {
        const classification = classifyKosisError(error);
        lastFailureNote = classification.note;
        previewAttempts.push({
          provider: "statisticsData",
          strategy: `preview-openapi-${attemptIndex + 1}`,
          cacheStatus: "bypass",
          outcome: "error",
          rowCount: 0,
          itemId: input.previewPlan.itemId,
          prdSe: input.previewPlan.prdSe,
          attemptIndex,
          errorType: classification.errorType,
          errorClass: classification.errorClass,
          notes: [
            `obj params: ${JSON.stringify(objParams)}`,
            classification.note,
          ],
        });
      }
    }

    if (dataPreview.length > 0) {
      return {
        dataPreview,
        previewSource,
        effectivePreviewPrdSe,
        previewAttempts,
      };
    }

    try {
      const fallbackPreview = await fetchHtmlPreviewFallback(
        this.client.config,
        input.orgId,
        input.tblId,
        input.tableKey,
        {
          ...input.previewOptions,
          preferredPrdSe: mapPeriodCode(
            input.prdSe ?? input.previewOptions?.preferredPrdSe ?? input.previewPlan.prdSe,
          ) as PreviewRequestOptions["preferredPrdSe"],
        },
        input.meta,
        input.resolvedSelections,
      );

      const fallbackRows = fallbackPreview?.rows.slice(0, 20) ?? [];
      previewAttempts.push({
        provider: "htmlPreviewFallback",
        strategy: "html-preview-fallback",
        cacheStatus: "bypass",
        outcome: fallbackRows.length > 0 ? "ok" : "empty",
        rowCount: fallbackRows.length,
        itemId: input.previewPlan.itemId,
        prdSe: mapPeriodCode(fallbackPreview?.periodCode ?? input.previewPlan.prdSe),
        attemptIndex: input.previewPlan.attempts.length,
        notes: [
          fallbackRows.length > 0
            ? "OpenAPI preview 실패 후 HTML fallback에서 usable preview를 확보했습니다."
            : "HTML fallback도 비어 있어 preview를 만들지 못했습니다.",
        ],
      });
      if (fallbackRows.length > 0 && fallbackPreview) {
        return {
          dataPreview: fallbackRows,
          previewSource: "html-fallback",
          effectivePreviewPrdSe: mapPeriodCode(fallbackPreview.periodCode),
          previewAttempts,
        };
      }
    } catch (error) {
      const classification = classifyKosisError(error);
      previewAttempts.push({
        provider: "htmlPreviewFallback",
        strategy: "html-preview-fallback",
        cacheStatus: "bypass",
        outcome: "error",
        rowCount: 0,
        itemId: input.previewPlan.itemId,
        prdSe: input.previewPlan.prdSe,
        attemptIndex: input.previewPlan.attempts.length,
        errorType: classification.errorType,
        errorClass: classification.errorClass,
        notes: [classification.note],
      });
    }

    return {
      dataPreview: [],
      previewSource: "none",
      effectivePreviewPrdSe,
      previewAttempts,
      warning: `preview 조회 실패: ${lastFailureNote} (itmId=${input.previewPlan.itemId}, prdSe=${input.previewPlan.prdSe})`,
    };
  }

  planQuestion(
    question: string,
    searchHints: string[] = [],
  ): QuestionPlan {
    return buildQuestionPlan(question, searchHints);
  }

  private async executeTopicSearch(input: {
    question: string;
    intent: QueryIntent;
    keywords: string[];
    queryPlan: QueryPlanItem[];
    limit: number;
  }): Promise<SearchTopicsResult> {
    const aggregate = new Map<string, NormalizedSearchResult>();
    const attempts = buildTableSearchAttempts(
      input.question,
      input.intent,
      input.queryPlan,
    );
    const attemptLogs: SearchAttemptLog[] = [];
    const startedAt = Date.now();
    const targetResultCount = Math.max(input.limit, TABLE_RESULT_TARGET);

    for (const [queryIndex, attempt] of attempts.entries()) {
      if (attemptLogs.length >= TABLE_ATTEMPT_LIMIT) {
        appendBudgetStopNote(attemptLogs, {
          query: attempt.query,
          provider: "statisticsSearch",
          strategy: "budget-stop-attempt-limit",
          note: "표 검색 attempt 상한에 도달해 여기서 멈춥니다.",
        });
        break;
      }
      if (Date.now() - startedAt >= TABLE_SEARCH_BUDGET_MS) {
        appendBudgetStopNote(attemptLogs, {
          query: attempt.query,
          provider: "statisticsSearch",
          strategy: "budget-stop-wall-clock",
          note: "표 검색 시간 예산을 넘겨 현재 후보로 마감합니다.",
        });
        break;
      }
      try {
        const records = await this.client.searchStatistics({
          searchNm: attempt.query,
          resultCount: Math.max(input.limit * 2, 10),
        });
        attemptLogs.push({
          query: attempt.query,
          provider: "statisticsSearch",
          strategy: attempt.strategy,
          cacheStatus: "bypass",
          outcome: records.length > 0 ? "ok" : "empty",
          rowCount: records.length,
          notes: [
            records.length > 0
              ? "통합검색에서 표 후보를 확보했습니다."
              : "검색은 성공했지만 결과가 비었습니다.",
          ],
        });

        for (const [rankIndex, record] of records.entries()) {
          const { score, whyMatched } = scoreSearchRecord(
            input.keywords,
            attempt.query,
            queryIndex,
            rankIndex,
            record,
            input.intent,
          );
          const normalized = normalizeSearchRecord(record, score, whyMatched);
          if (!normalized) {
            continue;
          }

          const current = aggregate.get(normalized.tableKey);
          if (!current || current.score < normalized.score) {
            aggregate.set(normalized.tableKey, normalized);
          } else {
            current.score += 3;
            current.whyMatched = uniqueStrings([
              ...current.whyMatched,
              ...normalized.whyMatched,
            ]);
          }
        }
        if (
          aggregate.size >= targetResultCount &&
          queryIndex >= 1 &&
          attemptLogs.filter((entry) => entry.outcome === "ok").length >= 2
        ) {
          appendBudgetStopNote(attemptLogs, {
            query: attempt.query,
            provider: "statisticsSearch",
            strategy: "budget-stop-enough-results",
            note: "표 후보가 충분해 추가 재시도 없이 마감합니다.",
          });
          break;
        }
      } catch (error) {
        const classification = classifyKosisError(error);
        attemptLogs.push({
          query: attempt.query,
          provider: "statisticsSearch",
          strategy: attempt.strategy,
          cacheStatus: "bypass",
          outcome: "error",
          rowCount: 0,
          errorType: classification.errorType,
          errorClass: classification.errorClass,
          notes: [classification.note],
        });
        if (!classification.shouldFallback) {
          throw error;
        }
      }
    }

    const results = [...aggregate.values()]
      .sort((left, right) => right.score - left.score)
      .slice(0, input.limit);

    if (shouldUseStaleBecauseOutputIsNotUsable(attemptLogs, results.length)) {
      throw new KosisApiError(
        "usable output을 만들지 못해 stale cache fallback 후보로 전환합니다.",
        "50",
      );
    }

    return {
      cacheStatus: "miss",
      queryPlan: input.queryPlan,
      attempts: attemptLogs,
      results,
    };
  }

  private async executeIndicatorSearch(input: {
    question: string;
    intent: QueryIntent;
    keywords: string[];
    queryPlan: QueryPlanItem[];
    limit: number;
  }): Promise<SearchIndicatorsResult> {
    const aggregate = new Map<string, NormalizedIndicatorResult>();
    const attemptLogs: IndicatorSearchAttemptLog[] = [];
    const attempts = buildIndicatorAttempts(
      input.question,
      input.intent,
      input.queryPlan,
      INDICATOR_EXACT_QUERY_LIMIT,
      INDICATOR_SANITIZED_QUERY_LIMIT,
    );
    const discoveredIds = new Set<string>();
    const indicatorSearchWindow = Math.max(input.limit * 6, 30);
    const startedAt = Date.now();
    const targetResultCount = Math.max(input.limit, INDICATOR_RESULT_TARGET);
    const pushRecords = (
      records: JsonRecord[],
      query: string,
      queryIndex: number,
      strategy: IndicatorSearchAttempt["strategy"],
      baseBonus = 0,
    ) => {
      for (const [rankIndex, record] of records.entries()) {
        const indicatorId = readString(record, "statJipyoId") ?? readString(record, "jipyoId");
        if (indicatorId) {
          discoveredIds.add(indicatorId);
        }

        const { score, whyMatched } = scoreIndicatorRecord(
          input.keywords,
          query,
          queryIndex,
          rankIndex,
          record,
          input.intent,
        );
        const normalized = normalizeIndicatorRecord(
          record,
          score + baseBonus,
          whyMatched,
          query,
          strategy,
        );
        if (!normalized) {
          continue;
        }

        const current = aggregate.get(normalized.indicatorKey);
        if (!current || current.score < normalized.score) {
          aggregate.set(normalized.indicatorKey, normalized);
        } else {
          current.score += 2;
          current.whyMatched = uniqueStrings([
            ...current.whyMatched,
            ...normalized.whyMatched,
          ]);
          current.matchedQueries = uniqueStrings([
            ...current.matchedQueries,
            ...normalized.matchedQueries,
          ]);
          current.matchedStrategies = uniqueStrings([
            ...current.matchedStrategies,
            ...normalized.matchedStrategies,
          ]);
          current.raw = {
            ...current.raw,
            ...normalized.raw,
          };
        }
      }
    };

    for (const [queryIndex, attempt] of attempts.entries()) {
      if (attemptLogs.length >= INDICATOR_ATTEMPT_LIMIT) {
        appendBudgetStopNote(attemptLogs, {
          query: attempt.query,
          provider: "indicatorListByName",
          strategy: "budget-stop-attempt-limit",
          note: "지표 검색 attempt 상한에 도달해 여기서 멈춥니다.",
        });
        break;
      }
      if (Date.now() - startedAt >= INDICATOR_SEARCH_BUDGET_MS) {
        appendBudgetStopNote(attemptLogs, {
          query: attempt.query,
          provider: "indicatorListByName",
          strategy: "budget-stop-wall-clock",
          note: "지표 검색 시간 예산을 넘겨 현재 후보로 마감합니다.",
        });
        break;
      }
      try {
        switch (attempt.strategy) {
          case "list-exact":
          case "list-sanitized": {
            const records = await this.client.searchIndicatorLists({
              indicatorName: attempt.query,
              numOfRows: indicatorSearchWindow,
            });
            attemptLogs.push({
              query: attempt.query,
              provider: "indicatorListByName",
              strategy: attempt.strategy,
              cacheStatus: "bypass",
              outcome: records.length > 0 ? "ok" : "empty",
              rowCount: records.length,
              notes: ["지표 목록 후보를 조회했습니다."],
            });
            pushRecords(
              records,
              attempt.query,
              queryIndex,
              attempt.strategy,
              attempt.strategy === "list-sanitized" ? 4 : 0,
            );
            break;
          }
          case "explain-exact":
          case "explain-sanitized": {
            const records = await this.client.getIndicatorExplanationByName({
              indicatorName: attempt.query,
              numOfRows: indicatorSearchWindow,
            });
            attemptLogs.push({
              query: attempt.query,
              provider: "indicatorExplainByName",
              strategy: attempt.strategy,
              cacheStatus: "bypass",
              outcome: records.length > 0 ? "ok" : "empty",
              rowCount: records.length,
              notes: ["지표 설명 후보를 조회했습니다."],
            });
            pushRecords(
              records,
              attempt.query,
              queryIndex,
              attempt.strategy,
              attempt.strategy === "explain-sanitized" ? 4 : 0,
            );
            break;
          }
          case "detail-exact":
          case "detail-sanitized": {
            const records = await this.client.getIndicatorDetailByName({
              indicatorName: attempt.query,
              srvRn: input.intent.recentPeriods ? Math.min(input.intent.recentPeriods, 12) : 5,
              numOfRows: indicatorSearchWindow,
            });
            attemptLogs.push({
              query: attempt.query,
              provider: "indicatorDetailByName",
              strategy: attempt.strategy,
              cacheStatus: "bypass",
              outcome: records.length > 0 ? "ok" : "empty",
              rowCount: records.length,
              notes: ["지표 상세 수치 후보를 조회했습니다."],
            });
            pushRecords(
              records,
              attempt.query,
              queryIndex,
              attempt.strategy,
              attempt.strategy === "detail-sanitized" ? 6 : 2,
            );
            break;
          }
          case "id-explain":
          case "id-detail":
            break;
        }
        const enoughIndicatorCandidates =
          aggregate.size >= targetResultCount &&
          attemptLogs.filter((entry) => entry.outcome === "ok").length >= 3;
        if (enoughIndicatorCandidates) {
          appendBudgetStopNote(attemptLogs, {
            query: attempt.query,
            provider: "indicatorListByName",
            strategy: "budget-stop-enough-results",
            note: "지표 후보가 충분해 이름 기반 재시도를 여기서 멈춥니다.",
          });
          break;
        }
      } catch (error) {
        const classification = classifyKosisError(error);
        attemptLogs.push({
          query: attempt.query,
          provider:
            attempt.strategy.startsWith("list")
              ? "indicatorListByName"
              : attempt.strategy.startsWith("explain")
                ? "indicatorExplainByName"
                : "indicatorDetailByName",
          strategy: attempt.strategy,
          cacheStatus: "bypass",
          outcome: "error",
          rowCount: 0,
          errorType: classification.errorType,
          errorClass: classification.errorClass,
          notes: [classification.note],
        });
        if (!classification.shouldFallback) {
          throw error;
        }
      }
    }

    const discoveredIdList = [...discoveredIds].slice(0, INDICATOR_DISCOVERED_ID_LIMIT);
    for (const [idIndex, indicatorId] of discoveredIdList.entries()) {
      if (attemptLogs.length >= INDICATOR_ATTEMPT_LIMIT) {
        appendBudgetStopNote(attemptLogs, {
          query: indicatorId,
          provider: "indicatorExplainById",
          strategy: "budget-stop-attempt-limit",
          note: "지표 ID 보강 attempt 상한에 도달해 멈춥니다.",
        });
        break;
      }
      if (Date.now() - startedAt >= INDICATOR_SEARCH_BUDGET_MS) {
        appendBudgetStopNote(attemptLogs, {
          query: indicatorId,
          provider: "indicatorExplainById",
          strategy: "budget-stop-wall-clock",
          note: "지표 ID 보강 시간 예산을 넘겨 현재 후보로 마감합니다.",
        });
        break;
      }
      try {
        const explainRows = await this.client.getIndicatorExplanationById({
          indicatorId,
          numOfRows: 5,
        });
        attemptLogs.push({
          query: indicatorId,
          provider: "indicatorExplainById",
          strategy: "id-explain",
          cacheStatus: "bypass",
          outcome: explainRows.length > 0 ? "ok" : "empty",
          rowCount: explainRows.length,
          notes: ["지표 ID 기반 설명자료를 보강했습니다."],
        });
        pushRecords(explainRows, indicatorId, attempts.length + idIndex, "id-explain", 8);
      } catch (error) {
        const classification = classifyKosisError(error);
        attemptLogs.push({
          query: indicatorId,
          provider: "indicatorExplainById",
          strategy: "id-explain",
          cacheStatus: "bypass",
          outcome: "error",
          rowCount: 0,
          errorType: classification.errorType,
          errorClass: classification.errorClass,
          notes: [classification.note],
        });
        if (!classification.shouldFallback) {
          throw error;
        }
      }

      if (
        aggregate.size >= targetResultCount &&
        attemptLogs.filter((entry) => entry.provider === "indicatorExplainById" && entry.outcome === "ok").length >= 1
      ) {
        appendBudgetStopNote(attemptLogs, {
          query: indicatorId,
          provider: "indicatorExplainById",
          strategy: "budget-stop-enough-results",
          note: "지표 설명 후보가 충분해 ID 보강을 줄입니다.",
        });
        break;
      }

      try {
        const detailRows = await this.client.getIndicatorDetailById({
          indicatorId,
          srvRn: input.intent.recentPeriods ? Math.min(input.intent.recentPeriods, 12) : 5,
          numOfRows: 10,
        });
        attemptLogs.push({
          query: indicatorId,
          provider: "indicatorDetailById",
          strategy: "id-detail",
          cacheStatus: "bypass",
          outcome: detailRows.length > 0 ? "ok" : "empty",
          rowCount: detailRows.length,
          notes: ["지표 ID 기반 상세 수치를 보강했습니다."],
        });
        pushRecords(detailRows, indicatorId, attempts.length + idIndex, "id-detail", 10);
      } catch (error) {
        const classification = classifyKosisError(error);
        attemptLogs.push({
          query: indicatorId,
          provider: "indicatorDetailById",
          strategy: "id-detail",
          cacheStatus: "bypass",
          outcome: "error",
          rowCount: 0,
          errorType: classification.errorType,
          errorClass: classification.errorClass,
          notes: [classification.note],
        });
        if (!classification.shouldFallback) {
          throw error;
        }
      }
    }

    const results = [...aggregate.values()]
      .sort((left, right) => right.score - left.score)
      .slice(0, input.limit);

    if (shouldUseStaleBecauseOutputIsNotUsable(attemptLogs, results.length)) {
      throw new KosisApiError(
        "usable indicator output을 만들지 못해 stale cache fallback 후보로 전환합니다.",
        "50",
      );
    }

    return {
      cacheStatus: "miss",
      queryPlan: input.queryPlan,
      attempts: attemptLogs,
      results,
    };
  }

  private async executeCatalogBrowse(input: {
    question: string;
    intent: QueryIntent;
    keywords: string[];
    queryPlan: QueryPlanItem[];
    limit: number;
  }): Promise<BrowseCatalogResult> {
    const catalogAttempts = buildCatalogSearchAttempts(
      input.question,
      input.intent,
      input.queryPlan,
      selectCatalogViews,
    );
    const aggregate = new Map<string, CatalogResult>();
    const attemptLogs: SearchAttemptLog[] = [];
    const exploredViewsMap = new Map<string, CatalogView>();
    const startedAt = Date.now();
    const targetResultCount = Math.max(input.limit, CATALOG_RESULT_TARGET);
    let foundDeepCatalogResult = false;

    for (const [attemptIndex, attempt] of catalogAttempts.entries()) {
      if (attemptLogs.length >= CATALOG_ATTEMPT_LIMIT) {
        appendBudgetStopNote(attemptLogs, {
          query: attempt.query,
          provider: "statisticsList",
          strategy: "budget-stop-attempt-limit",
          note: "카탈로그 탐색 attempt 상한에 도달해 멈춥니다.",
        });
        break;
      }
      if (Date.now() - startedAt >= CATALOG_SEARCH_BUDGET_MS) {
        appendBudgetStopNote(attemptLogs, {
          query: attempt.query,
          provider: "statisticsList",
          strategy: "budget-stop-wall-clock",
          note: "카탈로그 탐색 시간 예산을 넘겨 현재 후보로 마감합니다.",
        });
        break;
      }
      for (const view of attempt.views) {
        exploredViewsMap.set(view.vwCd, view);
        const queue: Array<{
          parentListId: string;
          depth: number;
          parentScore: number;
          parentReasons: string[];
        }> = [
          {
            parentListId: view.parentListId,
            depth: 0,
            parentScore: 0,
            parentReasons: [],
          },
        ];
        const visitedParentIds = new Set<string>();

        while (queue.length > 0) {
          if (attemptLogs.length >= CATALOG_ATTEMPT_LIMIT || Date.now() - startedAt >= CATALOG_SEARCH_BUDGET_MS) {
            break;
          }
          const currentParent = queue.shift()!;
          const visitKey = `${attempt.strategy}:${view.vwCd}:${currentParent.parentListId}:${currentParent.depth}`;
          if (visitedParentIds.has(visitKey)) {
            continue;
          }
          visitedParentIds.add(visitKey);

          let records: JsonRecord[] = [];
          try {
            records = await this.client.getStatisticsList({
              vwCd: view.vwCd,
              parentListId: currentParent.parentListId,
            });
            attemptLogs.push({
              query: attempt.query,
              provider: "statisticsList",
              strategy: attempt.strategy,
              cacheStatus: "bypass",
              outcome: records.length > 0 ? "ok" : "empty",
              rowCount: records.length,
              parentListId: currentParent.parentListId,
              depth: currentParent.depth,
              notes: [
                `${view.name} 뷰`,
                `depth limit=${attempt.depthLimit}`,
              ],
            });
          } catch (error) {
            const classification = classifyKosisError(error);
            attemptLogs.push({
              query: attempt.query,
              provider: "statisticsList",
              strategy: attempt.strategy,
              cacheStatus: "bypass",
              outcome: "error",
              rowCount: 0,
              parentListId: currentParent.parentListId,
              depth: currentParent.depth,
              errorType: classification.errorType,
              errorClass: classification.errorClass,
              notes: [classification.note, `${view.name} 뷰`],
            });
            if (!classification.shouldFallback) {
              throw error;
            }
            continue;
          }

          const levelResults = records
            .map((record, index) => {
              const { score, whyMatched } = scoreCatalogRecord(
                input.keywords,
                attempt.query,
                view,
                record,
                currentParent.depth,
                attemptIndex,
                index,
              );
              return normalizeCatalogRecord(
                view,
                record,
                score + Math.max(currentParent.parentScore / 8, 0),
                uniqueStrings([...currentParent.parentReasons, ...whyMatched]),
                currentParent.depth,
              );
            })
            .filter((value): value is CatalogResult => value !== null);

          for (const result of levelResults) {
            const existing = aggregate.get(result.catalogKey);
            if (!existing || existing.score < result.score) {
              aggregate.set(result.catalogKey, result);
            }
            if (result.depth >= 2) {
              foundDeepCatalogResult = true;
            }
          }

          if (
            aggregate.size >= targetResultCount &&
            currentParent.depth >= 1 &&
            (
              input.intent.primaryIntent !== "browse" ||
              foundDeepCatalogResult
            )
          ) {
            queue.length = 0;
            break;
          }

          if (currentParent.depth >= attempt.depthLimit) {
            continue;
          }

          const nextParents = levelResults
            .filter((result) => result.listId && !result.tblId)
            .sort((left, right) => right.score - left.score)
            .slice(0, currentParent.depth === 0 ? 3 : 2);

          for (const nextParent of nextParents) {
            queue.push({
              parentListId: nextParent.listId!,
              depth: currentParent.depth + 1,
              parentScore: nextParent.score,
              parentReasons: nextParent.whyMatched,
            });
          }
        }

        if (
          attemptLogs.length >= CATALOG_ATTEMPT_LIMIT ||
          Date.now() - startedAt >= CATALOG_SEARCH_BUDGET_MS ||
          (
            aggregate.size >= targetResultCount &&
            (
              input.intent.primaryIntent !== "browse" ||
              foundDeepCatalogResult
            )
          )
        ) {
          break;
        }
      }

      if (
        attemptLogs.length >= CATALOG_ATTEMPT_LIMIT ||
        Date.now() - startedAt >= CATALOG_SEARCH_BUDGET_MS ||
        (
          aggregate.size >= targetResultCount &&
          (
            input.intent.primaryIntent !== "browse" ||
            foundDeepCatalogResult
          )
        )
      ) {
        appendBudgetStopNote(attemptLogs, {
          query: attempt.query,
          provider: "statisticsList",
          strategy: aggregate.size >= targetResultCount ? "budget-stop-enough-results" : "budget-stop-wall-clock",
          note:
            aggregate.size >= targetResultCount
              ? "카탈로그 후보가 충분해 탐색을 조기 종료합니다."
              : "카탈로그 탐색 시간 예산을 넘겨 현재 후보로 마감합니다.",
        });
        break;
      }
    }

    const sorted = [...aggregate.values()].sort((left, right) => right.score - left.score);
    const seededResults = [
      ...sorted
        .filter((result) => !result.tblId && result.depth === 0)
        .slice(0, Math.max(1, Math.floor(input.limit / 3))),
      ...sorted
        .filter((result) => result.depth >= 2)
        .slice(0, Math.max(1, Math.floor(input.limit / 3))),
      ...sorted
        .filter((result) => Boolean(result.tblId))
        .slice(0, Math.max(1, Math.ceil(input.limit / 3))),
      ...sorted
        .filter((result) => Boolean(result.listId) && !result.tblId)
        .slice(0, Math.max(1, Math.floor(input.limit / 2))),
      ...sorted,
    ];
    const results: CatalogResult[] = [];
    const seen = new Set<string>();
    for (const result of seededResults) {
      if (seen.has(result.catalogKey)) {
        continue;
      }
      seen.add(result.catalogKey);
      results.push(result);
      if (results.length >= input.limit) {
        break;
      }
    }

    if (shouldUseStaleBecauseOutputIsNotUsable(attemptLogs, results.length)) {
      throw new KosisApiError(
        "usable catalog output을 만들지 못해 stale cache fallback 후보로 전환합니다.",
        "50",
      );
    }

    return {
      cacheStatus: "miss",
      queryPlan: input.queryPlan,
      exploredViews: [...exploredViewsMap.values()],
      attempts: attemptLogs,
      results,
    };
  }

  async searchTopics(
    question: string,
    searchHints: string[] = [],
    limit = this.defaultLimit,
  ): Promise<SearchTopicsResult> {
    const cacheKey = JSON.stringify({ question, searchHints, limit });
    const loaded = await this.loadWithCache(
      "search",
      cacheKey,
      async () => {
        const intent = inferQuestionIntent(question);
        const { keywords, queryPlan } = buildQueryPlan(question, searchHints, intent, "table");
        return this.executeTopicSearch({
          question,
          intent,
          keywords,
          queryPlan,
          limit,
        });
      },
      (error) => classifyKosisError(error).shouldFallback,
    );

    const result: SearchTopicsResult = {
      ...loaded.value,
      cacheStatus: loaded.cacheStatus,
      attempts:
        loaded.cacheStatus === "expired-revalidate-failed-stale-used"
          ? [
              ...loaded.value.attempts,
              {
                query: question,
                ...this.buildCacheFallbackAttempt(
                  "cache",
                  "search cache의 stale 결과를 재사용했습니다.",
                ),
              },
            ]
          : loaded.value.attempts,
    };
    return result;
  }

  async searchIndicators(
    question: string,
    searchHints: string[] = [],
    limit = this.defaultLimit,
  ): Promise<SearchIndicatorsResult> {
    const cacheKey = JSON.stringify({ question, searchHints, limit });
    const loaded = await this.loadWithCache(
      "indicator-search",
      cacheKey,
      async () => {
        const intent = inferQuestionIntent(question);
        const { keywords, queryPlan } = buildQueryPlan(question, searchHints, intent, "indicator");
        return this.executeIndicatorSearch({
          question,
          intent,
          keywords,
          queryPlan,
          limit,
        });
      },
      (error) => classifyKosisError(error).shouldFallback,
    );

    return {
      ...loaded.value,
      cacheStatus: loaded.cacheStatus,
      attempts:
        loaded.cacheStatus === "expired-revalidate-failed-stale-used"
          ? [
              ...loaded.value.attempts,
              {
                query: question,
                ...this.buildCacheFallbackAttempt(
                  "cache",
                  "indicator search stale cache를 재사용했습니다.",
                ),
              },
            ]
          : loaded.value.attempts,
    };
  }

  async browseCatalog(
    question: string,
    searchHints: string[] = [],
    limit = this.defaultLimit,
  ): Promise<BrowseCatalogResult> {
    const cacheKey = JSON.stringify({ question, searchHints, limit });
    const loaded = await this.loadWithCache(
      "catalog-browse",
      cacheKey,
      async () => {
        const intent = inferQuestionIntent(question);
        const { keywords, queryPlan } = buildQueryPlan(question, searchHints, intent, "catalog");
        return this.executeCatalogBrowse({
          question,
          intent,
          keywords,
          queryPlan,
          limit,
        });
      },
      (error) => classifyKosisError(error).shouldFallback,
    );

    return {
      ...loaded.value,
      cacheStatus: loaded.cacheStatus,
      attempts:
        loaded.cacheStatus === "expired-revalidate-failed-stale-used"
          ? [
              ...loaded.value.attempts,
              {
                query: question,
                ...this.buildCacheFallbackAttempt(
                  "cache",
                  "catalog browse stale cache를 재사용했습니다.",
                ),
              },
            ]
          : loaded.value.attempts,
    };
  }

  async getTableBundle(
    orgId: string,
    tblId: string,
    prdSe?: string,
    previewOptions?: PreviewRequestOptions,
  ): Promise<KosisTableBundle> {
    const cacheKey = JSON.stringify({
      version: BUNDLE_CACHE_VERSION,
      orgId,
      tblId,
      prdSe,
      previewOptions,
    });
    const loaded = await this.loadWithCache(
      "bundle",
      cacheKey,
      async () => {
        const warnings: string[] = [];
        const metaSourceSummary: KosisTableBundle["provenance"]["metaSources"] = [];
        const getMetaSafe = async (
          params: Parameters<KosisClient["getMeta"]>[0],
          warningLabel?: string,
        ): Promise<JsonRecord[]> => {
          try {
            const rows = await this.client.getMeta(params);
            metaSourceSummary.push({
              type: params.type,
              rowCount: rows.length,
              status: rows.length > 0 ? "ok" : "empty",
            });
            return rows;
          } catch (error) {
            if (
              error instanceof KosisApiError &&
              error.message.includes("데이터가 존재하지 않습니다")
            ) {
              metaSourceSummary.push({
                type: params.type,
                rowCount: 0,
                status: "empty",
              });
              if (warningLabel) {
                warnings.push(`${warningLabel} 메타가 비어 있습니다.`);
              }
              return [];
            }
            throw error;
          }
        };

        const metaRequests = await Promise.all([
          getMetaSafe({ type: "TBL", orgId, tblId }),
          getMetaSafe({ type: "ORG", orgId }, "기관"),
          getMetaSafe({ type: "PRD", orgId, tblId, detail: "Y" }),
          getMetaSafe({ type: "ITM", orgId, tblId }),
          getMetaSafe({ type: "CMMT", orgId, tblId }, "주석"),
          getMetaSafe({ type: "UNIT", orgId, tblId }, "단위"),
          getMetaSafe({ type: "SOURCE", orgId, tblId }, "출처"),
          getMetaSafe({ type: "NCD", orgId, tblId, ...(prdSe ? { prdSe } : {}) }, "갱신일"),
        ]);

        const meta: KosisMetaBundle = {
          table: metaRequests[0],
          organization: metaRequests[1],
          period: metaRequests[2],
          items: metaRequests[3],
          comments: metaRequests[4],
          units: metaRequests[5],
          source: metaRequests[6],
          updatedAt: metaRequests[7],
          weights: [],
        };

        const statId = readString(meta.source[0] ?? {}, "STAT_ID");
        let explanation: JsonRecord | null = null;
        let explanationSource: KosisTableBundle["provenance"]["explanationSource"] = "none";

        try {
          const records = statId
            ? await this.client.getExplanation({
                statId,
                metaItm: "All",
              })
            : await this.client.getExplanation({
                orgId,
                tblId,
                metaItm: "All",
              });
          explanation = records[0] ?? null;
          explanationSource = statId ? "statId" : explanation ? "orgTbl" : "none";
        } catch (error) {
          try {
            const fallback = await this.client.getExplanation({
              orgId,
              tblId,
              metaItm: "All",
            });
            explanation = fallback[0] ?? null;
            explanationSource = explanation ? "orgTbl" : "none";
          } catch {
            warnings.push("통계설명 자료를 연결하지 못했습니다.");
          }
        }

        const effectivePrdSe =
          resolvePreferredPeriodCode(meta, prdSe) ??
          prdSe ??
          readString(meta.updatedAt[0] ?? {}, "PRD_SE") ??
          readString(meta.period[0] ?? {}, "PRD_SE") ??
          "Y";

        const previewPlan = derivePreviewPlanWithSelections(
          meta,
          effectivePrdSe,
          previewOptions,
        );
        const weightParams = toWeightMetaParams(previewPlan.attempts, previewPlan.itemId);
        const resolvedSelections = Object.fromEntries(
          previewPlan.guide.dimensions.map((dimension, index) => [
            dimension.objId,
            previewPlan.attempts[0]?.[`objL${index + 1}`],
          ]),
        );
        meta.weights = await getMetaSafe(
          {
            type: "WGT",
            orgId,
            tblId,
            extraParams: weightParams,
          },
          "가중치",
        );

        const estimatedCells = estimateCellCount(meta, 5);
        let dataPreview: DataPreviewRow[] = [];
        let previewSource: KosisTableBundle["provenance"]["previewSource"] = "none";
        let effectivePreviewPrdSe = previewPlan.prdSe;
        let previewAttempts: PreviewAttemptLog[] = [];

        if (estimatedCells > 40_000) {
          warnings.push("예상 조회 셀 수가 많아 preview 조회를 생략했습니다.");
          previewAttempts = [
            {
              provider: "statisticsData",
              strategy: "preview-skipped-cell-estimate",
              cacheStatus: "bypass",
              outcome: "empty",
              rowCount: 0,
              itemId: previewPlan.itemId,
              prdSe: previewPlan.prdSe,
              attemptIndex: 0,
              notes: ["예상 조회 셀 수가 커서 preview를 생략했습니다."],
            },
          ];
        } else {
          const previewResolution = await this.resolveTablePreview({
            orgId,
            tblId,
            tableKey: tableKey(orgId, tblId),
            prdSe,
            previewPlan,
            previewOptions,
            meta,
            resolvedSelections,
          });
          dataPreview = previewResolution.dataPreview;
          previewSource = previewResolution.previewSource;
          effectivePreviewPrdSe = previewResolution.effectivePreviewPrdSe;
          previewAttempts = previewResolution.previewAttempts;
          if (previewSource === "html-fallback") {
            warnings.push("OpenAPI preview 대신 KOSIS HTML fallback preview를 사용했습니다.");
          } else if (previewResolution.warning) {
            warnings.push(previewResolution.warning);
          }
        }

        return {
          table: buildTableIdentity(orgId, tblId, meta, explanation),
          dataPreview,
          meta,
          explanation,
          warnings,
          units: normalizeUnits(meta, dataPreview),
          dimensions: normalizeDimensions(meta, dataPreview),
          coverage: {
            periods: buildCoveragePeriods(meta, dataPreview),
            lastUpdated: readString(meta.updatedAt[0] ?? {}, "SEND_DE"),
          },
          previewGuide: previewPlan.guide,
          previewRequest: {
            itemId: previewPlan.itemId,
            prdSe: effectivePreviewPrdSe,
            attempts: previewPlan.attempts,
          },
          comparisonReadiness: detectReadiness(dataPreview, warnings),
          provenance: {
            cacheStatus: "miss",
            metaSources: metaSourceSummary,
            explanationSource,
            previewSource,
            previewAttempts,
            previewParameters: {
              itemId: previewPlan.itemId,
              prdSe: effectivePreviewPrdSe,
              attempts: previewPlan.attempts,
              weightParams,
            },
          },
        };
      },
      (error) => classifyKosisError(error).shouldFallback,
    );

    return {
      ...loaded.value,
      warnings:
        loaded.cacheStatus === "expired-revalidate-failed-stale-used"
          ? uniqueStrings([
              ...loaded.value.warnings,
              "새 번들 조회에 실패해 만료된 cache 결과를 재사용했습니다.",
            ])
          : loaded.value.warnings,
      provenance: {
        ...loaded.value.provenance,
        cacheStatus: loaded.cacheStatus,
      },
    };
  }

  async getIndicatorBundle(input: {
    indicatorId?: string;
    indicatorName?: string;
    startPrdDe?: string;
    endPrdDe?: string;
    rn?: number;
    srvRn?: number;
  }): Promise<IndicatorBundle> {
    if (!input.indicatorId && !input.indicatorName) {
      throw new KosisApiError("지표 번들은 indicatorId 또는 indicatorName이 필요합니다.");
    }

    const cacheKey = JSON.stringify({
      version: INDICATOR_BUNDLE_CACHE_VERSION,
      ...input,
    });
    const loaded = await this.loadWithCache(
      "indicator-bundle",
      cacheKey,
      async () => {
        const warnings: string[] = [];
        const lookupAttempts: IndicatorSearchAttemptLog[] = [];
        let resolvedId = input.indicatorId;
        let resolvedName = input.indicatorName?.trim();
        let listMatches: JsonRecord[] = [];
        let detailRows: JsonRecord[] = [];
        let explanation: JsonRecord | null = null;
        let listSource: IndicatorBundle["provenance"]["listSource"] = "none";
        let explanationSource: IndicatorBundle["provenance"]["explanationSource"] = "none";
        let detailSource: IndicatorBundle["provenance"]["detailSource"] = "none";
        type BundleLookupCandidate = {
          query: string;
          provider:
            | "indicatorListById"
            | "indicatorListByName"
            | "indicatorExplainById"
            | "indicatorExplainByName"
            | "indicatorDetailById"
            | "indicatorDetailByName";
          strategy: string;
          source: "indicatorId" | "indicatorName";
          run: () => Promise<JsonRecord[]>;
        };

        const listCandidates: BundleLookupCandidate[] = [];
        if (resolvedId) {
          const indicatorId = resolvedId;
          listCandidates.push({
            query: indicatorId,
            provider: "indicatorListById",
            strategy: "bundle-list-id",
            run: () =>
              this.client.searchIndicatorLists({
                indicatorId,
                numOfRows: 20,
              }),
            source: "indicatorId",
          });
        }
        if (resolvedName) {
          const indicatorName = resolvedName;
          listCandidates.push({
            query: indicatorName,
            provider: "indicatorListByName",
            strategy: "bundle-list-name",
            run: () =>
              this.client.searchIndicatorLists({
                indicatorName,
                numOfRows: 20,
              }),
            source: "indicatorName",
          });
        }

        for (const candidate of listCandidates) {
          try {
            const rows = await candidate.run();
            lookupAttempts.push({
              query: candidate.query,
              provider: candidate.provider,
              strategy: candidate.strategy,
              cacheStatus: "bypass",
              outcome: rows.length > 0 ? "ok" : "empty",
              rowCount: rows.length,
              notes: ["지표 목록 문맥을 확보했습니다."],
            });
            if (rows.length > 0) {
              listMatches = rows;
              listSource = candidate.source;
              break;
            }
          } catch (error) {
            const classification = classifyKosisError(error);
            lookupAttempts.push({
              query: candidate.query,
              provider: candidate.provider,
              strategy: candidate.strategy,
              cacheStatus: "bypass",
              outcome: "error",
              rowCount: 0,
              errorType: classification.errorType,
              errorClass: classification.errorClass,
              notes: [classification.note],
            });
            if (!classification.shouldFallback) {
              throw error;
            }
          }
        }
        if (listMatches.length === 0) {
          warnings.push("지표 목록 검색 결과가 비어 있습니다.");
        }

        const bestListMatch = chooseBestIndicatorRecord(listMatches, resolvedName);
        resolvedId = readString(bestListMatch ?? {}, "statJipyoId") ?? resolvedId;
        resolvedName = readString(bestListMatch ?? {}, "statJipyoNm") ?? resolvedName;
        if (bestListMatch) {
          const narrowed = listMatches.filter((row) => {
            const rowId = readString(row, "statJipyoId");
            const rowName = readString(row, "statJipyoNm");
            return (
              (resolvedId && rowId === resolvedId) ||
              (resolvedName && rowName === resolvedName)
            );
          });
          listMatches =
            narrowed.length > 0
              ? narrowed
              : [
                  bestListMatch,
                  ...listMatches.filter((row) => row !== bestListMatch),
                ];
        }

        const explanationCandidates: BundleLookupCandidate[] = [];
        if (resolvedId) {
          const indicatorId = resolvedId;
          explanationCandidates.push({
            query: indicatorId,
            provider: "indicatorExplainById",
            strategy: "bundle-explain-id",
            run: () =>
              this.client.getIndicatorExplanationById({
                indicatorId,
                numOfRows: 10,
              }),
            source: "indicatorId",
          });
        }
        if (resolvedName) {
          const indicatorName = resolvedName;
          explanationCandidates.push({
            query: indicatorName,
            provider: "indicatorExplainByName",
            strategy: "bundle-explain-name",
            run: () =>
              this.client.getIndicatorExplanationByName({
                indicatorName,
                numOfRows: 10,
              }),
            source: "indicatorName",
          });
        }

        for (const candidate of explanationCandidates) {
          try {
            const rows = await candidate.run();
            const selected =
              chooseBestIndicatorRecord(rows, resolvedName) ?? firstUsableRecord(rows);
            lookupAttempts.push({
              query: candidate.query,
              provider: candidate.provider,
              strategy: candidate.strategy,
              cacheStatus: "bypass",
              outcome: selected ? "ok" : "empty",
              rowCount: rows.length,
              notes: ["지표 설명자료를 보강했습니다."],
            });
            if (selected) {
              explanation = selected;
              explanationSource = candidate.source;
              break;
            }
          } catch (error) {
            const classification = classifyKosisError(error);
            lookupAttempts.push({
              query: candidate.query,
              provider: candidate.provider,
              strategy: candidate.strategy,
              cacheStatus: "bypass",
              outcome: "error",
              rowCount: 0,
              errorType: classification.errorType,
              errorClass: classification.errorClass,
              notes: [classification.note],
            });
            if (!classification.shouldFallback) {
              throw error;
            }
          }
        }
        if (!explanation) {
          warnings.push("지표 설명자료가 비어 있습니다.");
        }

        if (!resolvedName) {
          resolvedName = readString(explanation ?? {}, "statJipyoNm") ?? resolvedName;
        }
        if (!resolvedId) {
          resolvedId = readString(explanation ?? {}, "statJipyoId") ?? resolvedId;
        }

        const detailCandidates: BundleLookupCandidate[] = [];
        if (resolvedId) {
          const indicatorId = resolvedId;
          detailCandidates.push({
            query: indicatorId,
            provider: "indicatorDetailById",
            strategy: "bundle-detail-id",
            run: () =>
              this.client.getIndicatorDetailById({
                indicatorId,
                startPrdDe: input.startPrdDe,
                endPrdDe: input.endPrdDe,
                rn: input.rn,
                srvRn: input.srvRn,
                numOfRows: Math.max(input.srvRn ?? 10, 10),
              }),
            source: "indicatorId",
          });
        }
        if (resolvedName) {
          const indicatorName = resolvedName;
          detailCandidates.push({
            query: indicatorName,
            provider: "indicatorDetailByName",
            strategy: "bundle-detail-name",
            run: () =>
              this.client.getIndicatorDetailByName({
                indicatorName,
                startPrdDe: input.startPrdDe,
                endPrdDe: input.endPrdDe,
                rn: input.rn,
                srvRn: input.srvRn,
                numOfRows: Math.max(input.srvRn ?? 10, 10),
              }),
            source: "indicatorName",
          });
        }

        for (const candidate of detailCandidates) {
          try {
            const rows = await candidate.run();
            lookupAttempts.push({
              query: candidate.query,
              provider: candidate.provider,
              strategy: candidate.strategy,
              cacheStatus: "bypass",
              outcome: rows.length > 0 ? "ok" : "empty",
              rowCount: rows.length,
              notes: ["지표 상세 수치를 확보했습니다."],
            });
            if (rows.length > 0) {
              detailRows = rows;
              detailSource = candidate.source;
              break;
            }
          } catch (error) {
            const classification = classifyKosisError(error);
            lookupAttempts.push({
              query: candidate.query,
              provider: candidate.provider,
              strategy: candidate.strategy,
              cacheStatus: "bypass",
              outcome: "error",
              rowCount: 0,
              errorType: classification.errorType,
              errorClass: classification.errorClass,
              notes: [classification.note],
            });
            if (!classification.shouldFallback) {
              throw error;
            }
          }
        }
        if (detailRows.length === 0) {
          warnings.push("지표 상세 수치가 비어 있습니다.");
        }

        if (!resolvedName) {
          resolvedName = readString(detailRows[0] ?? {}, "statJipyoNm") ?? resolvedName;
        }
        if (!resolvedId) {
          resolvedId = readString(detailRows[0] ?? {}, "statJipyoId") ?? resolvedId;
        }

        if (!resolvedName) {
          throw new KosisApiError("지표명을 확정하지 못했습니다.");
        }

        return {
          indicator: buildIndicatorIdentity(
            resolvedId,
            resolvedName,
            listMatches,
            detailRows,
            input.indicatorName,
          ),
          explanation,
          listMatches: listMatches.slice(0, 20),
          detailRows: detailRows.slice(0, 20),
          warnings: uniqueStrings(warnings),
          coverage: buildIndicatorCoverage(listMatches, detailRows),
          provenance: {
            cacheStatus: "miss",
            explanationSource,
            detailSource,
            listSource,
            lookupAttempts,
          },
        };
      },
      (error) => classifyKosisError(error).shouldFallback,
    );

    return {
      ...loaded.value,
      warnings:
        loaded.cacheStatus === "expired-revalidate-failed-stale-used"
          ? uniqueStrings([
              ...loaded.value.warnings,
              "새 지표 번들 조회에 실패해 만료된 cache 결과를 재사용했습니다.",
            ])
          : loaded.value.warnings,
      provenance: {
        ...loaded.value.provenance,
        cacheStatus: loaded.cacheStatus,
      },
    };
  }

  async compareTables(
    tables: CompareTableInput[],
    options?: { focus?: string; timeRange?: string; regions?: string[] },
  ): Promise<ComparisonResult> {
    const bundles = await Promise.all(
      tables.map((table) => this.getTableBundle(table.orgId, table.tblId, table.prdSe)),
    );
    return buildComparisonResult(bundles, options);
  }

  async answerBundle(
    question: string,
    options?: {
      limit?: number;
      comparisonMode?: "auto" | "none" | "pairwise";
      searchHints?: string[];
    },
  ): Promise<AnswerBundle> {
    const limit = options?.limit ?? this.defaultLimit;
    const intent = inferQuestionIntent(question);
    const combinedHints = uniqueStrings([
      ...(options?.searchHints ?? []),
      ...intent.searchHints,
      ...compareSearchHints(intent),
    ]);
    const planner = this.planQuestion(question, combinedHints);
    const plannerExecutions: PlannerExecutionLog[] = [];
    const tableSearchRuns: SearchTopicsResult[] = [];
    const indicatorSearchRuns: SearchIndicatorsResult[] = [];
    const catalogSearchRuns: BrowseCatalogResult[] = [];

    const executeDataset = async (dataset: PlannedDatasetCandidate): Promise<void> => {
      const hasEnoughTableResults =
        mergeTopicSearchResults(tableSearchRuns).results.length >= Math.max(limit, 2);
      const hasEnoughIndicatorResults =
        mergeIndicatorSearchResults(indicatorSearchRuns).results.length >= Math.max(limit, 2);

      if (
        dataset.requirement === "optional" &&
        (
          (dataset.lane === "indicator-search" && hasEnoughTableResults && indicatorSearchRuns.length >= 1) ||
          (dataset.lane === "catalog-browse" && hasEnoughTableResults) ||
          (dataset.lane === "table-search" && hasEnoughTableResults)
        )
      ) {
        plannerExecutions.push({
          datasetId: dataset.datasetId,
          lane: dataset.lane,
          requirement: dataset.requirement,
          label: dataset.label,
          seedQuestion: dataset.seedQuestion,
          queryPlan: dataset.queries,
          status: "skipped",
          resultCount: dataset.lane === "indicator-search"
            ? mergeIndicatorSearchResults(indicatorSearchRuns).results.length
            : mergeTopicSearchResults(tableSearchRuns).results.length,
          attemptCount: 0,
          okCount: 0,
          emptyCount: 0,
          errorCount: 0,
          selectedKeys: [],
          notes: [
            dataset.reason,
            hasEnoughIndicatorResults
              ? "앞선 후보가 이미 충분해 optional dataset을 건너뜁니다."
              : "앞선 표 후보가 충분해 optional dataset을 건너뜁니다.",
          ],
          failureReasons: [],
        });
        return;
      }

      const datasetKeywords = uniqueStrings([
        ...intent.keywords,
        ...dataset.searchHints,
        ...dataset.queries.flatMap((item) => tokenizeQuestion(item.query)),
      ]);
      try {
        if (dataset.lane === "table-search") {
          const result = await this.executeTopicSearch({
            question: dataset.seedQuestion,
            intent,
            keywords: datasetKeywords,
            queryPlan: dataset.queries,
            limit: Math.max(limit, dataset.requirement === "required" ? 6 : 4),
          });
          tableSearchRuns.push(result);
          const failureReasons = uniqueStrings(
            result.attempts
              .filter((attempt) => attempt.outcome === "error")
              .flatMap((attempt) => attempt.notes),
          );
          plannerExecutions.push({
            datasetId: dataset.datasetId,
            lane: dataset.lane,
            requirement: dataset.requirement,
            label: dataset.label,
            seedQuestion: dataset.seedQuestion,
            queryPlan: dataset.queries,
            status: result.results.length > 0 ? "ok" : "empty",
            resultCount: result.results.length,
            attemptCount: result.attempts.length,
            okCount: result.attempts.filter((attempt) => attempt.outcome === "ok").length,
            emptyCount: result.attempts.filter((attempt) => attempt.outcome === "empty").length,
            errorCount: result.attempts.filter((attempt) => attempt.outcome === "error").length,
            selectedKeys: result.results.slice(0, 3).map((entry) => entry.tableKey),
            notes: [
              dataset.reason,
              result.results.length > 0
                ? "표 후보를 확보했습니다."
                : "결과가 비어 다음 후보로 내려갑니다.",
            ],
            failureReasons,
          });
          return;
        }

        if (dataset.lane === "indicator-search") {
          const result = await this.executeIndicatorSearch({
            question: dataset.seedQuestion,
            intent,
            keywords: datasetKeywords,
            queryPlan: dataset.queries,
            limit: Math.max(limit, 4),
          });
          indicatorSearchRuns.push(result);
          const failureReasons = uniqueStrings(
            result.attempts
              .filter((attempt) => attempt.outcome === "error")
              .flatMap((attempt) => attempt.notes),
          );
          plannerExecutions.push({
            datasetId: dataset.datasetId,
            lane: dataset.lane,
            requirement: dataset.requirement,
            label: dataset.label,
            seedQuestion: dataset.seedQuestion,
            queryPlan: dataset.queries,
            status: result.results.length > 0 ? "ok" : "empty",
            resultCount: result.results.length,
            attemptCount: result.attempts.length,
            okCount: result.attempts.filter((attempt) => attempt.outcome === "ok").length,
            emptyCount: result.attempts.filter((attempt) => attempt.outcome === "empty").length,
            errorCount: result.attempts.filter((attempt) => attempt.outcome === "error").length,
            selectedKeys: result.results.slice(0, 3).map((entry) => entry.indicatorKey),
            notes: [
              dataset.reason,
              result.results.length > 0
                ? "지표 후보를 확보했습니다."
                : "지표 결과가 비어 다음 후보로 내려갑니다.",
            ],
            failureReasons,
          });
          return;
        }

        const result = await this.executeCatalogBrowse({
          question: dataset.seedQuestion,
          intent,
          keywords: datasetKeywords,
          queryPlan: dataset.queries,
          limit: Math.max(limit, 6),
        });
        catalogSearchRuns.push(result);
        const failureReasons = uniqueStrings(
          result.attempts
            .filter((attempt) => attempt.outcome === "error")
            .flatMap((attempt) => attempt.notes),
        );
        plannerExecutions.push({
          datasetId: dataset.datasetId,
          lane: dataset.lane,
          requirement: dataset.requirement,
          label: dataset.label,
          seedQuestion: dataset.seedQuestion,
          queryPlan: dataset.queries,
          status: result.results.length > 0 ? "ok" : "empty",
          resultCount: result.results.length,
          attemptCount: result.attempts.length,
          okCount: result.attempts.filter((attempt) => attempt.outcome === "ok").length,
          emptyCount: result.attempts.filter((attempt) => attempt.outcome === "empty").length,
          errorCount: result.attempts.filter((attempt) => attempt.outcome === "error").length,
          selectedKeys: result.results.slice(0, 3).map((entry) => entry.catalogKey),
          notes: [
            dataset.reason,
            result.results.length > 0
              ? "카탈로그 후보를 확보했습니다."
              : "카탈로그 결과가 비어 다음 후보로 내려갑니다.",
          ],
          failureReasons,
        });
      } catch (error) {
        const classification = classifyKosisError(error);
        plannerExecutions.push({
          datasetId: dataset.datasetId,
          lane: dataset.lane,
          requirement: dataset.requirement,
          label: dataset.label,
          seedQuestion: dataset.seedQuestion,
          queryPlan: dataset.queries,
          status: "error",
          resultCount: 0,
          attemptCount: 0,
          okCount: 0,
          emptyCount: 0,
          errorCount: 1,
          selectedKeys: [],
          notes: [dataset.reason, classification.note],
          failureReasons: [classification.note],
        });
        if (!classification.shouldFallback) {
          throw error;
        }
      }
    };

    for (const dataset of planner.datasets) {
      await executeDataset(dataset);
    }

    const search =
      tableSearchRuns.length > 0
        ? mergeTopicSearchResults(tableSearchRuns)
        : {
            cacheStatus: "bypass" as const,
            queryPlan: [],
            attempts: [],
            results: [],
          };
    const indicatorSearch =
      indicatorSearchRuns.length > 0
        ? mergeIndicatorSearchResults(indicatorSearchRuns)
        : {
            cacheStatus: "bypass" as const,
            queryPlan: [],
            attempts: [],
            results: [],
          };
    const catalogSearch =
      catalogSearchRuns.length > 0
        ? mergeCatalogResults(catalogSearchRuns)
        : {
            cacheStatus: "bypass" as const,
            queryPlan: [],
            exploredViews: [],
            attempts: [],
            results: [],
          };

    const shouldSearchIndicators = planner.datasets.some(
      (dataset) => dataset.lane === "indicator-search",
    );
    const shouldBrowse = planner.datasets.some(
      (dataset) => dataset.lane === "catalog-browse",
    );
    const comparisonMode = options?.comparisonMode ?? "auto";
    const selectionCounts = preferredSelectionCounts(intent, comparisonMode);
    const searchPool = new Map<string, NormalizedSearchResult>();
    for (const result of search.results) {
      searchPool.set(result.tableKey, result);
    }
    for (const catalogResult of catalogSearch.results) {
      const mapped = catalogToSearchResult(catalogResult);
      if (!mapped) {
        continue;
      }
      const current = searchPool.get(mapped.tableKey);
      if (!current || current.score < mapped.score) {
        searchPool.set(mapped.tableKey, mapped);
      }
    }
    const inspectedResultLimit =
      intent.primaryIntent === "compare"
        ? Math.min(Math.max(limit * 4, 12), searchPool.size)
        : 5;
    const inspectedResults = [...searchPool.values()]
      .sort((left, right) => right.score - left.score)
      .slice(0, inspectedResultLimit);
    const baseBundles = await Promise.all(
      inspectedResults.map((result) =>
        this.getTableBundle(result.orgId, result.tblId, intent.preferredPrdSe),
      ),
    );

    const reranked = inspectedResults
      .map((result, index) => ({
        result,
        baseBundle: baseBundles[index],
        bonus: computeQuestionBonus(baseBundles[index], intent),
      }))
      .sort(
        (left, right) =>
          right.result.score + right.bonus - (left.result.score + left.bonus),
      );

    const tableEntries = await Promise.all(
      reranked.map(async ({ result, baseBundle, bonus }) => {
        const autoSelections = inferPreviewOptions(baseBundle, intent);
        if (!autoSelections) {
          return {
            result,
            bundle: baseBundle,
            bonus,
            selectionBonus: 0,
            finalScore: result.score + bonus,
            autoSelections,
          };
        }

        const selectedBundle = await this.getTableBundle(
          result.orgId,
          result.tblId,
          intent.preferredPrdSe,
          autoSelections,
        );
        const selectionBonus = computeSelectionBonus(selectedBundle, intent, autoSelections);
        const reliabilityBonus = computeBundleReliabilityBonus(selectedBundle);
        const policyBonus = computeTableSelectionPolicyBonus(intent, result, selectedBundle);

        return {
          result,
          bundle: selectedBundle,
          bonus,
          selectionBonus,
          finalScore:
            result.score + bonus + selectionBonus + reliabilityBonus + policyBonus,
          autoSelections,
        };
      }),
    ).then((entries) =>
      entries.sort((left, right) => right.finalScore - left.finalScore),
    );
    const pickedCount = Math.min(selectionCounts.tables, tableEntries.length);
    const bundles = selectTableEntries(tableEntries, intent, pickedCount);

    const comparison =
      comparisonMode === "none" || bundles.length <= 1
        ? null
        : buildComparisonResult(
            bundles.map((entry) => entry.bundle),
            {
              focus:
                planner.comparisonAxes.find((axis) => axis.axis === "indicator")?.values.join(" vs ") ||
                planner.indicatorCandidates.slice(0, 2).map((candidate) => candidate.label).join(" vs ") ||
                intent.keywords.join(", "),
              timeRange: planner.period.label,
              regions:
                planner.comparisonAxes
                  .find((axis) => axis.axis === "region")
                  ?.values.filter((value) => value !== "지역별") ?? [],
            },
          );

    const selectedTables = bundles
      .map(({ result, bundle, autoSelections, finalScore }) => ({
        ...bundle.table,
        whyMatched: result.whyMatched,
        score: finalScore,
        warnings: bundle.warnings,
        previewRows: bundle.dataPreview.length,
        previewRequest: bundle.previewRequest,
        autoSelections,
      }))
      .sort((left, right) => right.score - left.score);

    const inspectedIndicatorLimit = Math.min(
      Math.max(
        selectionCounts.indicators,
        intent.preferredPrdSe === "Y" || question.includes("증감") ? 8 : 3,
      ),
      indicatorSearch.results.length,
    );
    const inspectedIndicators = indicatorSearch.results.slice(0, inspectedIndicatorLimit);
    const selectedIndicatorEntries = await Promise.all(
      inspectedIndicators.map(async (result) => {
        const bundle = await this.getIndicatorBundle({
          indicatorId: result.indicatorId,
          indicatorName: result.indicatorName,
          startPrdDe: intent.startPrdDe,
          endPrdDe: intent.endPrdDe,
          srvRn: intent.recentPeriods ? Math.min(intent.recentPeriods, 12) : 5,
        });
        const finalScore =
          result.score +
          computeIndicatorBonus(bundle, intent) +
          computeIndicatorReliabilityBonus(bundle) +
          computeIndicatorSelectionPolicyBonus(intent, bundle);
        return {
          result,
          bundle,
          finalScore,
          display: {
            ...bundle.indicator,
            whyMatched: result.whyMatched,
            score: finalScore,
            warnings: bundle.warnings,
            detailRows: bundle.detailRows.length,
            coverage: bundle.coverage,
            matchedQueries: result.matchedQueries,
            matchedStrategies: result.matchedStrategies,
          },
        };
      }),
    ).then((entries) =>
      entries.sort((left, right) => right.finalScore - left.finalScore),
    );
    const selectedIndicators = selectedIndicatorEntries
      .slice(0, selectionCounts.indicators)
      .map((entry) => entry.display);

    const rankedCatalogResults = [
      ...catalogSearch.results.filter((result) => !result.tblId && result.depth === 0),
      ...catalogSearch.results.filter((result) => result.depth >= 2),
      ...catalogSearch.results.filter((result) => result.listId && !result.tblId),
      ...catalogSearch.results,
    ]
      .filter((result, index, entries) =>
        entries.findIndex((entry) => entry.catalogKey === result.catalogKey) === index,
      )
      .map((result) => ({
        ...result,
        score: result.score + computeCatalogSelectionPolicyBonus(intent, result),
      }))
      .sort((left, right) => right.score - left.score);

    const catalogSelectionSeed =
      intent.primaryIntent === "browse"
        ? [
            ...rankedCatalogResults.filter((result) => !result.tblId && result.depth === 0).slice(0, 1),
            ...rankedCatalogResults.filter((result) => result.depth >= 2).slice(0, 1),
            ...rankedCatalogResults,
          ]
        : rankedCatalogResults;

    const selectedCatalogs = catalogSelectionSeed
      .filter((result, index, entries) =>
        entries.findIndex((entry) => entry.catalogKey === result.catalogKey) === index,
      )
      .slice(0, selectionCounts.catalogs)
      .map((result) => ({
        catalogKey: result.catalogKey,
        vwCd: result.vwCd,
        viewName: result.viewName,
        listId: result.listId,
        listName: result.listName,
        orgId: result.orgId,
        tblId: result.tblId,
        tblNm: result.tblNm,
        score: result.score,
        whyMatched: result.whyMatched,
        depth: result.depth,
      }));

    const nextQuestions = buildNextQuestionsByIntent({
      intent,
      selectedTables,
      selectedIndicators,
      selectedCatalogs,
      comparison,
      searchResultCount: search.results.length,
      indicatorResultCount: indicatorSearch.results.length,
      catalogResultCount: catalogSearch.results.length,
    });
    const evidence = buildAnswerEvidence({
      intent,
      selectedTables,
      selectedIndicators,
      selectedCatalogs,
      comparison,
    });
    const summary = buildAnswerSummary({
      intent,
      selectedTables,
      selectedIndicators,
      selectedCatalogs,
      comparison,
    });
    const indicatorAttemptSummary = summarizeIndicatorAttempts(indicatorSearch.attempts);
    const tableAttemptSummary = {
      attemptCount: search.attempts.length,
      okCount: search.attempts.filter((attempt) => attempt.outcome === "ok").length,
      emptyCount: search.attempts.filter((attempt) => attempt.outcome === "empty").length,
      errorCount: search.attempts.filter((attempt) => attempt.outcome === "error").length,
      error404Count: search.attempts.filter((attempt) => attempt.errorType === "404").length,
      topStrategies: uniqueStrings(search.attempts.map((attempt) => attempt.strategy)).slice(0, 5),
    };
    const catalogAttemptSummary = {
      attemptCount: catalogSearch.attempts.length,
      okCount: catalogSearch.attempts.filter((attempt) => attempt.outcome === "ok").length,
      emptyCount: catalogSearch.attempts.filter((attempt) => attempt.outcome === "empty").length,
      errorCount: catalogSearch.attempts.filter((attempt) => attempt.outcome === "error").length,
      error404Count: catalogSearch.attempts.filter((attempt) => attempt.errorType === "404").length,
      topStrategies: uniqueStrings(catalogSearch.attempts.map((attempt) => attempt.strategy)).slice(0, 5),
    };

    return {
      interpretedIntent: {
        question,
        keywords: intent.keywords,
        queryPlan: mergeQueryPlanItems(
          planner.datasets
            .filter((dataset) => dataset.requirement === "required")
            .map((dataset) => dataset.queries),
        ),
      },
      planner,
      summary,
      selectedTables,
      selectedIndicators,
      selectedCatalogs,
      comparison,
      nextQuestions,
      evidence,
      provenance: {
        plannerExecutions,
        lanes: [
          {
            lane: "table-search",
            enabled: planner.datasets.some((dataset) => dataset.lane === "table-search"),
            queryPlan: search.queryPlan,
            resultCount: search.results.length,
            attemptCount: tableAttemptSummary.attemptCount,
            okCount: tableAttemptSummary.okCount,
            emptyCount: tableAttemptSummary.emptyCount,
            errorCount: tableAttemptSummary.errorCount,
            error404Count: tableAttemptSummary.error404Count,
            topStrategies: tableAttemptSummary.topStrategies,
          },
          {
            ...indicatorAttemptSummary,
            enabled: shouldSearchIndicators,
            queryPlan: indicatorSearch.queryPlan,
            resultCount: indicatorSearch.results.length,
          },
          {
            lane: "catalog-browse",
            enabled: shouldBrowse,
            queryPlan: catalogSearch.queryPlan,
            resultCount: catalogSearch.results.length,
            attemptCount: catalogAttemptSummary.attemptCount,
            okCount: catalogAttemptSummary.okCount,
            emptyCount: catalogAttemptSummary.emptyCount,
            errorCount: catalogAttemptSummary.errorCount,
            error404Count: catalogAttemptSummary.error404Count,
            topStrategies: catalogAttemptSummary.topStrategies,
          },
        ],
        selectedTables: bundles.map(({ bundle }) => ({
          tableKey: bundle.table.tableKey,
          previewSource: bundle.provenance.previewSource,
          explanationSource: bundle.provenance.explanationSource,
          metaTypes: bundle.provenance.metaSources.map((entry) => entry.type),
          weightRowCount: bundle.meta.weights.length,
        })),
        selectedIndicators: selectedIndicatorEntries
          .slice(0, selectionCounts.indicators)
          .map(({ bundle }) => ({
          indicatorId: bundle.indicator.indicatorId,
          indicatorName: bundle.indicator.indicatorName,
          explanationSource: bundle.provenance.explanationSource,
          detailSource: bundle.provenance.detailSource,
          matchedQueries:
            selectedIndicatorEntries
              .find((entry) => entry.bundle.indicator.indicatorId === bundle.indicator.indicatorId)
              ?.display.matchedQueries ?? [],
          matchedStrategies:
            selectedIndicatorEntries
              .find((entry) => entry.bundle.indicator.indicatorId === bundle.indicator.indicatorId)
              ?.display.matchedStrategies ?? [],
        })),
        selectedCatalogs: selectedCatalogs.map((catalog) => ({
          catalogKey: catalog.catalogKey,
          vwCd: catalog.vwCd,
          depth: catalog.depth,
        })),
      },
    };
  }
}
