import type { KosisConfig } from "../config.js";
import { KosisApiError } from "./errors.js";
import type { DataPreviewRow, KosisMetaBundle, PreviewRequestOptions } from "./types.js";
import {
  buildBroadFilterClasses,
  buildClassAllArr,
  buildClassSet,
  buildDefaultClassArr,
  buildDefaultItemArr,
  buildDefaultPeriodArr,
  buildFieldList,
  buildOrderStr,
  extractAction,
  extractAssignments,
  extractFormInputs,
  extractStatInfo,
  filterRowsToSelectedClasses,
  parseTableHtml,
  resolveDefaultPeriodCode,
  resolvePeriodList,
  resolveSelectedClasses,
  resolveSelectedItems,
  type ResolvedSelectionMap,
  type SelectedClass,
} from "./html-fallback-core.js";

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
      response = await requestOnce(`${url};jsessionid=${this.cookies.get("JSESSIONID")}`);
    }

    if (!response.ok) {
      throw new KosisApiError(
        `KOSIS HTML fallback request failed with status ${response.status}`,
      );
    }

    return response.text();
  }
}

function applyPreviewRequestParams(
  params: URLSearchParams,
  statInfo: {
    pivotInfo?: { colList?: string[]; rowList?: string[] };
    colClsAt?: string;
    analyzable?: boolean;
  },
  selectedItems: string[],
  requestClasses: SelectedClass[],
  periodCode: string,
  periods: string[],
): void {
  const requestItemMultiply =
    Math.max(selectedItems.length, 1) *
    Math.max(
      requestClasses.reduce((sum, current) => sum + current.values.length, 0),
      1,
    );
  const requestMixItemCount = requestItemMultiply * Math.max(periods.length, 1);

  params.set("fieldList", buildFieldList(selectedItems, requestClasses, periodCode, periods));
  params.set("colAxis", (statInfo.pivotInfo?.colList ?? []).join(","));
  params.set("rowAxis", (statInfo.pivotInfo?.rowList ?? []).join(","));
  params.set("isFirst", "N");
  params.set("logSeq", String(Date.now()).slice(-9));
  params.set("viewKind", "1");
  params.set("viewSubKind", "");
  params.set("doAnal", "N");
  params.set("defaulPeriodArr", buildDefaultPeriodArr(periodCode, periods));
  params.set("defaultClassArr", buildDefaultClassArr(requestClasses));
  params.set("defaultItmArr", buildDefaultItemArr(selectedItems));
  params.set("classAllArr", buildClassAllArr(statInfo));
  params.set("classSet", buildClassSet(statInfo));
  params.set("selectAllFlag", "N");
  params.set("funcPrdSe", periodCode);
  params.set("itemMultiply", String(requestItemMultiply));
  params.set("cmmtChk", "Y");
  params.set("labelOriginData", "원자료 함께 보기");
  params.set("orderStr", buildOrderStr(statInfo));
  params.set("startNum", "1");
  params.set("endNum", String(requestMixItemCount));
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
}

export { filterRowsToSelectedClasses } from "./html-fallback-core.js";

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

  const requestPreview = async (
    requestClasses: SelectedClass[],
    filterClasses: SelectedClass[],
  ): Promise<DataPreviewRow[] | null> => {
    applyPreviewRequestParams(
      params,
      statInfo,
      selectedItems,
      requestClasses,
      periodCode,
      periods,
    );

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
      result?: string[];
    };
    if (parsed.errCode || !parsed.result?.[0]) {
      return null;
    }

    const rows = parseTableHtml(
      parsed.result[0],
      tableKey,
      statInfo,
      filterClasses,
      false,
    );
    return rows.length > 0 ? rows : null;
  };

  const targetedRows = await requestPreview(selectedClasses, selectedClasses);
  if (targetedRows?.length) {
    return targetedRows;
  }

  if (selectedClasses.length > 0) {
    return requestPreview(buildBroadFilterClasses(statInfo), selectedClasses);
  }

  return null;
}
