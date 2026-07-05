"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";

export type PatternPair = {
  ai: string;
  designer: string;
  meaning: string;
  blindSpot: string;
  verdict: string;
};

type PatternMeaningLabProps = {
  patterns: PatternPair[];
};

type PatternColumnProps = {
  label: string;
  mode: "ai" | "designer";
  patterns: PatternPair[];
  activeIndex: number;
  onSelect: (index: number) => void;
};

function PatternColumn({
  label,
  mode,
  patterns,
  activeIndex,
  onSelect,
}: PatternColumnProps) {
  const isAi = mode === "ai";

  return (
    <div className="relative z-10">
      <p
        className={cn(
          "font-mono text-[11px] uppercase tracking-[0.3em]",
          isAi ? "text-[#d3170c]" : "text-[#f2efe6]",
        )}
      >
        {label}
      </p>
      <ul className="mt-4 space-y-1.5">
        {patterns.map((pattern, index) => {
          const active = index === activeIndex;
          const title = isAi ? pattern.ai : pattern.designer;
          const detail = isAi ? pattern.blindSpot : pattern.verdict;

          return (
            <li key={`${mode}-${pattern.ai}-${pattern.designer}`}>
              <button
                type="button"
                aria-controls="pattern-meaning-lens"
                aria-pressed={active}
                onClick={() => onSelect(index)}
                onFocus={() => onSelect(index)}
                onMouseEnter={() => onSelect(index)}
                className={cn(
                  "group flex min-h-[3.9rem] w-full items-center gap-3 border px-3 py-2 text-left transition duration-300 focus:outline-none focus-visible:border-[#f2efe6]/70 focus-visible:ring-2 focus-visible:ring-[#d3170c]/55",
                  active
                    ? "border-[#d3170c]/70 bg-[#d3170c]/12 shadow-[0_0_28px_rgba(211,23,12,0.15)]"
                    : "border-white/10 bg-white/[0.025] hover:border-white/22 hover:bg-white/[0.045]",
                )}
              >
                <span
                  className={cn(
                    "font-mono text-[10px] transition",
                    active
                      ? "text-[#d3170c]"
                      : isAi
                        ? "text-[#d3170c]/50"
                        : "text-white/35",
                  )}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block leading-tight transition",
                      isAi
                        ? "text-base text-white/68 md:text-lg"
                        : "title-display text-lg text-[#f2efe6] md:text-xl",
                      active && (isAi ? "text-white/90" : "text-[#f2efe6]"),
                    )}
                  >
                    {title}
                  </span>
                  <span
                    className={cn(
                      "mt-1 block text-xs leading-5 transition",
                      active ? "text-white/62" : "text-white/38",
                    )}
                  >
                    {detail}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function PatternMeaningLab({
  patterns,
}: PatternMeaningLabProps) {
  const defaultIndex = Math.max(
    0,
    patterns.findIndex((pattern) => pattern.designer === "Meaning"),
  );
  const [activeIndex, setActiveIndex] = useState(defaultIndex);
  const reducedMotion = useReducedMotion();
  const activePattern = patterns[activeIndex] ?? patterns[0];
  const activeY = 15 + activeIndex * 14;

  if (!activePattern) {
    return null;
  }

  return (
    <div className="relative mt-12">
      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 z-0 hidden h-full w-full opacity-90 lg:block"
      >
        <defs>
          <linearGradient id="pattern-signal" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="rgba(211,23,12,0.08)" />
            <stop offset="45%" stopColor="rgba(211,23,12,0.72)" />
            <stop offset="55%" stopColor="rgba(242,239,230,0.7)" />
            <stop offset="100%" stopColor="rgba(242,239,230,0.08)" />
          </linearGradient>
        </defs>
        <path
          d="M 18 15 C 32 15 36 50 50 50 C 64 50 68 15 82 15"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="0.25"
        />
        <path
          d="M 18 29 C 32 29 36 50 50 50 C 64 50 68 29 82 29"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="0.25"
        />
        <path
          d="M 18 43 C 32 43 36 50 50 50 C 64 50 68 43 82 43"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="0.25"
        />
        <path
          d="M 18 57 C 32 57 36 50 50 50 C 64 50 68 57 82 57"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="0.25"
        />
        <path
          d="M 18 71 C 32 71 36 50 50 50 C 64 50 68 71 82 71"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="0.25"
        />
        <path
          d="M 18 85 C 32 85 36 50 50 50 C 64 50 68 85 82 85"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="0.25"
        />
        <motion.path
          animate={{
            d: `M 18 ${activeY} C 32 ${activeY} 36 50 50 50 C 64 50 68 ${activeY} 82 ${activeY}`,
          }}
          fill="none"
          stroke="url(#pattern-signal)"
          strokeLinecap="round"
          strokeWidth="0.7"
          transition={
            reducedMotion
              ? { duration: 0 }
              : { duration: 0.32, ease: [0.22, 0.61, 0.36, 1] }
          }
        />
        <circle cx="50" cy="50" r="1.3" fill="#d3170c" />
      </svg>

      <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.9fr)_minmax(0,1fr)] lg:items-stretch lg:gap-8">
        <div className="order-2 lg:order-1">
          <PatternColumn
            label="AI output feed"
            mode="ai"
            patterns={patterns}
            activeIndex={activeIndex}
            onSelect={setActiveIndex}
          />
        </div>

        <div
          id="pattern-meaning-lens"
          aria-live="polite"
          className="order-1 flex min-h-[17rem] flex-col justify-between overflow-hidden border-y border-white/15 bg-white/[0.035] px-5 py-6 shadow-[0_22px_70px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-sm lg:order-2 lg:my-8"
        >
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/42">
              Meaning lens
            </p>
            <motion.div
              key={activeIndex}
              initial={reducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.24 }}
            >
              <h3 className="title-display mt-6 text-3xl font-bold leading-none text-[#f2efe6] md:text-4xl">
                {activePattern.designer}
              </h3>
              <p className="mt-5 text-base leading-7 text-white/74 md:text-lg md:leading-8">
                {activePattern.meaning}
              </p>
            </motion.div>
          </div>

          <div className="mt-8 border-t border-white/12 pt-5">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#d3170c]/80">
                  AI misses
                </p>
                <p className="mt-2 text-sm leading-6 text-white/58">
                  {activePattern.blindSpot}
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#f2efe6]/72">
                  Designer move
                </p>
                <p className="mt-2 text-sm leading-6 text-white/68">
                  {activePattern.verdict}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="order-3">
          <PatternColumn
            label="Designer signal"
            mode="designer"
            patterns={patterns}
            activeIndex={activeIndex}
            onSelect={setActiveIndex}
          />
        </div>
      </div>
    </div>
  );
}
