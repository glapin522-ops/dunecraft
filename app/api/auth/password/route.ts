import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { requireSession, setSessionCookie } from "@/lib/auth/session";
import {
  findUserByUsername,
  findUserUntil,
  patchUser,
} from "@/lib/users-store";
import { updatePasswordHash } from "@/lib/auth/credentials";
import { toSessionUser } from "@/lib/auth/types";
import type { StoredUser } from "@/lib/auth/types";
import { validatePassword } from "@/lib/auth/validation";
import {
  generateSixDigitCode,
  isEmailStubMode,
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

function hasPendingPasswordCode(user: StoredUser): boolean {
  return Boolean(
    user.emailCodeHash &&
      user.emailCodeExpiresAt &&
      user.emailCodePurpose === "password_change",
  );
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = (await request.json()) as {
      action?: string;
      code?: string;
      newPassword?: string;
    };
    const action = body.action ?? "request";

    let stored = await findUserByUsername(session.username);
    if (!stored) {
      return NextResponse.json(
        { error: "seed_only", message: "Смена пароля недоступна для seed-аккаунта без записи в store." },
        { status: 400 },
      );
    }

    if (!stored.email || !stored.emailVerified) {
      return NextResponse.json(
        { error: "email_not_verified" },
        { status: 400 },
      );
    }

    if (action === "request") {
      const code = generateSixDigitCode();
      const codeHash = await bcrypt.hash(code, 8);
      const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();

      const patched = await patchUser(stored.username, (u) => {
        u.emailCodeHash = codeHash;
        u.emailCodeExpiresAt = expiresAt;
        u.emailCodePurpose = "password_change";
      });
      if (!patched) {
        return NextResponse.json({ error: "server_error" }, { status: 500 });
      }
      stored = patched;

      await putAuthToken({
        id: randomUUID(),
        username: stored.username,
        purpose: "password_change",
        codeHash,
        email: stored.email ?? undefined,
        expiresAt,
        createdAt: new Date().toISOString(),
      });

      // Ensure persistence is visible before telling the client OK.
      const verified = await findUserUntil(
        stored.username,
        (u) =>
          u.emailCodePurpose === "password_change" &&
          u.emailCodeHash === codeHash,
      );
      if (!verified) {
        // Last-chance rewrite if a concurrent saveUser clobbered the code.
        await patchUser(stored.username, (u) => {
          u.emailCodeHash = codeHash;
          u.emailCodeExpiresAt = expiresAt;
          u.emailCodePurpose = "password_change";
        });
      }

      const send = await sendVerificationCode(
        stored.email!,
        code,
        "password_change",
      );
      const payload: Record<string, unknown> = {
        ok: true,
        stub: send.stub,
        email: stored.email,
      };
      if (send.stub && send.devCode && isEmailStubMode()) {
        payload.devCode = send.devCode;
      }
      return NextResponse.json(payload);
    }

    if (action === "confirm") {
      const code = body.code?.trim() ?? "";
      const newPassword = body.newPassword ?? "";
      if (!/^\d{6}$/.test(code)) {
        return NextResponse.json({ error: "code_invalid" }, { status: 400 });
      }
      const policy = validatePassword(newPassword);
      if (policy) {
        return NextResponse.json({ error: policy }, { status: 400 });
      }

      if (!hasPendingPasswordCode(stored)) {
        const fresh = await findUserUntil(session.username, hasPendingPasswordCode);
        if (fresh) stored = fresh;
      }

      let match = false;
      if (hasPendingPasswordCode(stored)) {
        if (new Date(stored.emailCodeExpiresAt!).getTime() <= Date.now()) {
          return NextResponse.json({ error: "code_expired" }, { status: 400 });
        }
        match = await bcrypt.compare(code, stored.emailCodeHash!);
        if (!match) {
          const fresh = await findUserUntil(session.username, hasPendingPasswordCode);
          if (fresh && hasPendingPasswordCode(fresh)) {
            stored = fresh;
            if (new Date(stored.emailCodeExpiresAt!).getTime() > Date.now()) {
              match = await bcrypt.compare(code, stored.emailCodeHash!);
            }
          }
        }
      }

      if (!match) {
        const token = await takeAuthTokenUntil(
          stored.username,
          "password_change",
        );
        if (!token || !(await bcrypt.compare(code, token.codeHash))) {
          return NextResponse.json(
            { error: hasPendingPasswordCode(stored) ? "code_invalid" : "code_expired" },
            { status: 400 },
          );
        }
        match = true;
      }

      const updated = await updatePasswordHash(stored.username, newPassword);
      if (!updated.ok) {
        return NextResponse.json({ error: updated.error }, { status: 400 });
      }
      await removeAuthToken(stored.username, "password_change");

      const fresh = await findUserByUsername(stored.username);
      if (fresh) {
        await setSessionCookie(toSessionUser(fresh));
      }
      const ip = getClientIp(request);
      safeAppendAdminLog({
        actor: stored.username,
        kind: "password_change_self",
        message: "Пользователь " + stored.username + " сменил свой пароль",
        meta: {
          target: stored.username,
          ip: ip ?? null,
        },
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "bad_action" }, { status: 400 });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[auth/password]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
