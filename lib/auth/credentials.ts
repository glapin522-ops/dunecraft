import bcrypt from "bcryptjs";
import { timingSafeEqual } from "crypto";
import type { Role, SessionUser, StoredUser } from "./types";
import { toSessionUser } from "./types";
import { validateRegistration, validatePassword } from "./validation";
import { findUserByUsername, listUsers, saveUser } from "../users-store";

function safeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export function getSeedCreator(): { username: string; password: string } | null {
  const username = process.env.CREATOR_USERNAME?.trim();
  const password = process.env.CREATOR_PASSWORD?.trim();
  if (!username || !password) return null;
  return { username, password };
}

export type VerifyResult =
  | { ok: true; user: SessionUser; stored: StoredUser | null; needs2fa: boolean }
  | { ok: false };

/**
 * Verify username+password. Does NOT set session.
 * Seed-only accounts (env, no StoredUser) skip 2FA for MVP.
 */
export async function verifyCredentialsDetailed(
  username: string,
  password: string,
): Promise<VerifyResult> {
  const normalized = username.trim();
  if (!normalized || !password) return { ok: false };

  const seed = getSeedCreator();
  const users = await listUsers();
  const found = users.find(
    (u) => u.username.toLowerCase() === normalized.toLowerCase(),
  );

  // If the account exists in the store, ONLY the store hash counts.
  // Never fall through to CREATOR_PASSWORD — that was a session/2FA/ban bypass.
  if (found) {
    const ok = await bcrypt.compare(password, found.passwordHash);
    if (!ok) return { ok: false };
    const user = toSessionUser(found);
    return {
      ok: true,
      user,
      stored: found,
      needs2fa: Boolean(found.totpEnabled && found.totpSecret),
    };
  }

  // Seed-only creator: env credentials, no StoredUser row yet.
  if (
    seed &&
    safeEqualString(normalized.toLowerCase(), seed.username.toLowerCase()) &&
    safeEqualString(password, seed.password)
  ) {
    return {
      ok: true,
      user: {
        username: seed.username,
        role: "creator",
        level: 1,
        vipLevel: 0,
        balance: 0,
      },
      stored: null,
      needs2fa: false,
    };
  }

  return { ok: false };
}

/** Back-compat: returns SessionUser or null (ignores 2FA gate). */
export async function verifyCredentials(
  username: string,
  password: string,
): Promise<SessionUser | null> {
  const result = await verifyCredentialsDetailed(username, password);
  return result.ok ? result.user : null;
}

export async function registerPlayer(
  username: string,
  password: string,
): Promise<{ ok: true; user: SessionUser } | { ok: false; error: string }> {
  const normalized = username.trim();
  const policyError = validateRegistration(normalized, password);
  if (policyError) {
    return { ok: false, error: policyError };
  }

  const seed = getSeedCreator();
  if (
    seed &&
    normalized.toLowerCase() === seed.username.toLowerCase()
  ) {
    return { ok: false, error: "username_taken" };
  }

  const users = await listUsers();
  if (users.some((u) => u.username.toLowerCase() === normalized.toLowerCase())) {
    return { ok: false, error: "username_taken" };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const stored: StoredUser = {
    username: normalized,
    passwordHash,
    role: "player" satisfies Role,
    createdAt: new Date().toISOString(),
    email: null,
    emailVerified: false,
    totpEnabled: false,
  };
  await saveUser(stored);
  return { ok: true, user: toSessionUser(stored) };
}

/**
 * Upsert a StoredUser with role creator (full admin).
 * Preserves email / TOTP fields when updating password.
 */
export async function ensureCreatorAccount(
  username: string,
  password: string,
): Promise<SessionUser> {
  const normalized = username.trim();
  if (!normalized || !password) {
    throw new Error("ensureCreatorAccount: username and password required");
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const users = await listUsers();
  const existing = users.find(
    (u) => u.username.toLowerCase() === normalized.toLowerCase(),
  );
  const stored: StoredUser = {
    ...existing,
    username: existing?.username ?? normalized,
    passwordHash,
    role: "creator",
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    email: existing?.email ?? null,
    emailVerified: existing?.emailVerified ?? false,
    totpEnabled: existing?.totpEnabled ?? false,
    totpSecret: existing?.totpSecret ?? null,
  };
  await saveUser(stored);
  return toSessionUser(stored);
}

export async function updatePasswordHash(
  username: string,
  newPassword: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const policy = validatePassword(newPassword);
  if (policy) return { ok: false, error: policy };
  const user = await findUserByUsername(username);
  if (!user) return { ok: false, error: "not_found" };
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.emailCodeHash = null;
  user.emailCodeExpiresAt = null;
  user.emailCodePurpose = null;
  await saveUser(user);
  return { ok: true };
}
