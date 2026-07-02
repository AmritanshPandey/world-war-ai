"use client";

import Image from "next/image";
import WebGLOverlay from "@/components/webgl/WebGLOverlay";
import { useReducedMotionPreference, useScrollProgress } from "@/lib/scroll-store";
import { clamp, cn } from "@/lib/utils";

type LayerStyle = {
  opacity: number;
  transform?: string;
};

function smoothstep(value: number) {
  const clampedValue = clamp(value, 0, 1);

  return clampedValue * clampedValue * (3 - 2 * clampedValue);
}

function reveal(progress: number, start: number, end: number) {
  return smoothstep((progress - start) / (end - start));
}

function layerStyle(
  opacity: number,
  reducedMotion: boolean,
  translateY = 0,
  scale = 1,
): LayerStyle {
  return {
    opacity: clamp(opacity, 0, 1),
    transform: reducedMotion
      ? undefined
      : `translate3d(0, ${translateY.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`,
  };
}

function centeredLayerStyle(
  opacity: number,
  reducedMotion: boolean,
  translateY = 0,
  scale = 1,
): LayerStyle {
  return {
    opacity: clamp(opacity, 0, 1),
    transform: reducedMotion
      ? "translateX(-50%)"
      : `translate3d(-50%, ${translateY.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`,
  };
}

export default function LayeredScrollScene() {
  const progress = useScrollProgress();
  const reducedMotion = useReducedMotionPreference();

  const cityReveal = reveal(progress, 0.08, 0.24);
  const groundReveal = reveal(progress, 0.2, 0.38);
  const towerReveal = reveal(progress, 0.34, 0.52);
  const signalReveal = reveal(progress, 0.48, 0.66);
  const patternReveal = reveal(progress, 0.58, 0.76);
  const finalReveal = reveal(progress, 0.78, 0.96);
  const drift = reducedMotion ? 0 : progress;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black"
    >
      <div
        className="absolute inset-0"
        style={layerStyle(1, reducedMotion, drift * -46, 1 + drift * 0.045)}
      >
        <Image
          src="/images/bg.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-75 saturate-[0.74]"
        />
      </div>

      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_76%_22%,rgba(216,179,95,0.2),transparent_24rem),radial-gradient(circle_at_20%_20%,rgba(120,45,38,0.24),transparent_22rem),linear-gradient(180deg,rgba(0,0,0,0.16)_0%,rgba(0,0,0,0.58)_64%,rgba(0,0,0,0.94)_100%)]"
        style={layerStyle(0.86, reducedMotion)}
      />

      <div
        data-layer="city"
        className="absolute inset-x-[-12%] bottom-[13%] h-[28vh]"
        style={layerStyle(
          0.16 + cityReveal * 0.64,
          reducedMotion,
          30 - cityReveal * 42 - drift * 16,
          1 + cityReveal * 0.035,
        )}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.34)_48%,rgba(0,0,0,0.92)_100%),repeating-linear-gradient(90deg,rgba(245,245,240,0.02)_0_18px,rgba(16,16,15,0.94)_18px_50px,transparent_50px_66px)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(ellipse_at_50%_100%,rgba(216,179,95,0.12),transparent_58%)]" />
      </div>

      <div
        data-layer="ground"
        className="absolute inset-x-[-8%] bottom-[-7%] h-[35vh] bg-[radial-gradient(ellipse_at_28%_70%,rgba(216,179,95,0.16),transparent_28%),radial-gradient(ellipse_at_66%_52%,rgba(120,45,38,0.18),transparent_32%),linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.92)_66%)]"
        style={layerStyle(
          0.18 + groundReveal * 0.7,
          reducedMotion,
          48 - groundReveal * 54,
        )}
      />

      <div
        data-layer="tower"
        className="absolute bottom-[9%] left-[58%] h-[56vh] w-[5.5rem] bg-[linear-gradient(90deg,rgba(0,0,0,0.9),rgba(216,179,95,0.34),rgba(0,0,0,0.96)),linear-gradient(180deg,rgba(245,245,240,0.2),rgba(35,35,31,0.86)_38%,rgba(0,0,0,0.98))] [clip-path:polygon(43%_0,64%_3%,81%_100%,17%_100%)] md:w-32"
        style={centeredLayerStyle(
          towerReveal * 0.72,
          reducedMotion,
          52 - towerReveal * 64 - drift * 18,
          0.94 + towerReveal * 0.08,
        )}
      />

      <div
        data-layer="signals"
        className={cn(
          "absolute inset-0",
          "bg-[linear-gradient(90deg,transparent_0%,rgba(216,179,95,0.13)_49.9%,rgba(216,179,95,0.34)_50%,rgba(216,179,95,0.13)_50.1%,transparent_100%),repeating-linear-gradient(0deg,transparent_0_44px,rgba(216,179,95,0.06)_44px_45px)]",
        )}
        style={layerStyle(signalReveal * 0.72, reducedMotion)}
      />

      <div
        data-layer="pattern"
        className="absolute inset-x-0 top-[18%] h-[54vh] bg-[radial-gradient(ellipse_at_50%_50%,rgba(49,93,76,0.28),transparent_62%),repeating-linear-gradient(115deg,transparent_0_28px,rgba(245,245,240,0.035)_28px_29px)]"
        style={layerStyle(
          patternReveal * 0.7,
          reducedMotion,
          22 - patternReveal * 30,
        )}
      />

      <WebGLOverlay
        origin={[1.18, -1.82, 0]}
        mobileOrigin={[0.22, -1.88, 0]}
        spread={[2.65, 0.5, 1.12]}
        desktopCount={560}
        mobileCount={170}
        heroSparkCount={90}
        intensity={1 + patternReveal * 0.7}
        windStrength={0.4 + patternReveal * 0.38}
        opacity={0.2 + groundReveal * 0.34 + finalReveal * 0.32}
      />

      <div
        data-layer="final-grade"
        className="absolute inset-0 bg-[radial-gradient(circle_at_48%_44%,transparent_0%,rgba(0,0,0,0.22)_34%,rgba(0,0,0,0.86)_100%),linear-gradient(180deg,rgba(0,0,0,0.1)_0%,rgba(120,45,38,0.28)_64%,rgba(0,0,0,0.76)_100%)]"
        style={layerStyle(finalReveal * 0.86, reducedMotion)}
      />
    </div>
  );
}
