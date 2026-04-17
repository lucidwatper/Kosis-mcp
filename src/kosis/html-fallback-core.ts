import { KosisApiError } from "./errors.js";
import type {
  DataPreviewRow,
  KosisMetaBundle,
  PreviewRequestOptions,
} from "./types.js";
import { guessDefaultDimensionValue } from "./utils.js";

export interface StatHtmlInfo {
  itemInfo?: {
    defaultItmList?: string[];
    itmList?: Array<{ itmId: string; scrKor?: string }>;
  };
  classInfoList?: Array<{
    classId: string;
    classNm: string;
    sn: string;
    visible?: boolean;
    defaultItmList?: string[];
    defaultItmMapList?: Array<{ LVL: number | string; ITM_ID: string }>;
    itmList?: Array<{ itmId: string; scrKor?: string }>;
  }>;
  defaultPeriodStr?: string;
  periodInfo?: Record<string, unknown>;
  pivotInfo?: {
    colList?: string[];
    rowList?: string[];
  };
  analyzable?: boolean;
  colClsAt?: string;
}

export interface SelectedClass {
  classId: string;
  values: string[];
  filterValues: string[];
  levelGroups: Array<{ level: number; values: string[] }>;
  sn: string;
}

type StatClassInfo = NonNullable<StatHtmlInfo["classInfoList"]>[number];

export interface ResolvedSelectionMap {
  [classId: string]: string | undefined;
}

export function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x2F;/g, "/");
}

function stripHtml(value: string): string {
  return decodeHtml(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

export function extractAssignments(
  html: string,
  target: string,
): Record<string, string> {
  const assignments: Record<string, string> = {};
  const pattern = new RegExp(
    `${target}\\.([A-Za-z0-9_]+)\\s*=\\s*["']([^"']*)["'];`,
    "g",
  );

  for (const match of html.matchAll(pattern)) {
    const [, key, value] = match;
    assignments[key] = decodeHtml(value);
  }

  return assignments;
}

export function extractAction(html: string): string {
  const actionMatch = html.match(/paramInfoForm\.action\s*=\s*["']([^"']+)["'];/);
  if (!actionMatch) {
    throw new KosisApiError("Unable to resolve statHtmlContent action for HTML fallback.");
  }
  return actionMatch[1];
}

export function extractFormInputs(html: string): URLSearchParams {
  const formMatch = html.match(
    /<form[^>]+id="ParamInfo"[\s\S]*?>([\s\S]*?)<\/form>/,
  );

  if (!formMatch) {
    throw new KosisApiError("Unable to parse ParamInfo form for HTML fallback.");
  }

  const formHtml = formMatch[1];
  const params = new URLSearchParams();
  const inputPattern = /<input([^>]+)>/g;

  for (const match of formHtml.matchAll(inputPattern)) {
    const attrs = match[1];
    const name = attrs.match(/\bname="([^"]+)"/)?.[1];
    if (!name) {
      continue;
    }

    const type = attrs.match(/\btype="([^"]+)"/)?.[1]?.toLowerCase() ?? "text";
    const value = decodeHtml(attrs.match(/\bvalue="([^"]*)"/)?.[1] ?? "");
    const checked = /\bchecked(?:="checked")?\b/.test(attrs);

    if ((type === "checkbox" || type === "radio") && !checked) {
      continue;
    }

    params.append(name, value);
  }

  const selectPattern =
    /<select[^>]+name="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g;

  for (const match of formHtml.matchAll(selectPattern)) {
    const [, name, optionsHtml] = match;
    const options = [...optionsHtml.matchAll(/<option([^>]*)>([\s\S]*?)<\/option>/g)];
    if (options.length === 0) {
      continue;
    }

    const selected =
      options.find((option) => /\bselected(?:="selected")?\b/.test(option[1])) ??
      options[0];
    const value =
      selected[1].match(/\bvalue="([^"]*)"/)?.[1] ?? stripHtml(selected[2]);
    params.append(name, decodeHtml(value));
  }

  const textareaPattern =
    /<textarea[^>]+name="([^"]+)"[^>]*>([\s\S]*?)<\/textarea>/g;

  for (const match of formHtml.matchAll(textareaPattern)) {
    const [, name, value] = match;
    params.append(name, decodeHtml(value));
  }

  return params;
}

