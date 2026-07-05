"use client";

import type { ScannerPosition } from "@/components/spot-the-human/lib/game-config";
import { cn } from "@/lib/utils";

type ScannerCursorProps = {
  confidence: number;
  position: ScannerPosition;
  target: "target" | "decoy" | "swarm";
  visible: boolean;
};

export default function ScannerCursor({
  confidence,
  position,
  target,
  visible,
}: ScannerCursorProps) {
  if (!visible) {
    return null;
  }

  const left = `${((position.x + 1) / 2) * 100}%`;
  const top = `${((position.y + 1) / 2) * 100}%`;
  const amber = target === "target";
  const warning = target === "decoy";

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute z-40 h-20 w-20 -translate-x-1/2 -translate-y-1/2 transition-[left,top] duration-75 ease-out",
        amber ? "text-[#d8b35f]" : warning ? "text-[#d3170c]" : "text-white/42",
      )}
      style={{ left, top }}
    >
      <div
        className={cn(
          "absolute inset-0 rounded-full border transition-colors",
          amber
            ? "border-[#d8b35f]/75 shadow-[0_0_28px_rgba(216,179,95,0.22)]"
            : warning
              ? "border-[#d3170c]/75 shadow-[0_0_24px_rgba(211,23,12,0.18)]"
              : "border-white/26",
        )}
      />
      <div
        className="absolute inset-2 rounded-full border border-current opacity-25"
        style={{
          clipPath: `inset(${100 - Math.round(confidence * 100)}% 0 0 0)`,
        }}
      />
      <span className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-current" />
      <span className="absolute bottom-0 left-1/2 h-3 w-px -translate-x-1/2 bg-current" />
      <span className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-current" />
      <span className="absolute right-0 top-1/2 h-px w-3 -translate-y-1/2 bg-current" />
      <span className="absolute left-1/2 top-1/2 h-px w-8 -translate-x-1/2 bg-current opacity-75" />
      <span className="absolute left-1/2 top-1/2 h-8 w-px -translate-y-1/2 bg-current opacity-75" />
      <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.18em] opacity-65">
        {amber ? "Coherence" : warning ? "Unstable" : "Scanning"}
      </span>
    </div>
  );
}
