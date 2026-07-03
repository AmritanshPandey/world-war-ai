"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type ScrollIndicatorProps = {
  href: string;
  label: string;
  variant?: "light" | "dark";
};

export default function ScrollIndicator({
  href,
  label,
  variant = "light",
}: ScrollIndicatorProps) {
  const shouldReduceMotion = useReducedMotion();
  const isDark = variant === "dark";

  return (
    <motion.a
      href={href}
      className={cn(
        "inline-flex min-h-12 items-center gap-3 px-5 text-sm font-semibold backdrop-blur-sm transition-colors",
        isDark
          ? "border border-[#141412]/35 bg-white/40 text-[#141412] hover:border-[#c8170d]/60 hover:text-[#c8170d]"
          : "thin-hud-border bg-black/35 text-white hover:border-white/45 hover:text-hud",
      )}
      animate={shouldReduceMotion ? undefined : { y: [0, 6, 0] }}
      transition={{
        duration: 2.4,
        ease: "easeInOut",
        repeat: Infinity,
      }}
    >
      {label}
      <span
        className={cn("h-px w-8", isDark ? "bg-[#c8170d]" : "bg-hud")}
        aria-hidden="true"
      />
    </motion.a>
  );
}
