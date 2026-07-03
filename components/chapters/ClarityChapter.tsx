import ChapterShell from "@/components/briefing/ChapterShell";
import Reveal from "@/components/briefing/Reveal";

export default function ClarityChapter() {
  return (
    <ChapterShell
      id="clarity"
      eyebrow="07 / CLARITY AFTER CHAOS"
      tone="quiet"
      className="bg-[#050504] md:py-48"
      innerClassName="max-w-4xl"
    >
      <div className="max-w-3xl">
        <Reveal>
          <h2 className="title-display mt-6 text-4xl font-bold leading-[1.08] text-[#f2efe6] sm:text-5xl md:text-6xl">
            SURVIVAL IS NOT
            <span className="block">ABOUT OUTRUNNING</span>
            <span className="block">THE FUTURE.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="mt-8 text-xl leading-9 text-white/60 md:text-2xl">
            It is about seeing it clearly enough to adapt.
          </p>
        </Reveal>
      </div>

      <Reveal delay={0.15} className="mx-auto mt-20 max-w-2xl text-center md:mt-28">
        <p className="text-xl leading-9 text-white/70 md:text-2xl md:leading-10">
          AI will generate more than we ever could.
        </p>
        <p className="title-display mt-8 text-2xl leading-snug text-[#f2efe6] md:text-3xl">
          Our job is to make sure it generates a future worth living in.
        </p>
      </Reveal>
    </ChapterShell>
  );
}
