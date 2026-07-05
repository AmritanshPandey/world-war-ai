"use client";

import { cn } from "@/lib/utils";

type HintButtonProps = {
  disabled: boolean;
  visible: boolean;
  onRequest: () => void;
};

export default function HintButton({
  disabled,
  onRequest,
  visible,
}: HintButtonProps) {
  return (
    <button
      type="button"
      aria-label="Request signal hint"
      disabled={!visible || disabled}
      onClick={onRequest}
      className={cn(
        "pointer-events-auto min-h-10 border px-3 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d8b35f]",
        visible && !disabled
          ? "border-[#d8b35f]/55 bg-[#d8b35f]/10 text-[#f2efe6] hover:border-[#f2efe6]"
          : "border-white/10 bg-black/30 text-white/28",
      )}
    >
      Request Signal Hint
    </button>
  );
}
