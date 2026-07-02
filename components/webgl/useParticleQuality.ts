"use client";

import { useEffect, useState } from "react";

export type ParticleQualityTier =
  | "high-desktop"
  | "desktop"
  | "tablet"
  | "mobile"
  | "low-power-mobile";

export type ParticleQuality = {
  tier: ParticleQualityTier;
  ambientCount: number;
  heroSparkCount: number;
  dpr: [number, number];
  reducedMotion: boolean;
};

type NavigatorWithMemory = Navigator & {
  deviceMemory?: number;
};

const DEFAULT_QUALITY: ParticleQuality = {
  tier: "mobile",
  ambientCount: 180,
  heroSparkCount: 30,
  dpr: [1, 1.25],
  reducedMotion: false,
};

function readParticleQuality(): ParticleQuality {
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const width = window.innerWidth;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const navigatorWithMemory = navigator as NavigatorWithMemory;
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = navigatorWithMemory.deviceMemory ?? 4;

  const lowPower =
    cores <= 2 ||
    memory <= 2 ||
    (width < 768 && (cores <= 4 || memory <= 4));

  if (reducedMotion) {
    return {
      tier: lowPower ? "low-power-mobile" : "mobile",
      ambientCount: 90,
      heroSparkCount: 0,
      dpr: [1, width < 768 ? 1.25 : 1.5],
      reducedMotion,
    };
  }

  if (lowPower) {
    return {
      tier: "low-power-mobile",
      ambientCount: 100,
      heroSparkCount: 18,
      dpr: [1, 1.25],
      reducedMotion,
    };
  }

  if (width < 768) {
    return {
      tier: "mobile",
      ambientCount: 180,
      heroSparkCount: 30,
      dpr: [1, 1.25],
      reducedMotion,
    };
  }

  if (width < 1024 || coarsePointer) {
    return {
      tier: "tablet",
      ambientCount: 350,
      heroSparkCount: 50,
      dpr: [1, 1.25],
      reducedMotion,
    };
  }

  if (cores >= 8 && memory >= 8) {
    return {
      tier: "high-desktop",
      ambientCount: 700,
      heroSparkCount: 100,
      dpr: [1, 1.5],
      reducedMotion,
    };
  }

  return {
    tier: "desktop",
    ambientCount: 500,
    heroSparkCount: 75,
    dpr: [1, 1.5],
    reducedMotion,
  };
}

export function useParticleQuality() {
  const [quality, setQuality] = useState<ParticleQuality>(DEFAULT_QUALITY);

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const tabletQuery = window.matchMedia(
      "(min-width: 768px) and (max-width: 1023px)",
    );
    const pointerQuery = window.matchMedia("(pointer: coarse)");
    const updateQuality = () => {
      setQuality(readParticleQuality());
    };

    updateQuality();
    window.addEventListener("resize", updateQuality, { passive: true });
    reducedMotionQuery.addEventListener("change", updateQuality);
    mobileQuery.addEventListener("change", updateQuality);
    tabletQuery.addEventListener("change", updateQuality);
    pointerQuery.addEventListener("change", updateQuality);

    return () => {
      window.removeEventListener("resize", updateQuality);
      reducedMotionQuery.removeEventListener("change", updateQuality);
      mobileQuery.removeEventListener("change", updateQuality);
      tabletQuery.removeEventListener("change", updateQuality);
      pointerQuery.removeEventListener("change", updateQuality);
    };
  }, []);

  return quality;
}
