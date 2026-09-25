import Image from "next/image";
import type { ReactNode } from "react";
import { HeroMistLazy } from "@/components/HeroMistLazy";

type PageAtmosphereProps = {
  children: ReactNode;
  particlesId: string;
};

/** Shared full-bleed hero treatment for content pages. */
export function PageAtmosphere({ children, particlesId }: PageAtmosphereProps) {
  return (
    <section className="relative isolate overflow-hidden border-b border-[color:var(--glass-stroke)]">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[#0a0812]">
        <Image
          src="/hero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          quality={75}
          className="object-cover object-center opacity-60"
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            "linear-gradient(180deg, #0a0812f2 0%, #0a0812cc 22%, #0a081280 52%, #0a0812e8 100%)",
            "linear-gradient(0deg, #0a0812f5 0%, #0a0812b8 28%, transparent 62%)",
            "radial-gradient(ellipse 90% 70% at 50% 38%, transparent 20%, #0a0812b8 100%)",
            "radial-gradient(ellipse 46% 40% at 14% 62%, #67b8ff16, transparent 62%)",
          ].join(", "),
        }}
      />
      <HeroMistLazy particlesId={particlesId} />
      <div className="relative z-10">{children}</div>
    </section>
  );
}
