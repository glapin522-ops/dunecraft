import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BleedLayer } from "@/components/BleedLayer";
import { DonatePackCard } from "@/components/DonatePackCard";
import { StubBadge } from "@/components/StubBadge";
import { NewsRow } from "@/components/NewsRow";
import { DiscordInvite } from "@/components/DiscordInvite";
import { StayInTouch } from "@/components/StayInTouch";
import { FadeIn } from "@/components/motion/FadeIn";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { HeroMistLazy } from "@/components/HeroMistLazy";
import { donatePacks } from "@/content/donate";
import { listPublishedNews } from "@/lib/news-store";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const dict = getDictionary(locale);
  const pinnedOrRecent = (await listPublishedNews()).slice(0, 2);
  const packs = donatePacks.slice(0, 3);

  return (
    <div className="relative">
      <section className="relative flex min-h-[100svh] items-center overflow-hidden pb-safe md:min-h-[85vh]">
        <BleedLayer style={{ background: "#0a0812" }}>
          <Image
            src="/hero.png"
            alt=""
            fill
            priority
            sizes="100vw"
            quality={75}
            className="object-cover object-center opacity-70"
            style={{ objectFit: "cover", objectPosition: "center", opacity: 0.7 }}
          />
        </BleedLayer>
        <BleedLayer
          style={{
            background: [
              "linear-gradient(180deg, #0a0812cc 0%, #0a081233 28%, #0a081200 45%)",
              "linear-gradient(0deg, #0a0812 0%, #0a0812f2 14%, #0a0812aa 32%, transparent 62%)",
              "radial-gradient(ellipse 90% 70% at 50% 40%, transparent 30%, #0a081288 100%)",
              "radial-gradient(ellipse 46% 40% at 12% 70%, #67b8ff14, transparent 62%)",
            ].join(", "),
          }}
        />
        <BleedLayer
          style={{
            opacity: 0.05,
            backgroundImage:
              "linear-gradient(rgba(154,155,152,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(154,155,152,0.35) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 20%, transparent 75%)",
            maskImage: "radial-gradient(ellipse at center, black 20%, transparent 75%)",
          }}
        />

        <HeroMistLazy />

        <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-8 px-4 py-16 sm:py-24 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:gap-6 md:py-28 lg:gap-10 lg:py-32">
          <div className="min-w-0">
            <FadeIn delay={0} y={20}>
              <p className="kicker-mix text-base uppercase sm:text-lg">Minecraft RPG</p>
            </FadeIn>
            <FadeIn delay={0.08} y={24}>
              <h1 className="mt-4 text-4xl font-bold leading-[0.95] tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-[6.5rem]">
                {dict.home.heroTitle}
              </h1>
            </FadeIn>
            <FadeIn delay={0.16} y={20}>
              <p className="mt-5 max-w-xl text-lg font-medium text-gold-light sm:mt-6 sm:text-2xl md:text-3xl md:leading-snug">
                {dict.home.heroTagline}
              </p>
            </FadeIn>
            <FadeIn delay={0.22} y={16}>
              <p className="mt-4 max-w-xl text-sm text-muted sm:mt-5 sm:text-base md:text-lg">{dict.home.heroLead}</p>
            </FadeIn>
            <FadeIn delay={0.3} y={16}>
              <div className="mt-8 flex w-full sm:mt-10 sm:w-auto">
                <button type="button" disabled aria-disabled="true" aria-label={dict.home.launcherCta} className="hero-launcher-cta glow-btn inline-flex w-full items-center justify-center gap-2 px-8 py-4 text-base font-bold tracking-wide sm:w-auto sm:text-lg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
                    <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 19h14" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {dict.home.launcherCta}
                  <StubBadge label={dict.common.comingSoon} />
                </button>
              </div>
            </FadeIn>
            <FadeIn delay={0.38} y={12}>
              <p className="mt-5 text-sm text-muted">
                {dict.common.online} · {dict.common.comingSoon}
              </p>
            </FadeIn>
          </div>

          <FadeIn delay={0.2} y={28} className="relative mx-auto hidden w-full max-w-md md:mx-0 md:block lg:max-w-lg">
            <div className="hero-stage relative mx-auto aspect-[4/5] w-full max-h-[min(74vh,40rem)] overflow-visible">
              {/* character only — no panels / fill behind */}
              <img
                src="/hero-rune-viking.png?v=6"
                alt=""
                width={684}
                height={650}
                decoding="async"
                fetchPriority="high"
                className="hero-viking relative z-[2] mx-auto h-full w-auto max-h-full translate-x-12 -translate-y-4 object-contain object-bottom md:translate-x-16 md:-translate-y-6 lg:translate-x-24 lg:-translate-y-8"
              />
            </div>
          </FadeIn>
        </div>
      </section>

      <div className="section-divider-line" aria-hidden><img src="/runes/rune-fehu.png?v=3" alt="" className="section-divider-rune" width={20} height={20} /></div>

      <section className="relative bg-[#0a0812] py-12 md:py-24 lg:py-28">
        <div className="relative z-10 mx-auto max-w-6xl px-4">
          <FadeIn inView y={20} className="mb-8 text-center md:mb-14">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">{dict.home.newsTitle}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-muted sm:text-lg">{dict.home.newsLead}</p>
            <Link href={`/${locale}/news`} className="mt-4 inline-block text-base text-accent-skin transition-colors hover:text-foreground">
              {dict.common.seeAll} →
            </Link>
          </FadeIn>
          <Stagger inView stagger={0.12} className="grid gap-10 md:gap-14">
            {pinnedOrRecent.map((post) => (
              <StaggerItem key={post.slug} y={20}>
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
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

<div className="section-divider-line" aria-hidden><img src="/runes/rune-fehu.png?v=3" alt="" className="section-divider-rune" width={20} height={20} /></div>

      <section className="relative border-b border-[color:var(--glass-stroke)] bg-[#0a0812] py-12 md:py-24 lg:py-28">
        <div className="relative mx-auto max-w-6xl px-4">
          <FadeIn inView y={20} className="mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-14">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">{dict.home.donateTitle}</h2>
              <p className="mt-3 max-w-xl text-base text-muted sm:text-lg">{dict.home.donateLead}</p>
            </div>
            <Link href={`/${locale}/donate`} className="text-base text-accent-skin transition-colors hover:text-foreground">
              {dict.common.seeAll} →
            </Link>
          </FadeIn>
          <Stagger inView stagger={0.1} className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
            {packs.map((pack) => (
              <StaggerItem key={pack.id} y={20} className="h-full">
                <DonatePackCard pack={pack} locale={locale} dict={dict} compact />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 md:py-20">
        <FadeIn inView y={24}>
          <DiscordInvite title={dict.home.discordTitle} lead={dict.home.discordLead} buttonLabel={dict.home.discordCta} soon={dict.common.comingSoon} />
        </FadeIn>
      </section>

      <FadeIn inView y={24}>
        <section className="border-t border-border bg-surface-2 py-12 md:py-24">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <div className="panel-solid mx-auto max-w-3xl rounded-2xl px-6 py-10 sm:px-8 sm:py-12 md:px-12 md:py-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">{dict.home.ctaTitle}</h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-muted sm:text-lg">{dict.home.ctaLead}</p>
              <StayInTouch vk={dict.home.socialVk} telegram={dict.home.socialTelegram} discord={dict.home.socialDiscord} />
            </div>
          </div>
        </section>
      </FadeIn>
    </div>
  );
}
