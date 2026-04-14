import fs from "node:fs";
import path from "node:path";

export interface KosisConfig {
  apiKey?: string;
  baseUrl: string;
  cacheDir: string;
  cacheTtlMs: number;
  timeoutMs: number;
  defaultResultLimit: number;
  clearCacheOnStart: boolean;
  transportMode: "stdio" | "http";
  host: string;
  port: number;
  serverToken?: string;
}

function parseEnvFile(envPath: string): Record<string, string> {
  if (!fs.existsSync(envPath)) {
    return {};
  }

  const raw = fs.readFileSync(envPath, "utf8");
  const parsed: Record<string, string> = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalIndex = trimmed.indexOf("=");
    if (equalIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, equalIndex).trim();
    let value = trimmed.slice(equalIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    parsed[key] = value;
  }

  return parsed;
}

function readEnvValue(
  key: string,
  dotenvValues: Record<string, string>,
): string | undefined {
  return process.env[key] ?? dotenvValues[key];
}

function readIntValue(
  key: string,
  dotenvValues: Record<string, string>,
  fallback: number,
): number {
  const value = readEnvValue(key, dotenvValues);
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function loadConfig(cwd = process.cwd()): KosisConfig {
  const dotenvValues = parseEnvFile(path.join(cwd, ".env"));
  const apiKey = readEnvValue("KOSIS_API_KEY", dotenvValues);
  const transportMode =
    (readEnvValue("MCP_TRANSPORT", dotenvValues) ?? "stdio") === "http"
      ? "http"
      : "stdio";

  if (transportMode === "stdio" && !apiKey) {
    throw new Error(
      "KOSIS_API_KEY is required. Set it in the environment or a .env file.",
    );
  }

  const cacheDir =
    readEnvValue("KOSIS_CACHE_DIR", dotenvValues) ??
    path.join(cwd, ".cache", "kosis-mcp");

  return {
    apiKey,
    baseUrl:
      readEnvValue("KOSIS_BASE_URL", dotenvValues) ?? "https://kosis.kr",
    cacheDir,
    cacheTtlMs: readIntValue(
      "KOSIS_CACHE_TTL_MS",
      dotenvValues,
      1000 * 60 * 60 * 6,
    ),
    timeoutMs: readIntValue("KOSIS_TIMEOUT_MS", dotenvValues, 20_000),
    defaultResultLimit: readIntValue("KOSIS_DEFAULT_LIMIT", dotenvValues, 5),
    clearCacheOnStart:
      readEnvValue("KOSIS_CACHE_CLEAR_ON_START", dotenvValues) === "1",
    transportMode,
    host: readEnvValue("HOST", dotenvValues) ?? "127.0.0.1",
    port: readIntValue("PORT", dotenvValues, 3000),
    serverToken: readEnvValue("MCP_SERVER_TOKEN", dotenvValues),
  };
}
