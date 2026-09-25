export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  canModeratePlayers,
  isUserBanned,
  isUserMuted,
  muteUntilFromMinutes,
  toSessionUser,
} from "@/lib/auth/types";
import { findUserByUsername, saveUser } from "@/lib/users-store";
import { appendAdminLog } from "@/lib/admin-logs-store";

type Ctx = { params: Promise<{ username: string }> };

const MIN_MINUTES = 1;
const MAX_MINUTES = 5256000; // ~10 years

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

    let body: { minutes?: unknown; reason?: unknown };
    try {
      body = (await request.json()) as { minutes?: unknown; reason?: unknown };
    } catch {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const minutesRaw = body.minutes;
    const minutes =
      typeof minutesRaw === "number"
        ? minutesRaw
        : typeof minutesRaw === "string"
          ? Number(minutesRaw)
          : NaN;
    if (
      !Number.isFinite(minutes) ||
      minutes < MIN_MINUTES ||
      minutes > MAX_MINUTES
    ) {
      return NextResponse.json({ error: "invalid_minutes" }, { status: 400 });
    }
    const minutesInt = Math.floor(minutes);

    const reason =
      typeof body.reason === "string" ? body.reason.trim() : "";
    if (!reason || reason.length > 500) {
      return NextResponse.json({ error: "reason_required" }, { status: 400 });
    }

    const target = await findUserByUsername(username);
    if (!target) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    const mutedUntil = muteUntilFromMinutes(minutesInt);
    target.mutedUntil = mutedUntil;
    target.muteReason = reason;
    target.mutedBy = session!.username;
    await saveUser(target);

    await appendAdminLog({
      actor: session!.username,
      kind: "mute",
      message: `${session!.username} замутил ${target.username} на ${minutesInt} мин.: ${reason}`,
      meta: {
        target: target.username,
        minutes: minutesInt,
        reason,
        actor: session!.username,
        mutedUntil,
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
    console.error("[admin/players/mute] failed", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
