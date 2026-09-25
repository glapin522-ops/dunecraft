import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CabinetClient } from "@/components/CabinetClient";
import { PageAtmosphere } from "@/components/PageAtmosphere";
import { getSession } from "@/lib/auth/session";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ru";
  const dict = getDictionary(locale);
  return { title: dict.cabinet.title, description: dict.cabinet.lead };
}

export default async function CabinetPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw;
  const dict = getDictionary(locale);
  const user = await getSession();

  return (
    <PageAtmosphere particlesId="dunecraft-cabinet-mist">
      <div className="mx-auto max-w-6xl px-3 py-8 sm:px-4 md:py-12 xl:py-16">
        <h1 className="text-2xl font-bold sm:text-3xl">{dict.cabinet.title}</h1>
        <p className="mt-2 max-w-2xl text-muted">{dict.cabinet.lead}</p>
        <div className="mt-8 xl:mt-10">
          <CabinetClient dict={dict} locale={locale} initialUser={user} />
        </div>
      </div>
    </PageAtmosphere>
  );
}
