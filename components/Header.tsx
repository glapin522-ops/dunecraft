"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/dictionaries";
import type { SessionUser } from "@/lib/auth/types";
import { currencyForm } from "@/lib/currency-form";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { RoleBadge } from "./RoleBadge";
import { EtherDrop } from "./EtherDrop";
import { StubBadge } from "./StubBadge";
import { SkinHead } from "./SkinHead";
import { AUTH_EVENT } from "@/lib/auth-event";

type Props = {
  locale: Locale;
  dict: Dictionary;
};

const navKeys = ["home", "news", "donate", "faq"] as const;
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
  const label = dict.cabinet.login;
  return (
    <Link
      href={`/${locale}/cabinet`}
      onClick={onNavigate}
      aria-label={label}
      title={label}
      className={`header-login-btn inline-flex max-w-[14rem] items-center justify-center gap-2 px-3.5 py-2 text-sm font-bold tracking-wide min-w-[6.75rem] ${className}`}
    >
      {label}
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

function AccountCard({
  locale,
  dict,
  user,
  onLogout,
  onClose,
}: {
  locale: Locale;
  dict: Dictionary;
  user: SessionUser;
  onLogout: () => void;
  onClose?: () => void;
}) {
  const etherWord = currencyForm(user.balance, locale, {
    one: dict.cabinet.currencyEtherOne,
    few: dict.cabinet.currencyEtherFew,
    many: dict.cabinet.currencyEtherMany,
  });
  return (
    <div className="account-menu-card">
      <div className="account-head">
        <span className="account-head-mark">
          <SkinHead src={user.skinUrl} size={36} />
        </span>
        <div className="min-w-0">
          <Link href={`/${locale}/cabinet`} className="account-head-nick truncate font-display text-base font-bold text-foreground" onClick={onClose}>
            {user.username}
          </Link>
          <div className="mt-1">
            <RoleBadge role={user.role} dict={dict} />
          </div>
        </div>
      </div>
      <div className="account-row">
        <p className="flex min-w-0 items-center gap-2 text-sm text-foreground">
          <span className="font-mono tabular-nums">{user.balance}</span>
          <span className="ether-name text-xs">{etherWord}</span>
          <EtherDrop className="h-4 w-4" />
        </p>
        <Link href={`/${locale}/donate`} className="account-fill-btn" onClick={onClose}>
          {dict.cabinet.headerTopUp}
        </Link>
      </div>
      <Link href={`/${locale}/settings`} className="account-menu-link" onClick={onClose}>
        {dict.settings.menuLabel}
      </Link>
      <button type="button" className="account-menu-btn" onClick={onLogout}>
        {dict.cabinet.headerLogout}
      </button>
    </div>
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
      <div className="account-chip">
        <button
          type="button"
          className="account-chip-link min-w-0"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={dict.nav.cabinet}
          onClick={() => setOpen((v) => !v)}
        >
          <SkinHead src={user.skinUrl} size={26} />
          <span className="min-w-0 truncate">{user.username}</span>
        </button>
        <button
          type="button"
          className="account-chip-toggle"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={open ? "Close account menu" : "Open account menu"}
          onClick={() => setOpen((v) => !v)}
          onFocus={show}
        >
          <span aria-hidden className="text-[0.7rem] text-ash-light">{open ? "\u25b2" : "\u25bc"}</span>
        </button>
      </div>
      {open && (
        <div className="absolute right-0 top-full z-[80] w-[17.5rem] pt-2" role="menu">
          <AccountCard locale={locale} dict={dict} user={user} onLogout={onLogout} onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

export function Header({ locale, dict }: Props) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const router = useRouter();
  const pathname = usePathname() || `/${locale}`;

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
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
  }, [pathname]);

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    } catch {
      /* ignore */
    }
    setUser(null);
    setOpen(false);
    window.dispatchEvent(new Event(AUTH_EVENT));
    router.refresh();
  }

  return (
    <header className="site-header relative z-50 overflow-visible">
      <div className="site-header-inner mx-auto flex min-w-0 max-w-6xl items-center justify-between gap-3 overflow-visible px-4 py-3.5 sm:py-4">
        <Link href={`/${locale}`} className="group flex min-w-0 shrink items-center gap-2.5 sm:gap-3">
          <span className="site-header-logo relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden sm:h-14 sm:w-14">
            <Image src="/logo-dc.png" alt="" width={64} height={64} sizes="64px" quality={80} className="h-full w-full object-contain" priority />
          </span>
          <span className="site-header-brand min-w-0 truncate font-display text-lg font-bold tracking-wide sm:text-xl">DuneCraft</span>
        </Link>
        <nav className="site-header-nav hidden items-center gap-0.5 lg:flex" aria-label="Main">
          {navKeys.map((key) => {
            const active = isActive(pathname, locale, key);
            if (key === "donate") {
              return (
                <Link key={key} href={hrefFor(locale, key)} aria-current={active ? "page" : undefined} className={`donate-link site-nav-link ${active ? "donate-link-active site-nav-link-active" : ""}`}>
                  <DonateRune size={30} />
                  {dict.nav[key]}
                </Link>
              );
            }
            return (
              <Link key={key} href={hrefFor(locale, key)} aria-current={active ? "page" : undefined} className={`site-nav-link ${active ? "site-nav-link-active nav-live" : ""}`}>
                {dict.nav[key]}
              </Link>
            );
          })}
        </nav>
        <div className="site-header-actions relative z-50 flex shrink-0 items-center gap-2 overflow-visible sm:gap-2.5">
          <LocaleSwitcher locale={locale} labels={{ ru: dict.common.localeRu, en: dict.common.localeEn }} />
          {user ? <AccountMenu locale={locale} dict={dict} user={user} onLogout={() => void logout()} /> : <CabinetEntry locale={locale} dict={dict} className="hidden sm:inline-flex" />}
          <DownloadStub dict={dict} />
          <button type="button" className="site-header-burger inline-flex items-center justify-center p-2.5 text-ash-light lg:hidden" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen((v) => !v)}>
            <span className="sr-only">Menu</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              {open ? <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" /> : <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />}
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" className="site-header-mobile border-t px-4 py-3 lg:hidden" aria-label="Mobile">
          <ul className="flex flex-col gap-1">
            {navKeys.map((key) => {
              const active = isActive(pathname, locale, key);
              return (
                <li key={key}>
                  <Link href={hrefFor(locale, key)} aria-current={active ? "page" : undefined} className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold tracking-wide ${key === "donate" ? "text-ember" : active ? "nav-live" : "text-ash-light hover:bg-surface-2 hover:text-foreground"}`} onClick={() => setOpen(false)}>
                    {key === "donate" && <DonateRune size={28} />}
                    {dict.nav[key]}
                  </Link>
                </li>
              );
            })}
            <li className="mt-2">
              {user ? (
                <AccountCard locale={locale} dict={dict} user={user} onLogout={() => void logout()} onClose={() => setOpen(false)} />
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
