import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ChapterTone = "alert" | "hud" | "quiet";

type ChapterShellProps = {
  id: string;
  eyebrow: string;
  tone?: ChapterTone;
  className?: string;
  innerClassName?: string;
  hideEyebrow?: boolean;
  children: ReactNode;
};

const eyebrowTone: Record<ChapterTone, string> = {
  alert: "text-[#d3170c]",
  hud: "text-hud",
  quiet: "text-white/40",
};

/**
 * Shared post-hero chapter wrapper: semantic section, grain, briefing-style
 * eyebrow, and the hero's spacing rhythm. Backgrounds stay transparent so the
 * fixed atmospheric scene shows through; chapters layer their own moods.
 */
export default function ChapterShell({
  id,
  eyebrow,
  tone = "alert",
  className,
  innerClassName,
  hideEyebrow = false,
  children,
}: ChapterShellProps) {
  return (
    <section
      id={id}
      className={cn(
        "story-slide grain-overlay relative flex items-center overflow-hidden border-t border-white/10 px-5 py-28 md:px-10 md:py-40",
        className,
      )}
    >
      <div
        className={cn(
          "relative z-10 mx-auto w-full max-w-6xl",
          innerClassName,
        )}
      >
        {hideEyebrow ? null : (
          <p
            className={cn(
              "font-mono text-[11px] uppercase tracking-[0.3em] md:text-xs",
              eyebrowTone[tone],
            )}
          >
            {eyebrow}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
