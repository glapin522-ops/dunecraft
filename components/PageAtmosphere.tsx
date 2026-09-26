import Image from "next/image";
import type { ReactNode } from "react";
import { BleedLayer } from "@/components/BleedLayer";
import { HeroMistLazy } from "@/components/HeroMistLazy";

type PageAtmosphereProps = {
  children: ReactNode;
  particlesId: string;
};

export function PageAtmosphere({ children, particlesId }: PageAtmosphereProps) {
  return (
    <section className="relative isolate overflow-hidden border-b border-[color:var(--glass-stroke)]">
      <BleedLayer style={{ background: "#0a0812" }}>
        <Image
          src="/hero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          quality={75}
          className="object-cover object-center opacity-60"
          style={{ objectFit: "cover", objectPosition: "center", opacity: 0.6 }}
        />
      </BleedLayer>
      <BleedLayer
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