export function extractStatInfo(html: string): StatHtmlInfo {
  const match = html.match(/var g_jsonStatInfo\s*=\s*'([\s\S]*?)';/);
  if (!match) {
    throw new KosisApiError("Unable to parse g_jsonStatInfo for HTML fallback.");
  }

  const raw = match[1]
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, "\\");

  return JSON.parse(raw) as StatHtmlInfo;
}

function availablePeriodCodes(statInfo: StatHtmlInfo): string[] {
  return Object.keys(statInfo.periodInfo ?? {})
    .map((key) => key.match(/^defaultList([A-Z])$/)?.[1])
    .filter((value): value is string => Boolean(value));
}

function isWithinPeriodRange(
  value: string,
  startPrdDe?: string,
  endPrdDe?: string,
): boolean {
  if (!startPrdDe && !endPrdDe) {
    return true;
  }

  const normalized = value.replace(/[^\d]/g, "");
  if (!normalized) {
    return false;
  }

  const start = startPrdDe?.replace(/[^\d]/g, "");
  const end = endPrdDe?.replace(/[^\d]/g, "");

  if (start && normalized < start) {
    return false;
  }
  if (end && normalized > end) {
    return false;
  }
  return true;
}

export function resolveDefaultPeriodCode(
  statInfo: StatHtmlInfo,
  options?: PreviewRequestOptions,
): string {
  const available = availablePeriodCodes(statInfo);
  const preferred = options?.preferredPrdSe?.toUpperCase();
  if (preferred && available.includes(preferred)) {
    return preferred;
  }

  const period = statInfo.defaultPeriodStr?.split("#").find(Boolean);
  if (period && available.includes(period)) {
    return period;
  }

  if (available.includes("Y") && (options?.startPrdDe || options?.endPrdDe)) {
    return "Y";
  }

  return period ?? available[0] ?? "M";
}

export function resolvePeriodList(
  statInfo: StatHtmlInfo,
  periodCode: string,
  options?: PreviewRequestOptions,
): string[] {
  const defaultKey = `defaultList${periodCode}`;
  const listKey = `list${periodCode}`;
  const defaultValues = Array.isArray(statInfo.periodInfo?.[defaultKey])
    ? (statInfo.periodInfo?.[defaultKey] as Array<string | number>)
    : [];
  const listValues = Array.isArray(statInfo.periodInfo?.[listKey])
    ? (statInfo.periodInfo?.[listKey] as Array<string | number>)
    : [];

  const normalizedDefault = defaultValues.map((value) => String(value));
  const normalizedFull =
    listValues.length > 0
      ? listValues.map((value) => String(value))
      : normalizedDefault;
  const count = options?.newEstPrdCnt ?? Math.min(5, normalizedDefault.length || normalizedFull.length || 5);
  const wantsExpandedRange =
    Boolean(options?.startPrdDe || options?.endPrdDe) ||
    (options?.newEstPrdCnt !== undefined &&
      normalizedFull.length > normalizedDefault.length &&
      options.newEstPrdCnt > normalizedDefault.length);

  const filteredFull = normalizedFull.filter((value) =>
    isWithinPeriodRange(value, options?.startPrdDe, options?.endPrdDe),
  );
  if (wantsExpandedRange && filteredFull.length > 0) {
    return filteredFull.slice(-count);
  }

  const normalized = normalizedDefault.length > 0 ? normalizedDefault : normalizedFull;
  const filtered = normalized.filter((value) =>
    isWithinPeriodRange(value, options?.startPrdDe, options?.endPrdDe),
  );
  const source = filtered.length > 0 ? filtered : normalized;
  return source.slice(-count);
}

export function resolveSelectedItems(
  statInfo: StatHtmlInfo,
  options?: PreviewRequestOptions,
): string[] {
  const defaultItems = statInfo.itemInfo?.defaultItmList ?? [];
  const allItems = statInfo.itemInfo?.itmList ?? [];

  if (!options?.itemSelection) {
    return defaultItems.length > 0 ? [defaultItems[0]] : [];
  }

  const lowered = options.itemSelection.toLowerCase().trim();
  const matched = allItems.find(
    (item) =>
      item.itmId.toLowerCase() === lowered ||
      (item.scrKor?.toLowerCase().trim() ?? "") === lowered,
  );

  return matched ? [matched.itmId] : defaultItems.length > 0 ? [defaultItems[0]] : [];
}

