import type { CSSProperties, ReactNode } from "react";

type Props = {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

/** Absolute full-bleed layer with inline position — works before CSS arrives. */
export function BleedLayer({ children, className = "", style }: Props) {
  return (
    <div
      aria-hidden
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
