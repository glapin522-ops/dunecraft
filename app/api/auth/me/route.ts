import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { findUserByUsername } from "@/lib/users-store";
import { toSessionUser } from "@/lib/auth/types";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  const stored = await findUserByUsername(session.username);
  if (stored) {
    return NextResponse.json({ user: toSessionUser(stored) });
  }
  // Seed-only session (no StoredUser row)
  return NextResponse.json({
    user: {
      username: session.username,
      role: session.role,
      email: null,
      emailVerified: false,
      totpEnabled: false,
      level: session.level ?? 1,
      vipLevel: session.vipLevel ?? 0,
      balance: session.balance ?? 0,
      seedOnly: true,
    },
  });
}
