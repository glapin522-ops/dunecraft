import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageAtmosphere } from "@/components/PageAtmosphere";
import { NewsRow } from "@/components/NewsRow";
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
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <header className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {dict.news.title}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-muted sm:text-lg">
            {dict.news.lead}
          </p>
        </header>

        {posts.length === 0 ? (
          <p className="mt-14 text-center text-ash">{dict.news.empty}</p>
        ) : (
          <ul className="mt-12 grid gap-10 md:mt-16 md:gap-14">
            {posts.map((post) => (
              <li key={post.id}>
                <NewsRow
                  locale={locale}
                  href={`/${locale}/news/${post.slug}`}
                  title={post.title[locale]}
                  excerpt={post.excerpt[locale]}
                  date={post.date}
                  coverImageUrl={post.coverImageUrl}
                  pinned={post.pinned}
                  pinnedLabel={dict.common.pinned}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageAtmosphere>
  );
}
