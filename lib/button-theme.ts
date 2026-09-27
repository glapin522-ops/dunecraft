export const STORAGE_KEY = "dunecraft.theme.cta";
export const DEFAULT_CTA = "#e2c9a4";

export type CtaPalette = {
  cta: string;
  mid: string;
  deep: string;
  text: string;
};

export function normalizeHex(input: string): string | null {
  const raw = input.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{6}$/.test(raw)) {
    return `#${raw.toLowerCase()}`;
  }
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    const expanded = raw
      .split("")
      .map((c) => c + c)
      .join("");
    return `#${expanded.toLowerCase()}`;
  }
  return null;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("")}`;
}

function darken(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}

function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function deriveCtaPalette(hex: string): CtaPalette {
  const cta = normalizeHex(hex) ?? DEFAULT_CTA;
  return {
    cta,
    mid: darken(cta, 0.15),
    deep: darken(cta, 0.3),
    text: luminance(cta) > 0.55 ? "#1a1208" : "#f5f0e8",
  };
}

export function applyCtaTheme(hex: string): void {
  if (typeof document === "undefined") return;
  const palette = deriveCtaPalette(hex);
  const root = document.documentElement;
  root.style.setProperty("--cta", palette.cta);
  root.style.setProperty("--cta-mid", palette.mid);
  root.style.setProperty("--cta-deep", palette.deep);
  root.style.setProperty("--cta-text", palette.text);
}

export function readStoredCta(): string {
  if (typeof window === "undefined") return DEFAULT_CTA;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CTA;
    return normalizeHex(raw) ?? DEFAULT_CTA;
  } catch {
    return DEFAULT_CTA;
  }
}
