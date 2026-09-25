import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FaqClient } from "@/components/FaqClient";
import { PageAtmosphere } from "@/components/PageAtmosphere";
import { knowledgeEntries } from "@/content/knowledge";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ru";
  const dict = getDictionary(locale);
  return { title: dict.faq.title, description: dict.faq.lead };
}

export default async function FaqPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw;
  const dict = getDictionary(locale);

  return (
    <PageAtmosphere particlesId="dunecraft-faq-mist">
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <h1 className="text-3xl font-bold">{dict.faq.title}</h1>
        <p className="mt-2 max-w-2xl text-muted">{dict.faq.lead}</p>
        <FaqClient locale={locale} dict={dict} entries={knowledgeEntries} />
      </div>
    </PageAtmosphere>
  );
}
