import { NextResponse } from "next/server";
import { registerPlayer } from "@/lib/auth/credentials";
import { setSessionCookie } from "@/lib/auth/session";
import { recordAuthNetwork } from "@/lib/auth/login-audit";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
      passwordConfirm?: string;
    };
    const username = body.username?.trim() ?? "";
    const password = body.password ?? "";
    if (!body.passwordConfirm || body.passwordConfirm !== password) {
      return NextResponse.json({ error: "password_mismatch" }, { status: 400 });
    }
    const result = await registerPlayer(username, password);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    await setSessionCookie(result.user);
    await recordAuthNetwork(result.user.username, request, "register");
    return NextResponse.json({ user: result.user });
  } catch (err) {
    console.error("[auth/register]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
