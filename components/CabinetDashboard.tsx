"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "./Button";
import { ModelViewportStub } from "./ModelViewportStub";
import { StubBadge } from "./StubBadge";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import type { SessionUser } from "@/lib/auth/types";

type Props = {
  user: SessionUser;
  dict: Dictionary;
  locale: Locale;
  onLogout: () => void;
  logoutBusy?: boolean;
};

function greetingKeyForHour(hour: number): keyof Dictionary["cabinet"] {
  if (hour >= 5 && hour <= 11) return "greetMorning";
  if (hour >= 12 && hour <= 17) return "greetAfternoon";
  if (hour >= 18 && hour <= 22) return "greetEvening";
  return "greetNight";
}

function roleLabel(dict: Dictionary, role: SessionUser["role"]): string {
  const c = dict.cabinet;
  if (role === "creator") return c.roleCreator;
  if (role === "editor") return c.roleEditor;
  return c.rolePlayer;
}

export function CabinetDashboard({
  user,
  dict,
  locale,
  onLogout,
  logoutBusy = false,
}: Props) {
  const c = dict.cabinet;
  const soon = dict.common.comingSoon;
  const [hour, setHour] = useState<number | null>(null);
  const [skinNote, setSkinNote] = useState(false);

  useEffect(() => {
    setHour(new Date().getHours());
  }, []);

  const greeting = useMemo(() => {
    if (hour === null) return c.welcome;
    return String(c[greetingKeyForHour(hour)]);
  }, [hour, c]);

  const level = user.level ?? 1;
  const vipLevel = user.vipLevel ?? 0;
  const balance = user.balance ?? 0;
  const vipDisplay = vipLevel <= 0 ? c.statsVipNone : `VIP ${vipLevel}`;
  const donateHref = `/${locale}/donate`;

  return (
    <section className="flex min-w-0 flex-col gap-4 min-[56rem]:gap-5">
      {/* Greeting stays above the skin+cards row (split: where the tall skin used to start) */}
      <header className="min-w-0">
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl min-[56rem]:text-3xl">
          {greeting}, {user.username}!
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-border bg-surface-3 px-2.5 py-0.5 text-xs font-medium text-ash-light">
            {c.statsLevel} {level}
          </span>
          <span className="inline-flex items-center rounded-full border border-gold/40 bg-[color-mix(in_srgb,var(--gold)_14%,var(--surface-3))] px-2.5 py-0.5 text-xs font-medium text-gold-light">
            {c.statsVip}: {vipDisplay}
          </span>
        </div>
      </header>

      {/* Skin aligned with group/balance cards — same top edge in split */}
      <div className="grid min-w-0 gap-4 min-[56rem]:grid-cols-[minmax(10rem,0.34fr)_minmax(0,1fr)] min-[56rem]:items-stretch min-[56rem]:gap-4 min-[72rem]:gap-6">
        <ModelViewportStub
          id="cabinet-model-viewport"
          tall
          placeholder={c.statsModelPlaceholder}
          hint={c.statsModelHint}
          className="order-1 h-full min-[56rem]:order-none"
        />

        <div className="order-2 flex min-w-0 flex-col gap-4 min-[56rem]:order-none">
          <div className="panel-solid relative min-w-0 overflow-hidden rounded-3xl p-4 sm:p-5">
            <div
              className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rotate-12 rounded-lg border border-border bg-surface-3 opacity-50"
              aria-hidden
            />
            <p className="text-xs uppercase tracking-wide text-ash">{c.yourGroup}</p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center rounded-full border border-border bg-surface px-4 py-1.5 text-sm font-bold uppercase tracking-wider text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                {roleLabel(dict, user.role)}
              </span>
              {user.role === "creator" ? (
                <p className="max-w-xs text-sm text-moss-light sm:text-right">
                  {c.upgradeGroupMax}
                </p>
              ) : (
                <Link
                  href={donateHref}
                  className="glow-btn glow-btn-upgrade inline-flex items-center justify-center gap-1 rounded-2xl border border-[color-mix(in_srgb,var(--accent-upgrade)_45%,var(--border))] bg-[color-mix(in_srgb,var(--accent-upgrade)_16%,var(--surface-3))] px-4 py-2 text-sm font-semibold text-[color:var(--accent-upgrade)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors hover:bg-[color-mix(in_srgb,var(--accent-upgrade)_26%,var(--surface-3))]"
                >
                  {c.upgradeGroup}
                </Link>
              )}
            </div>
          </div>

          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <div className="panel-solid flex min-w-0 flex-col rounded-3xl p-4 sm:p-5">
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold tabular-nums text-foreground">
                  {balance}
                </span>
                <span
                  className="mb-1 inline-flex h-7 w-7 items-center justify-center rounded-md border border-[color-mix(in_srgb,var(--accent-balance)_50%,var(--border))] bg-[color-mix(in_srgb,var(--accent-balance)_14%,var(--surface))] text-sm shadow-[var(--glow-balance-sm)]"
                  aria-hidden
                  title="💎"
                >
                  💎
                </span>
              </div>
              <p className="mt-1 text-sm text-ash">{c.balanceNow}</p>
              <div className="mt-auto pt-4">
                <Link
                  href={donateHref}
                  className="glow-btn glow-btn-balance glow-ring-balance inline-flex w-full items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--accent-balance)_45%,var(--border))] bg-[color-mix(in_srgb,var(--accent-balance)_18%,var(--surface-3))] px-4 py-2.5 text-sm font-semibold text-[color:var(--accent-balance)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-colors hover:bg-[color-mix(in_srgb,var(--accent-balance)_28%,var(--surface-3))]"
                >
                  {c.topUpBalance}
                </Link>
              </div>
            </div>

            <div className="panel-solid flex min-w-0 flex-col items-center rounded-3xl p-4 sm:p-5">
              <div className="relative flex h-24 w-24 items-center justify-center">
                <div
                  className="pointer-events-none absolute inset-[-20%] rounded-full bg-[conic-gradient(from_180deg,color-mix(in_srgb,var(--moss-light)_55%,transparent),color-mix(in_srgb,var(--gold)_50%,transparent),color-mix(in_srgb,var(--accent-skin)_45%,transparent),color-mix(in_srgb,var(--moss-light)_55%,transparent))] opacity-60 blur-md"
                  aria-hidden
                />
                <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-[color-mix(in_srgb,var(--accent-skin)_45%,var(--border))] bg-surface shadow-[var(--glow-skin-sm)]">
                  <div
                    className="h-10 w-10 rounded-[2px] border border-gold/45 bg-surface-3"
                    aria-hidden
                  />
                </div>
              </div>
              <button
                type="button"
                className="glow-btn glow-btn-skin mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--accent-skin)_45%,var(--border))] bg-[color-mix(in_srgb,var(--accent-skin)_16%,var(--surface-3))] px-4 py-2.5 text-sm font-semibold text-[color:var(--accent-skin)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-colors hover:bg-[color-mix(in_srgb,var(--accent-skin)_26%,var(--surface-3))]"
                aria-describedby="skin-cape-stub-note"
                onClick={() => {
                  setSkinNote(true);
                  const el = document.getElementById("cabinet-model-viewport");
                  el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }}
              >
                {c.setupSkinCape}
                <StubBadge label={soon} />
              </button>
              <p
                id="skin-cape-stub-note"
                className={`mt-2 text-center text-[11px] text-ash ${skinNote ? "text-moss-light" : ""}`}
                role="status"
              >
                {skinNote ? c.skinStubNote : c.statsModelHint}
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            className="w-full rounded-2xl py-3"
            disabled={logoutBusy}
            onClick={onLogout}
          >
            {c.logoutAccount}
          </Button>
        </div>
      </div>
    </section>
  );
}
