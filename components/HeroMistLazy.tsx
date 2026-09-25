"use client";

import dynamic from "next/dynamic";

/**
 * Client-only lazy boundary so @tsparticles stays out of the critical homepage
 * JS until after hydration. SSR is skipped (canvas needs the browser).
 */
const HeroMistDynamic = dynamic(
  () => import("./HeroMist").then((m) => m.HeroMist),
  {
    ssr: false,
    loading: () => null,
  },
);

export function HeroMistLazy({
  particlesId,
}: {
  particlesId?: string;
} = {}) {
  return <HeroMistDynamic particlesId={particlesId} />;
}
