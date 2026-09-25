import { NextResponse } from "next/server";
import { requireSession, setSessionCookie } from "@/lib/auth/session";
import { findUserByUsername, saveUser } from "@/lib/users-store";
import { toSessionUser } from "@/lib/auth/types";
import {
  decryptTotpSecret,
  encryptTotpSecret,
  generateTotpSecret,
  totpQrDataUrl,
  verifyTotpCode,
} from "@/lib/auth/totp";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = (await request.json()) as {
      action?: string;
      code?: string;
    };
    const action = body.action ?? "setup";

    const stored = await findUserByUsername(session.username);
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
      stored.totpPendingSecret = secret;
      await saveUser(stored);
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
      const pending = stored.totpPendingSecret;
      if (!pending) {
        return NextResponse.json({ error: "no_pending_setup" }, { status: 400 });
      }
      if (!verifyTotpCode(pending, code)) {
        return NextResponse.json({ error: "totp_invalid" }, { status: 400 });
      }
      stored.totpSecret = encryptTotpSecret(pending);
      stored.totpEnabled = true;
      stored.totpPendingSecret = null;
      await saveUser(stored);
      const user = toSessionUser(stored);
      await setSessionCookie(user);
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
      stored.totpSecret = null;
      stored.totpEnabled = false;
      stored.totpPendingSecret = null;
      await saveUser(stored);
      const user = toSessionUser(stored);
      await setSessionCookie(user);
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
