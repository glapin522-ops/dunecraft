export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth/session";
import { canAssignRoles } from "@/lib/auth/types";
import { findUserByUsername, saveUser } from "@/lib/users-store";
import { validatePassword } from "@/lib/auth/validation";
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

    let body: { password?: unknown };
    try {
      body = (await request.json()) as { password?: unknown };
    } catch {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const password = typeof body.password === "string" ? body.password : "";
    const policy = validatePassword(password);
    if (policy) {
      return NextResponse.json({ error: policy }, { status: 400 });
    }

    const target = await findUserByUsername(username);
    if (!target) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    target.passwordHash = await bcrypt.hash(password, 10);
    target.emailCodeHash = null;
    target.emailCodeExpiresAt = null;
    target.emailCodePurpose = null;
    await saveUser(target);

    await appendAdminLog({
      actor: session!.username,
      kind: "password_reset",
      message: `${session!.username} сменил пароль игроку ${target.username}`,
      meta: { target: target.username },
    });

    return NextResponse.json(
      { ok: true, user: { username: target.username } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[admin/players/password] failed", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
