"use client";

import { useEffect, useState } from "react";

type RuneSpec = {
  id: string;
  src: string;
  left?: string;
  right?: string;
  top: string;
  size: number;
  dur: number;
  delay: number;
  rotate: number;
  opacity: number;
};

/* Full-page scatter: moderate density, right side inset so visible at 100% zoom */
const RUNES: RuneSpec[] = [
  // hero zone
  { id: "sowilo", src: "/runes/rune-sowilo.png?v=3", left: "7%", top: "4%", size: 64, dur: 40, delay: -15, rotate: -12, opacity: 0.26 },
  { id: "tiwaz", src: "/runes/rune-tiwaz.png?v=3", right: "7%", top: "5%", size: 58, dur: 34, delay: -6, rotate: 14, opacity: 0.28 },
  { id: "ansuz", src: "/runes/rune-ansuz.png?v=3", left: "5%", top: "18%", size: 70, dur: 38, delay: -12, rotate: 6, opacity: 0.24 },
  { id: "fehu-r", src: "/runes/rune-fehu.png?v=3", right: "8%", top: "22%", size: 62, dur: 28, delay: -3, rotate: -16, opacity: 0.26 },
  { id: "algiz", src: "/runes/rune-algiz.png?v=3", left: "6%", top: "32%", size: 66, dur: 30, delay: 0, rotate: -8, opacity: 0.22 },
  { id: "thurisaz-r", src: "/runes/rune-thurisaz.png?v=3", right: "10%", top: "36%", size: 54, dur: 32, delay: -9, rotate: 10, opacity: 0.2 },
  // news / mid page
  { id: "fehu", src: "/runes/rune-fehu.png?v=3", left: "4%", top: "48%", size: 58, dur: 36, delay: -18, rotate: 12, opacity: 0.2 },
  { id: "sowilo-r", src: "/runes/rune-sowilo.png?v=3", right: "6%", top: "52%", size: 60, dur: 42, delay: -20, rotate: -10, opacity: 0.22 },
  { id: "tiwaz-m", src: "/runes/rune-tiwaz.png?v=3", left: "8%", top: "62%", size: 52, dur: 33, delay: -7, rotate: 8, opacity: 0.18 },
  { id: "ansuz-r", src: "/runes/rune-ansuz.png?v=3", right: "9%", top: "66%", size: 56, dur: 37, delay: -14, rotate: -6, opacity: 0.2 },
  // lower page
  { id: "algiz-b", src: "/runes/rune-algiz.png?v=3", right: "7%", top: "78%", size: 64, dur: 31, delay: -4, rotate: 12, opacity: 0.18 },
  { id: "thurisaz", src: "/runes/rune-thurisaz.png?v=3", left: "6%", top: "84%", size: 50, dur: 35, delay: -11, rotate: -14, opacity: 0.16 },
];

export function FloatingRunes() {
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setOk(!mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (!ok) return null;

  return (
    <div className="floating-runes" aria-hidden>
      {RUNES.map((r) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={r.id}
          className="floating-rune"
          src={r.src}
          alt=""
          width={r.size}
          height={r.size}
          draggable={false}
          style={{
            ...(r.right != null ? { right: r.right, left: "auto" } : { left: r.left }),
            top: r.top,
            opacity: r.opacity,
            ["--rune-dur" as string]: `${r.dur}s`,
            ["--rune-delay" as string]: `${r.delay}s`,
            ["--rune-rot" as string]: `${r.rotate}deg`,
          }}
        />
      ))}
    </div>
  );
}
