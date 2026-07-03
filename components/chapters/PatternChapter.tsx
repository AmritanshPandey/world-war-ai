import ChapterShell from "@/components/briefing/ChapterShell";
import Reveal from "@/components/briefing/Reveal";

const AI_ITEMS = [
  "Options",
  "Variations",
  "First drafts",
  "Prototype velocity",
  "Production output",
  "Pattern recall",
];

const DESIGNER_ITEMS = [
  "Direction",
  "Intent",
  "Taste",
  "Context",
  "Priorities",
  "Meaning",
];

const BLIND_SPOTS = [
  "The politics behind a stakeholder decision.",
  "The emotion behind a customer complaint.",
  "The strategic reason a product should not exist.",
  "The difference between something polished and something right.",
];

function ComparisonColumn({
  label,
  items,
  accent,
}: {
  label: string;
  items: string[];
  accent: "red" | "white";
}) {
  const isRed = accent === "red";

  return (
    <div>
      <p
        className={
          isRed
            ? "font-mono text-[11px] uppercase tracking-[0.3em] text-[#d3170c]"
            : "font-mono text-[11px] uppercase tracking-[0.3em] text-[#f2efe6]"
        }
      >
        {label}
      </p>
      <ul className="mt-6">
        {items.map((item, index) => (
          <li
            key={item}
            className="flex items-baseline gap-4 border-t border-white/10 py-4 last:border-b"
          >
            <span
              className={
                isRed
                  ? "font-mono text-[10px] text-[#d3170c]/70"
                  : "font-mono text-[10px] text-white/40"
              }
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <span
              className={
                isRed
                  ? "text-lg text-white/60 md:text-xl"
                  : "title-display text-lg text-[#f2efe6] md:text-xl"
              }
            >
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PatternChapter() {
  return (
    <ChapterShell id="pattern" eyebrow="04 / THE PATTERN">
      {/* organised signal network — chaos resolving into intent */}
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
      </div>

      <div className="relative mt-16 grid gap-14 md:mt-24 md:grid-cols-2 md:gap-20">
        <div
          aria-hidden="true"
          className="absolute inset-y-2 left-1/2 hidden w-px bg-gradient-to-b from-transparent via-white/20 to-transparent md:block"
        />
        <Reveal>
          <ComparisonColumn label="AI accelerates" items={AI_ITEMS} accent="red" />
        </Reveal>
        <Reveal delay={0.2}>
          <ComparisonColumn
            label="Designers decide"
            items={DESIGNER_ITEMS}
            accent="white"
          />
        </Reveal>
      </div>

      <Reveal delay={0.15} className="mt-20 max-w-3xl md:mt-28">
        <p className="text-lg leading-8 text-white/70 md:text-xl md:leading-9">
          AI can propose. But it does not fully understand the room.
        </p>
        <ul className="mt-8 space-y-3">
          {BLIND_SPOTS.map((line) => (
            <li
              key={line}
              className="flex items-baseline gap-4 text-lg leading-8 text-white/55 md:text-xl md:leading-9"
            >
              <span
                aria-hidden="true"
                className="h-px w-6 shrink-0 translate-y-[-0.3em] bg-[#d3170c]/70"
              />
              {line}
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal delay={0.2} className="mt-16 max-w-3xl md:mt-20">
        <p className="title-display border-l-2 border-[#d3170c] pl-6 text-2xl leading-snug text-[#f2efe6] md:text-3xl">
          The designer&rsquo;s job is not to make more things. It is to make
          sure the right thing gets made.
        </p>
      </Reveal>
    </ChapterShell>
  );
}
