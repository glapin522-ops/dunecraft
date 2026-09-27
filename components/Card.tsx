import { type ReactNode } from "react";

type Tone = "default" | "deep" | "raised" | "feature" | "quiet";

type Props = {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "section";
  /**
   * Soft glass — rare (hero overlays). Prefer tone panels in cabinet.
   */
  glass?: boolean;
  /**
   * default = content card; deep = denser block; raised = emphasize;
   * feature = gold-edge highlight; quiet = soft secondary.
   */
  tone?: Tone;
};

const tones: Record<Tone, string> = {
  default: "panel-solid border-border rounded-xl",
  deep: "panel-solid-deep border-border rounded-xl",
  raised: "panel-solid-raised border-border rounded-2xl",
  feature: "panel-feature rounded-2xl",
  quiet: "panel-quiet rounded-lg",
};

export function Card({
  children,
  className = "",
  as: Tag = "div",
  glass = false,
  tone = "default",
}: Props) {
  return (
    <Tag
      className={`border p-5 ${
        glass
          ? "glass rounded-2xl border-[color:var(--glass-stroke)] shadow-sm shadow-black/40"
          : tones[tone]
      } ${className}`}
    >
      {children}
    </Tag>
  );
}
