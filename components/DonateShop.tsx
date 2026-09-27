"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { EtherDrop } from "@/components/EtherDrop";
import { PackRune } from "@/components/PackRune";
import { StubBadge } from "@/components/StubBadge";
import type { DonatePack } from "@/content/donate";
import type { SessionUser } from "@/lib/auth/types";
import { currencyForm } from "@/lib/currency-form";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import { AUTH_EVENT } from "@/lib/auth-event";

type Props = {
  locale: Locale;
  dict: Dictionary;
  packs: DonatePack[];
  initialUser?: SessionUser | null;
};

function pillClass(id: string) {
  return `pack-pill pack-pill-${id}`;
}

export function DonateShop({ locale, dict, packs, initialUser = null }: Props) {
  const featured = packs.find((p) => p.featured)?.id ?? packs[0]?.id ?? "";
  const [activeId, setActiveId] = useState(featured);
  const [user, setUser] = useState<SessionUser | null>(initialUser);
  const active = packs.find((p) => p.id === activeId) ?? packs[0];

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "same-origin", signal: controller.signal });
        if (!res.ok) return;
        const data = (await res.json()) as { user?: SessionUser | null };
        if (!controller.signal.aborted) setUser(data.user ?? null);
      } catch {
        /* keep SSR user */
      }
    }
    void load();
    function onAuth() {
      void load();
    }
    window.addEventListener(AUTH_EVENT, onAuth);
    return () => {
      controller.abort();
      window.removeEventListener(AUTH_EVENT, onAuth);
    };
  }, []);

  const etherWord = currencyForm(user?.balance ?? 0, locale, {
    one: dict.cabinet.currencyEtherOne,
    few: dict.cabinet.currencyEtherFew,
    many: dict.cabinet.currencyEtherMany,
  });

  return (
    <div className="pb-24" data-pack={active?.id ?? ""}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-xl">
          <h1 className="text-3xl font-bold md:text-4xl">{dict.donate.title}</h1>
          <p className="mt-2 text-muted">{dict.donate.lead}</p>
          <p className="mt-3 text-sm text-gold-light">{dict.donate.disclaimer}</p>
        </div>
        <div className="min-w-[16rem] rounded-2xl border border-border bg-surface-2/80 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ash">{dict.donate.balanceLabel}</p>
          {user ? (
            <p className="mt-2 flex items-center gap-2 text-lg text-foreground">
              <span className="font-mono tabular-nums">{user.balance}</span>
              <span className="ether-name text-sm">{etherWord}</span>
              <EtherDrop className="h-5 w-5" />
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted">{dict.donate.guestBalance}</p>
          )}
          <Link href={`/${locale}/cabinet`} className="mt-3 inline-flex text-sm text-gold-light hover:text-foreground">
            {dict.cabinet.headerTopUp}
          </Link>
        </div>
      </div>

      <div id="donate-packs" className="mt-12 flex flex-wrap justify-center gap-8 scroll-mt-28">
        {packs.map((pack) => {
          const on = pack.id === active?.id;
          return (
            <button
              key={pack.id}
              type="button"
              className="donate-shop-tile"
              data-on={on ? "1" : "0"}
              onClick={() => setActiveId(pack.id)}
            >
              <span className="donate-shop-face">
                <PackRune packId={pack.id} />
              </span>
              <span className={pillClass(pack.id)}>{pack.title[locale]}</span>
              <span className="text-sm text-muted">{pack.priceLabel[locale]}</span>
            </button>
          );
        })}
      </div>

      {active && (
        <div className="mt-14 space-y-8">
          <section>
            <h2 className="flex flex-wrap items-center gap-3 text-2xl font-bold">
              <span className={pillClass(active.id)}>{active.title[locale]}</span>
              {dict.donate.kitsTitle}
            </h2>
            <p className="mt-4 max-w-2xl rounded-2xl border border-border bg-surface-2/70 px-5 py-6 text-sm text-muted">
              {dict.donate.kitsSoon}
            </p>
          </section>
          <section>
            <h2 className="flex flex-wrap items-center gap-3 text-2xl font-bold">
              <span className={pillClass(active.id)}>{active.title[locale]}</span>
              {dict.donate.perksTitle}
            </h2>
            <p className="mt-4 max-w-2xl rounded-2xl border border-border bg-surface-2/70 px-5 py-6 text-sm text-muted">
              {dict.donate.perksSoon}
            </p>
          </section>
        </div>
      )}

      {active && (
        <div className="donate-shop-bar mt-12">
          <span className={pillClass(active.id)}>{active.title[locale]}</span>
          <span className="flex-1 text-xs text-ash sm:text-sm">{dict.donate.barHint}</span>
          <span className="font-mono text-base text-foreground">{active.priceLabel[locale]}</span>
          <Button variant="danger" disabled className="rounded-full" aria-disabled="true">
            {dict.donate.buy}
            <StubBadge label={dict.donate.buyDisabled} />
          </Button>
        </div>
      )}
    </div>
  );
}
