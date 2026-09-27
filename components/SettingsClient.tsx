"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import type { SessionUser } from "@/lib/auth/types";
import {
  DEFAULT_CTA,
  STORAGE_KEY,
  applyCtaTheme,
  deriveCtaPalette,
  normalizeHex,
  readStoredCta,
} from "@/lib/button-theme";
import { ColorPicker } from "@/components/ColorPicker";
import { Button } from "@/components/Button";
import { AccountSecurityClient } from "@/components/AccountSecurityClient";

type PanelId = "buttons" | "skin" | "account";

type Props = {
  dict: Dictionary;
  locale: Locale;
  initialUser: SessionUser | null;
};

export function SettingsClient({ dict, locale, initialUser }: Props) {
  const s = dict.settings;
  const [panel, setPanel] = useState<PanelId>("buttons");
  const [draft, setDraft] = useState(DEFAULT_CTA);
  const [applied, setApplied] = useState(DEFAULT_CTA);

  useEffect(() => {
    const stored = readStoredCta();
    setDraft(stored);
    setApplied(stored);
  }, []);

  const nav = useMemo(
    () =>
      [
        { id: "buttons" as const, label: s.navButtons, soon: false },
        { id: "account" as const, label: s.navAccount, soon: false },
        { id: "skin" as const, label: s.navSoonSkin, soon: true },
      ] as const,
    [s.navButtons, s.navAccount, s.navSoonSkin],
  );

  const draftPalette = useMemo(
    () => deriveCtaPalette(normalizeHex(draft) ?? DEFAULT_CTA),
    [draft],
  );

  const previewStyle = {
    ["--cta" as string]: draftPalette.cta,
    ["--cta-mid" as string]: draftPalette.mid,
    ["--cta-deep" as string]: draftPalette.deep,
    ["--cta-text" as string]: draftPalette.text,
  } as CSSProperties;

  function apply() {
    const hex = normalizeHex(draft) ?? DEFAULT_CTA;
    applyCtaTheme(hex);
    try {
      window.localStorage.setItem(STORAGE_KEY, hex);
    } catch {
      /* ignore quota / private mode */
    }
    setDraft(hex);
    setApplied(hex);
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] xl:mt-10">
      <aside className="rounded-2xl border border-[color-mix(in_srgb,var(--gold)_28%,transparent)] bg-[color-mix(in_srgb,var(--surface-2)_92%,transparent)] p-2">
        <nav className="flex flex-col gap-1" aria-label={s.title}>
          {nav.map((item) => {
            const active = panel === item.id && !item.soon;
            return (
              <button
                key={item.id}
                type="button"
                disabled={item.soon}
                onClick={() => {
                  if (!item.soon) setPanel(item.id);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold tracking-wide transition-colors ${
                  active
                    ? "bg-[color-mix(in_srgb,var(--gold)_18%,transparent)] text-foreground shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--gold)_40%,transparent)]"
                    : item.soon
                      ? "cursor-not-allowed text-muted/70"
                      : "text-ash-light hover:bg-surface-3/70 hover:text-foreground"
                }`}
              >
                <span>{item.label}</span>
                {item.soon ? (
                  <span className="text-[0.65rem] font-bold uppercase tracking-wider text-muted">
                    {s.comingSoon}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </aside>

      {panel === "account" ? (
        <AccountSecurityClient dict={dict} locale={locale} title={s.accountTitle} initialUser={initialUser} />
      ) : (
        <section className="rounded-2xl border border-[color-mix(in_srgb,var(--gold)_28%,transparent)] bg-[color-mix(in_srgb,var(--surface-2)_94%,transparent)] p-5 sm:p-6 md:p-8">
          {panel === "buttons" ? (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="font-display text-xl font-bold tracking-wide text-foreground sm:text-2xl">
                  {s.buttonsTitle}
                </h2>
                <p className="mt-2 max-w-xl text-sm text-muted sm:text-base">{s.buttonsLead}</p>
              </div>

              <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
                <ColorPicker value={draft} onChange={setDraft} />

                <div className="flex min-w-[12rem] flex-col gap-4">
                  <div style={previewStyle}>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-ash-light">
                      {s.preview}
                    </p>
                    <button type="button" className="account-fill-btn pointer-events-none">
                      {s.preview}
                    </button>
                    <div className="mt-3">
                      <Button variant="gold" size="md" disabled className="pointer-events-none">
                        {s.preview}
                      </Button>
                    </div>
                    <p className="mt-2 font-mono text-xs text-muted">{applied}</p>
                  </div>

                  <Button type="button" variant="gold" size="md" onClick={apply}>
                    {s.apply}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted">{s.comingSoon}</p>
          )}
        </section>
      )}
    </div>
  );
}
