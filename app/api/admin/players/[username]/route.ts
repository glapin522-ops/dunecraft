export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { canModeratePlayers, canSearchPlayers } from "@/lib/auth/types";
import {
  deleteUser,
  findUserByUsername,
  listUsers,
} from "@/lib/users-store";
import { appendAdminLog } from "@/lib/admin-logs-store";
import { toSafePlayer } from "@/lib/auth/safe-player";

type Ctx = { params: Promise<{ username: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!canSearchPlayers(session)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const { username: rawUsername } = await ctx.params;
    const username = decodeURIComponent(rawUsername).trim();
    if (!username) {
      return NextResponse.json({ error: "missing_username" }, { status: 400 });
    }

    const target = await findUserByUsername(username);
    if (!target) {
      const seedUsername = process.env.CREATOR_USERNAME?.trim() ?? "";
      if (
        seedUsername &&
        seedUsername.toLowerCase() === username.toLowerCase()
      ) {
        return NextResponse.json(
          {
            player: toSafePlayer({
              username: seedUsername,
              passwordHash: "",
              role: "creator",
              createdAt: new Date(0).toISOString(),
              email: null,
              emailVerified: false,
              totpEnabled: false,
            }),
          },
          { headers: { "Cache-Control": "no-store" } },
        );
      }
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    return NextResponse.json(
      { player: toSafePlayer(target) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[admin/players/get] failed", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, ctx: Ctx) {
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

    if (session!.username.toLowerCase() === username.toLowerCase()) {
      return NextResponse.json({ error: "cannot_delete_self" }, { status: 400 });
    }

    let body: { reason?: unknown } = {};
    try {
      const text = await request.text();
      if (text.trim()) body = JSON.parse(text) as { reason?: unknown };
    } catch {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const reason =
      typeof body.reason === "string" ? body.reason.trim() : "";
    if (!reason || reason.length > 500) {
      return NextResponse.json({ error: "reason_required" }, { status: 400 });
    }

    const target = await findUserByUsername(username);
    if (!target) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    if (target.role === "creator") {
      const users = await listUsers();
      const creatorCount = users.filter((u) => u.role === "creator").length;
      if (creatorCount <= 1) {
        return NextResponse.json({ error: "last_creator" }, { status: 400 });
      }
    }

    const removed = await deleteUser(target.username);
    if (!removed) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    await appendAdminLog({
      actor: session!.username,
      kind: "account_delete",
      message: `${session!.username} удалил аккаунт ${removed.username}: ${reason}`,
      meta: {
        target: removed.username,
        reason,
        actor: session!.username,
        role: removed.role,
      },
    });

    return NextResponse.json(
      { ok: true, username: removed.username },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[admin/players/delete] failed", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
