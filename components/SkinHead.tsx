"use client";

import { useEffect, useRef } from "react";
import { DEFAULT_STEVE_DATA_URL } from "@/lib/default-skin";

type Props = {
  src?: string | null;
  size?: number;
  className?: string;
};

export function SkinHead({ src, size = 28, className = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.decoding = "async";
    img.src = src?.trim() || DEFAULT_STEVE_DATA_URL;
    img.onload = () => {
      const unit = img.width / 8;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, unit, unit, unit, unit, 0, 0, size, size);
      ctx.drawImage(img, unit * 5, unit, unit, unit, 0, 0, size, size);
    };
  }, [src, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      aria-hidden
      className={`block rounded-md ${className}`.trim()}
      style={{ width: size, height: size, imageRendering: "pixelated" }}
    />
  );
}
