import ChapterShell from "@/components/briefing/ChapterShell";
import Reveal from "@/components/briefing/Reveal";
import PatternMeaningLab, {
  type PatternPair,
} from "@/components/chapters/PatternMeaningLab";

const PATTERN_PAIRS = [
  {
    ai: "Options",
    designer: "Direction",
    meaning: "Options become direction when a designer chooses what matters.",
    blindSpot: "Choice without a point of view.",
    verdict: "Name the path worth pursuing.",
  },
  {
    ai: "Variations",
    designer: "Intent",
    meaning: "Variations become intent when the work has a reason to exist.",
    blindSpot: "Novelty mistaken for purpose.",
    verdict: "Protect the reason behind the form.",
  },
  {
    ai: "First drafts",
    designer: "Taste",
    meaning: "First drafts become taste when someone knows what to remove.",
    blindSpot: "Polish without judgment.",
    verdict: "Remove what feels plausible but wrong.",
  },
  {
    ai: "Prototype velocity",
    designer: "Context",
    meaning: "Velocity becomes context when speed still listens to the room.",
    blindSpot: "Momentum hiding the real constraint.",
    verdict: "Slow down where the stakes are human.",
  },
  {
    ai: "Production output",
    designer: "Priorities",
    meaning: "Output becomes priority when a team can say what comes first.",
    blindSpot: "More artifacts than decisions.",
    verdict: "Turn volume into sequence.",
  },
  {
    ai: "Pattern recall",
    designer: "Meaning",
    meaning: "Pattern recall becomes meaning when memory meets consequence.",
    blindSpot: "The room, the politics, the cost.",
    verdict: "Make sure the right thing gets made.",
  },
] satisfies PatternPair[];

export default function PatternChapter() {
  return (
    <ChapterShell
      id="pattern"
      eyebrow="04 / THE PATTERN"
      className="py-20 md:py-20"
    >
      {/* organised signal network: chaos resolving into intent */}
      <svg
        aria-hidden="true"
        viewBox="0 0 400 300"
        className="pointer-events-none absolute right-[-6%] top-16 -z-10 hidden w-[42%] opacity-25 md:block"
      >
        {Array.from({ length: 6 }).map((_, row) =>
          Array.from({ length: 8 }).map((__, col) => (
            <circle
              key={`${row}-${col}`}
              cx={24 + col * 48}
              cy={24 + row * 48}
              r={1.6}
              fill="rgba(245,245,240,0.5)"
            />
          )),
        )}
        <path
          d="M24 264 L120 168 L216 168 L312 72 L360 24"
          fill="none"
          stroke="#d3170c"
          strokeWidth="1"
          opacity="0.8"
        />
        <circle cx={312} cy={72} r={5} fill="none" stroke="#d3170c" strokeWidth="1" />
        <circle cx={312} cy={72} r={1.8} fill="#d3170c" />
      </svg>

      <div className="max-w-4xl">
        <Reveal>
          <h2 className="title-display mt-6 text-4xl font-bold leading-[1.08] text-[#f2efe6] sm:text-5xl md:text-6xl">
            AI GENERATES OPTIONS.
            <span className="mt-2 block text-[#d3170c]">
              DESIGNERS CREATE MEANING.
            </span>
          </h2>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/64 md:text-lg md:leading-8">
            AI can propose. But it does not fully understand the room.
          </p>
        </Reveal>
      </div>

      <Reveal delay={0.18}>
        <PatternMeaningLab patterns={PATTERN_PAIRS} />
      </Reveal>
    </ChapterShell>
  );
}
