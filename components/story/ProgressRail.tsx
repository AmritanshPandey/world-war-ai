"use client";

import { STORY_SECTIONS, type SectionId } from "@/lib/constants";
import { useActiveSection } from "@/lib/scroll-store";
import { cn } from "@/lib/utils";

type ProgressRailProps = {
  activeSection?: SectionId;
};

export default function ProgressRail({
  activeSection,
}: ProgressRailProps) {
  const trackedSection = useActiveSection();
  const currentSection = activeSection ?? trackedSection;

  return (
    <nav
      aria-label="Story progress"
      className="fixed right-3 top-1/2 z-40 -translate-y-1/2 md:right-7"
    >
      <ol className="flex flex-col items-end gap-3">
        {STORY_SECTIONS.map((section) => {
          const isActive = section.id === currentSection;

          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                aria-current={isActive ? "step" : undefined}
                className="group flex min-h-6 items-center justify-end gap-3"
              >
                <span
                  className={cn(
                    "hidden text-right text-[11px] font-medium text-white/45 transition-colors md:block",
                    isActive && "text-hud",
                    "group-hover:text-white",
                  )}
                >
                  {section.label}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "block h-2.5 w-2.5 border border-white/35 bg-black/70 transition-all",
                    isActive && "h-7 border-hud bg-hud/25",
                    "group-hover:border-white",
                  )}
                />
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
