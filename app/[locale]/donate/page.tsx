import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DonateBg } from "@/components/DonateBg";
import { DonatePackCard } from "@/components/DonatePackCard";
import { donatePacks } from "@/content/donate";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ru";
  const dict = getDictionary(locale);
  return { title: dict.donate.title, description: dict.donate.lead };
}

export default async function DonatePage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw;
  const dict = getDictionary(locale);

  return (
    <div className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[#0a0812]">
        <DonateBg />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            "linear-gradient(180deg, #0a0812cc 0%, #0a081255 20%, #0a081244 55%, #0a0812e8 100%)",
            "radial-gradient(ellipse 42% 36% at 12% 55%, #67b8ff12, transparent 64%)",
            "radial-gradient(ellipse 95% 80% at 50% 60%, transparent 35%, #0a081299 100%)",
          ].join(", "),
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 py-12 md:py-16">
        <h1 className="text-3xl font-bold md:text-4xl">{dict.donate.title}</h1>
        <p className="mt-2 max-w-2xl text-muted">{dict.donate.lead}</p>
        <p className="mt-3 text-sm text-gold-light">{dict.donate.disclaimer}</p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {donatePacks.map((pack) => (
            <DonatePackCard key={pack.id} pack={pack} locale={locale} dict={dict} />
          ))}
        </div>
      </div>
    </div>
  );
}
