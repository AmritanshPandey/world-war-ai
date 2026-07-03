"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import type * as THREE from "three";
import FireSparksLayer from "@/components/webgl/FireSparksLayer";
import HelicopterModel from "@/components/webgl/swarm/HelicopterModel";
import ZombieSwarm from "@/components/webgl/swarm/ZombieSwarm";
import {
  FOG_COLOR,
  smoothstep01,
  type SwarmPointer,
} from "@/components/webgl/swarm/swarm-core";
import { useParticleQuality } from "@/components/webgl/useParticleQuality";

export type SwarmCanvasProps = {
  progressRef: RefObject<number>;
  pointerRef: RefObject<SwarmPointer>;
};

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
      canvas.removeEventListener("webglcontextlost", handleContextLost, false);
      canvas.removeEventListener(
        "webglcontextrestored",
        handleContextRestored,
        false,
      );
    };
  }, [gl, onContextLostChange]);

  return null;
}

/** Gentle mouse parallax + a slow upward camera drift as the swarm climbs. */
function CameraRig({
  children,
  pointerRef,
  progressRef,
  reducedMotion,
}: {
  children: ReactNode;
  pointerRef: RefObject<SwarmPointer>;
  progressRef: RefObject<number>;
  reducedMotion: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const group = groupRef.current;

    if (!group) {
      return;
    }

    if (reducedMotion) {
      group.rotation.set(0, 0, 0);
      group.position.set(0, -0.16, 0);

      return;
    }

    const pointer = pointerRef.current ?? { x: 0, y: 0 };
    const climb = smoothstep01(progressRef.current ?? 0);
    const targetRotationY = pointer.x * 0.028;
    const targetRotationX = pointer.y * 0.018;
    const targetY = -climb * 0.32;

    group.rotation.y += (targetRotationY - group.rotation.y) * 0.045;
    group.rotation.x += (targetRotationX - group.rotation.x) * 0.045;
    group.position.y += (targetY - group.position.y) * 0.06;
  });

  return <group ref={groupRef}>{children}</group>;
}

export default function SwarmCanvas({
  progressRef,
  pointerRef,
}: SwarmCanvasProps) {
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
      camera={{ position: [0, 0.4, 8.6], fov: 40 }}
      dpr={quality.dpr}
      frameloop={quality.reducedMotion || contextLost ? "demand" : "always"}
      gl={{
        alpha: true,
        antialias: true,
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
      <fog attach="fog" args={[FOG_COLOR, 8, 15]} />
      <ContextLossGuard onContextLostChange={setContextLost} />
      {contextLost ? null : (
        <CameraRig
          pointerRef={pointerRef}
          progressRef={progressRef}
          reducedMotion={quality.reducedMotion}
        >
          <HelicopterModel
            progressRef={progressRef}
            reducedMotion={quality.reducedMotion}
          />
          <ZombieSwarm
            progressRef={progressRef}
            pointerRef={pointerRef}
            tier={quality.tier}
            reducedMotion={quality.reducedMotion}
          />
          {/* burning-city embers drifting up between the swarm and camera */}
          <FireSparksLayer
            origin={[1.5, -2.9, 0.7]}
            mobileOrigin={[0.4, -2.9, 0.7]}
            spread={[3.4, 0.7, 1.1]}
            desktopCount={700}
            mobileCount={220}
            heroSparkCount={120}
            intensity={1.35}
            windStrength={0.55}
            opacity={0.85}
          />
        </CameraRig>
      )}
    </Canvas>
  );
}
