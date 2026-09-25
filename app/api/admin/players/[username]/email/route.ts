export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { canAssignRoles, toSessionUser } from "@/lib/auth/types";
import {
  findUserByEmail,
  findUserByUsername,
  saveUser,
} from "@/lib/users-store";
import { isValidEmail } from "@/lib/email";
import { appendAdminLog } from "@/lib/admin-logs-store";

type Ctx = { params: Promise<{ username: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!canAssignRoles(session)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const { username: rawUsername } = await ctx.params;
    const username = decodeURIComponent(rawUsername).trim();
    if (!username) {
      return NextResponse.json({ error: "missing_username" }, { status: 400 });
    }

    let body: { email?: unknown };
    try {
      body = (await request.json()) as { email?: unknown };
    } catch {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const raw =
      body.email === null || body.email === undefined
        ? ""
        : typeof body.email === "string"
          ? body.email.trim().toLowerCase()
          : null;
    if (raw === null) {
      return NextResponse.json({ error: "invalid_email" }, { status: 400 });
    }

    const target = await findUserByUsername(username);
    if (!target) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    if (raw === "") {
      target.email = null;
      target.emailVerified = false;
      target.pendingEmail = null;
      target.emailCodeHash = null;
      target.emailCodeExpiresAt = null;
      target.emailCodePurpose = null;
    } else {
      if (!isValidEmail(raw)) {
        return NextResponse.json({ error: "email_invalid" }, { status: 400 });
      }
      const taken = await findUserByEmail(raw);
      if (
        taken &&
        taken.username.toLowerCase() !== target.username.toLowerCase()
      ) {
        return NextResponse.json({ error: "email_taken" }, { status: 400 });
      }
      target.email = raw;
      target.emailVerified = true;
      target.pendingEmail = null;
      target.emailCodeHash = null;
      target.emailCodeExpiresAt = null;
      target.emailCodePurpose = null;
    }

    await saveUser(target);
    const sessionUser = toSessionUser(target);

    try {
      await appendAdminLog({
        actor: session!.username,
        kind: "email_change_admin",
        message: raw
          ? `${session!.username} установил почту ${raw} игроку ${target.username}`
          : `${session!.username} очистил почту игрока ${target.username}`,
        meta: {
          target: target.username,
          email: raw || null,
          cleared: !raw,
        },
      });
    } catch (error) {
      console.error("[admin/players/email] log failed", error);
    }

    return NextResponse.json(
      {
        ok: true,
        user: {
          username: target.username,
          role: sessionUser.role,
          email: sessionUser.email ?? null,
          emailVerified: sessionUser.emailVerified ?? false,
          totpEnabled: sessionUser.totpEnabled ?? false,
          createdAt: target.createdAt ?? null,
          balance: sessionUser.balance,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[admin/players/email] failed", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
