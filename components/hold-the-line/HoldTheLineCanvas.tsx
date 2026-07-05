"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import * as THREE from "three";
import type { HoldTheLineState } from "@/components/hold-the-line/hooks/useHoldTheLineGame";
import {
  PARTICLE_COUNTS,
  type InfectionChain,
  type PulseEvent,
  type ScannerPosition,
} from "@/components/hold-the-line/lib/game-config";
import {
  createSeededRandom,
} from "@/components/hold-the-line/lib/chain-factory";
import { useParticleQuality } from "@/components/webgl/useParticleQuality";
import HelicopterModel from "@/components/webgl/swarm/HelicopterModel";
import type { ParticleQualityTier } from "@/components/webgl/useParticleQuality";

type HoldTheLineCanvasProps = {
  scannerRef: RefObject<ScannerPosition>;
  state: HoldTheLineState;
};

function normToWorld(position: { x: number; y: number }) {
  return {
    x: position.x * 5.2,
    y: -position.y * 3.05,
  };
}

function countForTier(tier: ParticleQualityTier, reducedMotion: boolean) {
  if (reducedMotion) return PARTICLE_COUNTS.reducedMotion;
  if (tier === "low-power-mobile" || tier === "mobile") return PARTICLE_COUNTS.mobile;
  if (tier === "tablet") return PARTICLE_COUNTS.tablet;
  return PARTICLE_COUNTS.desktop;
}

function makeParticles(count: number) {
  const random = createSeededRandom(count * 17 + 9);

  return Array.from({ length: count }, () => {
    const x = (random() * 2 - 1) * 5.3;
    const y = -3.5 + random() * 4.1;

    return {
      baseX: x,
      baseY: y,
      x,
      y,
      z: (random() - 0.5) * 1.4,
      seed: random() * 1000,
      size: 0.035 + random() * 0.055,
    };
  });
}

function ContextLossGuard({
  onContextLostChange,
}: {
  onContextLostChange: (lost: boolean) => void;
}) {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    const canvas = gl.domElement;
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      onContextLostChange(true);
    };
    const handleContextRestored = () => onContextLostChange(false);

    canvas.addEventListener("webglcontextlost", handleContextLost, false);
    canvas.addEventListener("webglcontextrestored", handleContextRestored, false);

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

