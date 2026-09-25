/**
 * Safe player profile shapes for creator admin APIs.
 * Never includes passwordHash or totpSecret.
 */

import {
  isRole,
  isUserBanned,
  isUserMuted,
  type GeoInfo,
  type LoginHistoryEntry,
  type Role,
  type StoredUser,
} from "./types";

export type SafePlayerProfile = {
  username: string;
  role: Role;
  email: string | null;
  emailVerified: boolean;
  totpEnabled: boolean;
  createdAt: string | null;
  level: number;
  vipLevel: number;
  balance: number;
  banned: boolean;
  bannedUntil: string | null;
  banReason: string | null;
  bannedBy: string | null;
  muted: boolean;
  mutedUntil: string | null;
  muteReason: string | null;
  mutedBy: string | null;
  registrationIp: string | null;
  registrationGeo: GeoInfo | null;
  loginHistory: LoginHistoryEntry[];
  hasPassword: boolean;
  skinUrl: string | null;
  capeUrl: string | null;
};

function numField(value: unknown, fallback: number, min: number): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= min) {
    return Math.floor(value);
  }
  return fallback;
}

function sanitizeGeo(geo: GeoInfo | null | undefined): GeoInfo | null {
  if (!geo || typeof geo !== "object") return null;
  const out: GeoInfo = {};
  if (typeof geo.country === "string" && geo.country.trim()) {
    out.country = geo.country.trim();
  }
  if (typeof geo.city === "string" && geo.city.trim()) {
    out.city = geo.city.trim();
  }
  if (typeof geo.org === "string" && geo.org.trim()) {
    out.org = geo.org.trim();
  }
  if (typeof geo.isDatacenter === "boolean") {
    out.isDatacenter = geo.isDatacenter;
  }
  return Object.keys(out).length ? out : null;
}

function sanitizeHistory(
  list: LoginHistoryEntry[] | undefined,
): LoginHistoryEntry[] {
  if (!Array.isArray(list)) return [];
  return list
    .filter((e) => e && typeof e.ip === "string" && typeof e.at === "string")
    .slice(0, 15)
    .map((e) => ({
      ip: e.ip,
      at: e.at,
      userAgent:
        typeof e.userAgent === "string" ? e.userAgent.slice(0, 400) : undefined,
      geo: sanitizeGeo(e.geo) ?? undefined,
    }));
}

export function toSafePlayer(user: StoredUser): SafePlayerProfile {
  const banned = isUserBanned(user);
  const muted = isUserMuted(user);
  return {
    username: user.username,
    role: isRole(user.role) ? user.role : "player",
    email: user.email ?? null,
    emailVerified: Boolean(user.emailVerified && user.email),
    totpEnabled: Boolean(user.totpEnabled && user.totpSecret),
    createdAt: user.createdAt ?? null,
    level: numField(user.level, 1, 1),
    vipLevel: numField(user.vipLevel, 0, 0),
    balance: numField(user.balance, 0, 0),
    banned,
    bannedUntil: banned ? (user.bannedUntil ?? null) : null,
    banReason: banned ? (user.banReason ?? null) : null,
    bannedBy: banned ? (user.bannedBy ?? null) : null,
    muted,
    mutedUntil: muted ? (user.mutedUntil ?? null) : null,
    muteReason: muted ? (user.muteReason ?? null) : null,
    mutedBy: muted ? (user.mutedBy ?? null) : null,
    registrationIp: user.registrationIp ?? null,
    registrationGeo: sanitizeGeo(user.registrationGeo),
    loginHistory: sanitizeHistory(user.loginHistory),
    hasPassword: Boolean(user.passwordHash),
    skinUrl: typeof user.skinUrl === "string" && user.skinUrl ? user.skinUrl : null,
    capeUrl: typeof user.capeUrl === "string" && user.capeUrl ? user.capeUrl : null,
  };
}
