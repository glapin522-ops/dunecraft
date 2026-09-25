import { renderMarkdownSafe } from "@/lib/markdown";

type Props = { source: string; className?: string };

export function MarkdownBody({ source, className }: Props) {
  const html = renderMarkdownSafe(source);
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
