"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import AsciiZombieBackground from "@/components/briefing/AsciiZombieBackground";
import ChapterShell from "@/components/briefing/ChapterShell";
import Reveal from "@/components/briefing/Reveal";

export default function WallChapter() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [motionReady, setMotionReady] = useState(false);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const fieldY = useTransform(scrollYProgress, [0, 1], [46, -56]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMotionReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div ref={sectionRef} className="relative">
      <ChapterShell
        id="wall"
        eyebrow="02 / THE WALL"
        hideEyebrow
        className="min-h-svh bg-[#030202] !px-0 !py-0 md:!px-0 md:!py-0"
        innerClassName="!max-w-none"
      >
        <motion.div
          aria-hidden="true"
          style={motionReady && !reducedMotion ? { y: fieldY } : undefined}
          className="pointer-events-none absolute -inset-x-6 -inset-y-24 z-0"
        >
          <AsciiZombieBackground
            opacity={1}
            cellSize={8}
            fontSize={9}
            speed={1.08}
            chars=" .,:;irsxXA253hMHGS#9B&@@"
            faceSrc="/images/zombie-face-reference.png"
            faceX={0.72}
            faceY={0.56}
            faceScale={0.54}
            faceIntensity={1.62}
            faceDelay={2.2}
            faceFadeIn={0.16}
            faceHold={5.8}
            faceFadeOut={1.45}
            faceRepeatDelay={1.25}
            glitchIntensity={1.78}
            scareShake={1.15}
            scareZoom={1.1}
            triggerRootMargin="-22% 0px -22% 0px"
          />
        </motion.div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_30%_48%,rgba(0,0,0,0.48),transparent_38%),radial-gradient(ellipse_at_68%_48%,rgba(211,23,12,0.18),transparent_35%),linear-gradient(90deg,rgba(3,2,2,0.88)_0%,rgba(3,2,2,0.48)_38%,rgba(3,2,2,0.08)_66%,rgba(3,2,2,0.48)_100%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(rgba(211,23,12,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(216,179,95,0.05)_1px,transparent_1px)] bg-[size:40px_40px] opacity-85"
        />

        <div className="relative z-10 mx-auto flex min-h-svh w-full max-w-7xl items-center px-5 py-24 md:px-10 md:py-28">
          <div className="relative max-w-[44rem] overflow-hidden border border-white/15 bg-white/[0.04] px-5 py-7 shadow-[0_24px_86px_rgba(0,0,0,0.56),inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-md md:px-7 md:py-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(245,245,240,0.12),transparent_38%),radial-gradient(ellipse_at_92%_12%,rgba(211,23,12,0.18),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.09),transparent_32%,rgba(216,179,95,0.07)_68%,transparent)]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/55 to-transparent"
            />
            <div className="relative">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#d3170c] md:text-xs">
                02 / THE WALL
              </p>
              <Reveal>
                <h2 className="title-display mt-4 text-4xl font-bold leading-[1.04] text-[#f2efe6] [text-shadow:0_2px_18px_rgba(0,0,0,0.72)] sm:text-[2.75rem] md:text-[3.25rem]">
                  THE DANGER WAS
                  <span className="block">NEVER ONE TOOL.</span>
                </h2>
              </Reveal>
              <Reveal delay={0.15}>
                <p className="title-display mt-4 text-base text-[#ff321f] md:text-lg">
                  It was the system moving together.
                </p>
              </Reveal>
              <Reveal delay={0.25}>
                <p className="mt-6 max-w-xl text-sm leading-7 text-white/72 md:text-base">
                  The disruption is not one tool replacing one task.
                </p>
                <p className="mt-3 max-w-xl text-sm leading-7 text-white/72 md:text-base">
                  It is an entire industry changing its baseline at once.
                </p>
              </Reveal>
              <Reveal delay={0.35}>
                <p className="mt-7 max-w-2xl border-l-2 border-[#ff321f] pl-5 text-base leading-8 text-[#f2efe6] md:text-lg md:leading-8">
                  When everyone is copying, prompting, reacting, and
                  accelerating, the most valuable person is the one who stops
                  long enough to observe.
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </ChapterShell>
    </div>
  );
}
