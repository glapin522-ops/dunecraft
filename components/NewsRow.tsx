import Image from "next/image";
import Link from "next/link";
import { StubBadge } from "@/components/StubBadge";
import { formatNewsDate } from "@/lib/format-news-date";
import type { Locale } from "@/lib/i18n";

export type NewsRowProps = {
  locale: Locale;
  href: string;
  title: string;
  excerpt: string;
  date: string;
  coverImageUrl?: string | null;
  pinned?: boolean;
  pinnedLabel?: string;
};

export function NewsRow({
  locale,
  href,
  title,
  excerpt,
  date,
  coverImageUrl,
  pinned,
  pinnedLabel,
}: NewsRowProps) {
  const cover = coverImageUrl?.trim() || null;
  const formatted = formatNewsDate(date, locale);

  return (
    <Link
      href={href}
      className="group flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8 md:gap-10"
    >
      <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-[12px] bg-surface-2 sm:w-56 md:w-72 lg:w-80">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob / external covers
          <img
            src={cover}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <Image
            src="/hero.png"
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 320px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        )}
      </div>

      <div className="min-w-0 flex-1 pt-0.5 sm:pt-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <time
            dateTime={date}
            className="inline-flex items-center rounded-full bg-[#16121f] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-gold-light ring-1 ring-white/5"
          >
            {formatted}
          </time>
          {pinned && pinnedLabel ? <StubBadge label={pinnedLabel} /> : null}
        </div>
        <h3 className="mt-3 text-xl font-bold leading-snug tracking-tight text-foreground transition-colors group-hover:text-gold-light md:text-2xl">
          {title}
        </h3>
        <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-muted md:line-clamp-4 md:text-base">
          {excerpt}
        </p>
      </div>
    </Link>
  );
}
