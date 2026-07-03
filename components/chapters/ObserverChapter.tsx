import ChapterShell from "@/components/briefing/ChapterShell";
import Reveal from "@/components/briefing/Reveal";
import VideoChapter from "@/components/briefing/VideoChapter";

const PROMPTS = [
  "What is happening repeatedly?",
  "What is the system optimised for?",
  "What are we missing because we are busy reacting?",
];

const EYEBROW = "03 / THE OBSERVER";

export default function ObserverChapter() {
  return (
    <ChapterShell
      id="observer"
      eyebrow={EYEBROW}
      hideEyebrow
      className="!px-0 !py-0 md:!px-0 md:!py-0"
      innerClassName="!max-w-none"
    >
      <VideoChapter
        src="/media/1.mp4"
        logLabel="Observation log / 01"
        variant="alert"
        withScanline
        loop
      >
        <div className="mx-auto grid min-h-[calc(100svh-17rem)] w-full max-w-7xl content-between gap-y-12 lg:grid-cols-[minmax(0,25rem)_minmax(12rem,1fr)_minmax(16rem,24rem)] lg:grid-rows-[auto_1fr_auto] lg:gap-x-8 xl:grid-cols-[minmax(0,31rem)_minmax(18rem,1fr)_minmax(18rem,27rem)] xl:gap-x-12">
          <div className="lg:col-start-1 lg:row-start-1">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#d3170c] md:text-xs">
              {EYEBROW}
            </p>
            <Reveal>
              <h2 className="title-display mt-6 text-4xl font-bold leading-[1.04] text-[#f2efe6] [text-shadow:0_2px_18px_rgba(0,0,0,0.72)] sm:text-5xl lg:text-5xl xl:text-6xl">
                THE PANIC IS NOT
                <span className="block">THE STORY.</span>
                <span className="mt-3 block text-[#d3170c]">
                  THE PATTERN IS.
                </span>
              </h2>
            </Reveal>
          </div>

          <div className="lg:col-start-3 lg:row-start-1 lg:self-start lg:pt-14">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
              Observation prompts
            </p>
            <ol className="mt-6">
              {PROMPTS.map((prompt, index) => (
                <Reveal key={prompt} delay={0.2 + index * 0.25}>
                  <li className="border-t border-white/10 py-4 last:border-b">
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#d3170c]">
                      Prompt 0{index + 1}
                    </p>
                    <p className="mt-3 text-base leading-7 text-white/78 md:text-lg md:leading-8">
                      {prompt}
                    </p>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>

          <Reveal
            delay={0.2}
            className="max-w-sm lg:col-start-1 lg:row-start-3 lg:self-end"
          >
            <p className="text-base leading-7 text-white/64 md:text-lg md:leading-8">
              The AI-era designer does not begin with:
            </p>
            <p className="mt-2 text-base leading-7 text-white/48 line-through decoration-[#d3170c]/70 md:text-lg md:leading-8">
              &ldquo;Can AI make a screen?&rdquo;
            </p>
            <p className="mt-6 text-base leading-7 text-white/64 md:text-lg md:leading-8">
              They begin with:
            </p>
          </Reveal>

          <Reveal
            delay={0.3}
            className="max-w-md lg:col-start-3 lg:row-start-3 lg:self-end"
          >
            <p className="title-display border-l-2 border-[#d3170c] pl-6 text-2xl leading-snug text-[#f2efe6] [text-shadow:0_2px_18px_rgba(0,0,0,0.7)] md:text-3xl">
              &ldquo;What kind of design work is becoming abundant — and what
              becomes more valuable because it is still scarce?&rdquo;
            </p>
          </Reveal>
        </div>
      </VideoChapter>
    </ChapterShell>
  );
}
