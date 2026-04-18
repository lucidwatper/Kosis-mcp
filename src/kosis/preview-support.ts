import type {
  DataPreviewRow,
  KosisMetaBundle,
  KosisTableBundle,
  PreviewDimensionGuide,
  PreviewGuide,
  PreviewRequestOptions,
  QueryIntent,
  TableIdentity,
} from "./types.js";
import { mapPeriodCode, normalizePeriods, normalizePreviewPeriodKey } from "./period.js";
import {
  guessDefaultDimensionValue,
  readString,
  tableKey,
  uniqueStrings,
} from "./utils.js";

export interface PreviewPlan {
  itemId: string;
  prdSe: string;
  attempts: Array<Record<string, string>>;
  guide: PreviewGuide;
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

  const dimensionGroups = new Map<string, PreviewDimensionGuide>();

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

export function toWeightMetaParams(
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

export function derivePreviewPlanWithSelections(
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

export function normalizeUnits(meta: KosisMetaBundle, preview: DataPreviewRow[]): string[] {
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

export function normalizeDimensions(meta: KosisMetaBundle, preview: DataPreviewRow[]): string[] {
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

export function buildValueComparisonMatrix(
  bundles: KosisTableBundle[],
): Record<string, unknown>[] {
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
    const row: Record<string, unknown> = { period };
    for (const column of columns) {
      row[`${column.title} | ${column.label}`] = column.values[period];
    }
    return row;
  });
}

export function buildTableIdentity(
  orgId: string,
  tblId: string,
  meta: KosisMetaBundle,
  explanation: Record<string, unknown> | null,
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

export function estimateCellCount(
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

export function detectReadiness(
  preview: DataPreviewRow[],
  warnings: string[],
): "high" | "medium" | "low" {
  if (preview.length > 0) {
    return "high";
  }
  if (warnings.length === 0) {
    return "medium";
  }
  return "low";
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

export function inferPreviewOptions(
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

export function buildCoveragePeriods(
  meta: KosisMetaBundle,
  preview: DataPreviewRow[],
): string[] {
  return normalizePeriods(meta, preview);
}
