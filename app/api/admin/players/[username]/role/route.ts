export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  canAssignRoles,
  isRole,
  toSessionUser,
  type Role,
} from "@/lib/auth/types";
import { findUserByUsername, listUsers, saveUser } from "@/lib/users-store";
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

    // Safer: creators cannot change their own role via UI/API
    if (session!.username.toLowerCase() === username.toLowerCase()) {
      return NextResponse.json({ error: "cannot_change_own_role" }, { status: 400 });
    }

    let body: { role?: unknown };
    try {
      body = (await request.json()) as { role?: unknown };
    } catch {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    if (!isRole(body.role)) {
      return NextResponse.json({ error: "invalid_role" }, { status: 400 });
    }
    const nextRole: Role = body.role;

    const target = await findUserByUsername(username);
    if (!target) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    // Keep at least one creator in the store
    if (target.role === "creator" && nextRole !== "creator") {
      const users = await listUsers();
      const creatorCount = users.filter((u) => u.role === "creator").length;
      if (creatorCount <= 1) {
        return NextResponse.json(
          { error: "last_creator" },
          { status: 400 },
        );
      }
    }

    const prevRole = target.role;
    target.role = nextRole;
    await saveUser(target);
    const sessionUser = toSessionUser(target);

    await appendAdminLog({
      actor: session!.username,
      kind: "role_change",
      message: `${session!.username} сменил роль ${target.username}: ${prevRole} → ${nextRole}`,
      meta: {
        target: target.username,
        from: prevRole,
        to: nextRole,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        user: {
          username: target.username,
          role: target.role,
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
    console.error("[admin/players/role] failed", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
