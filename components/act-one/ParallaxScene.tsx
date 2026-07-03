"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

/**
 * Photographic backdrop behind the WebGL swarm scene: storm sky, ruined-city
 * skyline cutout, and the dark ground mass. Sky and skyline get a gentle
 * scroll + mouse parallax, tuned to move in the same direction (and less)
 * than the WebGL camera rig so the layered depth reads as one scene.
 */
export default function ParallaxScene() {
  const rootRef = useRef<HTMLDivElement>(null);
  const skyRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const sky = skyRef.current;
    const city = cityRef.current;

    if (!root || !sky || !city) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const pin = root.closest<HTMLElement>("[data-hero-pin]");
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const pointer = { x: 0, y: 0 };
    const eased = { skyX: 0, skyY: 0, cityX: 0, cityY: 0 };
    let frame = 0;

    const handlePointerMove = (event: PointerEvent) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
    };

    const tick = () => {
      const rect = pin?.getBoundingClientRect();
      const range = rect ? Math.max(1, rect.height - window.innerHeight) : 1;
      const progress = rect
        ? Math.min(1, Math.max(0, -rect.top / range))
        : 0;

      // Far sky barely moves; the nearer skyline moves more — both in the
      // same direction as the WebGL camera drift (~40px at full climb).
      const targetSkyX = pointer.x * -6;
      const targetSkyY = progress * 12 + pointer.y * -4;
      const targetCityX = pointer.x * -16;
      const targetCityY = progress * 30 + pointer.y * -9;

      eased.skyX += (targetSkyX - eased.skyX) * 0.06;
      eased.skyY += (targetSkyY - eased.skyY) * 0.06;
      eased.cityX += (targetCityX - eased.cityX) * 0.06;
      eased.cityY += (targetCityY - eased.cityY) * 0.06;

      sky.style.transform = `translate3d(${eased.skyX.toFixed(2)}px, ${eased.skyY.toFixed(2)}px, 0) scale(1.08)`;
      city.style.transform = `translate3d(${eased.cityX.toFixed(2)}px, ${eased.cityY.toFixed(2)}px, 0) scale(1.05)`;
      frame = window.requestAnimationFrame(tick);
    };

    if (finePointer) {
      window.addEventListener("pointermove", handlePointerMove, {
        passive: true,
      });
    }

    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);

      if (finePointer) {
        window.removeEventListener("pointermove", handlePointerMove);
      }
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="absolute inset-0 z-0 overflow-hidden bg-[#0a0908]"
    >
      <div ref={skyRef} className="absolute inset-0 will-change-transform">
        <Image
          src="/images/bg.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />

        <div
          data-layer="grade"
          className="absolute inset-0 bg-[radial-gradient(circle_at_78%_64%,rgba(255,166,74,0.16),transparent_36%),linear-gradient(90deg,rgba(0,0,0,0.58)_0%,transparent_46%,rgba(0,0,0,0.22)_100%),linear-gradient(180deg,rgba(0,0,0,0.34)_0%,transparent_38%,rgba(0,0,0,0.7)_100%)]"
        />
      </div>

      <div
        ref={cityRef}
        data-layer="ruined-city"
        className="absolute inset-x-0 bottom-0 h-[46vh] will-change-transform md:h-[54vh]"
      >
        <Image
          src="/images/b.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-bottom brightness-[0.72] saturate-[0.85]"
        />
        {/* smoke haze so the skyline recedes behind the swarm */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(24,20,16,0.18)_55%,rgba(10,9,8,0.42)_100%)]" />
      </div>

      <div
        data-layer="ground-swarm"
        className="absolute inset-x-[-8%] bottom-[-2%] z-[1] h-[34vh] bg-[radial-gradient(ellipse_at_70%_42%,rgba(0,0,0,0.4),transparent_58%),linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.22)_32%,rgba(0,0,0,0.55)_62%,rgba(0,0,0,0.88)_86%,#020202_100%)] md:h-[36vh]"
      />
    </div>
  );
}
