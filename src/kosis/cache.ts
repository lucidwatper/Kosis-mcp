import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

interface CacheEnvelope<T> {
  expiresAt: number;
  value: T;
}

export class FileCache {
  constructor(
    private readonly rootDir: string,
    private readonly ttlMs: number,
  ) {}

  async clearAll(): Promise<void> {
    await fs.rm(this.rootDir, { recursive: true, force: true });
  }

  private buildPath(namespace: string, key: string): string {
    const digest = crypto
      .createHash("sha1")
      .update(`${namespace}:${key}`)
      .digest("hex");
    return path.join(this.rootDir, namespace, `${digest}.json`);
  }

  async get<T>(namespace: string, key: string): Promise<T | null> {
    const cachePath = this.buildPath(namespace, key);

    try {
      const raw = await fs.readFile(cachePath, "utf8");
      const parsed = JSON.parse(raw) as CacheEnvelope<T>;

      if (!parsed || typeof parsed !== "object" || parsed.expiresAt < Date.now()) {
        await fs.rm(cachePath, { force: true });
        return null;
      }

      return parsed.value;
    } catch (error) {
      await fs.rm(cachePath, { force: true }).catch(() => undefined);
      return null;
    }
  }

  async set<T>(namespace: string, key: string, value: T): Promise<void> {
    const cachePath = this.buildPath(namespace, key);
    await fs.mkdir(path.dirname(cachePath), { recursive: true });
    const envelope: CacheEnvelope<T> = {
      expiresAt: Date.now() + this.ttlMs,
      value,
    };
    await fs.writeFile(cachePath, JSON.stringify(envelope, null, 2), "utf8");
  }
}
