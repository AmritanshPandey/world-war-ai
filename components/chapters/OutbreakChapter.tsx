"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import ChapterShell from "@/components/briefing/ChapterShell";
import Reveal from "@/components/briefing/Reveal";
import { cn } from "@/lib/utils";

const SIGNALS = [
  {
    label: "GENERATE",
    x: 34,
    y: 18,
    delay: 0,
    mobile: true,
    detail: "Draft output multiplying",
  },
  {
    label: "PROTOTYPE",
    x: 72,
    y: 26,
    delay: 0.9,
    mobile: false,
    detail: "New interface variants",
  },
  {
    label: "CODE",
    x: 23,
    y: 43,
    delay: 0.3,
    mobile: true,
    detail: "Implementation compressed",
  },
  {
    label: "RESEARCH",
    x: 78,
    y: 52,
    delay: 1.4,
    mobile: false,
    detail: "Answers arrive too fast",
  },
  {
    label: "VISUALISE",
    x: 34,
    y: 62,
    delay: 0.6,
    mobile: false,
    detail: "Pictures become cheap",
  },
  {
    label: "ITERATE",
    x: 75,
    y: 64,
    delay: 1.1,
    mobile: false,
    detail: "Cycles collapse inward",
  },
  {
    label: "AUTOMATE",
    x: 52,
    y: 73,
    delay: 1.7,
    mobile: true,
    detail: "Repeat work dissolves",
  },
];

const INITIAL_ACTIVE = ["GENERATE", "CODE", "PROTOTYPE"];

