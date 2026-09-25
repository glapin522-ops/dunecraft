export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { canSearchPlayers, isRole, type Role } from "@/lib/auth/types";
import { toSafePlayer } from "@/lib/auth/safe-player";
import { listUsers } from "@/lib/users-store";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!canSearchPlayers(session)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim().toLowerCase() ?? "";
    const roleParam = searchParams.get("role");
    const role: Role | null = isRole(roleParam) ? roleParam : null;
    const users = await listUsers();
    const seedUsername = process.env.CREATOR_USERNAME?.trim() ?? "";
    const hasSeedInStore = seedUsername
      ? users.some(
          (user) =>
            user.username.toLowerCase() === seedUsername.toLowerCase(),
        )
      : true;

    const source = [...users];
    if (seedUsername && !hasSeedInStore) {
      source.push({
        username: seedUsername,
        passwordHash: "",
        role: "creator",
        createdAt: new Date(0).toISOString(),
        email: null,
        emailVerified: false,
        totpEnabled: false,
      });
    }

    const players = source
      .filter((user) => !query || user.username.toLowerCase().includes(query))
      .filter((user) => !role || user.role === role)
      .sort((a, b) =>
        a.username.localeCompare(b.username, undefined, {
          sensitivity: "base",
        }),
      )
      .map(toSafePlayer);

    return NextResponse.json(
      { players },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[admin/players] failed", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
