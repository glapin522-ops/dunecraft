"use client";

import { useEffect, useRef } from "react";
import { SkinViewer } from "skinview3d";
import { DEFAULT_CAPE_URL, DEFAULT_STEVE_DATA_URL } from "@/lib/default-skin";

type Props = {
  skinUrl?: string | null;
  capeUrl?: string | null;
  className?: string;
  id?: string;
  autoRotate?: boolean;
  /** Radians. Math.PI shows the back. */
  yaw?: number;
  /** Hide the body and show only the cape. */
  capeOnly?: boolean;
};

export function PlayerSkinView({
  skinUrl,
  capeUrl,
  className = "",
  id,
  autoRotate = true,
  yaw = 0,
  capeOnly = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<SkinViewer | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const width = Math.max(160, wrap.clientWidth);
    const height = Math.max(200, wrap.clientHeight);
    const viewer = new SkinViewer({
      canvas,
      width,
      height,
      skin: skinUrl || DEFAULT_STEVE_DATA_URL,
      cape: capeUrl || DEFAULT_CAPE_URL,
    });
    viewer.controls.enableRotate = true;
    viewer.controls.enableZoom = true;
    viewer.controls.enablePan = false;
    viewer.autoRotate = autoRotate;
    viewer.autoRotateSpeed = 0.6;
    viewer.playerObject.rotation.y = yaw;
    if (capeOnly) {
      viewer.playerObject.skin.visible = false;
      viewer.playerObject.rotation.y = Math.PI;
      viewer.zoom = 1.7;
    }
    if (capeUrl) {
      void viewer.loadCape(capeUrl);
    }
    viewerRef.current = viewer;

    const ro = new ResizeObserver(() => {
      const w = Math.max(160, wrap.clientWidth);
      const h = Math.max(200, wrap.clientHeight);
      viewer.setSize(w, h);
    });
    ro.observe(wrap);

    return () => {
      ro.disconnect();
      viewer.dispose();
      viewerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    void viewer.loadSkin(skinUrl || DEFAULT_STEVE_DATA_URL);
  }, [skinUrl]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    if (capeUrl) void viewer.loadCape(capeUrl);
    else void viewer.loadCape(DEFAULT_CAPE_URL);
  }, [capeUrl]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.autoRotate = autoRotate;
  }, [autoRotate]);

  return (
    <div
      id={id}
      ref={wrapRef}
      className={`relative h-full min-h-[12rem] w-full overflow-hidden ${className}`}
    >
      <canvas ref={canvasRef} className="block h-full w-full touch-none" />
    </div>
  );
}
