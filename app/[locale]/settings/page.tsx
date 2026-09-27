import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageAtmosphere } from "@/components/PageAtmosphere";
import { SettingsClient } from "@/components/SettingsClient";
import { getSession } from "@/lib/auth/session";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ru";
  const dict = getDictionary(locale);
  return { title: dict.settings.title, description: dict.settings.buttonsLead };
}

export default async function SettingsPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw;
  const dict = getDictionary(locale);
  const user = await getSession();

  return (
    <PageAtmosphere particlesId="dunecraft-settings-mist">
      <div className="mx-auto max-w-6xl px-3 py-8 sm:px-4 md:py-12 xl:py-16">
        <h1 className="text-2xl font-bold sm:text-3xl">{dict.settings.title}</h1>
        <SettingsClient dict={dict} locale={locale} initialUser={user} />
      </div>
    </PageAtmosphere>
  );
}
