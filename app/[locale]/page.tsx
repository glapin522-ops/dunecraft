import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/Card";
import { DonateBg } from "@/components/DonateBg";
import { StubBadge } from "@/components/StubBadge";
import { Button } from "@/components/Button";
import { DiscordInvite } from "@/components/DiscordInvite";
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
    <div>
      {/* Hero — gigantism */}
      <section className="relative flex min-h-[100svh] items-center overflow-hidden border-b border-[color:var(--glass-stroke)] pb-safe md:min-h-[85vh]">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[#0a0812]">
          <Image
            src="/hero.png"
            alt=""
            fill
            priority
            sizes="100vw"
            quality={75}
            className="object-cover object-center opacity-70"
          />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: [
              "linear-gradient(180deg, #0a0812cc 0%, #0a081233 28%, #0a081200 45%)",
              "linear-gradient(0deg, #0a0812f2 0%, #0a081299 22%, transparent 55%)",
              "radial-gradient(ellipse 90% 70% at 50% 40%, transparent 30%, #0a081288 100%)",
              "radial-gradient(ellipse 50% 40% at 20% 30%, #5c3d7a33, transparent 55%)",
              "radial-gradient(ellipse 40% 35% at 80% 25%, #c9a8ef22, transparent 50%)",
            ].join(", "),
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(154,155,152,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(154,155,152,0.35) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse at center, black 20%, transparent 75%)",
          }}
        />

        <HeroMistLazy />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-16 sm:py-24 md:py-32">
          <FadeIn delay={0} y={20}>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-moss-light sm:text-base">
              Minecraft RPG
            </p>
          </FadeIn>
          <FadeIn delay={0.08} y={24}>
            <h1 className="mt-4 text-4xl font-bold leading-[0.95] tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-[7rem]">
              {dict.home.heroTitle}
            </h1>
          </FadeIn>
          <FadeIn delay={0.16} y={20}>
            <p className="mt-5 max-w-3xl text-lg font-medium text-gold-light sm:mt-6 sm:text-2xl md:text-3xl md:leading-snug">
              {dict.home.heroTagline}
            </p>
          </FadeIn>
          <FadeIn delay={0.22} y={16}>
            <p className="mt-4 max-w-2xl text-sm text-muted sm:mt-5 sm:text-base md:text-lg">
              {dict.home.heroLead}
            </p>
          </FadeIn>

          <FadeIn delay={0.3} y={16}>
            <div className="mt-8 flex w-full sm:mt-10 sm:w-auto">
              <button
                type="button"
                disabled
                aria-disabled="true"
                aria-label={dict.home.launcherCta}
                className="glow-btn glass inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gold/40 bg-gold/15 px-8 py-4 text-base font-bold tracking-wide text-gold-light opacity-80 sm:w-auto sm:text-lg"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                  className="shrink-0"
                >
                  <path
                    d="M12 3v12m0 0l-4-4m4 4l4-4M5 19h14"
                    stroke="currentColor"
                    strokeWidth="2.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {dict.home.launcherCta}
                <StubBadge label={dict.common.comingSoon} />
              </button>
            </div>
          </FadeIn>

          <FadeIn delay={0.38} y={12}>
            <p className="mt-6 inline-flex items-center gap-2 text-sm text-ash">
              <span>{dict.common.online}</span>
              <StubBadge label={dict.common.comingSoon} />
            </p>
          </FadeIn>
        </div>
      </section>

      {/* News — fewer, larger */}
      <section className="border-y border-border bg-surface py-12 md:py-24 lg:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <FadeIn inView y={20} className="mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-14">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                {dict.home.newsTitle}
              </h2>
              <p className="mt-3 max-w-xl text-base text-muted sm:text-lg">
                {dict.home.newsLead}
              </p>
            </div>
            <Link
              href={`/${locale}/news`}
              className="text-base text-moss-light transition-colors hover:text-gold-light"
            >
              {dict.common.seeAll} →
            </Link>
          </FadeIn>
          <Stagger
            inView
            stagger={0.1}
            className="grid gap-6 md:grid-cols-2 md:gap-8"
          >
            {pinnedOrRecent.map((post) => (
              <StaggerItem key={post.slug} y={20} className="h-full">
                <Link
                  href={`/${locale}/news/${post.slug}`}
                  className="block h-full"
                >
                  <Card
                    as="article"
                    className="h-full p-7 transition-[border-color,box-shadow] duration-200 hover:border-moss-light/40 hover:[box-shadow:var(--glow-moss-sm)] md:p-8"
                  >
                    <div className="flex items-center gap-2 text-sm text-ash">
                      <time dateTime={post.date}>{post.date}</time>
                      {post.pinned && <StubBadge label={dict.common.pinned} />}
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-foreground md:text-2xl">
                      {post.title[locale]}
                    </h3>
                    <p className="mt-3 text-base leading-relaxed text-muted">
                      {post.excerpt[locale]}
                    </p>
                  </Card>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Donate preview — bg + glass cards */}
      <section className="relative overflow-hidden border-b border-[color:var(--glass-stroke)] py-12 md:py-24 lg:py-28">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[#0a0812]">
          <DonateBg />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: [
              "linear-gradient(180deg, #0a0812cc 0%, #0a081255 22%, #0a081233 50%, #0a081266 78%, #0a0812e6 100%)",
              "radial-gradient(ellipse 75% 55% at 50% 40%, #c9a8ef28, transparent 60%)",
              "radial-gradient(ellipse 95% 80% at 50% 55%, transparent 40%, #0a081299 100%)",
            ].join(", "),
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{ boxShadow: "inset 0 0 140px color-mix(in srgb, var(--gold) 22%, transparent)" }}
        />

        <div className="relative mx-auto max-w-6xl px-4">
          <FadeIn inView y={20} className="mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-14">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                {dict.home.donateTitle}
              </h2>
              <p className="mt-3 max-w-xl text-base text-muted sm:text-lg">
                {dict.home.donateLead}
              </p>
            </div>
            <Link
              href={`/${locale}/donate`}
              className="text-base text-moss-light transition-colors hover:text-gold-light"
            >
              {dict.common.seeAll} →
            </Link>
          </FadeIn>
          <Stagger
            inView
            stagger={0.1}
            className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8"
          >
            {packs.map((pack) => (
              <StaggerItem key={pack.id} y={20} className="h-full">
                <Card
                  className={`h-full p-7 md:p-8 ${
                    pack.featured
                      ? "border-gold/40 glow-ring-gold"
                      : ""
                  }`}
                >
                  <p className="text-base text-gold-light">
                    {pack.priceLabel[locale]}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold md:text-2xl">
                    {pack.title[locale]}
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-muted">
                    {pack.description[locale]}
                  </p>
                  <Button
                    variant="gold"
                    size="lg"
                    disabled
                    className="mt-6 w-full"
                    aria-disabled
                  >
                    {dict.donate.buy}
                    <StubBadge label={dict.donate.buyDisabled} />
                  </Button>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Discord — separate styled invite */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-20">
        <FadeIn inView y={24}>
          <DiscordInvite
            title={dict.home.discordTitle}
            lead={dict.home.discordLead}
            buttonLabel={dict.home.discordCta}
            soon={dict.common.comingSoon}
          />
        </FadeIn>
      </section>

      {/* Bottom CTA */}
      <FadeIn inView y={24}>
        <section className="border-t border-border bg-surface-2 py-12 md:py-24">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <div className="panel-solid mx-auto max-w-3xl rounded-2xl px-6 py-10 sm:px-8 sm:py-12 md:px-12 md:py-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                {dict.home.ctaTitle}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-muted sm:text-lg">
                {dict.home.ctaLead}
              </p>
              <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
                <Link
                  href={`/${locale}/news`}
                  className="glow-btn glow-btn-moss glow-ring-moss inline-flex w-full items-center justify-center rounded-xl border border-moss-light/30 bg-moss px-8 py-4 text-base font-bold tracking-wide hover:bg-moss-light sm:w-auto sm:text-lg"
                >
                  {dict.home.ctaNews}
                </Link>
                <Link
                  href={`/${locale}/donate`}
                  className="glow-btn glass inline-flex w-full items-center justify-center rounded-xl px-8 py-4 text-base font-bold tracking-wide hover:border-moss-light/40 sm:w-auto sm:text-lg"
                >
                  {dict.home.ctaDonate}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </FadeIn>
    </div>
  );
}