export default function OutbreakChapter() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [motionReady, setMotionReady] = useState(false);
  const [activeSignals, setActiveSignals] = useState<string[]>(INITIAL_ACTIVE);
  const [focusSignal, setFocusSignal] = useState(SIGNALS[0].label);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const alertGlow = useTransform(scrollYProgress, [0, 0.55], [0.08, 0.42]);
  const activeSignalSet = useMemo(
    () => new Set(activeSignals),
    [activeSignals],
  );
  const activeSignal = SIGNALS.find((signal) => signal.label === focusSignal);
  const activeLoad = Math.round((activeSignals.length / SIGNALS.length) * 100);

  const toggleSignal = (label: string) => {
    setFocusSignal(label);
    setActiveSignals((currentSignals) => {
      if (currentSignals.includes(label)) {
        return currentSignals.length === 1
          ? currentSignals
          : currentSignals.filter((signal) => signal !== label);
      }

      return [...currentSignals, label];
    });
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMotionReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div ref={sectionRef} className="relative">
      <ChapterShell
        id="outbreak"
        eyebrow="01 / THE OUTBREAK"
        className="min-h-svh !py-0 md:!py-0"
        innerClassName="flex min-h-svh max-w-7xl flex-col justify-center py-14 sm:py-16 md:py-20"
      >
        {/* rising red alert atmosphere */}
        <motion.div
          aria-hidden="true"
          style={motionReady ? { opacity: reducedMotion ? 0.25 : alertGlow } : undefined}
          className="pointer-events-none absolute -inset-x-24 -inset-y-40 -z-10 opacity-25 bg-[radial-gradient(circle_at_72%_38%,rgba(211,23,12,0.2),transparent_44%),radial-gradient(circle_at_18%_80%,rgba(211,23,12,0.1),transparent_38%)]"
        />
        {/* low-opacity tactical grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-24 -inset-y-40 -z-10 opacity-[0.05] [background-image:linear-gradient(rgba(245,245,240,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(245,245,240,0.5)_1px,transparent_1px)] [background-size:56px_56px]"
        />

        <div className="mt-8 grid items-center gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.78fr)] xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.78fr)] xl:gap-16">
          <div className="max-w-3xl">
            <Reveal>
              <h2 className="title-display text-4xl font-bold leading-[1.04] text-[#f2efe6] sm:text-6xl xl:text-7xl">
                AI DID NOT
                <span className="block">ARRIVE SLOWLY.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="title-display mt-6 text-xl text-[#d3170c] md:text-2xl">
                It flooded the workflow.
              </p>
            </Reveal>
            <Reveal delay={0.25}>
              <p className="mt-8 max-w-xl text-lg leading-8 text-white/70 md:text-xl md:leading-9">
                At first, AI looked like another tool.
              </p>
              <p className="mt-4 max-w-xl text-lg leading-8 text-white/70 md:text-xl md:leading-9">
                Then it began writing, generating, prototyping, coding,
                summarising, and producing at a speed that changed the baseline
                for everyone.
              </p>
            </Reveal>
          </div>

          {/* interactive capability flood map */}
          <div
            className="relative min-h-[17rem] overflow-hidden border border-white/12 bg-black/25 shadow-[0_30px_120px_rgba(0,0,0,0.28)] backdrop-blur-[2px] sm:min-h-[24rem] xl:min-h-[30rem]"
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(circle_at_54%_47%,rgba(211,23,12,0.19),transparent_32%),radial-gradient(circle_at_42%_70%,rgba(245,245,240,0.08),transparent_44%)]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(245,245,240,0.72)_1px,transparent_1px),linear-gradient(90deg,rgba(245,245,240,0.72)_1px,transparent_1px)] [background-size:42px_42px]"
            />
            <svg
              aria-hidden="true"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full"
            >
              <defs>
                <filter id="outbreak-signal-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="1.2" />
                </filter>
              </defs>
              {SIGNALS.map((signal) => {
                const isActive = activeSignalSet.has(signal.label);

                return (
                  <line
                    key={signal.label}
                    x1="54"
                    y1="46"
                    x2={signal.x}
                    y2={signal.y}
                    stroke={isActive ? "#d3170c" : "rgba(245,245,240,0.2)"}
                    strokeWidth={isActive ? 0.6 : 0.2}
                    strokeDasharray={isActive ? "4 3" : "2 7"}
                    filter={isActive ? "url(#outbreak-signal-glow)" : undefined}
                    opacity={isActive ? 0.78 : 0.32}
                  />
                );
              })}
            </svg>

            <motion.div
              aria-hidden="true"
              animate={
                reducedMotion
                  ? false
                  : {
                      scale: [1, 1.1, 1],
                      opacity: [0.22, 0.5, 0.22],
                    }
              }
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-1/2 top-[46%] h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#d3170c]/35 bg-[#d3170c]/10 shadow-[0_0_70px_rgba(211,23,12,0.2)]"
            />
            <div className="absolute left-1/2 top-[46%] flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center border border-[#d3170c]/55 bg-black/65 shadow-[0_0_34px_rgba(211,23,12,0.18)]">
              <span className="font-mono text-[11px] uppercase tracking-[0.26em] text-[#d3170c]">
                {activeLoad}%
              </span>
            </div>

            {SIGNALS.map((signal) => {
              const isActive = activeSignalSet.has(signal.label);
              const isFocused = focusSignal === signal.label;

              return (
                <div
                  key={signal.label}
                  style={{
                    top: `${signal.y}%`,
                    left: `${signal.x}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  className={cn(
                    "absolute",
                    signal.mobile ? "block" : "hidden sm:block",
                  )}
                >
                  <motion.button
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => toggleSignal(signal.label)}
                    onPointerEnter={() => setFocusSignal(signal.label)}
                    animate={
                      reducedMotion
                        ? { y: isFocused ? -2 : 0 }
                        : { y: isFocused ? -4 : [0, -5, 0] }
                    }
                    transition={{
                      duration: isFocused ? 0.22 : 5.4,
                      repeat: reducedMotion || isFocused ? 0 : Infinity,
                      delay: signal.delay,
                      ease: "easeInOut",
                    }}
                    whileTap={{ scale: 0.96 }}
                    className={cn(
                      "flex min-w-[7.6rem] items-center justify-center gap-2 border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.22em] transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d3170c] md:text-[11px]",
                      isActive
                        ? "border-[#d3170c]/70 bg-[#d3170c]/18 text-white shadow-[0_0_30px_rgba(211,23,12,0.18)]"
                        : "border-white/14 bg-black/52 text-white/52 hover:border-white/30 hover:text-white/75",
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 shrink-0",
                        isActive ? "bg-[#d3170c]" : "bg-white/30",
                      )}
                    />
                    {signal.label}
                  </motion.button>
                </div>
              );
            })}

            <div className="absolute inset-x-5 bottom-5 border-t border-white/12 pt-4">
              <div className="flex items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.28em]">
                <span className="text-white/42">Workflow load</span>
                <span className="text-[#d3170c]">{activeSignals.length}/7</span>
              </div>
              <div className="mt-3 h-[3px] bg-white/10">
                <motion.div
                  animate={{ scaleX: activeSignals.length / SIGNALS.length }}
                  transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
                  className="h-full origin-left bg-[#d3170c]"
                />
              </div>
              <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-white/62">
                {activeSignal?.detail}
              </p>
            </div>
          </div>
        </div>
      </ChapterShell>
    </div>
  );
}
