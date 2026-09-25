import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import {
  hasCreatorAccess,
  isRole,
  isUserBanned,
  toSessionUser,
  type SessionUser,
} from "./types";
import { findUserByUsername } from "../users-store";

export const SESSION_COOKIE = "dc_session";
export const PENDING_2FA_COOKIE = "dc_2fa_pending";
const MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days
const PENDING_2FA_MAX_AGE_SEC = 60 * 5; // 5 minutes

function getSecret() {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET must be set (min 16 chars)");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    username: user.username,
    role: user.role,
    email: user.email ?? null,
    emailVerified: Boolean(user.emailVerified),
    totpEnabled: Boolean(user.totpEnabled),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SEC}s`)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const username = payload.username;
    const role = payload.role;
    if (typeof username !== "string" || !isRole(role)) {
      return null;
    }
    return {
      username,
      role,
      email: typeof payload.email === "string" ? payload.email : null,
      emailVerified: Boolean(payload.emailVerified),
      totpEnabled: Boolean(payload.totpEnabled),
      // Stats live on StoredUser; JWT fallback uses read-time defaults.
      level: 1,
      vipLevel: 0,
      balance: 0,
    };
  } catch {
    return null;
  }
}

export async function createPending2faToken(
  username: string,
  role: SessionUser["role"],
): Promise<string> {
  return new SignJWT({ username, role, purpose: "2fa_pending" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${PENDING_2FA_MAX_AGE_SEC}s`)
    .sign(getSecret());
}

export async function verifyPending2faToken(
  token: string,
): Promise<{ username: string; role: SessionUser["role"] } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.purpose !== "2fa_pending") return null;
    const username = payload.username;
    const role = payload.role;
    if (typeof username !== "string" || !isRole(role)) {
      return null;
    }
    return { username, role };
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: SessionUser): Promise<void> {
  const token = await createSessionToken(user);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
  // clear any leftover pending 2FA cookie
  jar.set(PENDING_2FA_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function setPending2faCookie(
  username: string,
  role: SessionUser["role"],
): Promise<void> {
  const token = await createPending2faToken(username, role);
  const jar = await cookies();
  jar.set(PENDING_2FA_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PENDING_2FA_MAX_AGE_SEC,
  });
}

export async function clearPending2faCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(PENDING_2FA_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getPending2fa(): Promise<{
  username: string;
  role: SessionUser["role"];
} | null> {
  const jar = await cookies();
  const token = jar.get(PENDING_2FA_COOKIE)?.value;
  if (!token) return null;
  return verifyPending2faToken(token);
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

async function clearSessionCookieSafe(): Promise<void> {
  try {
    await clearSessionCookie();
  } catch {
    // cookies().set may be disallowed in some RSC contexts — session still
    // returns null below so authz fails even if the cookie survives one render.
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  // The JWT proves which username signed in; role and account metadata remain
  // live by reading the current user record on every session check.
  const tokenUser = await verifySessionToken(token);
  if (!tokenUser) return null;

  const stored = await findUserByUsername(tokenUser.username);
  if (stored) {
    if (isUserBanned(stored)) {
      await clearSessionCookieSafe();
      return null;
    }
    return toSessionUser(stored);
  }

  // The configured creator may be a seed account that is not persisted yet.
  const seedUsername = process.env.CREATOR_USERNAME?.trim();
  if (
    seedUsername &&
    seedUsername.toLowerCase() === tokenUser.username.toLowerCase()
  ) {
    return {
      ...tokenUser,
      role: "creator",
      level: tokenUser.level ?? 1,
      vipLevel: tokenUser.vipLevel ?? 0,
      balance: tokenUser.balance ?? 0,
    };
  }

  // Account removed from the store — invalidate leftover JWT.
  await clearSessionCookieSafe();
  return null;
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

export async function requireCreator(): Promise<SessionUser> {
  const session = await getSession();
  if (!hasCreatorAccess(session)) {
    throw new Error("FORBIDDEN");
  }
  return session!;
}
