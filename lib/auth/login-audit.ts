/**
 * Record registration / login IP + soft geo. Never throws to callers.
 */

import { getClientIp, getUserAgent } from "../client-ip";
import { lookupGeo } from "../geoip";
import type { GeoInfo, LoginHistoryEntry, StoredUser } from "./types";
import { findUserByUsername, saveUser } from "../users-store";

const MAX_LOGIN_HISTORY = 15;

function pushLoginHistory(
  user: StoredUser,
  entry: LoginHistoryEntry,
): LoginHistoryEntry[] {
  const prev = Array.isArray(user.loginHistory) ? user.loginHistory : [];
  return [entry, ...prev].slice(0, MAX_LOGIN_HISTORY);
}

export async function recordAuthNetwork(
  username: string,
  request: Request,
  kind: "register" | "login",
): Promise<void> {
  try {
    const stored = await findUserByUsername(username);
    if (!stored) return;

    const ip = getClientIp(request);
    if (!ip) return;

    let geo: GeoInfo | null = null;
    try {
      geo = await lookupGeo(ip);
    } catch {
      geo = null;
    }

    const entry: LoginHistoryEntry = {
      ip,
      at: new Date().toISOString(),
      userAgent: getUserAgent(request),
      geo: geo ?? undefined,
    };

    if (kind === "register") {
      stored.registrationIp = ip;
      stored.registrationGeo = geo;
    }

    stored.loginHistory = pushLoginHistory(stored, entry);
    await saveUser(stored);
  } catch (err) {
    console.error("[login-audit]", kind, username, err);
  }
}
