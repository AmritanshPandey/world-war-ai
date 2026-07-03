"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Fades and drifts the hero title out as the pinned hero scrolls, so the
 * swarm takes the frame at the climax. Writes styles directly (no re-render
 * per scroll frame); leaves the title fully visible under reduced motion.
 */
export default function HeroTitleFade({ children }: { children: ReactNode }) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    const pin = element?.closest<HTMLElement>("[data-hero-pin]");

    if (!element || !pin) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let frame = 0;

    const update = () => {
      frame = 0;

      const rect = pin.getBoundingClientRect();
      const range = Math.max(1, rect.height - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / range));
      // Fully visible until 20% in, gone by 55%.
      const fade = Math.min(1, Math.max(0, (progress - 0.2) / 0.35));

      element.style.opacity = String(1 - fade);
      element.style.transform = `translate3d(0, ${(-fade * 60).toFixed(1)}px, 0)`;
      element.style.pointerEvents = fade > 0.6 ? "none" : "";
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

  return (
    <div ref={elementRef} className="will-change-[opacity,transform]">
      {children}
    </div>
  );
}
