export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { canViewAdminLogs } from "@/lib/auth/types";
import { listAdminLogs } from "@/lib/admin-logs-store";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!canViewAdminLogs(session)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : undefined;
    const logs = await listAdminLogs({
      limit: Number.isFinite(limit) ? limit : undefined,
    });

    return NextResponse.json(
      { logs },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[admin/logs] failed", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
