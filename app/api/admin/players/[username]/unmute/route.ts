export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  canModeratePlayers,
  isUserBanned,
  toSessionUser,
} from "@/lib/auth/types";
import { findUserByUsername, saveUser } from "@/lib/users-store";
import { appendAdminLog } from "@/lib/admin-logs-store";

type Ctx = { params: Promise<{ username: string }> };

export async function PATCH(_request: Request, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!canModeratePlayers(session)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const { username: rawUsername } = await ctx.params;
    const username = decodeURIComponent(rawUsername).trim();
    if (!username) {
      return NextResponse.json({ error: "missing_username" }, { status: 400 });
    }

    const target = await findUserByUsername(username);
    if (!target) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    target.mutedUntil = null;
    target.muteReason = null;
    target.mutedBy = null;
    await saveUser(target);

    await appendAdminLog({
      actor: session!.username,
      kind: "unmute",
      message: `${session!.username} снял мут с ${target.username}`,
      meta: {
        target: target.username,
        actor: session!.username,
      },
    });

    const sessionUser = toSessionUser(target);
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
          banned: isUserBanned(target),
          bannedUntil: target.bannedUntil ?? null,
          banReason: target.banReason ?? null,
          bannedBy: target.bannedBy ?? null,
          muted: false,
          mutedUntil: null,
          muteReason: null,
          mutedBy: null,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[admin/players/unmute] failed", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
