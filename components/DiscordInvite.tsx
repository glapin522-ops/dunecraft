import Image from "next/image";

type Props = {
  title: string;
  lead: string;
  buttonLabel: string;
  soon: string;
  className?: string;
  href?: string;
};

const DEFAULT_DISCORD = "https://discord.gg/FJKwr5nR8Z";

export function DiscordInvite({
  title,
  lead,
  buttonLabel,
  soon,
  className = "",
  href = DEFAULT_DISCORD,
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
            "radial-gradient(ellipse 42% 50% at 16% 70%, #67b8ff18, transparent 58%)",
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
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="glow-btn glass inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-xl border border-gold/35 bg-gold/15 px-6 py-3.5 text-base font-bold tracking-wide text-gold-light sm:w-auto"
        >
          {buttonLabel}
        </a>
      </div>
    </div>
  );
}
