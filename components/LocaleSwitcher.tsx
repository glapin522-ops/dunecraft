"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { locales } from "@/lib/i18n";

type Props = {
  locale: Locale;
  labels: { ru: string; en: string };
};

export function LocaleSwitcher({ locale, labels }: Props) {
  const pathname = usePathname() || "/";
  const segments = pathname.split("/");
  const rest = segments.slice(2).join("/");

  return (
    <div
      className="inline-flex rounded-lg border border-border bg-surface-2 p-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
      role="group"
      aria-label="Language"
    >
      {locales.map((loc) => {
        const href = rest ? `/${loc}/${rest}` : `/${loc}`;
        const active = loc === locale;
        return (
          <Link
            key={loc}
            href={href}
            hrefLang={loc}
            lang={loc}
            aria-current={active ? "true" : undefined}
            className={`rounded-md px-2.5 py-1.5 text-xs font-bold tracking-wider transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gold ${
              active
                ? "bg-gold/20 text-gold-light shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                : "text-ash hover:bg-surface-3/80 hover:text-foreground"
            }`}
          >
            {labels[loc]}
          </Link>
        );
      })}
    </div>
  );
}