function expandHierarchyValues(
  classId: string,
  selectedIds: string[],
  meta?: KosisMetaBundle,
): string[] {
  if (!meta || selectedIds.length === 0) {
    return selectedIds;
  }

  const itemById = new Map(
    meta.items
      .filter((item) => item.OBJ_ID === classId && typeof item.ITM_ID === "string")
      .map((item) => [
        String(item.ITM_ID),
        typeof item.UP_ITM_ID === "string" ? String(item.UP_ITM_ID) : undefined,
      ]),
  );

  const expanded = selectedIds.flatMap((selectedId) => {
    const chain: string[] = [];
    let current: string | undefined = selectedId;
    const seen = new Set<string>();

    while (current && !seen.has(current)) {
      seen.add(current);
      chain.unshift(current);
      current = itemById.get(current);
    }

    return chain.length > 0 ? chain : [selectedId];
  });

  return [...new Set(expanded)];
}

function buildLevelGroups(
  classId: string,
  selectedIds: string[],
  classInfo: StatClassInfo,
  meta?: KosisMetaBundle,
): Array<{ level: number; values: string[] }> {
  const levelById = new Map<string, number>();

  for (const item of classInfo.defaultItmMapList ?? []) {
    const level = Number.parseInt(String(item.LVL), 10);
    if (Number.isFinite(level)) {
      levelById.set(item.ITM_ID, level);
    }
  }

  if (meta) {
    const parentMap = new Map(
      meta.items
        .filter((item) => item.OBJ_ID === classId && typeof item.ITM_ID === "string")
        .map((item) => [
          String(item.ITM_ID),
          typeof item.UP_ITM_ID === "string" ? String(item.UP_ITM_ID) : undefined,
        ]),
    );

    const inferLevel = (id: string): number => {
      if (levelById.has(id)) {
        return levelById.get(id) ?? 1;
      }
      let depth = 1;
      let current = parentMap.get(id);
      const seen = new Set<string>();
      while (current && !seen.has(current)) {
        seen.add(current);
        depth += 1;
        current = parentMap.get(current);
      }
      return depth;
    };

    for (const id of selectedIds) {
      if (!levelById.has(id)) {
        levelById.set(id, inferLevel(id));
      }
    }
  }

  const grouped = new Map<number, string[]>();
  for (const id of selectedIds) {
    const level = levelById.get(id) ?? 1;
    const current = grouped.get(level) ?? [];
    current.push(id);
    grouped.set(level, current);
  }

  return [...grouped.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([level, values]) => ({ level, values }));
}

function createSelectedClass(
  classInfo: StatClassInfo,
  values: string[],
  filterValues: string[],
  meta?: KosisMetaBundle,
): SelectedClass {
  return {
    classId: classInfo.classId,
    values,
    filterValues,
    levelGroups: buildLevelGroups(classInfo.classId, values, classInfo, meta),
    sn: classInfo.sn,
  };
}

