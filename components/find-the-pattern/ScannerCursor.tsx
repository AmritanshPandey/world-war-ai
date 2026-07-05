"use client";

import type {
  ScannerPosition,
  ScannerTarget,
} from "@/components/find-the-pattern/lib/game-config";

type ScannerCursorProps = {
  active: boolean;
  confidence: number;
  position: ScannerPosition;
  target: ScannerTarget;
};

export default function ScannerCursor({
  active,
  confidence,
  position,
  target,
}: ScannerCursorProps) {
  if (!active) {
    return null;
  }

  const left = `${((position.x + 1) / 2) * 100}%`;
  const top = `${((position.y + 1) / 2) * 100}%`;
  const tone =
    target === "true"
      ? "rgb(216, 179, 95)"
      : target === "false"
        ? "rgb(211, 23, 12)"
        : "rgb(242, 239, 230)";
  const label =
    target === "true"
      ? "Signal"
      : target === "false"
        ? "Decoy"
        : confidence > 0.2
          ? "Noise"
          : "Scan";

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute z-40 h-24 w-24 -translate-x-1/2 -translate-y-1/2 md:h-32 md:w-32"
      style={{ left, top }}
    >
      <div
        className="absolute inset-0 rounded-full opacity-90"
        style={{
          background: `conic-gradient(${tone} ${Math.round(
            confidence * 360,
          )}deg, rgba(245,245,240,0.08) 0deg)`,
          maskImage:
            "radial-gradient(circle, transparent 57%, #000 59%, #000 64%, transparent 66%)",
        }}
      />
      <div
        className="absolute inset-3 rounded-full border shadow-[0_0_30px_rgba(216,179,95,0.1)]"
        style={{ borderColor: tone }}
      />
      <div className="absolute inset-0 animate-[scanner-pulse_1.8s_ease-out_infinite] rounded-full border border-[#d3170c]/30" />
      <span className="absolute left-1/2 top-1/2 h-px w-9 -translate-x-1/2 bg-[#f2efe6]/70" />
      <span className="absolute left-1/2 top-1/2 h-9 w-px -translate-y-1/2 bg-[#f2efe6]/70" />
      <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 border border-[#f2efe6]/80 bg-black" />
      <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 font-mono text-[9px] uppercase tracking-[0.18em] text-white/45">
        {label}
      </span>
    </div>
  );
}
