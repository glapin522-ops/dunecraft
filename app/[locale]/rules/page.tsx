import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageAtmosphere } from "@/components/PageAtmosphere";
import { Card } from "@/components/Card";
import { ruleSections } from "@/content/rules";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ru";
  const dict = getDictionary(locale);
  return { title: dict.rules.title, description: dict.rules.lead };
}

export default async function RulesPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw;
  const dict = getDictionary(locale);

  return (
    <PageAtmosphere particlesId="dunecraft-rules-mist">
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold">{dict.rules.title}</h1>
      <p className="mt-2 max-w-2xl text-muted">{dict.rules.lead}</p>

      <nav aria-label="Rules" className="mt-8 flex flex-wrap gap-2">
        {ruleSections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm text-ash-light hover:text-foreground"
          >
            {s.title[locale]}
          </a>
        ))}
      </nav>

      <div className="mt-10 space-y-6">
        {ruleSections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-24">
            <Card>
              <h2 className="text-xl font-semibold">{section.title[locale]}</h2>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-ash-light">
                {section.items[locale].map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </Card>
          </section>
        ))}
      </div>
    </div>
    </PageAtmosphere>
  );
}
