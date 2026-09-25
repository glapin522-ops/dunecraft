import { marked } from "marked";

/** Escape HTML so raw tags in markdown source cannot execute. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

marked.setOptions({
  gfm: true,
  breaks: true,
});

/**
 * Render markdown to safe HTML.
 * Strategy: escape the entire source first (no raw HTML), then parse markdown.
 * Links are limited to http(s) and relative paths via a custom renderer.
 */
export function renderMarkdownSafe(source: string): string {
  const escaped = escapeHtml(source || "");
  const renderer = new marked.Renderer();
  renderer.link = ({ href, title, text }) => {
    const safeHref =
      href &&
      (href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("/") ||
        href.startsWith("#"))
        ? href
        : "#";
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
    return `<a href="${escapeHtml(safeHref)}" rel="noopener noreferrer"${titleAttr}>${text}</a>`;
  };
  renderer.image = ({ href, title, text }) => {
    const safeHref =
      href &&
      (href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("/"))
        ? href
        : "";
    if (!safeHref) return escapeHtml(text || "");
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
    const alt = escapeHtml(text || "");
    return `<img src="${escapeHtml(safeHref)}" alt="${alt}"${titleAttr} loading="lazy" />`;
  };
  return marked.parse(escaped, { renderer }) as string;
}
