import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { canManageNews } from "@/lib/auth/types";
import {
  deleteNews,
  getNewsById,
  updateNews,
  type NewsInput,
} from "@/lib/news-store";
import { appendAdminLog } from "@/lib/admin-logs-store";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const session = await getSession();
  if (!canManageNews(session)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const post = await getNewsById(id);
  if (!post) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(
    { post },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(request: Request, ctx: Ctx) {
  const session = await getSession();
  if (!canManageNews(session)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  try {
    const body = (await request.json()) as Partial<NewsInput>;
    const before = await getNewsById(id);
    const post = await updateNews(id, body);
    if (!post) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const title = post.title.ru || post.title.en || post.slug;
    const prevStatus = before?.status;
    if (prevStatus !== "published" && post.status === "published") {
      await appendAdminLog({
        actor: session!.username,
        kind: "news_publish",
        message: `${session!.username} опубликовал новость «${title}»`,
        meta: { slug: post.slug, title, id: post.id },
      });
    } else if (prevStatus === "published" && post.status === "draft") {
      await appendAdminLog({
        actor: session!.username,
        kind: "news_unpublish",
        message: `${session!.username} снял с публикации «${title}»`,
        meta: { slug: post.slug, title, id: post.id },
      });
    }

    return NextResponse.json({ post });
  } catch (err) {
    console.error("[news/PATCH]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const session = await getSession();
  if (!canManageNews(session)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const existing = await getNewsById(id);
  const ok = await deleteNews(id);
  if (!ok) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (existing) {
    const title = existing.title.ru || existing.title.en || existing.slug;
    await appendAdminLog({
      actor: session!.username,
      kind: "news_delete",
      message: `${session!.username} удалил новость «${title}»`,
      meta: { slug: existing.slug, title, id: existing.id },
    });
  }
  return NextResponse.json({ ok: true });
}