export function resolveSelectedClasses(
  statInfo: StatHtmlInfo,
  options?: PreviewRequestOptions,
  meta?: KosisMetaBundle,
  resolvedSelections?: ResolvedSelectionMap,
): SelectedClass[] {
  return (statInfo.classInfoList ?? []).map((classInfo) => {
    const explicitSelection =
      resolvedSelections?.[classInfo.classId] ??
      options?.dimensionSelections?.[classInfo.classId] ??
      options?.dimensionSelections?.[classInfo.classNm];

    const explicitValues = Array.isArray(explicitSelection)
      ? explicitSelection
      : explicitSelection
        ? [explicitSelection]
        : [];
    const lowered = explicitValues.map((value) => value.toLowerCase().trim());
    const metaMatches = (meta?.items ?? [])
      .filter(
        (item) =>
          item.OBJ_ID === classInfo.classId &&
          typeof item.ITM_ID === "string" &&
          lowered.some(
            (candidate) =>
              String(item.ITM_ID).toLowerCase() === candidate ||
              (typeof item.ITM_NM === "string" && item.ITM_NM.toLowerCase().trim() === candidate),
          ),
      )
      .map((item) => String(item.ITM_ID));

    const mappedExplicit = (classInfo.itmList ?? [])
      .filter((item) =>
        lowered.some(
          (candidate) =>
            item.itmId.toLowerCase() === candidate ||
            (item.scrKor?.toLowerCase().trim() ?? "") === candidate,
        ),
      )
      .map((item) => item.itmId);
    const resolvedExplicit = [...new Set([...mappedExplicit, ...metaMatches])];

    if (resolvedExplicit.length > 0) {
      return createSelectedClass(
        classInfo,
        expandHierarchyValues(classInfo.classId, resolvedExplicit, meta),
        resolvedExplicit,
        meta,
      );
    }

    const inferredDefault = guessDefaultDimensionValue(
      classInfo.classNm,
      classInfo.classId,
      (classInfo.itmList ?? []).map((item) => ({
        id: item.itmId,
        name: item.scrKor,
      })),
    );
    if (inferredDefault) {
      return createSelectedClass(
        classInfo,
        expandHierarchyValues(classInfo.classId, [inferredDefault], meta),
        [inferredDefault],
        meta,
      );
    }

    const fallback =
      classInfo.defaultItmMapList?.map((item) => item.ITM_ID) ??
      classInfo.defaultItmList?.map((entry) => entry.split("#").at(-1) ?? "") ??
      [];
    const filteredFallback = fallback.filter(Boolean);

    return createSelectedClass(
      classInfo,
      filteredFallback,
      filteredFallback,
      meta,
    );
  });
}

function normalizeForMatch(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "");
}

function buildSelectedLabelMap(
  statInfo: StatHtmlInfo,
  selectedClasses: SelectedClass[],
): Map<string, string[]> {
  return new Map(
    selectedClasses.map((selectedClass) => {
      const classInfo = (statInfo.classInfoList ?? []).find(
        (entry) => entry.classId === selectedClass.classId,
      );
      const labels = selectedClass.filterValues.map((valueId) => {
        const match = (classInfo?.itmList ?? []).find((item) => item.itmId === valueId);
        return match?.scrKor?.trim() ?? valueId;
      });
      return [selectedClass.classId, labels];
    }),
  );
}

export function buildFieldList(
  selectedItems: string[],
  selectedClasses: SelectedClass[],
  periodCode: string,
  periods: string[],
): string {
  const fieldList = [
    {
      targetId: "PRD",
      targetValue: "",
      prdValue: `${periodCode},${periods.join(",")},@`,
    },
    ...selectedItems.map((itemId) => ({
      targetId: "ITM_ID",
      targetValue: itemId,
      prdValue: "",
    })),
    ...selectedClasses.flatMap((classInfo, index) =>
      classInfo.values.map((value) => ({
        targetId: `OV_L${index + 1}_ID`,
        targetValue: value,
        prdValue: "",
      })),
    ),
  ];

  return JSON.stringify(fieldList);
}

export function buildDefaultClassArr(selectedClasses: SelectedClass[]): string {
  return JSON.stringify(
    selectedClasses.flatMap((classInfo) =>
      classInfo.levelGroups.map((group) => ({
        objVarId: classInfo.classId,
        data: group.values,
        classType: group.level,
        classLvlCnt: group.values.length,
      })),
    ),
  );
}

export function buildDefaultItemArr(selectedItems: string[]): string {
  return JSON.stringify([{ data: selectedItems }]);
}

export function buildDefaultPeriodArr(
  periodCode: string,
  periods: string[],
): string {
  const parsedPeriods = periods.map((value) =>
    Number.parseInt(value, 10),
  );
  return JSON.stringify({ [periodCode]: parsedPeriods });
}

export function buildClassAllArr(statInfo: StatHtmlInfo): string {
  return JSON.stringify(
    (statInfo.classInfoList ?? []).map((classInfo) => ({
      objVarId: classInfo.classId,
      ovlSn: classInfo.sn,
    })),
  );
}

export function buildClassSet(statInfo: StatHtmlInfo): string {
  return JSON.stringify(
    (statInfo.classInfoList ?? []).map((classInfo) => ({
      objVarId: classInfo.classId,
      ovlSn: classInfo.sn,
      visible: String(classInfo.visible ?? true),
    })),
  );
}

