import Reveal from "@/components/briefing/Reveal";
import VideoChapter from "@/components/briefing/VideoChapter";

/**
 * The ending: sparse manifesto copy over the final full-bleed briefing video.
 */
export default function ManifestoChapter() {
  return (
    <section id="manifesto" className="story-slide relative">
      <VideoChapter
        src="/media/3.mp4"
        logLabel="08 / FINAL MANIFESTO"
        variant="quiet"
        className="border-t border-white/10"
      >
        <div className="flex min-h-[62svh] items-center">
          <div className="max-w-3xl text-left">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/45 md:text-xs">
              08 / FINAL MANIFESTO
            </p>

            <Reveal>
              <h2 className="title-display mt-10 text-4xl font-bold leading-[1.08] text-[#f2efe6] sm:text-5xl md:text-6xl">
                THE AI ERA IS NOT
                <span className="block">THE END OF DESIGN.</span>
              </h2>
            </Reveal>

            <Reveal delay={0.25}>
              <p className="title-display mt-12 text-3xl font-bold leading-[1.1] text-white/85 sm:text-4xl md:mt-16 md:text-5xl">
                IT IS THE END OF
                <span className="block">DESIGNING THE OLD WAY.</span>
              </p>
            </Reveal>

            <Reveal delay={0.2}>
              <p className="mt-14 max-w-2xl text-lg leading-9 text-white/60 md:mt-20 md:text-xl">
                The future belongs to designers who notice first, think deeper,
                and build with judgment.
              </p>
            </Reveal>

            <Reveal delay={0.25}>
              <p className="cinematic-text mt-16 text-base leading-loose tracking-[0.18em] text-white/55 md:mt-24 md:text-xl">
                Observe the chaos.
                <span className="block">Find the pattern.</span>
                <span className="block text-[#d3170c]">Design what matters.</span>
              </p>
            </Reveal>
          </div>
        </div>
      </VideoChapter>
    </section>
  );
}
