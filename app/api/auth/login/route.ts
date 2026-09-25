import { NextResponse } from "next/server";
import { verifyCredentialsDetailed } from "@/lib/auth/credentials";
import { isUserBanned } from "@/lib/auth/types";
import { setPending2faCookie, setSessionCookie } from "@/lib/auth/session";
import { recordAuthNetwork } from "@/lib/auth/login-audit";

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
    const result = await verifyCredentialsDetailed(username, password);
    if (!result.ok) {
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    }

    if (result.stored && isUserBanned(result.stored)) {
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
    return NextResponse.json({ user: result.user });
  } catch (err) {
    console.error("[auth/login]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
