import ChapterShell from "@/components/briefing/ChapterShell";
import Reveal from "@/components/briefing/Reveal";
import VideoChapter from "@/components/briefing/VideoChapter";

const LOOP_STEPS = ["Observe", "Copy", "Amplify", "Adapt"];

const EYEBROW = "02B / THE MECHANISM";

export default function MechanismChapter() {
  return (
    <ChapterShell
      id="mechanism"
      eyebrow={EYEBROW}
      hideEyebrow
      className="!px-0 !py-0 md:!px-0 md:!py-0"
      innerClassName="!max-w-none"
    >
      <VideoChapter
        src="/media/4.mp4"
        logLabel="Mechanism scan / 04"
        variant="alert"
        videoClassName="scale-[1.24]"
        withScanline
        loop
      >
        <div className="mx-auto grid min-h-[calc(100svh-17rem)] w-full max-w-7xl content-between gap-y-12 lg:grid-cols-[minmax(0,30rem)_minmax(12rem,1fr)_minmax(15rem,22rem)] lg:grid-rows-[auto_1fr_auto] lg:gap-x-10 xl:grid-cols-[minmax(0,34rem)_minmax(18rem,1fr)_minmax(17rem,25rem)] xl:gap-x-14">
          <div className="lg:col-start-1 lg:row-start-1">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#d3170c] md:text-xs">
              {EYEBROW}
            </p>
            <Reveal>
              <h2 className="title-display mt-6 text-4xl font-bold leading-[1.04] text-[#f2efe6] [text-shadow:0_2px_18px_rgba(0,0,0,0.72)] sm:text-5xl lg:text-5xl xl:text-6xl">
                UNDERSTAND
                <span className="block">HOW THE HORDE</span>
                <span className="block text-[#d3170c]">LEARNS.</span>
              </h2>
            </Reveal>
          </div>

          <Reveal
            delay={0.18}
            className="max-w-sm lg:col-start-1 lg:row-start-3 lg:self-end"
          >
            <p className="text-base leading-7 text-white/72 md:text-lg md:leading-8">
              AI does not move like one tool. It spreads through repeated
              patterns: one output copied, improved, shared, and copied again.
            </p>
            <p className="mt-5 text-base leading-7 text-white/60 md:text-lg md:leading-8">
              The danger is not the first zombie. It is the loop that teaches
              the next one how to move faster.
            </p>
          </Reveal>

          <div className="lg:col-start-3 lg:row-start-3 lg:self-end">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
              Infection loop
            </p>
            <ol className="mt-5 border-y border-white/12">
              {LOOP_STEPS.map((step, index) => (
                <Reveal key={step} delay={0.16 + index * 0.12}>
                  <li className="flex items-baseline justify-between gap-4 border-b border-white/10 py-3 last:border-b-0">
                    <span className="cinematic-text text-sm text-white/76 md:text-base">
                      {step}
                    </span>
                    <span className="font-mono text-[10px] text-[#d3170c]/80">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </VideoChapter>
    </ChapterShell>
  );
}
