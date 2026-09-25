import { NextResponse } from "next/server";
import { isCosmeticKind, readLocalCosmetic } from "@/lib/cosmetics";

/** Local-dev fallback when Vercel Blob is not linked. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const username = url.searchParams.get("user") ?? "";
  const kind = url.searchParams.get("kind");
  if (!username || !isCosmeticKind(kind)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const buf = await readLocalCosmetic(username, kind);
  if (!buf) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const bytes = new Uint8Array(buf.byteLength);
  bytes.set(buf);
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
    },
  });
}
