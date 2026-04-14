import type { KosisConfig } from "../config.js";
import { KosisApiError } from "./errors.js";
import type {
  DataPreviewRow,
  KosisMetaBundle,
  PreviewRequestOptions,
} from "./types.js";
import { guessDefaultDimensionValue } from "./utils.js";

interface CookieEntry {
  name: string;
  value: string;
}

interface StatHtmlInfo {
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

interface SelectedClass {
  classId: string;
  values: string[];
  filterValues: string[];
  sn: string;
}

interface ResolvedSelectionMap {
  [classId: string]: string | undefined;
}

function decodeHtml(value: string): string {
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

function extractAssignments(
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

function extractAction(html: string): string {
  const actionMatch = html.match(/paramInfoForm\.action\s*=\s*["']([^"']+)["'];/);
  if (!actionMatch) {
    throw new KosisApiError("Unable to resolve statHtmlContent action for HTML fallback.");
  }
  return actionMatch[1];
}

function extractFormInputs(html: string): URLSearchParams {
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

function extractStatInfo(html: string): StatHtmlInfo {
  const match = html.match(/var g_jsonStatInfo\s*=\s*'([\s\S]*?)';/);
  if (!match) {
    throw new KosisApiError("Unable to parse g_jsonStatInfo for HTML fallback.");
  }

  const raw = match[1]
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, "\\");

  return JSON.parse(raw) as StatHtmlInfo;
}

function resolveDefaultPeriodCode(statInfo: StatHtmlInfo): string {
  const period = statInfo.defaultPeriodStr?.split("#").find(Boolean);
  return period ?? "M";
}

function resolvePeriodList(
  statInfo: StatHtmlInfo,
  periodCode: string,
  options?: PreviewRequestOptions,
): string[] {
  const key = `defaultList${periodCode}`;
  const values = Array.isArray(statInfo.periodInfo?.[key])
    ? (statInfo.periodInfo?.[key] as Array<string | number>)
    : [];

  const normalized = values.map((value) => String(value));
  const count = options?.newEstPrdCnt ?? Math.min(5, normalized.length || 5);
  return normalized.slice(0, count);
}

function resolveSelectedItems(
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

function resolveSelectedClasses(
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

    const mappedExplicit = (classInfo.itmList ?? [])
      .filter((item) =>
        lowered.some(
          (candidate) =>
            item.itmId.toLowerCase() === candidate ||
            (item.scrKor?.toLowerCase().trim() ?? "") === candidate,
        ),
      )
      .map((item) => item.itmId);

    if (mappedExplicit.length > 0) {
      const hierarchyValues = expandHierarchyValues(
        classInfo.classId,
        mappedExplicit,
        meta,
      );
      return {
        classId: classInfo.classId,
        values: hierarchyValues,
        filterValues: mappedExplicit,
        sn: classInfo.sn,
      };
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
      const hierarchyValues = expandHierarchyValues(
        classInfo.classId,
        [inferredDefault],
        meta,
      );
      return {
        classId: classInfo.classId,
        values: hierarchyValues,
        filterValues: [inferredDefault],
        sn: classInfo.sn,
      };
    }

    const fallback =
      classInfo.defaultItmMapList?.map((item) => item.ITM_ID) ??
      classInfo.defaultItmList?.map((entry) => entry.split("#").at(-1) ?? "") ??
      [];

    return {
      classId: classInfo.classId,
      values: fallback.filter(Boolean),
      filterValues: fallback.filter(Boolean),
      sn: classInfo.sn,
    };
  });
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

function buildFieldList(
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

function buildDefaultClassArr(
  selectedClasses: SelectedClass[],
): string {
  return JSON.stringify(
    selectedClasses.map((classInfo) => ({
      objVarId: classInfo.classId,
      data: classInfo.values,
      classType: 1,
      classLvlCnt: classInfo.values.length,
    })),
  );
}

function buildDefaultItemArr(
  selectedItems: string[],
): string {
  return JSON.stringify([{ data: selectedItems }]);
}

function buildDefaultPeriodArr(
  periodCode: string,
  periods: string[],
): string {
  const parsedPeriods = periods.map((value) =>
    Number.parseInt(value, 10),
  );
  return JSON.stringify({ [periodCode]: parsedPeriods });
}

function buildClassAllArr(statInfo: StatHtmlInfo): string {
  return JSON.stringify(
    (statInfo.classInfoList ?? []).map((classInfo) => ({
      objVarId: classInfo.classId,
      ovlSn: classInfo.sn,
    })),
  );
}

function buildClassSet(statInfo: StatHtmlInfo): string {
  return JSON.stringify(
    (statInfo.classInfoList ?? []).map((classInfo) => ({
      objVarId: classInfo.classId,
      ovlSn: classInfo.sn,
      visible: String(classInfo.visible ?? true),
    })),
  );
}

function buildOrderStr(statInfo: StatHtmlInfo): string {
  const rows = statInfo.pivotInfo?.rowList ?? [];
  const parts = rows.map((_, index) => `OV_L${index + 1}_ID`);
  parts.push("TIME", "CHAR_ITM_ID");
  return parts.join(",");
}

export function filterRowsToSelectedClasses(
  rows: DataPreviewRow[],
  headerCells: string[],
  statInfo: StatHtmlInfo,
  selectedClasses: SelectedClass[],
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

  return filteredRows.length > 0 ? filteredRows : rows;
}

function parseTableHtml(
  tableHtml: string,
  tableKey: string,
  statInfo: StatHtmlInfo,
  selectedClasses: SelectedClass[],
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
  ).slice(0, 20);
}

class CookieSession {
  private readonly cookies = new Map<string, string>();

  constructor(private readonly config: KosisConfig) {}

  private updateCookies(response: Response): void {
    const getSetCookie = (response.headers as Headers & {
      getSetCookie?: () => string[];
    }).getSetCookie?.();
    const rawCookies = getSetCookie ?? [];

    for (const rawCookie of rawCookies) {
      const [pair] = rawCookie.split(";");
      const [name, value] = pair.split("=");
      if (name && value) {
        this.cookies.set(name.trim(), value.trim());
      }
    }
  }

  private cookieHeader(): string | undefined {
    if (this.cookies.size === 0) {
      return undefined;
    }
    return [...this.cookies.entries()]
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
  }

  async requestText(
    pathOrUrl: string,
    init?: RequestInit,
  ): Promise<string> {
    const requestOnce = async (resolvedUrl: string): Promise<Response> => {
      const headers = new Headers(init?.headers);
      const cookie = this.cookieHeader();
      if (cookie) {
        headers.set("Cookie", cookie);
      }

      const response = await fetch(resolvedUrl, {
        ...init,
        headers,
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });

      this.updateCookies(response);
      return response;
    };

    const url = pathOrUrl.startsWith("http")
      ? pathOrUrl
      : new URL(pathOrUrl, this.config.baseUrl).toString();

    let response = await requestOnce(url);

    if (
      response.status === 404 &&
      url.endsWith("/statHtml/html.do") &&
      this.cookies.has("JSESSIONID")
    ) {
      const retryUrl = `${url};jsessionid=${this.cookies.get("JSESSIONID")}`;
      response = await requestOnce(retryUrl);
    }

    if (!response.ok) {
      throw new KosisApiError(
        `KOSIS HTML fallback request failed with status ${response.status}`,
      );
    }

    return response.text();
  }
}

export async function fetchHtmlPreviewFallback(
  config: KosisConfig,
  orgId: string,
  tblId: string,
  tableKey: string,
  options?: PreviewRequestOptions,
  meta?: KosisMetaBundle,
  resolvedSelections?: ResolvedSelectionMap,
): Promise<DataPreviewRow[] | null> {
  const session = new CookieSession(config);
  const outerHtml = await session.requestText(
    `/statHtml/statHtml.do?orgId=${encodeURIComponent(orgId)}&tblId=${encodeURIComponent(tblId)}`,
  );
  const rightAssignments = extractAssignments(outerHtml, "rightForm");

  const rightLayoutBody = new URLSearchParams({
    orgId,
    tblId,
    vwCd: rightAssignments.vwCd ?? "",
    dbUser: rightAssignments.dbUser ?? "",
    language: rightAssignments.language ?? "ko",
    mode: rightAssignments.mode ?? "",
    pub: rightAssignments.pub ?? "",
    conn_path: rightAssignments.conn_path ?? "",
    list_id: rightAssignments.list_id ?? "",
    itm_id: rightAssignments.itm_id ?? "",
    tblSe: rightAssignments.tblSe ?? "",
    tblNm: rightAssignments.tblNm ?? "",
    query: rightAssignments.query ?? "",
    tabYn: rightAssignments.tabYn ?? "",
  });

  const rightHtml = await session.requestText("/statHtml/right_layout.do", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
    body: rightLayoutBody,
  });

  const action = extractAction(rightHtml);
  const contentAssignments = extractAssignments(rightHtml, "paramInfoForm");
  const contentBody = new URLSearchParams({
    orgId: contentAssignments.orgId ?? orgId,
    tblId: contentAssignments.tblId ?? tblId,
    pub: contentAssignments.pub ?? "",
    conn_path: contentAssignments.conn_path ?? "",
    list_id: contentAssignments.list_id ?? "",
    vw_cd: contentAssignments.vw_cd ?? "",
    language: contentAssignments.language ?? "ko",
    dbUser: contentAssignments.dbUser ?? "",
    tabYn: contentAssignments.tabYn ?? "",
    obj_var_id: contentAssignments.obj_var_id ?? "",
    itm_id: contentAssignments.itm_id ?? "",
    tblSe: contentAssignments.tblSe ?? "",
    tblNm: contentAssignments.tblNm ?? "",
    query: contentAssignments.query ?? "",
  });

  const contentHtml = await session.requestText(`/statHtml/${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
    body: contentBody,
  });

  const statInfo = extractStatInfo(contentHtml);
  const params = extractFormInputs(contentHtml);

  const selectedClasses = resolveSelectedClasses(
    statInfo,
    options,
    meta,
    resolvedSelections,
  );
  const selectedItems = resolveSelectedItems(statInfo, options);
  const periodCode = resolveDefaultPeriodCode(statInfo);
  const periods = resolvePeriodList(statInfo, periodCode, options);
  const itemMultiply =
    Math.max(selectedItems.length, 1) *
    Math.max(
      selectedClasses.reduce((sum, current) => sum + current.values.length, 0),
      1,
    );
  const mixItemCount = itemMultiply * Math.max(periods.length, 1);

  params.set("fieldList", buildFieldList(selectedItems, selectedClasses, periodCode, periods));
  params.set("colAxis", (statInfo.pivotInfo?.colList ?? []).join(","));
  params.set("rowAxis", (statInfo.pivotInfo?.rowList ?? []).join(","));
  params.set("isFirst", "N");
  params.set("logSeq", String(Date.now()).slice(-9));
  params.set("viewKind", "1");
  params.set("viewSubKind", "");
  params.set("doAnal", "N");
  params.set("defaulPeriodArr", buildDefaultPeriodArr(periodCode, periods));
  params.set("defaultClassArr", buildDefaultClassArr(selectedClasses));
  params.set("defaultItmArr", buildDefaultItemArr(selectedItems));
  params.set("classAllArr", buildClassAllArr(statInfo));
  params.set("classSet", buildClassSet(statInfo));
  params.set("selectAllFlag", "N");
  params.set("funcPrdSe", periodCode);
  params.set("itemMultiply", String(itemMultiply));
  params.set("cmmtChk", "Y");
  params.set("labelOriginData", "원자료 함께 보기");
  params.set("orderStr", buildOrderStr(statInfo));
  params.set("startNum", "1");
  params.set("endNum", String(mixItemCount));
  params.set("lastChk", "N");
  params.set("colClsAt", statInfo.colClsAt ?? "N");
  params.set("analyzable", String(statInfo.analyzable ?? true));
  params.set("tableType", "default");
  params.set("dataOpt2", params.get("dataOpt") ?? "ko");
  params.set("reqCellCnt", "0");
  params.set("prdSort", "asc");
  params.set("prdseSelect", "N");
  params.set("downGridFileType", "xlsx");
  params.set("downGridCellMerge", "Y");
  params.set("downGridMeta", "Y");
  params.set("expDash", "Y");

  const htmlResponse = await session.requestText("/statHtml/html.do", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Referer: `${config.baseUrl}/statHtml/statHtml.do?orgId=${encodeURIComponent(orgId)}&tblId=${encodeURIComponent(tblId)}`,
    },
    body: params,
  });

  const parsed = JSON.parse(htmlResponse) as {
    errCode?: number;
    errMsg?: string;
    result?: string[];
  };

  if (parsed.errCode) {
    throw new KosisApiError(parsed.errMsg ?? "KOSIS HTML fallback failed");
  }

  const tableHtml = parsed.result?.[0];
  if (!tableHtml) {
    return null;
  }

  return parseTableHtml(tableHtml, tableKey, statInfo, selectedClasses);
}
