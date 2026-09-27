"use client";

import { useEffect, useState } from "react";
import type { Dictionary } from "@/lib/dictionaries";

type Props = {
  label: Dictionary["common"]["backToTop"];
};

export function BackToTop({ label }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="back-to-top fixed bottom-6 right-6 z-50 rounded-full border-0 bg-[#1c1c1c] px-7 py-2.5 text-sm font-semibold tracking-wide text-[#e8e8e8] shadow-none transition hover:bg-[#252525] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lilac)]"
      aria-label={label}
    >
      {label}
    </button>
  );
}
