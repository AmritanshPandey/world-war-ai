"use client";

import { motion, useReducedMotion } from "framer-motion";

type ScrollIndicatorProps = {
  href: string;
  label: string;
};

export default function ScrollIndicator({ href, label }: ScrollIndicatorProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.a
      href={href}
      className="thin-hud-border inline-flex min-h-12 items-center gap-3 bg-black/35 px-5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:border-white/45 hover:text-hud"
      animate={shouldReduceMotion ? undefined : { y: [0, 6, 0] }}
      transition={{
        duration: 2.4,
        ease: "easeInOut",
        repeat: Infinity,
      }}
    >
      {label}
      <span className="h-px w-8 bg-hud" aria-hidden="true" />
    </motion.a>
  );
}
