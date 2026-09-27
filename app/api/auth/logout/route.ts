import { NextResponse } from "next/server";
import { clearSessionCookie, getSession } from "@/lib/auth/session";
import { safeAppendAdminLog } from "@/lib/admin-logs-store";
import { getClientIp } from "@/lib/client-ip";

export async function POST(request: Request) {
  const session = await getSession();
  const ip = getClientIp(request);
  const username = session?.username;
  await clearSessionCookie();
  if (username) {
    safeAppendAdminLog({
      actor: username,
      kind: "logout",
      message: `Выход: ${username}`,
      meta: {
        target: username,
        ip: ip ?? null,
      },
    });
  }
  return NextResponse.json({ ok: true });
}
