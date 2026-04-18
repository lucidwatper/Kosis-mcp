import type { DataPreviewRow, KosisMetaBundle } from "./types.js";
import { readString, uniqueStrings } from "./utils.js";

export function mapPeriodCode(raw?: string): string {
  if (!raw) {
    return "Y";
  }

  const value = raw.trim().toUpperCase();
  if (value === "H") {
    return "S";
  }
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

export function availablePeriodCodes(meta: KosisMetaBundle): string[] {
  return uniqueStrings(meta.period.map((row) => readString(row, "PRD_SE")));
}

export function resolvePreferredPeriodCode(
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

export function normalizePreviewPeriodKey(key: string): string | undefined {
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

export function normalizePeriods(meta: KosisMetaBundle, preview: DataPreviewRow[]): string[] {
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
