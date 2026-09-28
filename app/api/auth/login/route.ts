import { NextResponse } from "next/server";
import { verifyCredentialsDetailed } from "@/lib/auth/credentials";
import { isUserBanned } from "@/lib/auth/types";
import { setPending2faCookie, setSessionCookie } from "@/lib/auth/session";
import { recordAuthNetwork } from "@/lib/auth/login-audit";
import { safeAppendAdminLog } from "@/lib/admin-logs-store";
import { getClientIp } from "@/lib/client-ip";

function publicOrigin(request: Request): string {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host")?.split(",")[0]?.trim();
  const proto = (request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https");
  if (host && !host.startsWith("localhost") && !host.startsWith("127.")) {
    return `${proto}://${host}`;
  }
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      /* ignore */
    }
  }
  return new URL(request.url).origin;
}


export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const wantsHtmlRedirect = !contentType.includes("application/json");
    let username = "";
    let password = "";
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as {
        username?: string;
        password?: string;
      };
      username = body.username?.trim() ?? "";
      password = body.password ?? "";
    } else {
      const form = await request.formData();
      username = String(form.get("username") ?? "").trim();
      password = String(form.get("password") ?? "");
    }
    if (!username || !password) {
      if (wantsHtmlRedirect) {
        const url = new URL("/ru/cabinet", publicOrigin(request));
        url.searchParams.set("login", "fail");
        return NextResponse.redirect(url);
      }
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
      if (wantsHtmlRedirect) {
        const url = new URL("/ru/cabinet", publicOrigin(request));
        url.searchParams.set("login", "fail");
        return NextResponse.redirect(url);
      }
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
      if (wantsHtmlRedirect) {
        const url = new URL("/ru/cabinet", publicOrigin(request));
        url.searchParams.set("login", "banned");
        return NextResponse.redirect(url);
      }
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
      if (wantsHtmlRedirect) {
        const url = new URL("/ru/cabinet", publicOrigin(request));
        url.searchParams.set("login", "2fa");
        return NextResponse.redirect(url);
      }
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
    if (wantsHtmlRedirect) {
      return NextResponse.redirect(new URL("/ru/cabinet", publicOrigin(request)));
    }
    return NextResponse.json({ user: result.user });
  } catch (err) {
    console.error("[auth/login]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
