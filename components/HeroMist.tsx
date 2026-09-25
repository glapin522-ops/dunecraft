"use client";

import { useEffect, useMemo, useState } from "react";
import Particles, { ParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Engine, ISourceOptions } from "@tsparticles/engine";

/** Stable across remounts — ParticlesProvider requires a stable init reference. */
async function initEngine(engine: Engine) {
  await loadSlim(engine);
}

/** null = not yet measured (skip particles until known). */
function usePrefersReducedMotion(): boolean | null {
  const [reduced, setReduced] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return reduced;
}

/**
 * Tiny Void Orchid fireflies for the hero.
 * Lightweight ambient dots — no mouse trail, paused off-screen / on blur.
 * Destroy on unmount is handled by @tsparticles/react Particles cleanup.
 */
type HeroMistProps = { /** Unique tsparticles canvas id per page */ particlesId?: string };

export function HeroMist({ particlesId = "dunecraft-hero-mist" }: HeroMistProps = {}) {
  const reduceMotion = usePrefersReducedMotion();

  const options: ISourceOptions = useMemo(
    () => ({
      fullScreen: { enable: false },
      background: { color: { value: "transparent" } },
      fpsLimit: 30,
      detectRetina: false,
      pauseOnBlur: true,
      pauseOnOutsideViewport: true,
      particles: {
        number: {
          value: 28,
          density: { enable: true, width: 1400, height: 900 },
        },
        color: {
          value: ["#9a95a8", "#67b8ff", "#8aa4c4"],
        },
        shape: { type: "circle" },
        opacity: {
          value: { min: 0.12, max: 0.32 },
          animation: {
            enable: true,
            speed: 0.22,
            sync: false,
            startValue: "random",
            destroy: "none",
          },
        },
        size: {
          value: { min: 0.8, max: 2.2 },
        },
        move: {
          enable: true,
          // Calm slow drift — shared by homepage + cabinet
          speed: { min: 0.03, max: 0.12 },
          direction: "none",
          random: true,
          straight: false,
          outModes: { default: "out" },
          attract: { enable: false },
          drift: 0.02,
          warp: false,
          // Never ramp up velocity over time
          accelerate: false,
          decay: 0,
        },
        links: { enable: false },
        // Shadow blur is expensive on canvas — skip for perf
        shadow: { enable: false },
        twinkle: {
          particles: {
            enable: true,
            frequency: 0.05,
            opacity: 1,
          },
        },
      },
      interactivity: {
        detectsOn: "canvas",
        events: {
          onHover: { enable: false },
          onClick: { enable: false },
          resize: { enable: true },
        },
      },
    }),
    [],
  );

  // Wait for preference + skip entirely when reduced motion is on
  if (reduceMotion !== false) {
    return null;
  }

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
    >
      <ParticlesProvider init={initEngine}>
        <Particles
          id={particlesId}
          className="!absolute inset-0 h-full w-full"
          options={options}
        />
      </ParticlesProvider>
    </div>
  );
}
