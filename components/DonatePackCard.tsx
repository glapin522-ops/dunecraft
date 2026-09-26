import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { StubBadge } from "@/components/StubBadge";
import type { DonatePack } from "@/content/donate";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";

type Props = {
  pack: DonatePack;
  locale: Locale;
  dict: Dictionary;
  compact?: boolean;
};

export function DonatePackCard({ pack, locale, dict, compact = false }: Props) {
  return (
    <div className="donate-slide h-full">
      <Card
        className={`donate-slide-card ${compact ? "p-7 md:p-8" : ""} ${
          pack.featured ? "border-gold/40 glow-ring-gold" : ""
        }`}
      >
        <p className={`${compact ? "text-base" : "text-sm font-medium"} text-gold-light`}>
          {pack.priceLabel[locale]}
        </p>
        <h2 className={`mt-1 font-semibold ${compact ? "text-xl md:text-2xl" : "text-xl"}`}>
          {pack.title[locale]}
        </h2>
        <p className={`mt-3 text-muted ${compact ? "text-base leading-relaxed" : "text-sm"}`}>
          {pack.description[locale]}
        </p>
        <Button variant="danger" disabled className="mt-6 w-full" aria-disabled="true">
          {dict.donate.buy}
          <StubBadge label={dict.donate.buyDisabled} />
        </Button>
      </Card>
      <span className="donate-slide-go" aria-hidden>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 12h12m0 0l-5-5m5 5l-5 5"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  );
}
