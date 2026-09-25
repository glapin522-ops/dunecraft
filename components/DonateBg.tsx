import Image from "next/image";

/**
 * Subtle Ken Burns on donate bg via CSS (compositor-friendly).
 * Disabled under prefers-reduced-motion in globals.css.
 * Server component — no Framer Motion / client JS for a background zoom.
 */
export function DonateBg() {
  return (
    <div
      aria-hidden
      className="donate-kenburns pointer-events-none absolute inset-0 h-full w-full"
      style={{ transformOrigin: "50% 45%" }}
    >
      <Image
        src="/donate-bg.png"
        alt=""
        fill
        sizes="100vw"
        quality={75}
        className="object-cover object-center opacity-80"
        priority={false}
      />
    </div>
  );
}
