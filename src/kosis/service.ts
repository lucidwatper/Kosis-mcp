import { FileCache } from "./cache.js";
import { KosisClient } from "./client.js";
import { KosisApiError } from "./errors.js";
import { fetchHtmlPreviewFallback } from "./html-fallback.js";
import { inferQuestionIntent } from "./intent.js";
import {
  buildQueryPlan,
  normalizeIndicatorRecord,
  normalizeSearchRecord,
  scoreIndicatorRecord,
  scoreSearchRecord,
} from "./relevance.js";
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
  ProviderAttemptLog,
  PreviewDimensionGuide,
  PreviewGuide,
  PreviewAttemptLog,
  PreviewRequestOptions,
  QueryPlanItem,
  QueryIntent,
  SearchIndicatorsResult,
  SearchAttemptLog,
  SearchTopicsResult,
  TableIdentity,
} from "./types.js";
import {
  guessDefaultDimensionValue,
  overlapCount,
  readString,
  tableKey,
  textFromRecord,
  tokenizeQuestion,
  uniqueStrings,
} from "./utils.js";

interface PreviewPlan {
  itemId: string;
  prdSe: string;
  attempts: Array<Record<string, string>>;
  guide: PreviewGuide;
}

interface IndicatorSearchAttempt {
  query: string;
  strategy:
    | "list-exact"
    | "explain-exact"
    | "detail-exact"
    | "list-sanitized"
    | "explain-sanitized"
    | "detail-sanitized"
    | "id-explain"
    | "id-detail";
}

interface TableSearchAttempt {
  query: string;
  strategy:
    | "exact-plan"
    | "sanitized-query"
    | "measure-focused"
    | "domain-focused"
    | "suffix-boost";
}

interface CatalogSearchAttempt {
  query: string;
  strategy:
    | "primary-depth1"
    | "primary-depth2"
    | "alternate-depth1"
    | "alternate-depth2"
    | "keyword-focused";
  depthLimit: number;
  views: CatalogView[];
}

interface CachedLoadResult<T> {
  value: T;
  cacheStatus: Exclude<CacheStatus, "bypass">;
  staleError?: unknown;
}

const BUNDLE_CACHE_VERSION = "v3";
const INDICATOR_BUNDLE_CACHE_VERSION = "v2";
const DEFAULT_CATALOG_VIEWS: CatalogView[] = [
  { vwCd: "MT_ZTITLE", name: "주제별 통계", parentListId: "A" },
  { vwCd: "MT_OTITLE", name: "기관별 통계", parentListId: "A" },
  { vwCd: "MT_ATITLE01", name: "지역통계(주제별)", parentListId: "A" },
  { vwCd: "MT_ATITLE02", name: "지역통계(기관별)", parentListId: "A" },
  { vwCd: "MT_GTITLE01", name: "e-지방지표", parentListId: "A" },
  { vwCd: "MT_ETITLE", name: "영문 KOSIS", parentListId: "A" },
];

function mapPeriodCode(raw?: string): string {
  if (!raw) {
    return "Y";
  }

  const value = raw.trim().toUpperCase();
  if (["Y", "M", "Q", "S", "W", "D"].includes(value)) {
    return value;
  }

  const mapped: Record<string, string> = {
    "년": "Y",
    "연": "Y",
    "월": "M",
    "분기": "Q",
    "반기": "S",
    "주": "W",
    "일": "D",
  };

  return mapped[raw.trim()] ?? "Y";
}

function derivePreviewPlan(meta: KosisMetaBundle, preferredPrdSe?: string): PreviewPlan {
  return derivePreviewPlanWithSelections(meta, preferredPrdSe, undefined);
}

function availablePeriodCodes(meta: KosisMetaBundle): string[] {
  return uniqueStrings(meta.period.map((row) => readString(row, "PRD_SE")));
}

function resolvePreferredPeriodCode(
  meta: KosisMetaBundle,
  preferredPrdSe?: string,
): string | undefined {
  const available = availablePeriodCodes(meta).map((value) => value?.toUpperCase());
  if (available.length === 0) {
    return preferredPrdSe;
  }

  const mappedPreferred = mapPeriodCode(preferredPrdSe);
  if (available.includes(mappedPreferred)) {
    return mappedPreferred;
  }

  if (available.includes("Y")) {
    return "Y";
  }

  return available[0];
}

