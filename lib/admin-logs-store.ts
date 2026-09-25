import { put, list } from "@vercel/blob";
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
  const { blobs } = await list({ prefix: BLOB_PATHNAME, limit: 10 });
  const hit = blobs.find((b) => b.pathname === BLOB_PATHNAME) ?? blobs[0];
  if (!hit) return [];
  const res = await fetch(
    `${hit.url}${hit.url.includes("?") ? "&" : "?"}t=${Date.now()}`,
    { cache: "no-store" },
  );
  if (!res.ok) return [];
  const parsed = (await res.json()) as AdminLogEntry[];
  return Array.isArray(parsed) ? parsed : [];
}

async function writeBlob(logs: AdminLogEntry[]): Promise<void> {
  await put(BLOB_PATHNAME, JSON.stringify(logs, null, 2), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 0,
  });
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

async function persist(logs: AdminLogEntry[]): Promise<void> {
  if (hasBlob()) {
    try {
      await writeBlob(logs);
      await writeLocal(logs).catch(() => undefined);
      return;
    } catch (err) {
      console.error("[admin-logs] blob write failed, writing local", err);
    }
  }
  await writeLocal(logs);
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
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const logs = await loadRaw();
      // Avoid duplicate if a prior attempt already persisted this id
      if (!logs.some((l) => l.id === entry.id)) {
        logs.unshift(entry);
      }
      const trimmed = logs.slice(0, MAX_ENTRIES);
      await persist(trimmed);
      return entry;
    } catch (err) {
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
