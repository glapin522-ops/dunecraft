"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type StaggerProps = {
  children: ReactNode;
  className?: string;
  /** Stagger delay between children (seconds) */
  stagger?: number;
  /** Delay before first child (seconds) */
  delayChildren?: number;
  /** Animate when scrolled into view (once). Default: on mount. */
  inView?: boolean;
};

type StaggerItemProps = {
  children: ReactNode;
  className?: string;
  /** Vertical offset in px (ignored when reduced motion) */
  y?: number;
};

const ease = [0.22, 1, 0.36, 1] as const;

export function Stagger({
  children,
  className,
  stagger = 0.08,
  delayChildren = 0,
  inView = false,
}: StaggerProps) {
  const reduce = useReducedMotion();

  const variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduce ? 0 : stagger,
        delayChildren: reduce ? 0 : delayChildren,
      },
    },
  };

  if (inView) {
    return (
      <motion.div
        className={className}
        variants={variants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-48px" }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  y = 20,
}: StaggerItemProps) {
  const reduce = useReducedMotion();

  const variants = {
    hidden: { opacity: reduce ? 1 : 0, y: reduce ? 0 : y },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0 : 0.5, ease },
    },
  };

  return (
    <motion.div className={className} variants={variants}>
      {children}
    </motion.div>
  );
}
