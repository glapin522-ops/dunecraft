"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
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
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div ref={rootRef} className="locale-switch relative">
      <button
        type="button"
        className="locale-switch-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="locale-switch-code">{labels[locale]}</span>
        <span aria-hidden className="locale-switch-caret">
          {open ? "\u25b2" : "\u25bc"}
        </span>
      </button>
      {open && (
        <ul id={listId} className="locale-switch-menu" role="listbox" aria-label="Language">
          {locales.map((loc) => {
            const href = rest ? `/${loc}/${rest}` : `/${loc}`;
            const active = loc === locale;
            return (
              <li key={loc} role="option" aria-selected={active}>
                <Link
                  href={href}
                  hrefLang={loc}
                  lang={loc}
                  className={`locale-switch-option${active ? " is-active" : ""}`}
                  onClick={() => setOpen(false)}
                >
                  {labels[loc]}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
