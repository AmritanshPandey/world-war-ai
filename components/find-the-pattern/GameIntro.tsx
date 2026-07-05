"use client";

import { ROUND_COPY } from "@/components/find-the-pattern/lib/game-config";

type GameIntroProps = {
  visible: boolean;
  onBegin: () => void;
};

export default function GameIntro({ visible, onBegin }: GameIntroProps) {
  return (
    <div
      className={
        visible
          ? "pointer-events-auto absolute inset-0 z-30 flex items-center px-5 py-24 opacity-100 transition-opacity duration-500 md:px-10"
          : "pointer-events-none absolute inset-0 z-30 flex items-center px-5 py-24 opacity-0 transition-opacity duration-500 md:px-10"
      }
    >
      <div className="mx-auto w-full max-w-6xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#d3170c] md:text-xs">
          {ROUND_COPY.intro.eyebrow}
        </p>
        <h2 className="title-display mt-6 max-w-4xl text-5xl font-bold leading-[0.95] text-[#f2efe6] sm:text-6xl md:text-8xl">
          {ROUND_COPY.intro.title}
        </h2>
        <p className="mt-8 max-w-xl text-xl leading-8 text-white/72 md:text-2xl">
          {ROUND_COPY.intro.prompt}
        </p>
        <p className="mt-4 max-w-xl font-mono text-[11px] uppercase tracking-[0.24em] text-white/45">
          {ROUND_COPY.intro.instruction}
        </p>
        <div className="mt-8 grid max-w-2xl gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/45 sm:grid-cols-3">
          <div className="border border-white/10 bg-black/35 px-4 py-3">
            Move scanner
            <span className="mt-2 block text-[#f2efe6]/70">Mouse / WASD</span>
          </div>
          <div className="border border-white/10 bg-black/35 px-4 py-3">
            Build signal
            <span className="mt-2 block text-[#f2efe6]/70">Hold steady</span>
          </div>
          <div className="border border-white/10 bg-black/35 px-4 py-3">
            Confirm
            <span className="mt-2 block text-[#f2efe6]/70">Enter / button</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onBegin}
          className="mt-10 min-h-11 border border-[#d3170c]/70 bg-[#d3170c]/10 px-5 font-mono text-[11px] uppercase tracking-[0.24em] text-[#f2efe6] transition-colors hover:border-[#d8b35f] hover:bg-[#d8b35f]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d8b35f]"
        >
          Begin Scan
        </button>
      </div>
    </div>
  );
}
