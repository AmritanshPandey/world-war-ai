"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { FireSparksLayerProps } from "@/components/webgl/FireSparksLayer";
import { useParticleQuality } from "@/components/webgl/useParticleQuality";

const CanvasOverlay = dynamic<FireSparksLayerProps>(
  async () => {
    const [{ Canvas, useThree }, { default: FireSparksLayer }] =
      await Promise.all([
        import("@react-three/fiber"),
        import("@/components/webgl/FireSparksLayer"),
      ]);

    function ContextLossGuard({
      onContextLostChange,
    }: {
      onContextLostChange: (isLost: boolean) => void;
    }) {
      const gl = useThree((state) => state.gl);

      useEffect(() => {
        const canvas = gl.domElement;
        const handleContextLost = (event: Event) => {
          event.preventDefault();
          onContextLostChange(true);
        };
        const handleContextRestored = () => {
          onContextLostChange(false);
        };

        canvas.addEventListener("webglcontextlost", handleContextLost, false);
        canvas.addEventListener(
          "webglcontextrestored",
          handleContextRestored,
          false,
        );

        return () => {
          canvas.removeEventListener(
            "webglcontextlost",
            handleContextLost,
            false,
          );
          canvas.removeEventListener(
            "webglcontextrestored",
            handleContextRestored,
            false,
          );
        };
      }, [gl, onContextLostChange]);

      return null;
    }

    function CanvasOverlayComponent(props: FireSparksLayerProps) {
      const quality = useParticleQuality();
      const [webglAvailable] = useState(() => {
        if (typeof document === "undefined") {
          return false;
        }

        const testCanvas = document.createElement("canvas");
        const context =
          testCanvas.getContext("webgl") ||
          testCanvas.getContext("experimental-webgl");

        return Boolean(context);
      });
      const [contextLost, setContextLost] = useState(false);

      if (!webglAvailable) {
        return null;
      }

      return (
        <Canvas
          camera={{ position: [0, 0, 6], fov: 45 }}
          dpr={quality.dpr}
          frameloop={quality.reducedMotion || contextLost ? "demand" : "always"}
          gl={{
            alpha: true,
            antialias: false,
            powerPreference:
              quality.tier === "low-power-mobile"
                ? "low-power"
                : "high-performance",
          }}
          style={{
            background: "transparent",
            opacity: contextLost ? 0 : 1,
          }}
        >
          <ContextLossGuard onContextLostChange={setContextLost} />
          {contextLost ? null : <FireSparksLayer {...props} />}
        </Canvas>
      );
    }

    return CanvasOverlayComponent;
  },
  {
    loading: () => null,
    ssr: false,
  },
);

export default function WebGLOverlay({
  className,
  ...sparkProps
}: FireSparksLayerProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-[15] select-none",
        className,
      )}
      aria-hidden="true"
    >
      <CanvasOverlay {...sparkProps} />
    </div>
  );
}