function buildPreviewGuide(meta: KosisMetaBundle): PreviewGuide {
  const itemOptions = uniqueStrings(
    meta.items
      .filter((row) => readString(row, "OBJ_ID") === "ITEM")
      .flatMap((row) => {
        const id = readString(row, "ITM_ID");
        const name = readString(row, "ITM_NM");
        return id && name ? [`${id}::${name}`] : [];
      }),
  ).map((entry) => {
    const [id, name] = entry.split("::");
    return { id, name };
  });

  const dimensionGroups = new Map<
    string,
    PreviewDimensionGuide
  >();

  for (const row of meta.items) {
    const objId = readString(row, "OBJ_ID");
    if (!objId || objId === "ITEM") {
      continue;
    }

    const order = Number.parseInt(readString(row, "OBJ_ID_SN") ?? "999", 10);
    const itmId = readString(row, "ITM_ID");
    const itmNm = readString(row, "ITM_NM");
    if (!itmId) {
      continue;
    }

    const current = dimensionGroups.get(objId) ?? {
      objId,
      name: readString(row, "OBJ_NM") ?? objId,
      order: Number.isFinite(order) ? order : 999,
      values: [],
    };
    if (itmNm) {
      current.values.push({ id: itmId, name: itmNm });
    }
    current.order = Number.isFinite(order) ? order : current.order;
    dimensionGroups.set(objId, current);
  }

  return {
    itemOptions,
    dimensions: [...dimensionGroups.values()]
      .map((dimension) => ({
        ...dimension,
        values: uniqueStrings(
          dimension.values.map((value) => `${value.id}::${value.name}`),
        )
          .map((entry) => {
            const [id, name] = entry.split("::");
            return { id, name };
          })
          .slice(0, 50),
      }))
      .sort((left, right) => left.order - right.order),
  };
}

function resolveSelectionValue(
  dimension: PreviewDimensionGuide,
  selection: string | string[] | undefined,
): string | undefined {
  if (!selection) {
    return undefined;
  }

  const candidates = Array.isArray(selection) ? selection : [selection];
  const lowered = candidates.map((value) => value.toLowerCase().trim());

  const matched = dimension.values.find((value) => {
    const id = value.id.toLowerCase();
    const name = value.name.toLowerCase();
    return lowered.some((candidate) => candidate === id || candidate === name);
  });

  return matched?.id;
}

function toWeightMetaParams(
  attempts: Array<Record<string, string>>,
  itemId: string,
): Record<string, string> | undefined {
  const primaryAttempt = attempts[0];
  if (!primaryAttempt) {
    return undefined;
  }

  const weightParams: Record<string, string> = {};
  for (const [key, value] of Object.entries(primaryAttempt)) {
    const match = key.match(/^objL(\d+)$/);
    if (!match || value === "all") {
      continue;
    }
    weightParams[`C${match[1]}`] = value;
  }

  if (itemId && itemId !== "all") {
    weightParams.ITEM = itemId;
  }

  return Object.keys(weightParams).length > 0 ? weightParams : undefined;
}

function derivePreviewPlanWithSelections(
  meta: KosisMetaBundle,
  preferredPrdSe?: string,
  options?: PreviewRequestOptions,
): PreviewPlan {
  const guide = buildPreviewGuide(meta);
  const itemSelectionLowered = options?.itemSelection?.toLowerCase().trim();
  const itemId =
    guide.itemOptions.find((option) => {
      if (!itemSelectionLowered) {
        return false;
      }
      return (
        option.id.toLowerCase() === itemSelectionLowered ||
        option.name.toLowerCase() === itemSelectionLowered
      );
    })?.id ??
    guide.itemOptions[0]?.id ??
    "all";

  const explicitAttempt: Record<string, string> = {};
  const allAttempt: Record<string, string> = {};
  const firstValueAttempt: Record<string, string> = {};

  for (const [index, dimension] of guide.dimensions.entries()) {
    const selection =
      options?.dimensionSelections?.[dimension.objId] ??
      options?.dimensionSelections?.[dimension.name];
    const selectedId =
      resolveSelectionValue(dimension, selection) ??
      guessDefaultDimensionValue(
        dimension.name,
        dimension.objId,
        dimension.values,
      );

    explicitAttempt[`objL${index + 1}`] = selectedId ?? "all";
    allAttempt[`objL${index + 1}`] = "all";
    firstValueAttempt[`objL${index + 1}`] = dimension.values[0]?.id ?? "all";
  }

  return {
    itemId,
    prdSe: mapPeriodCode(preferredPrdSe),
    attempts:
      guide.dimensions.length > 0
        ? [explicitAttempt, allAttempt, firstValueAttempt]
        : [{ objL1: "all" }],
    guide,
  };
}

function normalizeUnits(meta: KosisMetaBundle, preview: DataPreviewRow[]): string[] {
  const previewLabelUnits = preview.flatMap((row) =>
    Object.values(row)
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.match(/\(([^()]+)\)/)?.[1]),
  );

  return uniqueStrings([
    ...meta.units.map((row) => readString(row, "UNIT_NM") ?? readString(row, "UNIT_NM_ENG")),
    ...meta.items.map((row) => readString(row, "UNIT_NM") ?? readString(row, "UNIT_ENG_NM")),
    ...preview.map((row) => {
      const value = row.UNIT_NM;
      return typeof value === "string" ? value : undefined;
    }),
    ...previewLabelUnits,
  ]);
}

