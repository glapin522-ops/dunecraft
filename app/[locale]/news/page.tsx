import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageAtmosphere } from "@/components/PageAtmosphere";
import { Card } from "@/components/Card";
import { StubBadge } from "@/components/StubBadge";
import { listPublishedNews } from "@/lib/news-store";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ru";
  const dict = getDictionary(locale);
  return { title: dict.news.title, description: dict.news.lead };
}

export default async function NewsPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw;
  const dict = getDictionary(locale);
  const posts = await listPublishedNews();

  return (
    <PageAtmosphere particlesId="dunecraft-news-mist">
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold">{dict.news.title}</h1>
      <p className="mt-2 max-w-2xl text-muted">{dict.news.lead}</p>

      {posts.length === 0 ? (
        <p className="mt-10 text-ash">{dict.news.empty}</p>
      ) : (
        <ul className="mt-10 grid gap-4 md:grid-cols-2">
          {posts.map((post) => (
            <li key={post.id}>
              <Link href={`/${locale}/news/${post.slug}`}>
                <Card as="article" className="h-full hover:border-moss-light/40">
                  {post.coverImageUrl ? (
                    <div className="relative mb-3 h-40 w-full overflow-hidden rounded-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.coverImageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-ash">
                    <time dateTime={post.date}>{post.date}</time>
                    {post.pinned && <StubBadge label={dict.common.pinned} />}
                  </div>
                  <h2 className="mt-2 text-xl font-semibold text-foreground">
                    {post.title[locale]}
                  </h2>
                  <p className="mt-2 text-sm text-muted">{post.excerpt[locale]}</p>
                  <span className="mt-4 inline-block text-sm text-moss-light">
                    {dict.common.readMore} →
                  </span>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
    </PageAtmosphere>
  );
}
