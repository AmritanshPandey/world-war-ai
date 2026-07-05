"use client";

import { ALTITUDE } from "@/components/hold-the-line/lib/game-config";
import { cn } from "@/lib/utils";

type AltitudeMeterProps = {
  altitude: number;
};

export default function AltitudeMeter({ altitude }: AltitudeMeterProps) {
  const danger = altitude <= ALTITUDE.danger;
  const warning = altitude <= ALTITUDE.warning;

  return (
    <div className="border border-white/12 bg-black/45 p-4 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/38">
            Evacuation Altitude
          </p>
          <p
            className={cn(
              "mt-2 font-mono text-2xl leading-none",
              danger ? "text-[#d3170c]" : warning ? "text-[#d8b35f]" : "text-[#f2efe6]",
            )}
          >
            {Math.round(altitude)}%
          </p>
        </div>
        <div className="relative h-28 w-3 border border-white/12 bg-white/5">
          <div
            className={cn(
              "absolute bottom-0 left-0 right-0 transition-[height,background-color] duration-300",
              danger ? "bg-[#d3170c]" : warning ? "bg-[#d8b35f]" : "bg-[#f2efe6]/80",
            )}
            style={{ height: `${Math.max(0, Math.min(100, altitude))}%` }}
          />
          <span className="absolute bottom-[30%] left-[-0.35rem] h-px w-5 bg-[#d3170c]/55" />
          <span className="absolute bottom-[60%] left-[-0.35rem] h-px w-5 bg-[#d8b35f]/45" />
        </div>
      </div>
      <p
        className={cn(
          "mt-4 min-h-5 font-mono text-[10px] uppercase tracking-[0.22em]",
          danger ? "text-[#d3170c]" : warning ? "text-[#d8b35f]" : "text-white/32",
        )}
      >
        {danger ? "Critical rotor sag" : warning ? "Rotor vibration detected" : "Evac zone stable"}
      </p>
    </div>
  );
}