function normalizeDimensions(meta: KosisMetaBundle, preview: DataPreviewRow[]): string[] {
  const fromMeta = meta.items.map((row) => {
    const objNm = readString(row, "OBJ_NM");
    const objId = readString(row, "OBJ_ID");
    return objNm ?? objId;
  });

  const fromPreview = preview.flatMap((row) =>
    Object.entries(row)
      .filter(([key, value]) => key.endsWith("_OBJ_NM") && typeof value === "string")
      .map(([, value]) => value as string),
  );

  return uniqueStrings([...fromMeta, ...fromPreview]);
}

function normalizePeriods(meta: KosisMetaBundle, preview: DataPreviewRow[]): string[] {
  return uniqueStrings([
    ...meta.period.map((row) => readString(row, "PRD_DE")),
    ...preview.map((row) => {
      const value = row.PRD_DE;
      return typeof value === "string" ? value : undefined;
    }),
    ...preview.flatMap((row) =>
      Object.keys(row)
        .filter((key) => key !== "tableKey")
        .map((key) => normalizePreviewPeriodKey(key))
        .filter(Boolean),
    ),
  ]);
}

function normalizePreviewPeriodKey(key: string): string | undefined {
  const trimmed = key.trim().replace(/p\)$/i, "").trim();
  const yearMatch = trimmed.match(/^(\d{4})$/);
  if (yearMatch) {
    return yearMatch[1];
  }
  const yearWordMatch = trimmed.match(/^(\d{4})년$/);
  if (yearWordMatch) {
    return yearWordMatch[1];
  }
  const compactMatch = trimmed.match(/^(\d{4})(\d{2})$/);
  if (compactMatch) {
    return `${compactMatch[1]}-${compactMatch[2]}`;
  }
  const dottedMonthMatch = trimmed.match(/^(\d{4})\.(\d{2})$/);
  if (dottedMonthMatch) {
    return `${dottedMonthMatch[1]}-${dottedMonthMatch[2]}`;
  }
  const quarterMatch = trimmed.match(/^(\d{4})\s*Q([1-4])$/i);
  if (quarterMatch) {
    return `${quarterMatch[1]}-Q${quarterMatch[2]}`;
  }
  return undefined;
}

