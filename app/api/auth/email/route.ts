import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { requireSession, setSessionCookie } from "@/lib/auth/session";
import {
  findUserByEmail,
  findUserByUsername,
  findUserUntil,
  patchUser,
} from "@/lib/users-store";
import { toSessionUser } from "@/lib/auth/types";
import type { StoredUser } from "@/lib/auth/types";
import {
  generateSixDigitCode,
  isEmailStubMode,
  isValidEmail,
  sendVerificationCode,
} from "@/lib/email";
import {
  putAuthToken,
  removeAuthToken,
  takeAuthTokenUntil,
} from "@/lib/auth-tokens";
import { safeAppendAdminLog } from "@/lib/admin-logs-store";
import { getClientIp } from "@/lib/client-ip";

const CODE_TTL_MS = 15 * 60 * 1000;

function hasPendingEmailCode(user: StoredUser): boolean {
  return Boolean(
    user.emailCodeHash &&
      user.emailCodeExpiresAt &&
      user.emailCodePurpose === "email_verify" &&
      user.pendingEmail,
  );
}

/** POST — request verification code for bind/change email */
export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = (await request.json()) as { email?: string; action?: string; code?: string };
    const action = body.action ?? "request";

    let stored = await findUserByUsername(session.username);
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
      const clearVerified = stored.email?.toLowerCase() !== email;

      const patched = await patchUser(stored.username, (u) => {
        u.pendingEmail = email;
        u.emailCodeHash = codeHash;
        u.emailCodeExpiresAt = expiresAt;
        u.emailCodePurpose = "email_verify";
        if (clearVerified) {
          u.emailVerified = false;
        }
      });
      if (!patched) {
        return NextResponse.json({ error: "server_error" }, { status: 500 });
      }
      stored = patched;

      await putAuthToken({
        id: randomUUID(),
        username: stored.username,
        purpose: "email_verify",
        codeHash,
        email,
        expiresAt,
        createdAt: new Date().toISOString(),
      });

      const verified = await findUserUntil(
        stored.username,
        (u) =>
          u.emailCodePurpose === "email_verify" &&
          u.emailCodeHash === codeHash &&
          u.pendingEmail === email,
      );
      if (!verified) {
        await patchUser(stored.username, (u) => {
          u.pendingEmail = email;
          u.emailCodeHash = codeHash;
          u.emailCodeExpiresAt = expiresAt;
          u.emailCodePurpose = "email_verify";
          if (clearVerified) {
            u.emailVerified = false;
          }
        });
      }

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

      if (!hasPendingEmailCode(stored)) {
        const fresh = await findUserUntil(session.username, hasPendingEmailCode);
        if (fresh) stored = fresh;
      }

      let match = false;
      let tokenEmail: string | undefined;

      if (hasPendingEmailCode(stored)) {
        if (new Date(stored.emailCodeExpiresAt!).getTime() <= Date.now()) {
          return NextResponse.json({ error: "code_expired" }, { status: 400 });
        }
        match = await bcrypt.compare(code, stored.emailCodeHash!);
        if (!match) {
          const fresh = await findUserUntil(session.username, hasPendingEmailCode);
          if (fresh && hasPendingEmailCode(fresh)) {
            stored = fresh;
            if (new Date(stored.emailCodeExpiresAt!).getTime() > Date.now()) {
              match = await bcrypt.compare(code, stored.emailCodeHash!);
            }
          }
        }
      }

      if (!match) {
        const token = await takeAuthTokenUntil(stored.username, "email_verify");
        if (!token || !(await bcrypt.compare(code, token.codeHash))) {
          return NextResponse.json(
            { error: hasPendingEmailCode(stored) ? "code_invalid" : "code_expired" },
            { status: 400 },
          );
        }
        match = true;
        tokenEmail = token.email?.trim().toLowerCase() || undefined;
      }

      const pending =
        (stored.pendingEmail ?? tokenEmail ?? "").trim().toLowerCase();
      if (!pending) {
        return NextResponse.json({ error: "code_expired" }, { status: 400 });
      }

      const oldEmail = stored.email?.trim().toLowerCase() || null;
      const kind =
        oldEmail && oldEmail !== pending ? "email_change_self" : "email_bind_self";

      const confirmed = await patchUser(stored.username, (u) => {
        u.email = pending;
        u.emailVerified = true;
        u.pendingEmail = null;
        u.emailCodeHash = null;
        u.emailCodeExpiresAt = null;
        u.emailCodePurpose = null;
      });
      if (!confirmed) {
        return NextResponse.json({ error: "server_error" }, { status: 500 });
      }
      stored = confirmed;
      await removeAuthToken(stored.username, "email_verify");

      const user = toSessionUser(stored);
      await setSessionCookie(user);
      const ip = getClientIp(request);
      safeAppendAdminLog({
        actor: stored.username,
        kind,
        message:
          kind === "email_change_self"
            ? "Пользователь " + stored.username + " сменил почту на " + pending
            : "Пользователь " + stored.username + " привязал почту " + pending,
        meta: {
          target: stored.username,
          email: pending || null,
          previousEmail: oldEmail,
          ip: ip ?? null,
        },
      });
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
