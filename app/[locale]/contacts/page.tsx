import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DiscordInvite } from "@/components/DiscordInvite";
import { StubBadge } from "@/components/StubBadge";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ru";
  const dict = getDictionary(locale);
  return { title: dict.contacts.title, description: dict.contacts.lead };
}

export default async function ContactsPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const dict = getDictionary(raw);

  const other = [
    { key: "email" as const, label: dict.contacts.email },
    { key: "telegram" as const, label: dict.contacts.telegram },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold">{dict.contacts.title}</h1>
      <p className="mt-2 max-w-2xl text-muted">{dict.contacts.lead}</p>

      <div className="mt-10">
        <DiscordInvite
          title={dict.contacts.discord}
          lead={dict.contacts.discordLead}
          buttonLabel={dict.home.discordCta}
          soon={dict.contacts.soon}
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {other.map((ch) => (
          <Card key={ch.key}>
            <h2 className="text-lg font-semibold">{ch.label}</h2>
            <p className="mt-2 text-sm text-muted">{dict.contacts.soon}</p>
            <Button variant="secondary" disabled className="mt-4" aria-disabled>
              {ch.label}
              <StubBadge label={dict.contacts.soon} />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
