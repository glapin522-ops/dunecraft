import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "gold" | "danger";
type Size = "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-moss text-foreground hover:bg-moss-light border border-moss-light/40 glow-btn glow-btn-moss shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
  secondary:
    "bg-surface-3 text-foreground hover:bg-surface-2 border border-border glow-btn shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
  ghost: "bg-transparent text-ash-light hover:text-foreground hover:bg-surface-3 font-semibold",
  gold: "bg-gold/20 text-gold-light hover:bg-gold/30 border border-gold/50 glow-btn shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]",
  danger:
    "bg-[color-mix(in_srgb,var(--accent-danger)_18%,var(--surface-3))] text-accent-danger hover:bg-[color-mix(in_srgb,var(--accent-danger)_28%,var(--surface-3))] border border-[color-mix(in_srgb,var(--accent-danger)_45%,var(--border))] glow-btn glow-btn-danger shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
};

const sizes: Record<Size, string> = {
  md: "rounded-lg px-5 py-2.5 text-sm font-semibold",
  lg: "rounded-xl px-8 py-4 text-base sm:text-lg font-bold",
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
      className={`inline-flex items-center justify-center gap-2 font-semibold tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
