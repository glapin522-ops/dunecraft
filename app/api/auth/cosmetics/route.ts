import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { toSessionUser } from "@/lib/auth/types";
import { findUserByUsername, saveUser } from "@/lib/users-store";
import {
  isCosmeticKind,
  saveCosmeticFile,
  validateCosmeticPng,
  type CosmeticKind,
} from "@/lib/cosmetics";

export const runtime = "nodejs";

async function persistUrl(
  username: string,
  kind: CosmeticKind,
  url: string | null,
) {
  const stored = await findUserByUsername(username);
  if (!stored) return null;
  const next = {
    ...stored,
    ...(kind === "skin" ? { skinUrl: url } : { capeUrl: url }),
  };
  await saveUser(next);
  return toSessionUser(next);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const stored = await findUserByUsername(session.username);
  if (!stored) {
    return NextResponse.json({ error: "need_account" }, { status: 409 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form" }, { status: 400 });
  }

  const kindRaw = form.get("kind");
  if (!isCosmeticKind(kindRaw)) {
    return NextResponse.json({ error: "bad_kind" }, { status: 400 });
  }
  const kind: CosmeticKind = kindRaw;

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const check = validateCosmeticPng(buf, kind);
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: 400 });
  }

  try {
    const url = await saveCosmeticFile(session.username, kind, buf);
    const user = await persistUrl(session.username, kind, url);
    return NextResponse.json({ ok: true, kind, url, user });
  } catch (err) {
    console.error("[cosmetics] upload failed", err);
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const stored = await findUserByUsername(session.username);
  if (!stored) {
    return NextResponse.json({ error: "need_account" }, { status: 409 });
  }

  let kindRaw: unknown = null;
  try {
    const body = (await req.json()) as { kind?: unknown };
    kindRaw = body.kind;
  } catch {
    return NextResponse.json({ error: "bad_kind" }, { status: 400 });
  }
  if (!isCosmeticKind(kindRaw)) {
    return NextResponse.json({ error: "bad_kind" }, { status: 400 });
  }

  const user = await persistUrl(session.username, kindRaw, null);
  return NextResponse.json({ ok: true, kind: kindRaw, url: null, user });
}
