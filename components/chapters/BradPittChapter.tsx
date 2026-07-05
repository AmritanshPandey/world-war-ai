"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

import backgroundImage from "@/public/images/bg1.png";
import bradImage from "@/public/images/bp.png";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function BradPittChapter() {
  const sectionRef = useRef<HTMLElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const characterRef = useRef<HTMLDivElement>(null);
  const foregroundRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const background = backgroundRef.current;
    const character = characterRef.current;
    const foreground = foregroundRef.current;

    if (!section || !background || !character || !foreground) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const pointer = { x: 0, y: 0 };
    const eased = { x: 0, y: 0, progress: 0 };
    let frame = 0;

    const updateTarget = () => {
      const rect = section.getBoundingClientRect();
      const range = Math.max(1, rect.height + window.innerHeight);
      eased.progress = clamp((window.innerHeight - rect.top) / range, 0, 1);
    };

    const render = () => {
      frame = 0;
      eased.x += (pointer.x - eased.x) * 0.08;
      eased.y += (pointer.y - eased.y) * 0.08;
      updateTarget();

      const lift = (eased.progress - 0.5) * 18;
      const bgX = eased.x * -8;
      const bgY = eased.y * -5 + lift * -0.18;
      const charX = eased.x * 18;
      const charY = eased.y * 10 + lift;
      const fgX = eased.x * -16;

      background.style.transform = `translate3d(${bgX.toFixed(2)}px, ${bgY.toFixed(2)}px, 0) scale(1.015)`;
      character.style.transform = `translate3d(${charX.toFixed(2)}px, ${charY.toFixed(2)}px, 0)`;
      foreground.style.transform = `translate3d(${fgX.toFixed(2)}px, ${(lift * 0.45).toFixed(2)}px, 0)`;
    };

    const requestRender = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(render);
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") {
        return;
      }

      const rect = section.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      requestRender();
    };

    updateTarget();
    render();
    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    window.addEventListener("scroll", requestRender, { passive: true });
    window.addEventListener("resize", requestRender);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }

      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("scroll", requestRender);
      window.removeEventListener("resize", requestRender);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="brad-pitt"
      className="story-slide relative isolate flex min-h-svh items-center overflow-hidden border-t border-white/10 bg-black text-white"
    >
      <div
        ref={backgroundRef}
        className="absolute inset-0 z-0 h-full min-h-svh w-full will-change-transform"
      >
        <Image
          src={backgroundImage}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_48%] brightness-[0.94] saturate-[0.96]"
        />
      </div>

      <div
        aria-hidden="true"
        className="absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(0,0,0,0.66)_0%,rgba(0,0,0,0.28)_30%,rgba(0,0,0,0.04)_58%,rgba(0,0,0,0.24)_100%),linear-gradient(180deg,rgba(0,0,0,0.02)_0%,rgba(0,0,0,0.04)_54%,rgba(0,0,0,0.58)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 z-[3] bg-[linear-gradient(180deg,rgba(0,0,0,0.72)_0%,rgba(0,0,0,0.66)_58%,rgba(0,0,0,0.18)_100%)] lg:hidden"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 z-[2] opacity-[0.04] [background-image:linear-gradient(rgba(245,245,240,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(245,245,240,0.7)_1px,transparent_1px)] [background-size:48px_48px] lg:opacity-0"
      />

      <div
        ref={characterRef}
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-4svh] right-[-34vw] z-20 aspect-[1689/2823] h-[clamp(28rem,76svh,52rem)] will-change-transform sm:right-[-14vw] md:right-[-4vw] lg:right-[clamp(6rem,13vw,18rem)] lg:h-[clamp(34rem,86svh,58rem)]"
      >
        <Image
          src={bradImage}
          alt=""
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 34vw, 28vw"
          className="object-contain object-bottom drop-shadow-[0_28px_46px_rgba(0,0,0,0.48)]"
          priority
        />
      </div>

      <div
        ref={foregroundRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[-8%] bottom-[-7%] z-20 h-[24svh] bg-[radial-gradient(ellipse_at_66%_82%,rgba(211,23,12,0.16),transparent_30%),linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.58)_78%,#020202_100%)] will-change-transform"
      />

      <div className="relative z-30 mx-auto flex min-h-svh w-full max-w-7xl items-end px-5 pb-[9svh] pt-20 md:px-10 lg:px-14">
        <div className="max-w-[28rem]">
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#d3170c] [text-shadow:0_2px_12px_rgba(0,0,0,0.9)]">
            Character dossier / World War Z
          </p>
          <h2 className="title-display mt-4 text-5xl font-bold leading-none text-[#f2efe6] [text-shadow:0_6px_28px_rgba(0,0,0,0.9)] md:text-6xl">
            Gerry Lane
          </h2>
          <p className="mt-3 font-mono text-xs uppercase tracking-[0.28em] text-white/78 [text-shadow:0_2px_12px_rgba(0,0,0,0.9)]">
            Brad Pitt
          </p>
          <p className="mt-6 max-w-sm border-l-2 border-[#d3170c] pl-4 text-sm leading-7 text-white/72 [text-shadow:0_2px_12px_rgba(0,0,0,0.9)] md:text-base">
            He survives by reading the crowd, noticing the anomaly, and turning
            panic into a pattern.
          </p>
        </div>
      </div>
    </section>
  );
}
