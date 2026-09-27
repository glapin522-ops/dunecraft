"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { normalizeHex } from "@/lib/button-theme";

type Hsv = { h: number; s: number; v: number };

type Props = {
  value: string;
  onChange: (hex: string) => void;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const n = normalizeHex(hex);
  if (!n) return null;
  const h = n.slice(1);
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

function rgbToHsv(r: number, g: number, b: number): Hsv {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s, v: max };
}

function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let rp = 0;
  let gp = 0;
  let bp = 0;
  if (h < 60) [rp, gp, bp] = [c, x, 0];
  else if (h < 120) [rp, gp, bp] = [x, c, 0];
  else if (h < 180) [rp, gp, bp] = [0, c, x];
  else if (h < 240) [rp, gp, bp] = [0, x, c];
  else if (h < 300) [rp, gp, bp] = [x, 0, c];
  else [rp, gp, bp] = [c, 0, x];
  return {
    r: (rp + m) * 255,
    g: (gp + m) * 255,
    b: (bp + m) * 255,
  };
}

function hsvToHex(hsv: Hsv): string {
  const { r, g, b } = hsvToRgb(hsv.h, hsv.s, hsv.v);
  return rgbToHex(r, g, b);
}

function hueColor(h: number): string {
  const { r, g, b } = hsvToRgb(h, 1, 1);
  return rgbToHex(r, g, b);
}

export function ColorPicker({ value, onChange }: Props) {
  const parsed = useMemo(() => {
    const rgb = hexToRgb(value) ?? { r: 226, g: 201, b: 164 };
    return rgbToHsv(rgb.r, rgb.g, rgb.b);
  }, [value]);

  const [hsv, setHsv] = useState<Hsv>(parsed);
  const [hexDraft, setHexDraft] = useState(normalizeHex(value) ?? value);
  const svRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<"sv" | "hue" | null>(null);
  const hsvRef = useRef(hsv);
  hsvRef.current = hsv;

  useEffect(() => {
    const rgb = hexToRgb(value);
    if (!rgb) return;
    const next = rgbToHsv(rgb.r, rgb.g, rgb.b);
    setHsv(next);
    setHexDraft(normalizeHex(value) ?? value);
  }, [value]);

  const emit = useCallback(
    (next: Hsv) => {
      setHsv(next);
      const hex = hsvToHex(next);
      setHexDraft(hex);
      onChange(hex);
    },
    [onChange],
  );

  const updateSv = useCallback(
    (clientX: number, clientY: number) => {
      const el = svRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const s = clamp((clientX - rect.left) / rect.width, 0, 1);
      const v = clamp(1 - (clientY - rect.top) / rect.height, 0, 1);
      emit({ ...hsvRef.current, s, v });
    },
    [emit],
  );

  const updateHue = useCallback(
    (clientX: number) => {
      const el = hueRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const h = clamp(((clientX - rect.left) / rect.width) * 360, 0, 359.999);
      emit({ ...hsvRef.current, h });
    },
    [emit],
  );

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (dragging.current === "sv") updateSv(e.clientX, e.clientY);
      if (dragging.current === "hue") updateHue(e.clientX);
    }
    function onUp() {
      dragging.current = null;
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [updateHue, updateSv]);

  const hex = hsvToHex(hsv);
  const pure = hueColor(hsv.h);

  function commitHexDraft() {
    const n = normalizeHex(hexDraft);
    if (!n) {
      setHexDraft(hex);
      return;
    }
    const rgb = hexToRgb(n)!;
    emit(rgbToHsv(rgb.r, rgb.g, rgb.b));
  }

  return (
    <div className="flex w-full max-w-[280px] flex-col gap-4">
      <div
        ref={svRef}
        className="relative aspect-square w-full max-w-[280px] cursor-crosshair touch-none overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--gold)_35%,transparent)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
        style={{
          background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${pure})`,
        }}
        onPointerDown={(e) => {
          dragging.current = "sv";
          (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
          updateSv(e.clientX, e.clientY);
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.45)]"
          style={{
            left: `${hsv.s * 100}%`,
            top: `${(1 - hsv.v) * 100}%`,
            background: hex,
          }}
        />
      </div>

      <div
        ref={hueRef}
        className="relative h-3 w-full cursor-pointer touch-none rounded-full border border-[color-mix(in_srgb,var(--gold)_28%,transparent)]"
        style={{
          background:
            "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)",
        }}
        onPointerDown={(e) => {
          dragging.current = "hue";
          (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
          updateHue(e.clientX);
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.45)]"
          style={{
            left: `${(hsv.h / 360) * 100}%`,
            background: pure,
          }}
        />
      </div>

      <div className="flex items-center gap-3">
        <span
          className="h-9 w-9 shrink-0 rounded-xl border border-[color-mix(in_srgb,var(--gold)_40%,transparent)] shadow-inner"
          style={{ background: hex }}
          aria-hidden
        />
        <input
          type="text"
          value={hexDraft}
          spellCheck={false}
          aria-label="HEX"
          className="min-w-0 flex-1 rounded-xl border border-[color-mix(in_srgb,var(--gold)_30%,transparent)] bg-[color-mix(in_srgb,var(--surface)_80%,transparent)] px-3 py-2 font-mono text-sm uppercase text-foreground outline-none focus:border-[color-mix(in_srgb,var(--gold)_55%,transparent)]"
          onChange={(e) => setHexDraft(e.target.value)}
          onBlur={commitHexDraft}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitHexDraft();
            }
          }}
        />
      </div>
    </div>
  );
}
