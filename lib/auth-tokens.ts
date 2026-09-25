/**
 * Optional pending auth tokens blob (email codes can also live on StoredUser).
 * Kept for cross-request stub/dev codes and short-lived lookups.
 */
import { put, list } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";

const BLOB_PATHNAME = "dunecraft/auth-tokens.json";
const LOCAL_PATH = path.join(process.cwd(), "data", "auth-tokens.json");

export type AuthTokenRecord = {
  id: string;
  username: string;
  purpose: "email_verify" | "password_change";
  codeHash: string;
  email?: string;
  expiresAt: string;
  createdAt: string;
};

type Store = { tokens: AuthTokenRecord[] };

function hasBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

async function readLocal(): Promise<Store> {
  try {
    const raw = await fs.readFile(LOCAL_PATH, "utf8");
    const parsed = JSON.parse(raw) as Store;
    return { tokens: Array.isArray(parsed.tokens) ? parsed.tokens : [] };
  } catch {
    return { tokens: [] };
  }
}

async function writeLocal(store: Store): Promise<void> {
  await fs.mkdir(path.dirname(LOCAL_PATH), { recursive: true });
  await fs.writeFile(LOCAL_PATH, JSON.stringify(store, null, 2), "utf8");
}

async function readBlob(): Promise<Store> {
  const { blobs } = await list({ prefix: BLOB_PATHNAME, limit: 10 });
  const hit = blobs.find((b) => b.pathname === BLOB_PATHNAME) ?? blobs[0];
  if (!hit) return { tokens: [] };
  const res = await fetch(
    `${hit.url}${hit.url.includes("?") ? "&" : "?"}t=${Date.now()}`,
    { cache: "no-store" },
  );
  if (!res.ok) return { tokens: [] };
  const parsed = (await res.json()) as Store;
  return { tokens: Array.isArray(parsed.tokens) ? parsed.tokens : [] };
}

async function writeBlob(store: Store): Promise<void> {
  await put(BLOB_PATHNAME, JSON.stringify(store, null, 2), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 0,
  });
}

async function load(): Promise<Store> {
  if (hasBlob()) {
    try {
      return await readBlob();
    } catch (err) {
      console.error("[auth-tokens] blob read failed", err);
      return readLocal();
    }
  }
  return readLocal();
}

async function save(store: Store): Promise<void> {
  // prune expired
  const now = Date.now();
  store.tokens = store.tokens.filter(
    (t) => new Date(t.expiresAt).getTime() > now,
  );
  if (hasBlob()) {
    try {
      await writeBlob(store);
      return;
    } catch (err) {
      console.error("[auth-tokens] blob write failed", err);
    }
  }
  await writeLocal(store);
}

export async function putAuthToken(
  record: AuthTokenRecord,
): Promise<void> {
  const store = await load();
  store.tokens = store.tokens.filter(
    (t) =>
      !(
        t.username.toLowerCase() === record.username.toLowerCase() &&
        t.purpose === record.purpose
      ),
  );
  store.tokens.push(record);
  await save(store);
}

export async function takeAuthToken(
  username: string,
  purpose: AuthTokenRecord["purpose"],
): Promise<AuthTokenRecord | null> {
  const store = await load();
  const idx = store.tokens.findIndex(
    (t) =>
      t.username.toLowerCase() === username.toLowerCase() &&
      t.purpose === purpose,
  );
  if (idx < 0) return null;
  const hit = store.tokens[idx];
  if (new Date(hit.expiresAt).getTime() <= Date.now()) {
    store.tokens.splice(idx, 1);
    await save(store);
    return null;
  }
  return hit;
}

export async function removeAuthToken(
  username: string,
  purpose: AuthTokenRecord["purpose"],
): Promise<void> {
  const store = await load();
  store.tokens = store.tokens.filter(
    (t) =>
      !(
        t.username.toLowerCase() === username.toLowerCase() &&
        t.purpose === purpose
      ),
  );
  await save(store);
}
