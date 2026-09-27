import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "gold" | "danger";
type Size = "md" | "lg";

/** Visual roles: gold = one main CTA; primary = action; secondary = quiet; ghost = text-like; danger = logout/ban */
const variants: Record<Variant, string> = {
  primary:
    "btn-role-primary bg-moss text-foreground hover:bg-moss-light border border-moss-light/35",
  secondary:
    "btn-role-secondary bg-transparent text-ash-light hover:text-foreground hover:bg-surface-3/80 border border-border/80",
  ghost: "btn-role-ghost bg-transparent text-ash-light hover:text-foreground border border-transparent",
  gold: "btn-role-gold text-[color:var(--cta-text)] border border-[color:var(--cta)]",
  danger:
    "btn-role-danger text-accent-danger border border-[color-mix(in_srgb,var(--accent-danger)_40%,var(--border))] bg-[color-mix(in_srgb,var(--accent-danger)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--accent-danger)_20%,var(--surface-3))]",
};

const sizes: Record<Size, string> = {
  md: "px-5 py-2.5 text-sm font-semibold",
  lg: "px-8 py-3.5 text-base sm:text-lg font-bold",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
};

export function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  disabled,
  type = "button",
  ...rest
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
