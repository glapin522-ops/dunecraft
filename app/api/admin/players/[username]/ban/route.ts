export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  banUntilFromDays,
  canModeratePlayers,
  isUserBanned,
  isUserMuted,
  toSessionUser,
} from "@/lib/auth/types";
import { findUserByUsername, saveUser } from "@/lib/users-store";
import { appendAdminLog } from "@/lib/admin-logs-store";

type Ctx = { params: Promise<{ username: string }> };

const MIN_DAYS = 1;
const MAX_DAYS = 9999;
const PERM_DAYS = 9999;

export async function PATCH(request: Request, ctx: Ctx) {
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
      return NextResponse.json({ error: "cannot_moderate_self" }, { status: 400 });
    }

    let body: { days?: unknown; reason?: unknown };
    try {
      body = (await request.json()) as { days?: unknown; reason?: unknown };
    } catch {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const daysRaw = body.days;
    const days =
      typeof daysRaw === "number"
        ? daysRaw
        : typeof daysRaw === "string"
          ? Number(daysRaw)
          : NaN;
    if (!Number.isFinite(days) || days < MIN_DAYS || days > MAX_DAYS) {
      return NextResponse.json({ error: "invalid_days" }, { status: 400 });
    }
    const daysInt = Math.floor(days);

    const reason =
      typeof body.reason === "string" ? body.reason.trim() : "";
    if (!reason || reason.length > 500) {
      return NextResponse.json({ error: "reason_required" }, { status: 400 });
    }

    const target = await findUserByUsername(username);
    if (!target) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    const bannedUntil = banUntilFromDays(daysInt);
    target.bannedUntil = bannedUntil;
    target.banReason = reason;
    target.bannedBy = session!.username;
    await saveUser(target);

    const permanent = daysInt >= PERM_DAYS;
    const label = permanent ? "навсегда (9999 дн.)" : `на ${daysInt} дн.`;
    await appendAdminLog({
      actor: session!.username,
      kind: "ban",
      message: `${session!.username} забанил ${target.username} ${label}: ${reason}`,
      meta: {
        target: target.username,
        days: daysInt,
        permanent,
        reason,
        actor: session!.username,
        bannedUntil,
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
          muted: isUserMuted(target),
          mutedUntil: target.mutedUntil ?? null,
          muteReason: target.muteReason ?? null,
          mutedBy: target.mutedBy ?? null,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[admin/players/ban] failed", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
