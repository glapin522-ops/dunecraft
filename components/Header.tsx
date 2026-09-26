"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/dictionaries";
import type { SessionUser } from "@/lib/auth/types";
import { currencyForm } from "@/lib/currency-form";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { RoleBadge } from "./RoleBadge";
import { EtherDrop } from "./EtherDrop";
import { StubBadge } from "./StubBadge";

type Props = {
  locale: Locale;
  dict: Dictionary;
};

const navKeys = [
  "home",
  "news",
  "donate",
  "rules",
  "faq",
  "contacts",
] as const;

function DonateRune({ size = 40 }: { size?: number }) {
  return (
    <span className="donate-bob" aria-hidden>
      <svg viewBox="0 0 36 72" width={Math.round(size * 0.5)} height={size} className="donate-rune">
        <path pathLength={100} d="M18 4 V68" />
        <path pathLength={100} d="M18 26 L28 36 L18 46 L8 36 Z" />
        <path pathLength={100} d="M9 16 L16 22" />
        <path pathLength={100} d="M27 50 L20 56" />
      </svg>
    </span>
  );
}

function CabinetSeal() {
  return (
    <svg viewBox="0 0 24 24" className="cabinet-seal" width="16" height="16" aria-hidden>
      <circle cx="12" cy="12" r="8" pathLength={100} />
      <circle cx="12" cy="12" r="2.2" />
    </svg>
  );
}

function hrefFor(locale: Locale, key: (typeof navKeys)[number]) {
  if (key === "home") return `/${locale}`;
  return `/${locale}/${key}`;
}

