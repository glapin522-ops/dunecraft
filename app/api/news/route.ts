export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { canManageNews } from "@/lib/auth/types";
import {
  createNews,
  listAllNews,
  listPublishedNews,
  type NewsInput,
} from "@/lib/news-store";
import { appendAdminLog } from "@/lib/admin-logs-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "1";
  if (all) {
    const session = await getSession();
    if (!canManageNews(session)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const posts = await listAllNews();
    return NextResponse.json({ posts }, { headers: { "Cache-Control": "no-store" } });
  }
  const posts = await listPublishedNews();
  return NextResponse.json({ posts }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!canManageNews(session)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  try {
    const body = (await request.json()) as NewsInput;
    if (!body?.title?.ru?.trim() && !body?.title?.en?.trim()) {
      return NextResponse.json({ error: "title_required" }, { status: 400 });
    }
    const post = await createNews({
      ...body,
      title: {
        ru: body.title?.ru ?? "",
        en: body.title?.en ?? "",
      },
      excerpt: {
        ru: body.excerpt?.ru ?? "",
        en: body.excerpt?.en ?? "",
      },
      body: {
        ru: body.body?.ru ?? "",
        en: body.body?.en ?? "",
      },
    });

    const title = post.title.ru || post.title.en || post.slug;
    await appendAdminLog({
      actor: session!.username,
      kind: "news_create",
      message: `${session!.username} создал новость «${title}»`,
      meta: { slug: post.slug, title, id: post.id, status: post.status },
    });
    if (post.status === "published") {
      await appendAdminLog({
        actor: session!.username,
        kind: "news_publish",
        message: `${session!.username} опубликовал новость «${title}»`,
        meta: { slug: post.slug, title, id: post.id },
      });
    }

    return NextResponse.json({ post }, { status: 201 });
  } catch (err) {
    console.error("[news/POST]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
