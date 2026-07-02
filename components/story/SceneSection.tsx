import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SceneTone = "amber" | "crimson" | "green" | "steel";

type SceneSectionProps = {
  id: string;
  eyebrow: string;
  title: string;
  tone?: SceneTone;
  children: ReactNode;
};

const toneClasses: Record<SceneTone, string> = {
  amber: "from-[#d8b35f]/18 via-transparent to-black",
  crimson: "from-[#782d26]/24 via-transparent to-black",
  green: "from-[#315d4c]/20 via-transparent to-black",
  steel: "from-[#7b858d]/14 via-transparent to-black",
};

export default function SceneSection({
  id,
  eyebrow,
  title,
  tone = "steel",
  children,
}: SceneSectionProps) {
  return (
    <section
      id={id}
      className="grain-overlay relative flex min-h-svh items-center border-t border-white/10 px-5 py-28 md:px-10"
    >
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-90",
          toneClasses[tone],
        )}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-hud/50 to-transparent"
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <p className="cinematic-text text-xs text-hud/90 md:text-sm">
          {eyebrow}
        </p>
        <h2 className="mt-5 max-w-4xl text-5xl font-black leading-none text-white md:text-7xl">
          {title}
        </h2>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-white/66 md:text-xl">
          {children}
        </p>
      </div>
    </section>
  );
}