function parseNumericValue(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.replace(/,/g, "").trim();
  if (!normalized || normalized === "-" || normalized === "…" || normalized === "…") {
    return undefined;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function inferSeriesLabel(row: DataPreviewRow): string {
  const preferredKeys = [
    "ITM_NM",
    "itmNm",
    "1) 기본항목별",
    "기본항목별",
    "항목",
  ];
  for (const key of preferredKeys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  const fallback = Object.entries(row)
    .filter(([key]) => key !== "tableKey")
    .find(([, value]) => typeof value === "string" && !parseNumericValue(value));
  if (fallback && typeof fallback[1] === "string") {
    return fallback[1].trim();
  }

  return "값";
}

function inferSeriesUnit(label: string, bundle: KosisTableBundle): string | undefined {
  const labelUnit = label.match(/\(([^()]+)\)/)?.[1]?.trim();
  if (labelUnit) {
    return labelUnit;
  }
  return bundle.units[0];
}

interface PreviewSeries {
  label: string;
  unit?: string;
  values: Record<string, number>;
}

function extractPreviewSeries(bundle: KosisTableBundle): PreviewSeries[] {
  const seriesMap = new Map<string, PreviewSeries>();

  for (const row of bundle.dataPreview) {
    const label = inferSeriesLabel(row);
    const key = label || bundle.table.title;
    const existing = seriesMap.get(key) ?? {
      label: key,
      unit: inferSeriesUnit(key, bundle),
      values: {},
    };

    const directPeriod = normalizePreviewPeriodKey(String(row.PRD_DE ?? ""));
    const directValue = parseNumericValue(row.DT);
    if (directPeriod && directValue !== undefined) {
      existing.values[directPeriod] = directValue;
    }

    for (const [column, value] of Object.entries(row)) {
      if (column === "tableKey" || column === "PRD_DE" || column === "DT") {
        continue;
      }
      const period = normalizePreviewPeriodKey(column);
      const numeric = parseNumericValue(value);
      if (!period || numeric === undefined) {
        continue;
      }
      existing.values[period] = numeric;
    }

    if (Object.keys(existing.values).length > 0) {
      seriesMap.set(key, existing);
    }
  }

  return [...seriesMap.values()];
}

function buildValueComparisonMatrix(
  bundles: KosisTableBundle[],
): JsonRecord[] {
  const columns = bundles.flatMap((bundle) =>
    extractPreviewSeries(bundle).map((series) => ({
      key: `${bundle.table.tableKey}:${series.label}`,
      title: bundle.table.title,
      label: series.label,
      unit: series.unit,
      values: series.values,
    })),
  );
  const periods = uniqueStrings(
    columns.flatMap((column) => Object.keys(column.values)),
  ).sort();

  return periods.map((period) => {
    const row: JsonRecord = { period };
    for (const column of columns) {
      row[`${column.title} | ${column.label}`] = column.values[period];
    }
    return row;
  });
}

function buildTableIdentity(
  orgId: string,
  tblId: string,
  meta: KosisMetaBundle,
  explanation: JsonRecord | null,
): TableIdentity {
  const sourceRecord = meta.source[0] ?? {};
  const updatedAtRecord = meta.updatedAt[0] ?? {};
  const title = readString(meta.table[0] ?? {}, "TBL_NM") ?? tblId;
  const organization =
    readString(meta.organization[0] ?? {}, "ORG_NM") ?? readString(sourceRecord, "DEPT_NM");
  const statId = readString(sourceRecord, "STAT_ID");
  const survey =
    readString(sourceRecord, "JOSA_NM") ?? readString(explanation ?? {}, "statsNm");
  const lastPeriod = readString(updatedAtRecord, "PRD_DE") ?? readString(meta.period.at(-1) ?? {}, "PRD_DE");

  return {
    tableKey: tableKey(orgId, tblId),
    orgId,
    tblId,
    statId,
    title,
    organization,
    survey,
    period: lastPeriod,
  };
}

function estimateCellCount(
  meta: KosisMetaBundle,
  requestedPeriods: number,
  dimensionWidth = 2,
): number {
  const dimensionCount = Math.max(
    1,
    uniqueStrings(meta.items.map((row) => readString(row, "OBJ_ID"))).length,
  );
  const itemCount = Math.max(
    1,
    uniqueStrings(meta.items.map((row) => readString(row, "ITM_ID"))).length,
  );

  return requestedPeriods * itemCount * Math.max(1, dimensionCount * dimensionWidth);
}

function detectReadiness(preview: DataPreviewRow[], warnings: string[]): "high" | "medium" | "low" {
  if (preview.length > 0) {
    return "high";
  }
  if (warnings.length === 0) {
    return "medium";
  }
  return "low";
}

function summaryRow(bundle: KosisTableBundle) {
  return {
    tableKey: bundle.table.tableKey,
    title: bundle.table.title,
    organization: bundle.table.organization,
    units: bundle.units,
    periods: bundle.coverage.periods,
    dimensionCount: bundle.dimensions.length,
    previewRows: bundle.dataPreview.length,
    readiness: bundle.comparisonReadiness,
    warnings: bundle.warnings,
  };
}

function intersectStrings(groups: string[][]): string[] {
  if (groups.length === 0) {
    return [];
  }

  return groups
    .reduce((accumulator, current) =>
      accumulator.filter((value) => current.includes(value)),
    )
    .filter(Boolean);
}

function chooseItemSelection(
  guide: PreviewGuide,
  keywords: string[],
  title: string,
): string | undefined {
  const loweredTitle = title.toLowerCase();
  const options = guide.itemOptions;
  if (options.length === 0) {
    return undefined;
  }

  const byName = (patterns: string[]) =>
    options.find((option) =>
      patterns.some((pattern) => option.name.includes(pattern)),
    )?.name;

  if (loweredTitle.includes("실업")) {
    return byName(["실업률", "실업자"]);
  }
  if (loweredTitle.includes("고용") || loweredTitle.includes("취업")) {
    return byName(["고용률", "취업자", "취업률"]);
  }
  if (keywords.includes("실업")) {
    return byName(["실업률", "실업자"]);
  }
  if (keywords.includes("고용") || keywords.includes("취업")) {
    return byName(["고용률", "취업자", "취업률"]);
  }

  return options[0]?.name;
}

function chooseDimensionSelections(
  guide: PreviewGuide,
  keywords: string[],
): Record<string, string> {
  const selections: Record<string, string> = {};

  for (const dimension of guide.dimensions) {
    if (
      (dimension.name.includes("연령") || dimension.objId.toLowerCase().includes("age")) &&
      keywords.includes("청년")
    ) {
      const match =
        dimension.values.find((value) => value.name.includes("15 - 29세")) ??
        dimension.values.find((value) => value.name.includes("20 - 29세")) ??
        dimension.values.find((value) => value.name.includes("청년"));
      if (match) {
        selections[dimension.name] = match.name;
        continue;
      }
    }

    if (dimension.name.includes("성별")) {
      const match =
        (keywords.includes("남성") || keywords.includes("남자"))
          ? dimension.values.find((value) => value.name.includes("남"))
          : (keywords.includes("여성") || keywords.includes("여자"))
            ? dimension.values.find((value) => value.name.includes("여"))
            : dimension.values.find(
                (value) => value.name.includes("전체") || value.name === "계",
              );
      if (match) {
        selections[dimension.name] = match.name;
        continue;
      }
    }

    if (
      (dimension.name.includes("국가") || dimension.name.includes("지역")) &&
      !Object.keys(selections).includes(dimension.name)
    ) {
      const match = dimension.values.find(
        (value) =>
          value.name.includes("전국") ||
          value.name.includes("대한민국") ||
          value.name.includes("전체") ||
          value.name === "계",
      );
      if (match) {
        selections[dimension.name] = match.name;
      }
    }
  }

  return selections;
}

function inferPreviewOptions(
  bundle: KosisTableBundle,
  intent: QueryIntent,
): PreviewRequestOptions | undefined {
  const measurePatterns = intent.measures.length > 0 ? intent.measures : intent.keywords;
  const dimensionSelections = chooseDimensionSelections(
    bundle.previewGuide,
    intent.keywords,
  );

  if (intent.geographyScope === "national") {
    for (const dimension of bundle.previewGuide.dimensions) {
      if (dimension.name.includes("지역") || dimension.name.includes("국가")) {
        const match = dimension.values.find((value) =>
          ["전국", "대한민국", "한국", "계", "합계"].some((candidate) =>
            value.name.includes(candidate),
          ),
        );
        if (match) {
          dimensionSelections[dimension.name] = match.name;
        }
      }
    }
  }

  if (intent.sexSelection) {
    for (const dimension of bundle.previewGuide.dimensions) {
      if (dimension.name.includes("성별")) {
        const match = dimension.values.find((value) => value.name.includes(intent.sexSelection!));
        if (match) {
          dimensionSelections[dimension.name] = match.name;
        }
      }
    }
  }

  if (intent.ageSelection) {
    for (const dimension of bundle.previewGuide.dimensions) {
      if (dimension.name.includes("연령")) {
        const match = dimension.values.find((value) =>
          value.name.includes(intent.ageSelection!),
        );
        if (match) {
          dimensionSelections[dimension.name] = match.name;
        }
      }
    }
  }

  let itemSelection = chooseItemSelection(
    bundle.previewGuide,
    intent.keywords,
    bundle.table.title,
  );

  for (const dimension of bundle.previewGuide.dimensions) {
    const measureMatch = dimension.values.find((value) =>
      measurePatterns.some((measure) => value.name.includes(measure)),
    );
    if (measureMatch) {
      dimensionSelections[dimension.name] = measureMatch.name;
    }
  }

  const optionMatch = bundle.previewGuide.itemOptions.find((option) =>
    measurePatterns.some((measure) => option.name.includes(measure)),
  );
  if (optionMatch) {
    itemSelection = optionMatch.name;
  }

  if (!itemSelection && Object.keys(dimensionSelections).length === 0) {
    return undefined;
  }

  return {
    itemSelection,
    dimensionSelections:
      Object.keys(dimensionSelections).length > 0 ? dimensionSelections : undefined,
    newEstPrdCnt: intent.recentPeriods ? Math.min(intent.recentPeriods, 24) : 3,
    startPrdDe: intent.startPrdDe,
    endPrdDe: intent.endPrdDe,
  };
}

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

function isNoDataError(error: unknown): boolean {
  return (
    error instanceof KosisApiError &&
    (error.code === "30" || error.message.includes("데이터가 존재하지 않습니다"))
  );
}

function classifyKosisError(error: unknown): {
  errorType?: "404" | "no-data" | "other";
  errorClass: SearchAttemptLog["errorClass"];
  shouldFallback: boolean;
  note: string;
} {
  if (!(error instanceof KosisApiError)) {
    return {
      errorType: "other",
      errorClass: "unknown",
      shouldFallback: false,
      note: "비KOSIS 오류라서 즉시 중단 대상입니다.",
    };
  }

  if (error.code === "10" || error.code === "11") {
    return {
      errorType: "other",
      errorClass: "fatal-auth",
      shouldFallback: false,
      note: "인증 오류라서 다른 후보로 내려가지 않습니다.",
    };
  }

  if (
    error.code === "20" ||
    error.code === "21" ||
    error.code === "22" ||
    error.message.includes("필수요청변수값이 누락") ||
    error.message.includes("필수요청변수") ||
    error.message.includes("잘못된 요청변수") ||
    error.message.includes("허용되지 않은 파라미터")
  ) {
    return {
      errorType: "other",
      errorClass: "fatal-request",
      shouldFallback: true,
      note: "요청 파라미터 조합이 맞지 않아 다음 전략으로 축소합니다.",
    };
  }

  if (error.code === "30" || error.message.includes("데이터가 존재하지 않습니다")) {
    return {
      errorType: "no-data",
      errorClass: "recoverable-empty",
      shouldFallback: true,
      note: "조회 결과 없음이라 다음 후보로 내려갑니다.",
    };
  }

  if (error.code === "31" || error.code === "41") {
    return {
      errorType: "other",
      errorClass: "recoverable-shape",
      shouldFallback: true,
      note: "결과 범위가 커서 더 좁은 후보가 필요합니다.",
    };
  }

  if (error.code === "40" || error.code === "42") {
    return {
      errorType: "other",
      errorClass: "recoverable-quota",
      shouldFallback: true,
      note: "호출 제한이 걸려 더 싼 후보나 캐시로 내려갑니다.",
    };
  }

  if (
    error.code === "50" ||
    error.message.includes("status 404") ||
    error.message.includes("사이트 변경안내") ||
    error.message.includes("non-JSON payload")
  ) {
    return {
      errorType: error.message.includes("status 404") ? "404" : "other",
      errorClass: "recoverable-server",
      shouldFallback: true,
      note: "서버/응답 형태 문제라 fallback 대상입니다.",
    };
  }

  return {
    errorType: "other",
    errorClass: "unknown",
    shouldFallback: false,
    note: "분류되지 않은 오류라 바로 surface 합니다.",
  };
}

function isIndicatorRecoverableError(error: unknown): boolean {
  return classifyKosisError(error).shouldFallback;
}

function classifySearchError(error: unknown): SearchAttemptLog["errorType"] {
  return classifyKosisError(error).errorType;
}

function shouldUseStaleBecauseOutputIsNotUsable(
  attempts: Array<ProviderAttemptLog>,
  resultCount: number,
): boolean {
  if (resultCount > 0) {
    return false;
  }

  const hadServerishError = attempts.some((attempt) =>
    ["recoverable-server", "recoverable-quota", "recoverable-shape"].includes(
      attempt.errorClass ?? "",
    ),
  );
  const hadOkAttempt = attempts.some((attempt) => attempt.outcome === "ok");
  return hadServerishError && !hadOkAttempt;
}

function sanitizeSearchQuery(query: string): string {
  return query
    .replace(/대한민국|한국|국내|지난|최근|비교해줘|비교|보여줘|설명해줘|무엇인지|의미|설명자료/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildTableSearchAttempts(
  question: string,
  intent: QueryIntent,
  queryPlan: QueryPlanItem[],
): TableSearchAttempt[] {
  const exactQueries = uniqueStrings(queryPlan.map((item) => item.query));
  const sanitizedQueries = uniqueStrings(exactQueries.map(sanitizeSearchQuery)).filter(
    (query) => query.length >= 2,
  );
  const measureQueries = uniqueStrings([
    ...intent.measures,
    ...intent.keywords.slice(0, 2),
  ]).filter((query) => query.length >= 2);
  const domainQueries = uniqueStrings(intent.searchHints).filter((query) => query.length >= 2);
  const suffixQueries = uniqueStrings(
    [...intent.measures, ...intent.keywords.slice(0, 2)].flatMap((query) =>
      query.length >= 2 ? [`${query} 통계표`, `${query} 통계자료`] : [],
    ),
  );

  return [
    ...exactQueries.map((query) => ({ query, strategy: "exact-plan" as const })),
    ...sanitizedQueries.map((query) => ({ query, strategy: "sanitized-query" as const })),
    ...measureQueries.map((query) => ({ query, strategy: "measure-focused" as const })),
    ...domainQueries.map((query) => ({ query, strategy: "domain-focused" as const })),
    ...suffixQueries.map((query) => ({ query, strategy: "suffix-boost" as const })),
  ];
}

function alternateCatalogViews(primaryViews: CatalogView[]): CatalogView[] {
  const primaryCodes = new Set(primaryViews.map((view) => view.vwCd));
  return DEFAULT_CATALOG_VIEWS.filter((view) => !primaryCodes.has(view.vwCd));
}

function buildCatalogSearchAttempts(
  question: string,
  intent: QueryIntent,
  queryPlan: QueryPlanItem[],
): CatalogSearchAttempt[] {
  const primaryViews = selectCatalogViews(question, intent);
  const alternateViews = alternateCatalogViews(primaryViews);
  const exactQuery = queryPlan[0]?.query ?? question;
  const sanitizedQuery = sanitizeSearchQuery(exactQuery) || exactQuery;
  const keywordQuery = intent.keywords[0] ?? sanitizedQuery;

  return [
    { query: exactQuery, strategy: "primary-depth1", depthLimit: 1, views: primaryViews },
    { query: exactQuery, strategy: "primary-depth2", depthLimit: 2, views: primaryViews },
    { query: exactQuery, strategy: "alternate-depth1", depthLimit: 1, views: alternateViews },
    { query: sanitizedQuery, strategy: "alternate-depth2", depthLimit: 2, views: alternateViews },
    { query: keywordQuery, strategy: "keyword-focused", depthLimit: 2, views: primaryViews },
  ];
}

function sanitizeIndicatorQuery(query: string): string {
  return query
    .replace(/대한민국|한국|국내/g, "")
    .replace(/최근|추이|설명자료|설명|의미|수치|값|통계표|통계자료|지표|시계열/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildIndicatorAttempts(
  question: string,
  intent: QueryIntent,
  queryPlan: QueryPlanItem[],
): IndicatorSearchAttempt[] {
  const exactQueries = uniqueStrings(queryPlan.map((item) => item.query));
  const sanitizedQueries = uniqueStrings([
    ...exactQueries.map(sanitizeIndicatorQuery),
    ...intent.measures,
    ...intent.keywords.filter((keyword) => keyword.length >= 2),
    sanitizeIndicatorQuery(question),
  ]).filter((query) => query.length >= 2);

  const attempts: IndicatorSearchAttempt[] = [];
  for (const query of exactQueries) {
    attempts.push({ query, strategy: "list-exact" });
    attempts.push({ query, strategy: "explain-exact" });
    attempts.push({ query, strategy: "detail-exact" });
  }
  for (const query of sanitizedQueries) {
    attempts.push({ query, strategy: "list-sanitized" });
    attempts.push({ query, strategy: "explain-sanitized" });
    attempts.push({ query, strategy: "detail-sanitized" });
  }

  return attempts;
}

function chooseBestIndicatorRecord(
  records: JsonRecord[],
  nameHint?: string,
): JsonRecord | null {
  if (records.length === 0) {
    return null;
  }

  const normalizedHint = nameHint?.replace(/\s+/g, "").toLowerCase();
  const loweredHint = nameHint?.toLowerCase();
  if (!normalizedHint || !loweredHint) {
    return records[0];
  }

  const exact = records.find((record) => {
    const name = (readString(record, "statJipyoNm") ?? "")
      .replace(/\s+/g, "")
      .toLowerCase();
    return name === normalizedHint;
  });
  if (exact) {
    return exact;
  }

  const partial = records.find((record) => {
    const name = (readString(record, "statJipyoNm") ?? "").toLowerCase();
    return name.includes(loweredHint);
  });
  return partial ?? records[0];
}

function buildIndicatorCoverage(
  listMatches: JsonRecord[],
  detailRows: JsonRecord[],
): IndicatorBundle["coverage"] {
  const firstList = listMatches[0] ?? {};
  const firstDetail = detailRows[0] ?? {};
  const lastDetail = detailRows.at(-1) ?? {};

  return {
    start:
      readString(firstList, "strtPrdDe") ??
      readString(firstDetail, "prdDe"),
    end:
      readString(firstList, "endPrdDe") ??
      readString(lastDetail, "prdDe"),
    latest:
      readString(firstList, "prdDe") ??
      readString(lastDetail, "prdDe"),
    prdSe:
      readString(firstDetail, "prdSe"),
    prdSeName: readString(firstList, "prdSeName"),
  };
}

function buildIndicatorIdentity(
  indicatorId: string | undefined,
  indicatorName: string,
  listMatches: JsonRecord[],
  detailRows: JsonRecord[],
  sourceQuery?: string,
): IndicatorBundle["indicator"] {
  return {
    indicatorId,
    indicatorName,
    unit:
      readString(detailRows[0] ?? {}, "unit") ??
      readString(listMatches[0] ?? {}, "unit"),
    sourceQuery,
  };
}

function firstUsableRecord(rows: JsonRecord[]): JsonRecord | null {
  return rows.find((row) => Object.keys(row).length > 0) ?? null;
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

function summarizeIndicatorAttempts(
  attempts: IndicatorSearchAttemptLog[],
): AnswerProvenance["lanes"][number] {
  const okCount = attempts.filter((attempt) => attempt.outcome === "ok").length;
  const emptyCount = attempts.filter((attempt) => attempt.outcome === "empty").length;
  const errorAttempts = attempts.filter((attempt) => attempt.outcome === "error");
  const strategyCounts = new Map<string, number>();

  for (const attempt of attempts) {
    strategyCounts.set(
      attempt.strategy,
      (strategyCounts.get(attempt.strategy) ?? 0) + 1,
    );
  }

  const topStrategies = [...strategyCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([strategy]) => strategy);

  return {
    lane: "indicator-search",
    enabled: true,
    queryPlan: [],
    resultCount: 0,
    attemptCount: attempts.length,
    okCount,
    emptyCount,
    errorCount: errorAttempts.length,
    error404Count: errorAttempts.filter((attempt) => attempt.errorType === "404").length,
    topStrategies,
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

function catalogKeyFromRecord(view: CatalogView, record: JsonRecord): string | null {
  const orgId = readString(record, "ORG_ID");
  const tblId = readString(record, "TBL_ID");
  const listId = readString(record, "LIST_ID");

  if (orgId && tblId) {
    return `catalog-table:${view.vwCd}:${orgId}:${tblId}`;
  }
  if (listId) {
    return `catalog-list:${view.vwCd}:${listId}`;
  }
  return null;
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
        prdSe: fallbackPreview?.periodCode ?? input.previewPlan.prdSe,
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
          effectivePreviewPrdSe: fallbackPreview.periodCode,
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
        const aggregate = new Map<string, NormalizedSearchResult>();
        const attempts = buildTableSearchAttempts(question, intent, queryPlan);
        const attemptLogs: SearchAttemptLog[] = [];

        for (const [queryIndex, attempt] of attempts.entries()) {
          try {
            const records = await this.client.searchStatistics({
              searchNm: attempt.query,
              resultCount: Math.max(limit * 2, 10),
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
                keywords,
                attempt.query,
                queryIndex,
                rankIndex,
                record,
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
          .slice(0, limit);

        if (shouldUseStaleBecauseOutputIsNotUsable(attemptLogs, results.length)) {
          throw new KosisApiError(
            "usable output을 만들지 못해 stale cache fallback 후보로 전환합니다.",
            "50",
          );
        }

        return {
          cacheStatus: "miss",
          queryPlan,
          attempts: attemptLogs,
          results,
        };
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
        const aggregate = new Map<string, NormalizedIndicatorResult>();
        const attemptLogs: IndicatorSearchAttemptLog[] = [];
        const attempts = buildIndicatorAttempts(question, intent, queryPlan);
        const discoveredIds = new Set<string>();
        const indicatorSearchWindow = Math.max(limit * 6, 30);
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
              keywords,
              query,
              queryIndex,
              rankIndex,
              record,
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
                  srvRn: intent.recentPeriods ? Math.min(intent.recentPeriods, 12) : 5,
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

        const discoveredIdList = [...discoveredIds].slice(0, 10);
        for (const [idIndex, indicatorId] of discoveredIdList.entries()) {
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

          try {
            const detailRows = await this.client.getIndicatorDetailById({
              indicatorId,
              srvRn: intent.recentPeriods ? Math.min(intent.recentPeriods, 12) : 5,
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
          .slice(0, limit);

        if (shouldUseStaleBecauseOutputIsNotUsable(attemptLogs, results.length)) {
          throw new KosisApiError(
            "usable indicator output을 만들지 못해 stale cache fallback 후보로 전환합니다.",
            "50",
          );
        }

        return {
          cacheStatus: "miss",
          queryPlan,
          attempts: attemptLogs,
          results,
        };
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
        const catalogAttempts = buildCatalogSearchAttempts(question, intent, queryPlan);
        const aggregate = new Map<string, CatalogResult>();
        const attemptLogs: SearchAttemptLog[] = [];
        const exploredViewsMap = new Map<string, CatalogView>();

        for (const [attemptIndex, attempt] of catalogAttempts.entries()) {
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
                    keywords,
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
          }
        }

        const sorted = [...aggregate.values()].sort((left, right) => right.score - left.score);
        const seededResults = [
          ...sorted
            .filter((result) => !result.tblId && result.depth === 0)
            .slice(0, Math.max(1, Math.floor(limit / 3))),
          ...sorted
            .filter((result) => result.depth >= 2)
            .slice(0, Math.max(1, Math.floor(limit / 3))),
          ...sorted
            .filter((result) => Boolean(result.tblId))
            .slice(0, Math.max(1, Math.ceil(limit / 3))),
          ...sorted
            .filter((result) => Boolean(result.listId) && !result.tblId)
            .slice(0, Math.max(1, Math.floor(limit / 2))),
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
          if (results.length >= limit) {
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
          queryPlan,
          exploredViews: [...exploredViewsMap.values()],
          attempts: attemptLogs,
          results,
        };
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
            periods: normalizePeriods(meta, dataPreview),
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
    const shouldSearchIndicators =
      intent.wantsIndicators || intent.wantsExplanation || intent.measures.length > 0;
    const shouldBrowse = wantsCatalogBrowse(question, intent);
    const compareQueries = compareTopicQueries(intent);
    const [search, indicatorSearch, catalogSearch, compareSearches] = await Promise.all([
      this.searchTopics(question, combinedHints, limit),
      shouldSearchIndicators
        ? this.searchIndicators(question, combinedHints, limit)
        : Promise.resolve<SearchIndicatorsResult>({
            cacheStatus: "bypass",
            queryPlan: [],
            attempts: [],
            results: [],
          }),
      shouldBrowse
        ? this.browseCatalog(question, combinedHints, Math.max(limit, 6))
        : Promise.resolve<BrowseCatalogResult>({
            cacheStatus: "bypass",
            queryPlan: [],
            exploredViews: [],
            attempts: [],
            results: [],
          }),
      compareQueries.length > 0
        ? Promise.all(
            compareQueries.map((query) =>
              this.searchTopics(query, [], Math.max(limit, 6)),
            ),
          )
        : Promise.resolve<SearchTopicsResult[]>([]),
    ]);
    const comparisonMode = options?.comparisonMode ?? "auto";
    const selectionCounts = preferredSelectionCounts(intent, comparisonMode);
    const searchPool = new Map<string, NormalizedSearchResult>();
    for (const result of search.results) {
      searchPool.set(result.tableKey, result);
    }
    for (const compareSearch of compareSearches) {
      for (const result of compareSearch.results) {
        const current = searchPool.get(result.tableKey);
        if (!current || current.score < result.score) {
          searchPool.set(result.tableKey, result);
        }
      }
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
            { focus: intent.keywords.join(", ") },
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
        queryPlan: search.queryPlan,
      },
      summary,
      selectedTables,
      selectedIndicators,
      selectedCatalogs,
      comparison,
      nextQuestions,
      evidence,
      provenance: {
        lanes: [
          {
            lane: "table-search",
            enabled: true,
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
