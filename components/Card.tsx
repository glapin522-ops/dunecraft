import { type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "section";
  /**
   * Soft glass look — prefer solid panels in cabinet / lists.
   * Homepage hero overlays may still opt into glass.
   */
  glass?: boolean;
};

export function Card({
  children,
  className = "",
  as: Tag = "div",
  glass = false,
}: Props) {
  return (
    <Tag
      className={`rounded-2xl border p-5 ${
        glass
          ? "glass border-[color:var(--glass-stroke)] shadow-sm shadow-black/40"
          : "panel-solid border-border"
      } ${className}`}
    >
      {children}
    </Tag>
  );
}
