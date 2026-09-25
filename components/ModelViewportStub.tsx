/** CSS silhouette — stub until rotatable 3D model viewer lands. */

type Props = {
  placeholder: string;
  hint: string;
  /** Tall portrait layout for cabinet dashboard (~вертеть скин later). */
  tall?: boolean;
  className?: string;
  id?: string;
};

export function ModelViewportStub({
  placeholder,
  hint,
  tall = false,
  className = "",
  id,
}: Props) {
  return (
    <div
      id={id}
      data-model-viewer-stub
      className={`relative flex w-full flex-col items-center justify-center overflow-hidden rounded-3xl border border-[color:var(--glass-stroke-gold)] bg-surface shadow-[var(--glow-gold-sm)] ${
        tall
          ? "min-h-[10rem] max-h-[14rem] aspect-[16/10] sm:min-h-[11rem] sm:max-h-[14rem] min-[56rem]:min-h-0 min-[56rem]:h-full min-[56rem]:max-h-none min-[56rem]:aspect-auto"
          : "min-h-[14rem] aspect-[16/10] md:min-h-[15rem]"
      } ${className}`}
      aria-label={hint}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,color-mix(in_srgb,var(--moss)_45%,transparent),transparent_70%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent"
        aria-hidden
      />
      {/* Minecraft-ish blocky figure (CSS only; no Three.js yet) */}
      <div
        className={`relative z-[1] flex flex-col items-center ${tall ? "scale-100 min-[56rem]:scale-125 min-[72rem]:scale-150" : ""}`}
        aria-hidden
      >
        <div className="h-12 w-12 rounded-[2px] border border-gold/45 bg-surface-3" />
        <div className="mt-0.5 flex items-stretch gap-0.5">
          <div className="h-14 w-4 rounded-[2px] border border-moss-light/35 bg-moss/35" />
          <div className="h-16 w-14 rounded-[2px] border border-moss-light/55 bg-moss/55" />
          <div className="h-14 w-4 rounded-[2px] border border-moss-light/35 bg-moss/35" />
        </div>
        <div className="mt-0.5 flex gap-1">
          <div className="h-16 w-[1.5rem] rounded-[2px] border border-border bg-surface-2" />
          <div className="h-16 w-[1.5rem] rounded-[2px] border border-border bg-surface-2" />
        </div>
      </div>
      <p className="absolute inset-x-3 bottom-3 z-[1] text-center text-[10px] leading-snug text-ash md:text-xs">
        {hint}
      </p>
      <span className="sr-only">{placeholder}</span>
    </div>
  );
}