function isActive(pathname: string, locale: Locale, key: (typeof navKeys)[number]) {
  const href = hrefFor(locale, key);
  if (key === "home") return pathname === href || pathname === `/${locale}/`;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function CabinetEntry({
  locale,
  dict,
  className = "",
  onNavigate,
}: {
  locale: Locale;
  dict: Dictionary;
  className?: string;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={`/${locale}/cabinet`}
      onClick={onNavigate}
      aria-label={dict.nav.cabinet}
      title={dict.nav.cabinet}
      className={`cabinet-btn inline-flex max-w-[14rem] items-center justify-center gap-2 px-3.5 py-2 text-sm font-bold tracking-wide min-w-[6.75rem] ${className}`}
    >
      <CabinetSeal />
      <span className="sr-only">{dict.nav.cabinet}</span>
    </Link>
  );
}

function DownloadStub({ dict }: { dict: Dictionary }) {
  return (
    <button type="button" disabled aria-disabled="true" className="header-download hidden sm:inline-flex" aria-label={dict.home.launcherCta}>
      {dict.cabinet.headerDownload}
      <StubBadge label={dict.common.comingSoon} />
    </button>
  );
}

function AccountMenu({
  locale,
  dict,
  user,
  onLogout,
}: {
  locale: Locale;
  dict: Dictionary;
  user: SessionUser;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const etherWord = currencyForm(user.balance, locale, {
    one: dict.cabinet.currencyEtherOne,
    few: dict.cabinet.currencyEtherFew,
    many: dict.cabinet.currencyEtherMany,
  });

  function cancelClose() {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }
  function show() {
    cancelClose();
    setOpen(true);
  }
  function hideSoon() {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpen(false), 120);
  }

  return (
    <div className="relative hidden sm:block" onMouseEnter={show} onMouseLeave={hideSoon}>
      <button type="button" className="account-chip" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)} onFocus={show}>
        <CabinetSeal />
        <span className="min-w-0 truncate">{user.username}</span>
        <span aria-hidden className="text-[0.65rem] text-ash-light">▾</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-[80] w-64 pt-2" role="menu">
          <div className="account-menu-card">
            <p className="truncate font-display text-base font-bold text-foreground">{user.username}</p>
            <div className="mt-2">
              <RoleBadge role={user.role} dict={dict} />
            </div>
            <p className="mt-3 flex items-center gap-2 text-sm text-foreground">
              <span className="font-mono tabular-nums">{user.balance}</span>
              <span className="ether-name text-xs">{etherWord}</span>
              <EtherDrop className="h-4 w-4" />
            </p>
            <Link href={`/${locale}/cabinet`} role="menuitem" className="account-menu-link mt-3" onClick={() => setOpen(false)}>
              {dict.nav.cabinet}
            </Link>
            <button type="button" role="menuitem" className="account-menu-btn" onClick={onLogout}>
              {dict.cabinet.headerLogout}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Header({ locale, dict }: Props) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const pathname = usePathname() || `/${locale}`;

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "same-origin", signal: controller.signal });
        if (!res.ok) {
          setUser(null);
          return;
        }
        const data = (await res.json()) as { user?: SessionUser | null };
        setUser(data.user ?? null);
      } catch {
        if (!controller.signal.aborted) setUser(null);
      }
    })();
    return () => controller.abort();
  }, [pathname]);

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    } catch {
      /* ignore */
    }
    setUser(null);
  }

  return (
    <header className="sticky top-0 z-50 overflow-visible border-b border-border bg-black/95 backdrop-blur-md">
      <div className="mx-auto flex min-w-0 max-w-6xl items-center justify-between gap-3 overflow-visible px-4 py-4 sm:py-5">
        <Link href={`/${locale}`} className="group flex min-w-0 shrink items-center gap-3 sm:gap-3.5">
          <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gold/35 bg-void shadow-[0_0_22px_rgba(155,126,201,0.32)] transition group-hover:border-gold/60 group-hover:shadow-[0_0_28px_rgba(201,168,239,0.45)] sm:h-16 sm:w-16">
            <Image src="/logo-dc.png" alt="" width={64} height={64} sizes="64px" quality={80} className="h-full w-full object-contain" priority />
          </span>
          <span className="min-w-0 truncate font-display text-lg font-bold tracking-wide text-foreground transition group-hover:text-gold-light sm:text-xl">
            DuneCraft
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {navKeys.map((key) => {
            const active = isActive(pathname, locale, key);
            if (key === "donate") {
              return (
                <Link key={key} href={hrefFor(locale, key)} aria-current={active ? "page" : undefined} className={`donate-link rounded-lg px-3 py-2 text-sm font-bold tracking-wide ${active ? "donate-link-active bg-moss/30" : "hover:bg-surface-2/90"}`}>
                  <DonateRune size={30} />
                  {dict.nav[key]}
                </Link>
              );
            }
            return (
              <Link key={key} href={hrefFor(locale, key)} aria-current={active ? "page" : undefined} className={`rounded-lg px-3 py-2 text-sm font-bold tracking-wide transition-colors ${active ? "nav-live" : "text-ash-light hover:bg-surface-2/90 hover:text-foreground"}`}>
                {dict.nav[key]}
              </Link>
            );
          })}
        </nav>

        <div className="relative z-50 flex shrink-0 items-center gap-2 overflow-visible sm:gap-2.5">
          <LocaleSwitcher locale={locale} labels={{ ru: dict.common.localeRu, en: dict.common.localeEn }} />
          {user ? (
            <AccountMenu locale={locale} dict={dict} user={user} onLogout={() => void logout()} />
          ) : (
            <CabinetEntry locale={locale} dict={dict} className="hidden sm:inline-flex" />
          )}
          <DownloadStub dict={dict} />
          <button type="button" className="inline-flex items-center justify-center rounded-lg border border-border bg-surface-2 p-2.5 text-ash-light hover:border-gold/35 hover:text-gold-light lg:hidden" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen((v) => !v)}>
            <span className="sr-only">Menu</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" className="border-t border-border bg-surface px-4 py-3 lg:hidden" aria-label="Mobile">
          <ul className="flex flex-col gap-1">
            {navKeys.map((key) => {
              const active = isActive(pathname, locale, key);
              return (
                <li key={key}>
                  <Link
                    href={hrefFor(locale, key)}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold tracking-wide ${key === "donate" ? "text-ember" : active ? "nav-live" : "text-ash-light hover:bg-surface-2 hover:text-foreground"}`}
                    onClick={() => setOpen(false)}
                  >
                    {key === "donate" && <DonateRune size={28} />}
                    {dict.nav[key]}
                  </Link>
                </li>
              );
            })}
            <li className="mt-2">
              {user ? (
                <div className="space-y-2 rounded-xl border border-border bg-surface-2 p-3">
                  <p className="truncate font-bold">{user.username}</p>
                  <RoleBadge role={user.role} dict={dict} />
                  <Link href={`/${locale}/cabinet`} className="account-menu-link" onClick={() => setOpen(false)}>
                    {dict.nav.cabinet}
                  </Link>
                  <button type="button" className="account-menu-btn" onClick={() => void logout()}>
                    {dict.cabinet.headerLogout}
                  </button>
                </div>
              ) : (
                <CabinetEntry locale={locale} dict={dict} className="w-full max-w-none" onNavigate={() => setOpen(false)} />
              )}
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
