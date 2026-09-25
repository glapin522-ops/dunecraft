"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/dictionaries";
import type { Role, SessionUser } from "@/lib/auth/types";
import { LocaleSwitcher } from "./LocaleSwitcher";

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
      <svg
        viewBox="0 0 36 72"
        width={Math.round(size * 0.5)}
        height={size}
        className="donate-rune"
      >
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


function roleLabel(dict: Dictionary, role: Role): string {
  if (role === "creator") return dict.cabinet.roleCreator;
  if (role === "editor") return dict.cabinet.roleEditor;
  return dict.cabinet.rolePlayer;
}

function roleBadgeClass(role: Role): string {
  if (role === "creator") return "border-gold/55 bg-gold/25 text-gold-light";
  if (role === "editor") return "border-moss-light/50 bg-moss/30 text-moss-light";
  return "border-border bg-surface-2 text-ash-light";
}

function UserCabinetPill({
  locale,
  dict,
  user,
  className = "",
  onNavigate,
}: {
  locale: Locale;
  dict: Dictionary;
  user: SessionUser;
  className?: string;
  onNavigate?: () => void;
}) {
  const initial = (user.username.trim().charAt(0) || "?").toUpperCase();
  return (
    <Link
      href={`/${locale}/cabinet`}
      onClick={onNavigate}
      title={`${dict.nav.signedInAs} ${user.username}`}
      className={`glow-btn glow-ring-gold inline-flex max-w-[14rem] items-center gap-2 rounded-full border border-gold/45 bg-gold/15 py-1 pl-1 pr-2.5 text-sm font-bold tracking-wide text-gold-light shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-colors hover:bg-gold/25 sm:max-w-[16rem] ${className}`}
    >
      <CabinetSeal />
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-void text-xs font-bold text-gold-light"
        aria-hidden
      >
        {initial}
      </span>
      <span className="min-w-0 truncate">{user.username}</span>
      <span
        className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${roleBadgeClass(user.role)}`}
      >
        {roleLabel(dict, user.role)}
      </span>
    </Link>
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
        const res = await fetch("/api/auth/me", {
          credentials: "same-origin",
          signal: controller.signal,
        });
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

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-black/95 backdrop-blur-md">
      <div className="mx-auto flex min-w-0 max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:py-5">
        <Link
          href={`/${locale}`}
          className="group flex min-w-0 shrink items-center gap-3 sm:gap-3.5"
        >
          <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gold/35 bg-void shadow-[0_0_22px_rgba(155,126,201,0.32)] transition group-hover:border-gold/60 group-hover:shadow-[0_0_28px_rgba(201,168,239,0.45)] sm:h-16 sm:w-16">
            <Image
              src="/logo-dc.png"
              alt=""
              width={64}
              height={64}
              sizes="64px"
              quality={80}
              className="h-full w-full object-contain"
              priority
            />
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
                <Link
                  key={key}
                  href={hrefFor(locale, key)}
                  aria-current={active ? "page" : undefined}
                  className={`donate-link rounded-lg px-3 py-2 text-sm font-bold tracking-wide ${
                    active ? "donate-link-active bg-moss/30" : "hover:bg-surface-2/90"
                  }`}
                >
                  <DonateRune size={30} />
                  {dict.nav[key]}
                </Link>
              );
            }
            return (
              <Link
                key={key}
                href={hrefFor(locale, key)}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-bold tracking-wide transition-colors ${
                  active
                    ? "bg-moss/30 text-gold-light shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                    : "text-ash-light hover:bg-surface-2/90 hover:text-foreground"
                }`}
              >
                {dict.nav[key]}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          <LocaleSwitcher
            locale={locale}
            labels={{ ru: dict.common.localeRu, en: dict.common.localeEn }}
          />
          {user ? (
            <UserCabinetPill
              locale={locale}
              dict={dict}
              user={user}
              className="hidden sm:inline-flex"
            />
          ) : (
            <Link
              href={`/${locale}/cabinet`}
              className="cabinet-btn hidden items-center justify-center gap-2 px-3.5 py-2 text-sm font-bold tracking-wide sm:inline-flex"
            >
              <CabinetSeal />
              {dict.nav.cabinet}
            </Link>
          )}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-surface-2 p-2.5 text-ash-light hover:border-gold/35 hover:text-gold-light lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
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
        <nav
          id="mobile-nav"
          className="border-t border-border bg-surface px-4 py-3 lg:hidden"
          aria-label="Mobile"
        >
          <ul className="flex flex-col gap-1">
            {navKeys.map((key) => {
              const active = isActive(pathname, locale, key);
              return (
                <li key={key}>
                  <Link
                    href={hrefFor(locale, key)}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold tracking-wide ${
                      key === "donate"
                        ? "text-ember"
                        : active
                          ? "bg-moss/30 text-gold-light"
                          : "text-ash-light hover:bg-surface-2 hover:text-foreground"
                    }`}
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
                <UserCabinetPill
                  locale={locale}
                  dict={dict}
                  user={user}
                  className="w-full max-w-none justify-center"
                  onNavigate={() => setOpen(false)}
                />
              ) : (
                <Link
                  href={`/${locale}/cabinet`}
                  className="cabinet-btn flex items-center justify-center gap-2 px-3 py-2.5 text-center text-sm font-bold tracking-wide"
                  onClick={() => setOpen(false)}
                >
                  <CabinetSeal />
                  {dict.nav.cabinet}
                </Link>
              )}
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