function AmbientSwarm({
  altitude,
  pulses,
  reducedMotion,
  scannerRef,
  tier,
}: {
  altitude: number;
  pulses: PulseEvent[];
  reducedMotion: boolean;
  scannerRef: RefObject<ScannerPosition>;
  tier: ParticleQualityTier;
}) {
  const count = countForTier(tier, reducedMotion);
  const particles = useMemo(() => makeParticles(count), [count]);
  const positions = useMemo(() => new Float32Array(count * 3), [count]);
  const colors = useMemo(() => new Float32Array(count * 3), [count]);
  const sizes = useMemo(() => new Float32Array(count), [count]);
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const pulsesRef = useRef(pulses);
  const altitudeRef = useRef(altitude);

  useEffect(() => {
    pulsesRef.current = pulses;
    altitudeRef.current = altitude;
  }, [altitude, pulses]);

  useFrame(() => {
    const now = performance.now();
    const time = now * 0.001;
    const scanner = scannerRef.current;
    const scannerWorld = normToWorld(scanner);
    const danger = 1 - altitudeRef.current / 100;

    particles.forEach((particle, index) => {
      let targetX =
        particle.baseX +
        Math.sin(time * 0.22 + particle.seed) * (0.16 + danger * 0.22);
      let targetY =
        particle.baseY +
        ((time * (reducedMotion ? 0.035 : 0.085 + danger * 0.08) +
          particle.seed) %
          4.8);

      if (targetY > 2.35) {
        targetY -= 4.8;
      }

      if (scanner.active) {
        const dx = targetX - scannerWorld.x;
        const dy = targetY - scannerWorld.y;
        const scanDistance = Math.max(0.001, Math.hypot(dx, dy));
        const influence = Math.max(0, 1 - scanDistance / 1.15);

        targetX += (dx / scanDistance) * influence * 0.18;
        targetY += (dy / scanDistance) * influence * 0.12;
      }

      for (const pulse of pulsesRef.current) {
        const pulseAge = (now - pulse.createdAt) / 1000;
        const pulseWorld = normToWorld(pulse);
        const dx = targetX - pulseWorld.x;
        const dy = targetY - pulseWorld.y;
        const pulseDistance = Math.max(0.001, Math.hypot(dx, dy));
        const ring = Math.max(
          0,
          1 - Math.abs(pulseDistance - pulseAge * 2.5) / (0.32 + pulse.charge * 0.4),
        );

        targetX += (dx / pulseDistance) * ring * 0.2;
        targetY += (dy / pulseDistance) * ring * 0.16;
      }

      particle.x += (targetX - particle.x) * (reducedMotion ? 0.035 : 0.07);
      particle.y += (targetY - particle.y) * (reducedMotion ? 0.035 : 0.07);

      const offset = index * 3;
      const ember = particle.seed % 1 > 0.94;
      positions[offset] = particle.x;
      positions[offset + 1] = particle.y;
      positions[offset + 2] = particle.z;
      colors[offset] = ember ? 0.78 : 0.11 + danger * 0.18;
      colors[offset + 1] = ember ? 0.14 : 0.09;
      colors[offset + 2] = ember ? 0.06 : 0.08;
      sizes[index] = particle.size * (ember ? 1.3 : 1);
    });

    const positionAttribute = geometryRef.current?.getAttribute("position") as
      | THREE.BufferAttribute
      | undefined;
    const colorAttribute = geometryRef.current?.getAttribute("color") as
      | THREE.BufferAttribute
      | undefined;
    const sizeAttribute = geometryRef.current?.getAttribute("size") as
      | THREE.BufferAttribute
      | undefined;

    if (positionAttribute && colorAttribute && sizeAttribute) {
      positionAttribute.needsUpdate = true;
      colorAttribute.needsUpdate = true;
      sizeAttribute.needsUpdate = true;
    }
  });

  return (
    <points>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial
        transparent
        vertexColors
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        vertexShader={`
          attribute float size;
          varying vec3 vColor;
          void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (260.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          varying vec3 vColor;
          void main() {
            float d = distance(gl_PointCoord, vec2(0.5));
            float alpha = smoothstep(0.5, 0.12, d);
            gl_FragColor = vec4(vColor, alpha * 0.82);
          }
        `}
      />
    </points>
  );
}

