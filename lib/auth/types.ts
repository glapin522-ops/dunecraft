/**
 * Site roles. Extensible: add new roles here and wire permission helpers.
 * Existing users keep player/creator; editor is assigned by creators in ЛК.
 */
export type Role = "player" | "editor" | "creator";

export const ROLES: readonly Role[] = ["player", "editor", "creator"] as const;

export function isRole(value: unknown): value is Role {
  return value === "player" || value === "editor" || value === "creator";
}

export type GeoInfo = {
  country?: string;
  city?: string;
  org?: string;
  isDatacenter?: boolean;
};

export type LoginHistoryEntry = {
  ip: string;
  at: string;
  userAgent?: string;
  geo?: GeoInfo;
};

export type SessionUser = {
  username: string;
  role: Role;
  email?: string | null;
  emailVerified?: boolean;
  totpEnabled?: boolean;
  level: number;
  vipLevel: number;
  balance: number;
  skinUrl?: string | null;
  capeUrl?: string | null;
};

export type StoredUser = {
  username: string;
  passwordHash: string;
  role: Role;
  createdAt: string;
  email?: string | null;
  emailVerified?: boolean;
  pendingEmail?: string | null;
  emailCodeHash?: string | null;
  emailCodeExpiresAt?: string | null;
  emailCodePurpose?: "email_verify" | "password_change" | null;
  totpSecret?: string | null;
  totpEnabled?: boolean;
  totpPendingSecret?: string | null;
  level?: number;
  vipLevel?: number;
  balance?: number;
  skinUrl?: string | null;
  capeUrl?: string | null;
  bannedUntil?: string | null;
  banReason?: string | null;
  bannedBy?: string | null;
  mutedUntil?: string | null;
  muteReason?: string | null;
  mutedBy?: string | null;
  registrationIp?: string | null;
  registrationGeo?: GeoInfo | null;
  loginHistory?: LoginHistoryEntry[];
};

export function canManageNews(user: SessionUser | null | undefined): boolean {
  return user?.role === "creator" || user?.role === "editor";
}

export function canSearchPlayers(user: SessionUser | null | undefined): boolean {
  return user?.role === "creator";
}

export function canAssignRoles(user: SessionUser | null | undefined): boolean {
  return user?.role === "creator";
}

export function canGrantBalance(user: SessionUser | null | undefined): boolean {
  return user?.role === "creator";
}

export function canModeratePlayers(user: SessionUser | null | undefined): boolean {
  return user?.role === "creator";
}

export function hasCreatorAccess(user: SessionUser | null | undefined): boolean {
  return user?.role === "creator";
}

export function canViewAdminLogs(user: SessionUser | null | undefined): boolean {
  return user?.role === "creator";
}

const DEFAULT_LEVEL = 1;
const DEFAULT_VIP_LEVEL = 0;
const DEFAULT_BALANCE = 0;

export function toSessionUser(u: StoredUser): SessionUser {
  const level =
    typeof u.level === "number" && Number.isFinite(u.level) && u.level >= 1
      ? Math.floor(u.level)
      : DEFAULT_LEVEL;
  const vipLevel =
    typeof u.vipLevel === "number" && Number.isFinite(u.vipLevel) && u.vipLevel >= 0
      ? Math.floor(u.vipLevel)
      : DEFAULT_VIP_LEVEL;
  const balance =
    typeof u.balance === "number" && Number.isFinite(u.balance) && u.balance >= 0
      ? Math.floor(u.balance)
      : DEFAULT_BALANCE;
  return {
    username: u.username,
    role: isRole(u.role) ? u.role : "player",
    email: u.email ?? null,
    emailVerified: Boolean(u.emailVerified && u.email),
    totpEnabled: Boolean(u.totpEnabled && u.totpSecret),
    level,
    vipLevel,
    balance,
    skinUrl: typeof u.skinUrl === "string" && u.skinUrl ? u.skinUrl : null,
    capeUrl: typeof u.capeUrl === "string" && u.capeUrl ? u.capeUrl : null,
  };
}

export function isUserBanned(
  user: Pick<StoredUser, "bannedUntil"> | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!user?.bannedUntil) return false;
  const until = Date.parse(user.bannedUntil);
  return Number.isFinite(until) && until > now.getTime();
}

export function isUserMuted(
  user: Pick<StoredUser, "mutedUntil"> | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!user?.mutedUntil) return false;
  const until = Date.parse(user.mutedUntil);
  return Number.isFinite(until) && until > now.getTime();
}

export function banUntilFromDays(days: number, from: Date = new Date()): string {
  const ms = Math.max(0, Math.floor(days)) * 24 * 60 * 60 * 1000;
  return new Date(from.getTime() + ms).toISOString();
}

export function muteUntilFromMinutes(
  minutes: number,
  from: Date = new Date(),
): string {
  const ms = Math.max(0, Math.floor(minutes)) * 60 * 1000;
  return new Date(from.getTime() + ms).toISOString();
}
