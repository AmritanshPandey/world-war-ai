"use client";

import {
  DECISIONS,
  type DecisionId,
} from "@/components/find-the-pattern/lib/game-config";
import { cn } from "@/lib/utils";

type DecisionCardsProps = {
  disabled?: boolean;
  onChoose: (decisionId: DecisionId) => void;
  onPreview: (decisionId: DecisionId | null) => void;
};

export default function DecisionCards({
  disabled = false,
  onChoose,
  onPreview,
}: DecisionCardsProps) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {DECISIONS.map((decision, index) => (
        <button
          key={decision.id}
          type="button"
          disabled={disabled}
          onClick={() => onChoose(decision.id)}
          onMouseEnter={() => onPreview(decision.id)}
          onMouseLeave={() => onPreview(null)}
          onFocus={() => onPreview(decision.id)}
          onBlur={() => onPreview(null)}
          className={cn(
            "group min-h-36 border bg-black/45 p-5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d8b35f] disabled:pointer-events-none disabled:opacity-60",
            "border-white/15 hover:border-[#d8b35f]/70 hover:bg-white/[0.055]",
          )}
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/38 group-hover:text-[#d8b35f]">
            Tactical choice {String(index + 1).padStart(2, "0")}
          </span>
          <span className="title-display mt-5 block text-2xl font-bold leading-tight text-[#f2efe6]">
            {decision.label}
          </span>
          <span className="mt-4 block text-sm leading-6 text-white/55">
            {decision.description}
          </span>
        </button>
      ))}
    </div>
  );
}
