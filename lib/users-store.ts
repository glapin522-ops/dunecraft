import { put, list } from "@vercel/blob";
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
  const { blobs } = await list({ prefix: BLOB_PATHNAME, limit: 10 });
  const hit = blobs.find((b) => b.pathname === BLOB_PATHNAME) ?? blobs[0];
  if (!hit) return [];
  const res = await fetch(`${hit.url}${hit.url.includes("?") ? "&" : "?"}t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) return [];
  const parsed = (await res.json()) as StoredUser[];
  return Array.isArray(parsed) ? parsed : [];
}

async function writeBlob(users: StoredUser[]): Promise<void> {
  await put(BLOB_PATHNAME, JSON.stringify(users, null, 2), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 0,
  });
}

async function persist(users: StoredUser[]): Promise<void> {
  if (hasBlob()) {
    try {
      await writeBlob(users);
      await writeLocal(users).catch(() => undefined);
      return;
    } catch (err) {
      console.error("[users-store] blob write failed, writing local", err);
    }
  }
  await writeLocal(users);
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
  const users = await listUsers();
  const idx = users.findIndex(
    (u) => u.username.toLowerCase() === user.username.toLowerCase(),
  );
  if (idx >= 0) users[idx] = user;
  else users.push(user);
  await persist(users);
}

/** Remove a user by username. Returns the removed user or null if missing. */
export async function deleteUser(
  username: string,
): Promise<StoredUser | null> {
  const users = await listUsers();
  const idx = users.findIndex(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase(),
  );
  if (idx < 0) return null;
  const [removed] = users.splice(idx, 1);
  await persist(users);
  return removed ?? null;
}
