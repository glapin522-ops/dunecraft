import { NextResponse } from "next/server";
import { verifyCredentialsDetailed } from "@/lib/auth/credentials";
import { isUserBanned } from "@/lib/auth/types";
import { setPending2faCookie, setSessionCookie } from "@/lib/auth/session";
import { recordAuthNetwork } from "@/lib/auth/login-audit";
import { safeAppendAdminLog } from "@/lib/admin-logs-store";
import { getClientIp } from "@/lib/client-ip";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
    };
    const username = body.username?.trim() ?? "";
    const password = body.password ?? "";
    if (!username || !password) {
      return NextResponse.json(
        { error: "missing_fields" },
        { status: 400 },
      );
    }
    const ip = getClientIp(request);
    const result = await verifyCredentialsDetailed(username, password);
    if (!result.ok) {
      safeAppendAdminLog({
        actor: username,
        kind: "login_failed",
        message: `Неудачный вход: ${username}`,
        meta: {
          target: username,
          ip: ip ?? null,
          reason: "invalid_credentials",
        },
      });
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    }

    if (result.stored && isUserBanned(result.stored)) {
      safeAppendAdminLog({
        actor: result.user.username,
        kind: "login_blocked_ban",
        message: `Вход заблокирован (бан): ${result.user.username}`,
        meta: {
          target: result.user.username,
          ip: ip ?? null,
          banReason: result.stored.banReason ?? null,
          bannedUntil: result.stored.bannedUntil ?? null,
        },
      });
      return NextResponse.json(
        {
          error: "banned",
          bannedUntil: result.stored.bannedUntil ?? null,
          banReason: result.stored.banReason ?? null,
        },
        { status: 403 },
      );
    }

    if (result.needs2fa) {
      await setPending2faCookie(result.user.username, result.user.role);
      return NextResponse.json({
        requires2fa: true,
        username: result.user.username,
      });
    }
    await setSessionCookie(result.user);
    // Soft IP audit — never blocks login
    void recordAuthNetwork(result.user.username, request, "login");
    safeAppendAdminLog({
      actor: result.user.username,
      kind: "login_success",
      message: `Успешный вход: ${result.user.username}`,
      meta: {
        target: result.user.username,
        ip: ip ?? null,
        via: "password",
      },
    });
    return NextResponse.json({ user: result.user });
  } catch (err) {
    console.error("[auth/login]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
