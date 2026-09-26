import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { registerPlayer } from "@/lib/auth/credentials";
import { setSessionCookie } from "@/lib/auth/session";
import { recordAuthNetwork } from "@/lib/auth/login-audit";
import { findUserByUsername, saveUser } from "@/lib/users-store";
import {
  generateSixDigitCode,
  isEmailStubMode,
  sendVerificationCode,
} from "@/lib/email";
import { putAuthToken } from "@/lib/auth-tokens";

const CODE_TTL_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
      passwordConfirm?: string;
      email?: string;
    };
    const username = body.username?.trim() ?? "";
    const password = body.password ?? "";
    const email = body.email?.trim() ?? "";
    if (!body.passwordConfirm || body.passwordConfirm !== password) {
      return NextResponse.json({ error: "password_mismatch" }, { status: 400 });
    }
    const result = await registerPlayer(username, password, email);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    await setSessionCookie(result.user);
    await recordAuthNetwork(result.user.username, request, "register");

    const stored = await findUserByUsername(result.user.username);
    const pending = stored?.pendingEmail?.trim().toLowerCase() ?? "";
    let emailSent = false;
    let stub = false;
    let devCode: string | undefined;
    if (stored && pending) {
      const code = generateSixDigitCode();
      const codeHash = await bcrypt.hash(code, 8);
      const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();
      stored.emailCodeHash = codeHash;
      stored.emailCodeExpiresAt = expiresAt;
      stored.emailCodePurpose = "email_verify";
      await saveUser(stored);
      await putAuthToken({
        id: randomUUID(),
        username: stored.username,
        purpose: "email_verify",
        codeHash,
        email: pending,
        expiresAt,
        createdAt: new Date().toISOString(),
      });
      const send = await sendVerificationCode(pending, code, "email_verify");
      emailSent = true;
      stub = send.stub;
      if (send.stub && send.devCode && isEmailStubMode()) {
        devCode = send.devCode;
      }
    }

    return NextResponse.json({
      user: result.user,
      emailSent,
      stub,
      email: pending || undefined,
      ...(devCode ? { devCode } : {}),
    });
  } catch (err) {
    console.error("[auth/register]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
