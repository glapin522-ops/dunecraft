import Image from "next/image";
import { StubBadge } from "./StubBadge";

type Props = {
  title: string;
  lead: string;
  buttonLabel: string;
  soon: string;
  className?: string;
};

export function DiscordInvite({
  title,
  lead,
  buttonLabel,
  soon,
  className = "",
}: Props) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-[color:var(--glass-stroke)] ${className}`}
    >
      <div aria-hidden className="absolute inset-0 bg-[#0a0812]">
        <Image
          src="/discord-banner.png"
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 960px"
          quality={75}
          className="object-cover object-center opacity-80"
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            "linear-gradient(90deg, #0a0812f2 0%, #0a0812cc 42%, #0a081266 70%, #0a081233 100%)",
            "linear-gradient(0deg, #0a0812e6 0%, transparent 45%)",
            "radial-gradient(ellipse 50% 60% at 75% 40%, #c9a8ef22, transparent 55%)",
            "radial-gradient(ellipse 40% 50% at 20% 70%, #5c3d7a33, transparent 50%)",
          ].join(", "),
        }}
      />

      <div className="relative flex min-h-[220px] flex-col justify-end gap-4 p-6 sm:min-h-[260px] sm:p-8 md:p-10">
        <div className="max-w-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-moss-light">
            Community
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            {title}
          </h2>
          <p className="mt-3 text-sm text-muted sm:text-base">{lead}</p>
        </div>
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="glow-btn glass inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-xl border border-gold/35 bg-gold/15 px-6 py-3.5 text-base font-bold tracking-wide text-gold-light opacity-80 sm:w-auto"
        >
          {buttonLabel}
          <StubBadge label={soon} />
        </button>
      </div>
    </div>
  );
}