function ChainVisual({
  chain,
  selected,
}: {
  chain: InfectionChain;
  selected: boolean;
}) {
  const nodes = chain.displayNodes ?? chain.nodes;
  const linePositions = new Float32Array(chain.links.length * 6);
  const exposed = selected || chain.state === "exposed";
  const disrupted = chain.state === "disrupted";
  const completed = chain.state === "completed" || chain.state === "expired";
  const color =
    chain.type === "falseSignal"
      ? "#d3170c"
      : exposed
        ? "#d8b35f"
        : "#a9140d";
  const opacity = completed ? 0.18 : disrupted ? 0.12 : exposed ? 0.78 : 0.46;

  chain.links.forEach(([from, to], index) => {
    const a = normToWorld(nodes[from]);
    const b = normToWorld(nodes[to]);
    const offset = index * 6;

    linePositions[offset] = a.x;
    linePositions[offset + 1] = a.y;
    linePositions[offset + 2] = 0.18;
    linePositions[offset + 3] = b.x;
    linePositions[offset + 4] = b.y;
    linePositions[offset + 5] = 0.18;
  });

  return (
    <group>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={opacity}
          depthWrite={false}
        />
      </lineSegments>
      {nodes.map((node, index) => {
        const position = normToWorld(node);
        const core = chain.coreIndex === index;
        const showCore =
          core && chain.type !== "critical"
            ? true
            : core && (selected || chain.state === "exposed");
        const radius =
          (showCore ? node.radius * 1.8 : node.radius) *
          (disrupted ? 1.7 : completed ? 0.55 : 1);

        return (
          <mesh key={node.id} position={[position.x, position.y, 0.24]}>
            <sphereGeometry args={[radius * 4.1, 14, 10]} />
            <meshBasicMaterial
              color={showCore ? "#d8b35f" : chain.type === "falseSignal" ? "#d3170c" : "#8f120c"}
              transparent
              opacity={completed ? 0.22 : disrupted ? 0.32 : showCore ? 0.96 : 0.78}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function PulseRing({ pulse }: { pulse: PulseEvent }) {
  const ref = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const position = normToWorld(pulse);

  useFrame(() => {
    const age = (performance.now() - pulse.createdAt) / 1000;
    const scale = 0.4 + age * (2.0 + pulse.charge * 1.8);
    const opacity = Math.max(0, 0.42 - age * 0.5);

    if (ref.current) {
      ref.current.scale.setScalar(scale);
    }

    if (materialRef.current) {
      materialRef.current.opacity = opacity;
    }
  });

  return (
    <mesh ref={ref} position={[position.x, position.y, 0.42]}>
      <ringGeometry args={[0.17, 0.19, 64]} />
      <meshBasicMaterial
        ref={materialRef}
        color={pulse.result === "miss" || pulse.result === "false" ? "#d3170c" : "#f2efe6"}
        transparent
        opacity={0.38}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function GameScene({
  scannerRef,
  state,
}: {
  scannerRef: RefObject<ScannerPosition>;
  state: HoldTheLineState;
}) {
  const quality = useParticleQuality();
  const heliProgressRef = useRef(0.52);

  useEffect(() => {
    heliProgressRef.current = 0.52 + (1 - state.evacuationAltitude / 100) * 0.42;
  }, [state.evacuationAltitude]);

  return (
    <>
      <fog attach="fog" args={["#3a332b", 7, 14]} />
      <group position={[0, -0.1, 0]}>
        <AmbientSwarm
          altitude={state.evacuationAltitude}
          pulses={state.pulses}
          reducedMotion={state.reducedMotion || quality.reducedMotion}
          scannerRef={scannerRef}
          tier={quality.tier}
        />
        {state.activeChains.map((chain) => (
          <ChainVisual
            key={chain.id}
            chain={chain}
            selected={state.selectedChainId === chain.id}
          />
        ))}
        {state.pulses.map((pulse) => (
          <PulseRing key={pulse.id} pulse={pulse} />
        ))}
      </group>
      <group position={[0.7, 0.24, 0]} scale={0.78}>
        <HelicopterModel
          progressRef={heliProgressRef}
          reducedMotion={state.reducedMotion || quality.reducedMotion}
        />
      </group>
    </>
  );
}

export default function HoldTheLineCanvas({
  scannerRef,
  state,
}: HoldTheLineCanvasProps) {
  const quality = useParticleQuality();
  const [contextLost, setContextLost] = useState(false);
  const [webglAvailable] = useState(() => {
    if (typeof document === "undefined") return false;

    const canvas = document.createElement("canvas");

    return Boolean(
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl"),
    );
  });

  if (!webglAvailable) {
    return (
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_32%,rgba(216,179,95,0.12),transparent_26%),radial-gradient(circle_at_50%_72%,rgba(211,23,12,0.18),transparent_38%),#030303]" />
    );
  }

  return (
    <Canvas
      camera={{ position: [0, 0.12, 8.2], fov: 42 }}
      dpr={quality.dpr}
      frameloop={quality.reducedMotion || contextLost ? "demand" : "always"}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference:
          quality.tier === "low-power-mobile" ? "low-power" : "high-performance",
      }}
      style={{
        background: "transparent",
        opacity: contextLost ? 0 : 1,
      }}
    >
      <color attach="background" args={["#030303"]} />
      <ContextLossGuard onContextLostChange={setContextLost} />
      {contextLost ? null : <GameScene scannerRef={scannerRef} state={state} />}
    </Canvas>
  );
}
