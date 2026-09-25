export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { canGrantBalance, toSessionUser } from "@/lib/auth/types";
import { findUserByUsername, saveUser } from "@/lib/users-store";
import { appendAdminLog } from "@/lib/admin-logs-store";

type Ctx = { params: Promise<{ username: string }> };

const MAX_BALANCE = 1_000_000;

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!canGrantBalance(session)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const { username: rawUsername } = await ctx.params;
    const username = decodeURIComponent(rawUsername).trim();
    if (!username) {
      return NextResponse.json({ error: "missing_username" }, { status: 400 });
    }

    let body: { amount?: unknown; mode?: unknown };
    try {
      body = (await request.json()) as { amount?: unknown; mode?: unknown };
    } catch {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const modeRaw = typeof body.mode === "string" ? body.mode.trim() : "grant";
    const mode = modeRaw === "set" ? "set" : "grant";

    const amountRaw = body.amount;
    const amount =
      typeof amountRaw === "number"
        ? amountRaw
        : typeof amountRaw === "string"
          ? Number(amountRaw)
          : NaN;
    if (!Number.isFinite(amount)) {
      return NextResponse.json({ error: "invalid_amount" }, { status: 400 });
    }
    const value = Math.floor(amount);
    if (mode === "grant") {
      if (value <= 0 || value > MAX_BALANCE) {
        return NextResponse.json({ error: "invalid_amount" }, { status: 400 });
      }
    } else {
      if (value < 0 || value > MAX_BALANCE) {
        return NextResponse.json({ error: "invalid_amount" }, { status: 400 });
      }
    }

    const target = await findUserByUsername(username);
    if (!target) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    const current =
      typeof target.balance === "number" &&
      Number.isFinite(target.balance) &&
      target.balance >= 0
        ? Math.floor(target.balance)
        : 0;

    const balanceAfter = mode === "set" ? value : current + value;
    if (balanceAfter > MAX_BALANCE * 2) {
      // soft cap after grant to avoid absurd totals
      return NextResponse.json({ error: "invalid_amount" }, { status: 400 });
    }
    target.balance = balanceAfter;
    await saveUser(target);

    const sessionUser = toSessionUser(target);
    try {
      if (mode === "set") {
        await appendAdminLog({
          actor: session!.username,
          kind: "balance_set",
          message: `${session!.username} задал баланс игроку ${target.username}: было ${current}, стало ${balanceAfter}`,
          meta: {
            target: target.username,
            balanceBefore: current,
            balanceAfter,
            amount: balanceAfter,
            mode: "set",
          },
        });
      } else {
        await appendAdminLog({
          actor: session!.username,
          kind: "balance_grant",
          message: `${session!.username} начислил ${value} игроку ${target.username} (баланс: ${balanceAfter})`,
          meta: {
            target: target.username,
            amount: value,
            balanceBefore: current,
            balanceAfter,
            mode: "grant",
          },
        });
      }
    } catch (logErr) {
      console.error("[admin/players/balance] log failed after save", logErr);
      // Balance already saved — still surface log failure so creator notices
      return NextResponse.json(
        {
          ok: true,
          warning: "log_failed",
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
    console.error("[admin/players/balance] failed", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
