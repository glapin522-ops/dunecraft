import { isBlobConflict, readPublicJson, writePublicJson } from "./blob-json";
import { promises as fs } from "fs";
import path from "path";

export type AdminLogKind =
  | "balance_grant"
  | "balance_set"
  | "news_publish"
  | "news_unpublish"
  | "news_create"
  | "news_delete"
  | "role_change"
  | "password_reset"
  | "email_change_admin"
  | "ban"
  | "unban"
  | "mute"
  | "unmute"
  | "account_delete";

export type AdminLogEntry = {
  id: string;
  at: string;
  actor: string;
  kind: AdminLogKind;
  message: string;
  meta?: Record<string, string | number | boolean | null>;
};

const BLOB_PATHNAME = "dunecraft/admin-logs.json";
const LOCAL_PATH = path.join(process.cwd(), "data", "admin-logs.json");
const MAX_ENTRIES = 500;

function hasBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

async function readLocal(): Promise<AdminLogEntry[]> {
  try {
    const raw = await fs.readFile(LOCAL_PATH, "utf8");
    const parsed = JSON.parse(raw) as AdminLogEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeLocal(logs: AdminLogEntry[]): Promise<void> {
  await fs.mkdir(path.dirname(LOCAL_PATH), { recursive: true });
  await fs.writeFile(LOCAL_PATH, JSON.stringify(logs, null, 2), "utf8");
}

async function readBlob(): Promise<AdminLogEntry[]> {
  const { data } = await readPublicJson<AdminLogEntry[]>(BLOB_PATHNAME);
  return Array.isArray(data) ? data : [];
}

async function loadRaw(): Promise<AdminLogEntry[]> {
  if (hasBlob()) {
    try {
      return await readBlob();
    } catch (err) {
      console.error("[admin-logs] blob read failed, trying local", err);
      return readLocal();
    }
  }
  return readLocal();
}

export type AppendAdminLogInput = {
  actor: string;
  kind: AdminLogKind;
  message: string;
  meta?: Record<string, string | number | boolean | null>;
};

export async function appendAdminLog(
  input: AppendAdminLogInput,
): Promise<AdminLogEntry> {
  const entry: AdminLogEntry = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    actor: input.actor,
    kind: input.kind,
    message: input.message,
    meta: input.meta,
  };
  let lastError: unknown;
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const { data, etag } = hasBlob()
        ? await readPublicJson<AdminLogEntry[]>(BLOB_PATHNAME)
        : { data: await readLocal(), etag: null };
      const logs = Array.isArray(data) ? data : [];
      if (!logs.some((item) => item.id === entry.id)) {
        logs.unshift(entry);
      }
      const trimmed = logs.slice(0, MAX_ENTRIES);
      if (!hasBlob()) {
        await writeLocal(trimmed);
        return entry;
      }
      await writePublicJson(BLOB_PATHNAME, trimmed, etag);
      await writeLocal(trimmed).catch(() => undefined);
      return entry;
    } catch (err) {
      if (isBlobConflict(err) && attempt < 5) continue;
      lastError = err;
      console.error(`[admin-logs] append attempt ${attempt + 1} failed`, err);
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("appendAdminLog failed");
}

export async function listAdminLogs(opts?: {
  limit?: number;
}): Promise<AdminLogEntry[]> {
  const logs = await loadRaw();
  const sorted = [...logs].sort((a, b) => b.at.localeCompare(a.at));
  const limit =
    typeof opts?.limit === "number" &&
    Number.isFinite(opts.limit) &&
    opts.limit > 0
      ? Math.min(Math.floor(opts.limit), MAX_ENTRIES)
      : MAX_ENTRIES;
  return sorted.slice(0, limit);
}