export function buildOrderStr(statInfo: StatHtmlInfo): string {
  const rows = statInfo.pivotInfo?.rowList ?? [];
  const parts = rows.map((_, index) => `OV_L${index + 1}_ID`);
  parts.push("TIME", "CHAR_ITM_ID");
  return parts.join(",");
}

function buildBroadSelectedClasses(statInfo: StatHtmlInfo): SelectedClass[] {
  return (statInfo.classInfoList ?? []).map((classInfo) => {
    const values =
      classInfo.defaultItmMapList?.map((item) => item.ITM_ID).filter(Boolean) ??
      classInfo.defaultItmList?.map((entry) => entry.split("#").at(-1) ?? "").filter(Boolean) ??
      [];

    return createSelectedClass(classInfo, values, values);
  });
}

export function filterRowsToSelectedClasses(
  rows: DataPreviewRow[],
  headerCells: string[],
  statInfo: StatHtmlInfo,
  selectedClasses: SelectedClass[],
  fallbackToOriginal = true,
): DataPreviewRow[] {
  if (rows.length === 0 || selectedClasses.length === 0) {
    return rows;
  }

  const selectedLabelMap = buildSelectedLabelMap(statInfo, selectedClasses);
  const lastSeenByHeader = new Map<string, string>();

  const filteredRows = rows.filter((row) => {
    const effectiveRow = new Map<string, string>();

    for (const header of headerCells) {
      if (header === "tableKey") {
        continue;
      }
      const rawValue = row[header];
      const value = typeof rawValue === "string" ? rawValue.trim() : "";
      if (value) {
        lastSeenByHeader.set(header, value);
        effectiveRow.set(header, value);
        continue;
      }

      const previous = lastSeenByHeader.get(header);
      if (previous) {
        effectiveRow.set(header, previous);
      }
    }

    return selectedClasses.every((selectedClass) => {
      const classInfo = (statInfo.classInfoList ?? []).find(
        (entry) => entry.classId === selectedClass.classId,
      );
      if (!classInfo) {
        return true;
      }

      const matchingHeaders = headerCells.filter((header) =>
        normalizeForMatch(header).includes(normalizeForMatch(classInfo.classNm)),
      );
      if (matchingHeaders.length === 0) {
        return true;
      }

      const selectedLabels = selectedLabelMap.get(selectedClass.classId) ?? [];
      return matchingHeaders.some((header) => {
        const effectiveValue = effectiveRow.get(header);
        if (!effectiveValue) {
          return false;
        }
        const normalizedValue = normalizeForMatch(effectiveValue);
        return selectedLabels.some(
          (label) =>
            normalizedValue === normalizeForMatch(label) ||
            normalizedValue.includes(normalizeForMatch(label)),
        );
      });
    });
  });

  return filteredRows.length > 0 ? filteredRows : fallbackToOriginal ? rows : [];
}

export function parseTableHtml(
  tableHtml: string,
  tableKey: string,
  statInfo: StatHtmlInfo,
  selectedClasses: SelectedClass[],
  fallbackToOriginal = true,
): DataPreviewRow[] {
  const rows = [...tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map(
    (match) => match[1],
  );
  if (rows.length === 0) {
    return [];
  }

  const headerCells = [...rows[0].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map(
    (match) => stripHtml(match[1]),
  );

  const parsedRows = rows
    .slice(1)
    .map((rowHtml) => [...rowHtml.matchAll(/<(td|th)[^>]*>([\s\S]*?)<\/(td|th)>/g)])
    .filter((cells) => cells.length > 0)
    .map((cells) => {
      const record: DataPreviewRow = { tableKey };
      cells.forEach((cell, index) => {
        const value = stripHtml(cell[2]);
        const header = headerCells[index] || `HTML_COL_${index + 1}`;
        record[header] = value;
      });
      return record;
    })
    .filter((record) =>
      Object.entries(record)
        .filter(([key]) => key !== "tableKey")
        .some(([, value]) => typeof value === "string" && /\d/.test(value)),
    );

  return filterRowsToSelectedClasses(
    parsedRows,
    ["tableKey", ...headerCells],
    statInfo,
    selectedClasses,
    fallbackToOriginal,
  ).slice(0, 20);
}

export function buildBroadFilterClasses(statInfo: StatHtmlInfo): SelectedClass[] {
  return buildBroadSelectedClasses(statInfo);
}
