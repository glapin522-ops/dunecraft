"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "./Button";
import { SkinCapeStudio } from "./SkinCapeStudio";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import type { SessionUser } from "@/lib/auth/types";

const PlayerSkinView = dynamic(
  () => import("./PlayerSkinView").then((m) => m.PlayerSkinView),
  { ssr: false },
);

type Props = {
  user: SessionUser;
  dict: Dictionary;
  locale: Locale;
  onLogout: () => void;
  logoutBusy?: boolean;
  onUser?: (user: SessionUser) => void;
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
  onUser,
}: Props) {
  const c = dict.cabinet;
  const [hour, setHour] = useState<number | null>(null);
  const [studioOpen, setStudioOpen] = useState(false);
  const [viewUser, setViewUser] = useState(user);

  useEffect(() => {
    setHour(new Date().getHours());
  }, []);

  useEffect(() => {
    setViewUser(user);
  }, [user]);

  const greeting = useMemo(() => {
    if (hour === null) return c.welcome;
    return String(c[greetingKeyForHour(hour)]);
  }, [hour, c]);

  const level = viewUser.level ?? 1;
  const vipLevel = viewUser.vipLevel ?? 0;
  const balance = viewUser.balance ?? 0;
  const vipDisplay = vipLevel <= 0 ? c.statsVipNone : `VIP ${vipLevel}`;
  const donateHref = `/${locale}/donate`;

  function handleUser(next: SessionUser) {
    setViewUser(next);
    onUser?.(next);
  }

  return (
    <section className="flex min-w-0 flex-col gap-4 min-[56rem]:gap-5">
      <header className="min-w-0">
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl min-[56rem]:text-3xl">
          {greeting}, {viewUser.username}!
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

      <div className="grid min-w-0 gap-4 min-[56rem]:grid-cols-[minmax(10rem,0.34fr)_minmax(0,1fr)] min-[56rem]:items-stretch min-[56rem]:gap-4 min-[72rem]:gap-6">
        <div
          id="cabinet-model-viewport"
          className="order-1 relative flex min-h-[16rem] w-full flex-col overflow-hidden rounded-3xl border border-[color:var(--glass-stroke-gold)] bg-surface shadow-[var(--glow-gold-sm)] min-[56rem]:order-none min-[56rem]:min-h-0 min-[56rem]:h-full"
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,color-mix(in_srgb,var(--moss)_45%,transparent),transparent_70%)]"
            aria-hidden
          />
          <div className="relative z-[1] min-h-0 flex-1">
            <PlayerSkinView
              skinUrl={viewUser.skinUrl}
              capeUrl={viewUser.capeUrl}
              className="h-full min-h-[16rem] min-[56rem]:min-h-full"
            />
          </div>
          <p className="relative z-[1] px-3 pb-3 text-center text-[10px] leading-snug text-ash md:text-xs">
            {c.skinHintLive}
          </p>
        </div>

        <div className="order-2 flex min-w-0 flex-col gap-4 min-[56rem]:order-none">
          <div className="panel-solid relative min-w-0 overflow-hidden rounded-3xl p-4 sm:p-5">
            <p className="text-xs uppercase tracking-wide text-ash">{c.yourGroup}</p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center rounded-full border border-border bg-surface px-4 py-1.5 text-sm font-bold uppercase tracking-wider text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                {roleLabel(dict, viewUser.role)}
              </span>
              {viewUser.role === "creator" ? (
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
            <div className="panel-solid flex min-w-0 flex-col items-center rounded-3xl p-4 sm:p-5">
              <div className="relative flex h-24 w-24 items-center justify-center">
                <div className="pointer-events-none absolute inset-[-20%] rounded-full bg-[conic-gradient(from_180deg,color-mix(in_srgb,var(--ember)_50%,transparent),color-mix(in_srgb,var(--gold)_35%,transparent),color-mix(in_srgb,var(--ember)_40%,transparent))] opacity-70 blur-md" aria-hidden />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--ember)_55%,var(--border))] bg-surface shadow-[0_0_24px_color-mix(in_srgb,var(--ember)_35%,transparent)]">
                  <svg width="36" height="52" viewBox="0 0 24 40" fill="none" aria-hidden className="skin-rune text-[color:var(--ember)]">
                    <path d="M12 2v36" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="miter" />
                    <path d="M12 14l6 6-6 6-6-6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="miter" />
                    <path d="M6 9l4 4M18 27l-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="miter" />
                  </svg>
                </div>
              </div>
              <button
                type="button"
                className="glow-btn btn-fill-ember mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold"
                onClick={() => setStudioOpen(true)}
              >
                {c.setupSkinCape}
              </button>
            </div>

            <div className="panel-solid flex min-w-0 flex-col rounded-3xl p-4 sm:p-5">
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold tabular-nums text-foreground">{balance}</span>
                <span className="mb-1 inline-flex h-7 w-7 items-center justify-center rounded-md border border-[color-mix(in_srgb,var(--accent-balance)_50%,var(--border))] bg-[color-mix(in_srgb,var(--accent-balance)_14%,var(--surface))] text-sm shadow-[var(--glow-balance-sm)]" aria-hidden>
                  💎
                </span>
              </div>
              <p className="mt-1 text-sm text-ash">{c.balanceNow}</p>
              <div className="mt-auto pt-4">
                <Link
                  href={donateHref}
                  className="glow-btn btn-fill-balance inline-flex w-full items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold"
                >
                  {c.topUpBalance}
                </Link>
              </div>
            </div>
          </div>

          <Button variant="secondary" className="w-full rounded-2xl py-3" disabled={logoutBusy} onClick={onLogout}>
            {c.logoutAccount}
          </Button>
        </div>
      </div>

      <SkinCapeStudio
        user={viewUser}
        dict={dict}
        open={studioOpen}
        onClose={() => setStudioOpen(false)}
        onUser={handleUser}
      />
    </section>
  );
}
