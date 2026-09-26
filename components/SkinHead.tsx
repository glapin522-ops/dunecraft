"use client";

import { useEffect, useRef } from "react";
import { DEFAULT_STEVE_DATA_URL } from "@/lib/default-skin";

type Props = {
  skinUrl?: string | null;
  size?: number;
  className?: string;
  alt?: string;
};

/**
 * Front face + hat overlay from a Minecraft skin PNG.
 * UV is the 64-unit sheet: face (8,8) 8×8, hat (40,8) 8×8.
 * Works for 64×64, 64×32 and HD (128 / 256) because scale = width / 64.
 */
export function SkinHead({
  skinUrl,
  size = 72,
  className = "",
  alt = "",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      const unit = Math.max(1, Math.round(img.width / 64));
      canvas.width = 8;
      canvas.height = 8;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, 8, 8);
      ctx.drawImage(img, 8 * unit, 8 * unit, 8 * unit, 8 * unit, 0, 0, 8, 8);

      const hat = document.createElement("canvas");
      hat.width = 8;
      hat.height = 8;
      const hatCtx = hat.getContext("2d");
      if (!hatCtx) return;
      hatCtx.drawImage(img, 40 * unit, 8 * unit, 8 * unit, 8 * unit, 0, 0, 8, 8);
      const pixels = hatCtx.getImageData(0, 0, 8, 8).data;
      let painted = false;
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] > 12) {
          painted = true;
          break;
        }
      }
      if (painted) ctx.drawImage(hat, 0, 0);
    };
    img.onerror = () => {
      if (cancelled || img.src.endsWith(DEFAULT_STEVE_DATA_URL)) return;
      img.src = DEFAULT_STEVE_DATA_URL;
    };
    img.src = skinUrl || DEFAULT_STEVE_DATA_URL;

    return () => {
      cancelled = true;
    };
  }, [skinUrl]);

  return (
    <canvas
      ref={canvasRef}
      width={8}
      height={8}
      className={`block ${className}`.trim()}
      style={{
        width: size,
        height: size,
        imageRendering: "pixelated",
      }}
      aria-label={alt || undefined}
      role={alt ? "img" : undefined}
    />
  );
}
