"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type FadeInProps = {
  children: ReactNode;
  className?: string;
  /** Delay in seconds before animation starts */
  delay?: number;
  /** Vertical offset in px (ignored when reduced motion) */
  y?: number;
  /** Duration in seconds */
  duration?: number;
  /** Animate when scrolled into view (once). Default: on mount. */
  inView?: boolean;
};

const ease = [0.22, 1, 0.36, 1] as const;

export function FadeIn({
  children,
  className,
  delay = 0,
  y = 20,
  duration = 0.5,
  inView = false,
}: FadeInProps) {
  const reduce = useReducedMotion();
  const offset = reduce ? 0 : y;
  const dur = reduce ? 0 : duration;
  const d = reduce ? 0 : delay;

  const initial = { opacity: reduce ? 1 : 0, y: offset };
  const target = { opacity: 1, y: 0 };
  const transition = { duration: dur, delay: d, ease };

  if (inView) {
    return (
      <motion.div
        className={className}
        initial={initial}
        whileInView={target}
        viewport={{ once: true, margin: "-48px" }}
        transition={transition}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={initial}
      animate={target}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}
