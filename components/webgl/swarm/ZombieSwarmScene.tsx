"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import type { SwarmPointer } from "@/components/webgl/swarm/swarm-core";

const SwarmCanvas = dynamic(
  () => import("@/components/webgl/swarm/SwarmCanvas"),
  { ssr: false, loading: () => null },
);

/**
 * Hero swarm scene host. Measures scroll progress through the pinned hero
 * (the nearest `[data-hero-pin]` ancestor) and normalized pointer position,
 * both written into refs so the WebGL scene can read them per frame without
 * triggering React renders.
 */
export default function ZombieSwarmScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const pointerRef = useRef<SwarmPointer>({ x: 0, y: 0, active: false });

  useEffect(() => {
    const container = containerRef.current;
    const pin = container?.closest<HTMLElement>("[data-hero-pin]");

    if (!pin) {
      return;
    }

    let frame = 0;

    const update = () => {
      frame = 0;

      const rect = pin.getBoundingClientRect();
      const range = Math.max(1, rect.height - window.innerHeight);

      progressRef.current = Math.min(1, Math.max(0, -rect.top / range));
    };

    const requestUpdate = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }

      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, []);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      pointerRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointerRef.current.y = (event.clientY / window.innerHeight) * 2 - 1;
      pointerRef.current.active = true;
    };

    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 select-none"
    >
      <SwarmCanvas progressRef={progressRef} pointerRef={pointerRef} />
    </div>
  );
}
