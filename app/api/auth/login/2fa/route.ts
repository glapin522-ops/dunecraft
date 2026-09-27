import { NextResponse } from "next/server";
import {
  clearPending2faCookie,
  getPending2fa,
  setSessionCookie,
} from "@/lib/auth/session";
import { findUserByUsername } from "@/lib/users-store";
import { isUserBanned, toSessionUser } from "@/lib/auth/types";
import { decryptTotpSecret, verifyTotpCode } from "@/lib/auth/totp";
import { recordAuthNetwork } from "@/lib/auth/login-audit";
import { safeAppendAdminLog } from "@/lib/admin-logs-store";
import { getClientIp } from "@/lib/client-ip";

export async function POST(request: Request) {
  try {
    const pending = await getPending2fa();
    if (!pending) {
      return NextResponse.json({ error: "no_pending_2fa" }, { status: 401 });
    }
    const body = (await request.json()) as { code?: string };
    const code = body.code?.trim() ?? "";
    if (!code) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    const ip = getClientIp(request);
    const stored = await findUserByUsername(pending.username);
    if (!stored?.totpEnabled || !stored.totpSecret) {
      await clearPending2faCookie();
      return NextResponse.json({ error: "totp_not_enabled" }, { status: 400 });
    }

    if (isUserBanned(stored)) {
      await clearPending2faCookie();
      safeAppendAdminLog({
        actor: stored.username,
        kind: "login_blocked_ban",
        message: `Вход заблокирован (бан): ${stored.username}`,
        meta: {
          target: stored.username,
          ip: ip ?? null,
          banReason: stored.banReason ?? null,
          bannedUntil: stored.bannedUntil ?? null,
          via: "2fa",
        },
      });
      return NextResponse.json(
        {
          error: "banned",
          bannedUntil: stored.bannedUntil ?? null,
          banReason: stored.banReason ?? null,
        },
        { status: 403 },
      );
    }

    let secret: string;
    try {
      secret = decryptTotpSecret(stored.totpSecret);
    } catch {
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    if (!verifyTotpCode(secret, code)) {
      safeAppendAdminLog({
        actor: stored.username,
        kind: "login_failed",
        message: `Неудачный вход (2FA): ${stored.username}`,
        meta: {
          target: stored.username,
          ip: ip ?? null,
          reason: "totp_invalid",
        },
      });
      return NextResponse.json({ error: "totp_invalid" }, { status: 401 });
    }

    const user = toSessionUser(stored);
    await setSessionCookie(user);
    void recordAuthNetwork(user.username, request, "login");
    safeAppendAdminLog({
      actor: user.username,
      kind: "login_success",
      message: `Успешный вход: ${user.username}`,
      meta: {
        target: user.username,
        ip: ip ?? null,
        via: "2fa",
      },
    });
    return NextResponse.json({ user });
  } catch (err) {
    console.error("[auth/login/2fa]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
