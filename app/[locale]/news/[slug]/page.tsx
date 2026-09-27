import Link from "next/link";
import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageAtmosphere } from "@/components/PageAtmosphere";
import { MarkdownBody } from "@/components/MarkdownBody";
import { StubBadge } from "@/components/StubBadge";
import { getNewsBySlug as fetchNewsBySlug } from "@/lib/news-store";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const getNewsBySlug = cache((slug: string) => fetchNewsBySlug(slug));

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ru";
  const post = await getNewsBySlug(slug);
  if (!post) return { title: "404" };
  return {
    title: post.title[locale],
    description: post.excerpt[locale],
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw;
  const dict = getDictionary(locale);
  const post = await getNewsBySlug(slug);
  if (!post) notFound();

  return (
    <PageAtmosphere particlesId="dunecraft-news-slug-mist">
    <article className="mx-auto max-w-3xl px-4 py-12">
      <Link
        href={`/${locale}/news`}
        className="text-sm text-moss-light hover:text-gold-light"
      >
        ← {dict.news.backToList}
      </Link>
      <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-ash">
        <time dateTime={post.date}>{post.date}</time>
        {post.pinned && <StubBadge label={dict.common.pinned} />}
      </div>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
        {post.title[locale]}
      </h1>
      {post.coverImageUrl ? (
        <div className="mt-6 overflow-hidden rounded-xl border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.coverImageUrl}
            alt=""
            className="max-h-[420px] w-full object-cover"
          />
        </div>
      ) : null}
      <MarkdownBody
        className="prose-dc mt-8 text-base leading-relaxed text-ash-light [&_a]:text-moss-light [&_a]:underline [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:ml-4 [&_ol]:list-decimal [&_p]:mb-4 [&_ul]:list-disc"
        source={post.body[locale]}
      />
    </article>
    </PageAtmosphere>
  );
}
