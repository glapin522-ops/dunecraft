import { readPublicJson, writePublicJson } from "./blob-json";
import { promises as fs } from "fs";
import path from "path";
import type { StoredUser } from "./auth/types";

const BLOB_PATHNAME = "dunecraft/users.json";
const LOCAL_PATH = path.join(process.cwd(), "data", "users.json");

function hasBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

async function readLocal(): Promise<StoredUser[]> {
  try {
    const raw = await fs.readFile(LOCAL_PATH, "utf8");
    const parsed = JSON.parse(raw) as StoredUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeLocal(users: StoredUser[]): Promise<void> {
  await fs.mkdir(path.dirname(LOCAL_PATH), { recursive: true });
  await fs.writeFile(LOCAL_PATH, JSON.stringify(users, null, 2), "utf8");
}

async function readBlob(): Promise<StoredUser[]> {
  const { data } = await readPublicJson<StoredUser[]>(BLOB_PATHNAME);
  return Array.isArray(data) ? data : [];
}

async function mutateBlob(mut: (users: StoredUser[]) => StoredUser[]): Promise<void> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    const { data, etag } = await readPublicJson<StoredUser[]>(BLOB_PATHNAME);
    const base = Array.isArray(data) ? data : [];
    const next = mut(base);
    try {
      await writePublicJson(BLOB_PATHNAME, next, attempt === 0 ? etag : null);
      await writeLocal(next).catch(() => undefined);
      return;
    } catch (err) {
      lastErr = err;
      console.error(`[users-store] blob write attempt ${attempt + 1} failed`, err);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("users store write failed");
}

export async function listUsers(): Promise<StoredUser[]> {
  if (hasBlob()) {
    try {
      return await readBlob();
    } catch (err) {
      console.error("[users-store] blob read failed, trying local", err);
      return readLocal();
    }
  }
  return readLocal();
}

export async function findUserByUsername(
  username: string,
): Promise<StoredUser | null> {
  const users = await listUsers();
  return (
    users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase(),
    ) ?? null
  );
}

export async function findUserByEmail(
  email: string,
): Promise<StoredUser | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  const users = await listUsers();
  return (
    users.find(
      (u) =>
        (u.email && u.email.toLowerCase() === normalized) ||
        (u.pendingEmail && u.pendingEmail.toLowerCase() === normalized),
    ) ?? null
  );
}

export async function saveUser(user: StoredUser): Promise<void> {
  const apply = (users: StoredUser[]) => {
    const next = users.map((entry) => ({ ...entry }));
    const idx = next.findIndex(
      (entry) => entry.username.toLowerCase() === user.username.toLowerCase(),
    );
    if (idx >= 0) next[idx] = user;
    else next.push(user);
    return next;
  };
  if (!hasBlob()) {
    await writeLocal(apply(await readLocal()));
    return;
  }
  await mutateBlob(apply);
}

/** Remove a user by username. Returns the removed user or null if missing. */
export async function deleteUser(
  username: string,
): Promise<StoredUser | null> {
  const key = username.trim().toLowerCase();
  let removed: StoredUser | null = null;
  const apply = (users: StoredUser[]) => {
    const next = users.map((entry) => ({ ...entry }));
    const idx = next.findIndex((entry) => entry.username.toLowerCase() === key);
    if (idx < 0) {
      removed = null;
      return next;
    }
    const [found] = next.splice(idx, 1);
    removed = found ?? null;
    return next;
  };
  if (!hasBlob()) {
    await writeLocal(apply(await readLocal()));
    return removed;
  }
  await mutateBlob(apply);
  return removed;
}
