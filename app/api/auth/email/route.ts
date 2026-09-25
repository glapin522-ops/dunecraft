import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { requireSession, setSessionCookie } from "@/lib/auth/session";
import {
  findUserByEmail,
  findUserByUsername,
  saveUser,
} from "@/lib/users-store";
import { toSessionUser } from "@/lib/auth/types";
import {
  generateSixDigitCode,
  isEmailStubMode,
  isValidEmail,
  sendVerificationCode,
} from "@/lib/email";
import { putAuthToken, removeAuthToken, takeAuthToken } from "@/lib/auth-tokens";

const CODE_TTL_MS = 15 * 60 * 1000;

/** POST — request verification code for bind/change email */
export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = (await request.json()) as { email?: string; action?: string; code?: string };
    const action = body.action ?? "request";

    const stored = await findUserByUsername(session.username);
    if (!stored) {
      return NextResponse.json(
        { error: "seed_only", message: "Аккаунт только из env — привязка почты недоступна. Создайте запись в store." },
        { status: 400 },
      );
    }

    if (action === "request") {
      const email = body.email?.trim().toLowerCase() ?? "";
      if (!isValidEmail(email)) {
        return NextResponse.json({ error: "email_invalid" }, { status: 400 });
      }
      const taken = await findUserByEmail(email);
      if (
        taken &&
        taken.username.toLowerCase() !== stored.username.toLowerCase()
      ) {
        return NextResponse.json({ error: "email_taken" }, { status: 400 });
      }

      const code = generateSixDigitCode();
      const codeHash = await bcrypt.hash(code, 8);
      const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();

      stored.pendingEmail = email;
      stored.emailCodeHash = codeHash;
      stored.emailCodeExpiresAt = expiresAt;
      stored.emailCodePurpose = "email_verify";
      // If changing from a different verified email, mark unverified until confirm
      if (stored.email?.toLowerCase() !== email) {
        stored.emailVerified = false;
      }
      await saveUser(stored);

      await putAuthToken({
        id: randomUUID(),
        username: stored.username,
        purpose: "email_verify",
        codeHash,
        email,
        expiresAt,
        createdAt: new Date().toISOString(),
      });

      const send = await sendVerificationCode(email, code, "email_verify");
      const payload: Record<string, unknown> = {
        ok: true,
        stub: send.stub,
        email,
      };
      if (send.stub && send.devCode && isEmailStubMode()) {
        payload.devCode = send.devCode;
      }
      return NextResponse.json(payload);
    }

    if (action === "confirm") {
      const code = body.code?.trim() ?? "";
      if (!/^\d{6}$/.test(code)) {
        return NextResponse.json({ error: "code_invalid" }, { status: 400 });
      }
      if (
        !stored.emailCodeHash ||
        !stored.emailCodeExpiresAt ||
        stored.emailCodePurpose !== "email_verify" ||
        !stored.pendingEmail
      ) {
        return NextResponse.json({ error: "code_expired" }, { status: 400 });
      }
      if (new Date(stored.emailCodeExpiresAt).getTime() <= Date.now()) {
        return NextResponse.json({ error: "code_expired" }, { status: 400 });
      }
      const match = await bcrypt.compare(code, stored.emailCodeHash);
      if (!match) {
        // also try blob token (in case of race)
        const token = await takeAuthToken(stored.username, "email_verify");
        if (!token || !(await bcrypt.compare(code, token.codeHash))) {
          return NextResponse.json({ error: "code_invalid" }, { status: 400 });
        }
      }

      stored.email = stored.pendingEmail;
      stored.emailVerified = true;
      stored.pendingEmail = null;
      stored.emailCodeHash = null;
      stored.emailCodeExpiresAt = null;
      stored.emailCodePurpose = null;
      await saveUser(stored);
      await removeAuthToken(stored.username, "email_verify");

      const user = toSessionUser(stored);
      await setSessionCookie(user);
      return NextResponse.json({ ok: true, user });
    }

    return NextResponse.json({ error: "bad_action" }, { status: 400 });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[auth/email]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
