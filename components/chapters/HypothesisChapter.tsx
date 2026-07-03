"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import ChapterShell from "@/components/briefing/ChapterShell";
import Reveal from "@/components/briefing/Reveal";
import VideoChapter from "@/components/briefing/VideoChapter";

const TEST_SEQUENCE = [
  "Observe",
  "Form a hypothesis",
  "Create a low-cost test",
  "Test against reality",
  "Learn",
  "Adapt",
];

const EYEBROW = "05 / TEST THE HYPOTHESIS";

export default function HypothesisChapter() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [motionReady, setMotionReady] = useState(false);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end 0.7"],
  });
  const confidence = useTransform(scrollYProgress, [0.25, 0.85], [0.06, 1]);
  const uncertainOpacity = useTransform(scrollYProgress, [0.55, 0.7], [1, 0]);
  const confirmedOpacity = useTransform(scrollYProgress, [0.55, 0.7], [0, 1]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMotionReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div ref={sectionRef}>
      <ChapterShell
        id="hypothesis"
        eyebrow={EYEBROW}
        tone="hud"
        hideEyebrow
        className="!px-0 !py-0 md:!px-0 md:!py-0"
        innerClassName="!max-w-none"
      >
        <VideoChapter
          src="/media/2.mp4"
          logLabel="Validation log / 02"
          variant="validation"
          hideTopLeftMark
          loop
        >
          <div className="mx-auto grid min-h-[calc(100svh-17rem)] w-full max-w-7xl content-between gap-y-12 lg:grid-cols-[minmax(0,22rem)_minmax(12rem,1fr)_minmax(15rem,22rem)] lg:grid-rows-[auto_1fr_auto] lg:gap-x-8 xl:grid-cols-[minmax(0,26rem)_minmax(18rem,1fr)_minmax(17rem,25rem)] xl:gap-x-12">
            <div className="lg:col-start-1 lg:row-start-1">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-hud md:text-xs">
                {EYEBROW}
              </p>
              <Reveal>
                <h2 className="title-display mt-6 text-4xl font-bold leading-[1.05] text-[#f2efe6] [text-shadow:0_2px_18px_rgba(0,0,0,0.72)] sm:text-5xl lg:text-5xl xl:text-6xl">
                  AN INSIGHT IS NOT
                  <span className="block">A SOLUTION UNTIL</span>
                  <span className="block text-hud">IT SURVIVES REALITY.</span>
                </h2>
              </Reveal>
            </div>

            {/* animated test sequence */}
            <div className="lg:col-start-3 lg:row-start-1 lg:self-start lg:pt-16">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
                Test sequence
              </p>
              <ol className="mt-6">
                {TEST_SEQUENCE.map((step, index) => (
                  <Reveal key={step} delay={0.15 + index * 0.18}>
                    <li className="flex items-baseline gap-4 border-t border-white/10 py-4 last:border-b">
                      <span className="font-mono text-[10px] text-hud/80">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="cinematic-text text-sm text-white/75 md:text-base">
                        {step}
                      </span>
                    </li>
                  </Reveal>
                ))}
              </ol>

              {/* validation readout */}
              <div className="mt-10" aria-hidden="true">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.3em]">
                  <span className="text-white/40">Signal confidence</span>
                  <span className="relative">
                    <motion.span
                      style={motionReady ? { opacity: reducedMotion ? 0 : uncertainOpacity } : undefined}
                      className="text-[#d3170c]"
                    >
                      Unconfirmed
                    </motion.span>
                    <motion.span
                      style={motionReady ? { opacity: reducedMotion ? 1 : confirmedOpacity } : undefined}
                      className="absolute right-0 opacity-0 text-hud"
                    >
                      Confirmed
                    </motion.span>
                  </span>
                </div>
                <div className="mt-3 h-[3px] w-full bg-white/10">
                  <motion.div
                    style={motionReady ? { scaleX: reducedMotion ? 0.85 : confidence } : undefined}
                    className="h-full origin-left scale-x-[0.06] bg-gradient-to-r from-[#d3170c] to-hud"
                  />
                </div>
              </div>
            </div>

            <Reveal
              delay={0.15}
              className="max-w-sm lg:col-start-1 lg:row-start-3 lg:self-end"
            >
              <p className="text-base leading-7 text-white/72 md:text-lg md:leading-8">
                AI makes it cheaper to create. That does not make every output
                correct.
              </p>
              <p className="mt-5 text-base leading-7 text-white/72 md:text-lg md:leading-8">
                The opportunity is not to avoid failure. It is to make smaller,
                faster, more intelligent failures.
              </p>
            </Reveal>

            <Reveal
              delay={0.2}
              className="max-w-sm lg:col-start-3 lg:row-start-3 lg:self-end"
            >
              <p className="title-display border-l-2 border-hud pl-6 text-2xl leading-snug text-[#f2efe6] [text-shadow:0_2px_18px_rgba(0,0,0,0.7)] md:text-3xl">
                The designer who learns fastest gains the advantage.
              </p>
            </Reveal>
          </div>
        </VideoChapter>
      </ChapterShell>
    </div>
  );
}
