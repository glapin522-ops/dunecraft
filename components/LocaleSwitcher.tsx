"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { locales } from "@/lib/i18n";

type Props = {
  locale: Locale;
  labels: { ru: string; en: string };
  /** Open the list upward (footer). Default: downward. */
  menuUp?: boolean;
};

export function LocaleSwitcher({ locale, labels, menuUp = false }: Props) {
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

  const caretOpen = menuUp ? "\u25bc" : "\u25b2";
  const caretClosed = menuUp ? "\u25b2" : "\u25bc";

  return (
    <div ref={rootRef} className={`locale-switch relative${menuUp ? " locale-switch-up" : ""}`}>
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
          {open ? caretOpen : caretClosed}
        </span>
      </button>
      {open && (
        <ul
          id={listId}
          className={`locale-switch-menu${menuUp ? " is-up" : ""}`}
          role="listbox"
          aria-label="Language"
        >
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
