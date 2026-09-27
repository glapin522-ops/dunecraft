import { NextResponse } from "next/server";
import { requireSession, setSessionCookie } from "@/lib/auth/session";
import {
  findUserByUsername,
  findUserUntil,
  patchUser,
} from "@/lib/users-store";
import { toSessionUser } from "@/lib/auth/types";
import {
  decryptTotpSecret,
  encryptTotpSecret,
  generateTotpSecret,
  totpQrDataUrl,
  verifyTotpCode,
} from "@/lib/auth/totp";
import { safeAppendAdminLog } from "@/lib/admin-logs-store";
import { getClientIp } from "@/lib/client-ip";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = (await request.json()) as {
      action?: string;
      code?: string;
    };
    const action = body.action ?? "setup";

    let stored = await findUserByUsername(session.username);
    if (!stored) {
      return NextResponse.json(
        { error: "seed_only", message: "2FA недоступна для seed-аккаунта без записи в store." },
        { status: 400 },
      );
    }

    if (action === "setup") {
      if (stored.totpEnabled && stored.totpSecret) {
        return NextResponse.json({ error: "already_enabled" }, { status: 400 });
      }
      const { secret, uri } = generateTotpSecret(stored.username);
      const patched = await patchUser(stored.username, (u) => {
        u.totpPendingSecret = secret;
      });
      if (!patched) {
        return NextResponse.json({ error: "server_error" }, { status: 500 });
      }
      const verified = await findUserUntil(
        stored.username,
        (u) => u.totpPendingSecret === secret,
      );
      if (!verified) {
        await patchUser(stored.username, (u) => {
          u.totpPendingSecret = secret;
        });
      }
      const qrDataUrl = await totpQrDataUrl(uri);
      return NextResponse.json({
        ok: true,
        secret,
        qrDataUrl,
        uri,
      });
    }

    if (action === "confirm") {
      const code = body.code?.trim() ?? "";
      if (!stored.totpPendingSecret) {
        const fresh = await findUserUntil(
          session.username,
          (u) => Boolean(u.totpPendingSecret),
        );
        if (fresh) stored = fresh;
      }
      const pending = stored.totpPendingSecret;
      if (!pending) {
        return NextResponse.json({ error: "no_pending_setup" }, { status: 400 });
      }
      if (!verifyTotpCode(pending, code)) {
        const fresh = await findUserUntil(
          session.username,
          (u) => Boolean(u.totpPendingSecret),
        );
        const retrySecret = fresh?.totpPendingSecret;
        if (!retrySecret || !verifyTotpCode(retrySecret, code)) {
          return NextResponse.json({ error: "totp_invalid" }, { status: 400 });
        }
        stored = fresh!;
      }
      const secretToEnable = stored.totpPendingSecret!;
      const confirmed = await patchUser(stored.username, (u) => {
        u.totpSecret = encryptTotpSecret(secretToEnable);
        u.totpEnabled = true;
        u.totpPendingSecret = null;
      });
      if (!confirmed) {
        return NextResponse.json({ error: "server_error" }, { status: 500 });
      }
      stored = confirmed;
      const user = toSessionUser(stored);
      await setSessionCookie(user);
      const ip = getClientIp(request);
      safeAppendAdminLog({
        actor: stored.username,
        kind: "totp_enable",
        message: "Пользователь " + stored.username + " включил 2FA",
        meta: {
          target: stored.username,
          ip: ip ?? null,
        },
      });
      return NextResponse.json({ ok: true, user });
    }

    if (action === "disable") {
      const code = body.code?.trim() ?? "";
      if (!stored.totpEnabled || !stored.totpSecret) {
        return NextResponse.json({ error: "not_enabled" }, { status: 400 });
      }
      let secret: string;
      try {
        secret = decryptTotpSecret(stored.totpSecret);
      } catch {
        return NextResponse.json({ error: "server_error" }, { status: 500 });
      }
      if (!verifyTotpCode(secret, code)) {
        return NextResponse.json({ error: "totp_invalid" }, { status: 400 });
      }
      const disabled = await patchUser(stored.username, (u) => {
        u.totpSecret = null;
        u.totpEnabled = false;
        u.totpPendingSecret = null;
      });
      if (!disabled) {
        return NextResponse.json({ error: "server_error" }, { status: 500 });
      }
      stored = disabled;
      const user = toSessionUser(stored);
      await setSessionCookie(user);
      const ip = getClientIp(request);
      safeAppendAdminLog({
        actor: stored.username,
        kind: "totp_disable",
        message: "Пользователь " + stored.username + " отключил 2FA",
        meta: {
          target: stored.username,
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
    console.error("[auth/totp]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
