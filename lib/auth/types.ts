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
  /** Likely VPN / hosting / cloud provider from org keywords. */
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
  /** Character level; defaults to 1 when missing on stored user. */
  level: number;
  /** VIP tier; 0 = none. Defaults to 0 when missing on stored user. */
  vipLevel: number;
  /** Donate balance; defaults to 0 when missing on stored user. */
  balance: number;
};

export type StoredUser = {
  username: string;
  passwordHash: string;
  role: Role;
  createdAt: string;
  email?: string | null;
  emailVerified?: boolean;
  /** Pending email awaiting verification (bind/change flow). */
  pendingEmail?: string | null;
  /** bcrypt hash of 6-digit email verification / password-change code. */
  emailCodeHash?: string | null;
  emailCodeExpiresAt?: string | null;
  emailCodePurpose?: "email_verify" | "password_change" | null;
  /** Base32 TOTP secret — server-side only, never sent to client after setup. */
  totpSecret?: string | null;
  totpEnabled?: boolean;
  /** Temporary secret during 2FA setup before confirm. */
  totpPendingSecret?: string | null;
  /** Character level (optional on disk; read defaults to 1). */
  level?: number;
  /** VIP tier (optional on disk; read defaults to 0 = no VIP). */
  vipLevel?: number;
  /** Donate balance (optional on disk; read defaults to 0). */
  balance?: number;
  /** ISO timestamp when ban ends; null/undefined = not banned. */
  bannedUntil?: string | null;
  banReason?: string | null;
  bannedBy?: string | null;
  /** ISO timestamp when mute ends; null/undefined = not muted. */
  mutedUntil?: string | null;
  muteReason?: string | null;
  mutedBy?: string | null;
  /** Client IP at registration (first seen). */
  registrationIp?: string | null;
  registrationGeo?: GeoInfo | null;
  /** Recent successful logins (newest first, capped server-side). */
  loginHistory?: LoginHistoryEntry[];
};

/** News: create / edit / publish / pin / delete. */
export function canManageNews(
  user: SessionUser | null | undefined,
): boolean {
  return user?.role === "creator" || user?.role === "editor";
}

/** Player search in cabinet. */
export function canSearchPlayers(
  user: SessionUser | null | undefined,
): boolean {
  return user?.role === "creator";
}

/** Assign or change roles of other users. */
export function canAssignRoles(
  user: SessionUser | null | undefined,
): boolean {
  return user?.role === "creator";
}

/** Grant donate balance to players. Creator only. */
export function canGrantBalance(
  user: SessionUser | null | undefined,
): boolean {
  return user?.role === "creator";
}

/**
 * Ban / mute / delete player accounts. Creator only.
 */
export function canModeratePlayers(
  user: SessionUser | null | undefined,
): boolean {
  return user?.role === "creator";
}

/**
 * Full admin (creator only). Alias kept for call sites that need every
 * creator-gated feature; prefer specific helpers when gating a single capability.
 */
export function hasCreatorAccess(
  user: SessionUser | null | undefined,
): boolean {
  return user?.role === "creator";
}

/**
 * Admin logs panel in player stats. Creator only for now;
 * more roles / "paint" permissions can be added later.
 */
export function canViewAdminLogs(
  user: SessionUser | null | undefined,
): boolean {
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
    typeof u.vipLevel === "number" &&
    Number.isFinite(u.vipLevel) &&
    u.vipLevel >= 0
      ? Math.floor(u.vipLevel)
      : DEFAULT_VIP_LEVEL;
  const balance =
    typeof u.balance === "number" &&
    Number.isFinite(u.balance) &&
    u.balance >= 0
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
  };
}

/** Active ban if bannedUntil is a future ISO timestamp. */
export function isUserBanned(
  user: Pick<StoredUser, "bannedUntil"> | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!user?.bannedUntil) return false;
  const until = Date.parse(user.bannedUntil);
  return Number.isFinite(until) && until > now.getTime();
}

/** Active mute if mutedUntil is a future ISO timestamp. */
export function isUserMuted(
  user: Pick<StoredUser, "mutedUntil"> | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!user?.mutedUntil) return false;
  const until = Date.parse(user.mutedUntil);
  return Number.isFinite(until) && until > now.getTime();
}

/** Ban duration in days → ISO end; 9999 days ≈ permanent. */
export function banUntilFromDays(days: number, from: Date = new Date()): string {
  const ms = Math.max(0, Math.floor(days)) * 24 * 60 * 60 * 1000;
  return new Date(from.getTime() + ms).toISOString();
}

/** Mute duration in minutes → ISO end. */
export function muteUntilFromMinutes(
  minutes: number,
  from: Date = new Date(),
): string {
  const ms = Math.max(0, Math.floor(minutes)) * 60 * 1000;
  return new Date(from.getTime() + ms).toISOString();
}
