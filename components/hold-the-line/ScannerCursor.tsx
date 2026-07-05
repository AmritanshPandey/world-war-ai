"use client";

import type { ScannerPosition } from "@/components/hold-the-line/lib/game-config";
import { cn } from "@/lib/utils";

type ScannerCursorProps = {
  charge: number;
  confidence: number;
  energy: number;
  position: ScannerPosition;
  target: "none" | "core" | "false";
  visible: boolean;
};

export default function ScannerCursor({
  charge,
  confidence,
  energy,
  position,
  target,
  visible,
}: ScannerCursorProps) {
  if (!visible) {
    return null;
  }

  const left = `${((position.x + 1) / 2) * 100}%`;
  const top = `${((position.y + 1) / 2) * 100}%`;
  const tone =
    target === "core"
      ? "rgb(216, 179, 95)"
      : target === "false"
        ? "rgb(211, 23, 12)"
        : "rgb(242, 239, 230)";

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute z-40 h-28 w-28 -translate-x-1/2 -translate-y-1/2 md:h-36 md:w-36"
      style={{ left, top }}
    >
      <div
        className="absolute inset-0 rounded-full opacity-85"
        style={{
          background: `conic-gradient(${tone} ${Math.round(
            charge * 360,
          )}deg, rgba(245,245,240,0.08) 0deg)`,
          maskImage:
            "radial-gradient(circle, transparent 55%, #000 57%, #000 63%, transparent 65%)",
        }}
      />
      <div
        className="absolute inset-3 rounded-full"
        style={{
          background: `conic-gradient(${tone} ${Math.round(
            confidence * 360,
          )}deg, rgba(245,245,240,0.06) 0deg)`,
          maskImage:
            "radial-gradient(circle, transparent 62%, #000 64%, #000 67%, transparent 69%)",
        }}
      />
      <div
        className={cn(
          "absolute inset-5 rounded-full border shadow-[0_0_30px_rgba(216,179,95,0.1)]",
          target === "false" ? "border-[#d3170c]/75" : "border-[#d8b35f]/55",
        )}
      />
      <div className="absolute inset-0 animate-[scanner-pulse_2.1s_ease-out_infinite] rounded-full border border-[#d3170c]/25" />
      <span className="absolute left-1/2 top-1/2 h-px w-10 -translate-x-1/2 bg-[#f2efe6]/70" />
      <span className="absolute left-1/2 top-1/2 h-10 w-px -translate-y-1/2 bg-[#f2efe6]/70" />
      <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 border border-[#f2efe6]/80 bg-black" />
      <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.18em] text-white/45">
        {target === "core"
          ? "Core exposed"
          : target === "false"
            ? "Unstable"
            : energy < 18
              ? "Recharge"
              : "Scan"}
      </span>
    </div>
  );
}
