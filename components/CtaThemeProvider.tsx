"use client";

import { useEffect, type ReactNode } from "react";
import {
  DEFAULT_CTA,
  STORAGE_KEY,
  applyCtaTheme,
  normalizeHex,
  readStoredCta,
} from "@/lib/button-theme";

type Props = {
  children?: ReactNode;
};

export function CtaThemeProvider({ children }: Props) {
  useEffect(() => {
    applyCtaTheme(readStoredCta());

    function onStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY) return;
      const next = event.newValue ? normalizeHex(event.newValue) : null;
      applyCtaTheme(next ?? DEFAULT_CTA);
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return children ?? null;
}
