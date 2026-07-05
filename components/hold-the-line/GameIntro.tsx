"use client";

type GameIntroProps = {
  visible: boolean;
  onBegin: () => void;
};

export default function GameIntro({ visible, onBegin }: GameIntroProps) {
  return (
    <div
      className={
        visible
          ? "pointer-events-auto absolute inset-0 z-50 flex items-center px-5 py-24 opacity-100 transition-opacity duration-500 md:px-10"
          : "pointer-events-none absolute inset-0 z-50 flex items-center px-5 py-24 opacity-0 transition-opacity duration-500 md:px-10"
      }
    >
      <div className="mx-auto w-full max-w-6xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#d3170c] md:text-xs">
          WORLD WAR AI / FINAL TEST
        </p>
        <h2 className="title-display mt-6 max-w-5xl text-5xl font-bold leading-[0.95] text-[#f2efe6] sm:text-6xl md:text-8xl">
          HOLD THE LINE
        </h2>
        <p className="mt-8 max-w-2xl text-xl leading-8 text-white/72 md:text-2xl">
          The swarm is climbing. Find the weak point before it reaches the evac
          zone.
        </p>
        <div className="mt-8 grid max-w-3xl gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/45 sm:grid-cols-3">
          <div className="border border-white/10 bg-black/35 px-4 py-3">
            Move to scan
            <span className="mt-2 block text-[#f2efe6]/70">Mouse / drag / arrows</span>
          </div>
          <div className="border border-white/10 bg-black/35 px-4 py-3">
            Hold to charge
            <span className="mt-2 block text-[#f2efe6]/70">Mouse / touch / space</span>
          </div>
          <div className="border border-white/10 bg-black/35 px-4 py-3">
            Release to disrupt
            <span className="mt-2 block text-[#f2efe6]/70">Strike the core node</span>
          </div>
        </div>
        <p className="mt-7 max-w-2xl border-l-2 border-[#d3170c] pl-5 text-base leading-7 text-white/62">
          The best designers do not create the most output. They know where to
          intervene.
        </p>
        <button
          type="button"
          onClick={onBegin}
          aria-label="Begin Hold The Line mission"
          className="mt-10 min-h-11 border border-[#d3170c]/70 bg-[#d3170c]/10 px-5 font-mono text-[11px] uppercase tracking-[0.24em] text-[#f2efe6] transition-colors hover:border-[#d8b35f] hover:bg-[#d8b35f]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d8b35f]"
        >
          Begin Mission
        </button>
      </div>
    </div>
  );
}
