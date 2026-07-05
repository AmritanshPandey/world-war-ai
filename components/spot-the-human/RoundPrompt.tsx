"use client";

import type { SpotTheHumanState } from "@/components/spot-the-human/hooks/useSpotTheHumanGame";
import { ROUND_CONFIGS } from "@/components/spot-the-human/lib/game-config";

type RoundPromptProps = {
  state: SpotTheHumanState;
};

export default function RoundPrompt({ state }: RoundPromptProps) {
  const config = ROUND_CONFIGS[state.currentRound];

  return (
    <div className="max-w-3xl border border-white/12 bg-black/55 p-4 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#d8b35f]">
          {config.label}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/36">
          {config.objective}
        </p>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/72 md:text-base">
        {config.prompt}
      </p>
      <p className="mt-3 font-mono text-[10px] uppercase leading-5 tracking-[0.2em] text-white/40">
        {config.targetRule}
      </p>
    </div>
  );
}
