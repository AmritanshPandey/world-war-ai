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
import type { SpotTheHumanState } from "@/components/spot-the-human/hooks/useSpotTheHumanGame";
import {
  PARTICLE_COUNTS,
  type CrowdFigure,
  type CrowdPose,
  type FigureRole,
  type ScanPing,
  type ScannerPosition,
} from "@/components/spot-the-human/lib/game-config";
import { createSeededRandom } from "@/components/spot-the-human/lib/crowd-generator";
import HelicopterModel from "@/components/webgl/swarm/HelicopterModel";
import {
  useParticleQuality,
  type ParticleQualityTier,
} from "@/components/webgl/useParticleQuality";

type SpotTheHumanCanvasProps = {
  scannerRef: RefObject<ScannerPosition>;
  state: SpotTheHumanState;
};

const POSE_COLORS: Record<FigureRole, string> = {
  infected: "#151211",
  target: "#2b302f",
  decoy: "#58140f",
  cluster: "#211515",
};

function normToWorld(position: { x: number; y: number }, z = 0) {
  return new THREE.Vector3(position.x * 5.35, -position.y * 3.05, z);
}

function wrap(value: number, min: number, max: number) {
  const range = max - min;
  return ((((value - min) % range) + range) % range) + min;
}

function successVisible(status: string) {
  return status === "round1Success" || status === "round2Success" || status === "round3Success";
}

function particleCountForTier(tier: ParticleQualityTier, reducedMotion: boolean) {
  if (reducedMotion) return PARTICLE_COUNTS.reducedMotion;
  if (tier === "low-power-mobile" || tier === "mobile") return PARTICLE_COUNTS.mobile;
  if (tier === "tablet") return PARTICLE_COUNTS.tablet;
  return PARTICLE_COUNTS.desktop;
}

function posePoints(pose: CrowdPose) {
  switch (pose) {
    case "rush":
      return [
        [-0.22, -0.52],
        [-0.06, -0.48],
        [0.02, -0.1],
        [0.2, -0.2],
        [0.28, -0.02],
        [0.12, 0.12],
        [0.08, 0.34],
        [-0.12, 0.34],
        [-0.18, 0.1],
        [-0.3, 0.0],
        [-0.24, -0.18],
      ];
    case "climb":
      return [
        [-0.2, -0.54],
        [-0.04, -0.44],
        [-0.02, -0.14],
        [0.2, 0.02],
        [0.15, 0.2],
        [0.02, 0.12],
        [0.04, 0.36],
        [-0.14, 0.35],
        [-0.18, 0.12],
        [-0.34, 0.2],
        [-0.38, 0.04],
        [-0.18, -0.1],
      ];
    case "reach":
      return [
        [-0.18, -0.5],
        [0.02, -0.5],
        [0.06, -0.12],
        [0.36, 0.12],
        [0.3, 0.27],
        [0.06, 0.18],
        [0.02, 0.36],
        [-0.16, 0.35],
        [-0.16, 0.12],
        [-0.36, 0.02],
        [-0.3, -0.16],
        [-0.1, -0.08],
      ];
    case "fall":
      return [
        [-0.28, -0.36],
        [-0.02, -0.44],
        [0.14, -0.22],
        [0.36, -0.26],
        [0.42, -0.08],
        [0.12, 0.02],
        [0.08, 0.24],
        [-0.1, 0.3],
        [-0.18, 0.08],
        [-0.42, 0.1],
        [-0.44, -0.08],
        [-0.18, -0.12],
      ];
    case "crouch":
      return [
        [-0.32, -0.38],
        [-0.08, -0.44],
        [0.18, -0.34],
        [0.28, -0.14],
        [0.1, 0.04],
        [0.04, 0.25],
        [-0.14, 0.25],
        [-0.22, 0.06],
        [-0.42, 0.0],
        [-0.42, -0.2],
      ];
    case "sidestep":
      return [
        [-0.14, -0.52],
        [0.08, -0.5],
        [0.1, -0.12],
        [0.34, -0.05],
        [0.32, 0.1],
        [0.08, 0.1],
        [0.04, 0.36],
        [-0.14, 0.36],
        [-0.18, 0.12],
        [-0.38, 0.04],
        [-0.34, -0.12],
        [-0.12, -0.12],
      ];
    case "calm":
    case "still":
    default:
      return [
        [-0.12, -0.54],
        [0.12, -0.54],
        [0.1, -0.16],
        [0.2, 0.02],
        [0.1, 0.14],
        [0.04, 0.36],
        [-0.14, 0.36],
        [-0.2, 0.14],
        [-0.1, 0.02],
      ];
  }
}

function createPoseGeometry(pose: CrowdPose) {
  const body = new THREE.Shape();
  const points = posePoints(pose);
  const [firstX, firstY] = points[0];

  body.moveTo(firstX, firstY);
  points.slice(1).forEach(([x, y]) => body.lineTo(x, y));
  body.closePath();

  const head = new THREE.Shape();
  const headX = pose === "rush" ? 0.03 : pose === "fall" ? 0.16 : -0.02;
  const headY = pose === "fall" ? 0.36 : 0.48;
  head.absarc(headX, headY, 0.115, 0, Math.PI * 2, false);

  const geometry = new THREE.ShapeGeometry([body, head], 4);
  geometry.center();

  return geometry;
}

function animatedFigurePosition({
  figure,
  reducedMotion,
  round,
  target,
  threat,
  time,
}: {
  figure: CrowdFigure;
  reducedMotion: boolean;
  round: number;
  target: CrowdFigure;
  threat: number;
  time: number;
}) {
  const stillFactor = reducedMotion ? 0.12 : 1;
  let x = figure.baseX;
  let y = figure.baseY;
  let rotation = 0;

  if (figure.role === "target") {
    if (round === 1) {
      x += Math.sin(time * 0.52 + figure.seed) * 0.025 * stillFactor;
      y += Math.sin(time * 0.34 + figure.seed) * 0.065 * stillFactor;
      rotation = -0.04;
    } else if (round === 2) {
      x += Math.sin(time * 0.74 + figure.seed) * 0.075 * stillFactor;
      y += Math.sin(time * 0.27 + figure.seed) * 0.025 * stillFactor;
      rotation = Math.sin(time * 0.55) * 0.04 * stillFactor;
    } else {
      x += Math.sin(time * 0.34 + figure.seed) * 0.018 * stillFactor;
      y += Math.cos(time * 0.24 + figure.seed) * 0.012 * stillFactor;
      rotation = 0.02;
    }

    return { x, y, rotation };
  }

  if (round === 1) {
    y = wrap(
      figure.baseY - time * figure.speed * 0.32 * stillFactor,
      -0.48,
      0.88,
    );
    x += Math.sin(time * 1.1 + figure.seed) * figure.sway * stillFactor + 0.025 * threat;
    rotation = 0.18 + Math.sin(time * 1.6 + figure.seed) * 0.11 * stillFactor;
  } else if (round === 2) {
    y = wrap(
      figure.baseY - time * figure.speed * 0.42 * stillFactor,
      -0.68,
      0.86,
    );
    x += Math.sin(time * (figure.role === "decoy" ? 2.7 : 1.3) + figure.seed) *
      figure.sway *
      stillFactor;

    const dx = x - target.baseX;
    const dy = y - target.baseY;
    const gap = Math.max(0.001, Math.hypot(dx, dy));
    const avoid = Math.max(0, 1 - gap / target.avoidRadius);
    x += (dx / gap) * avoid * 0.12;
    y += (dy / gap) * avoid * 0.08;
    rotation =
      (figure.role === "decoy" ? -0.22 : 0.12) +
      Math.sin(time * 1.5 + figure.seed) * 0.14 * stillFactor;
  } else {
    y = wrap(
      figure.baseY - time * figure.speed * 0.48 * stillFactor * (0.7 + threat * 0.55),
      -0.62,
      0.9,
    );
    x += Math.sin(time * 1.8 + figure.seed) * figure.sway * 0.8 * stillFactor;

    const dx = x - target.baseX;
    const dy = y - target.baseY;
    const gap = Math.max(0.001, Math.hypot(dx, dy));
    const avoid = Math.max(0, 1 - gap / (target.avoidRadius + 0.02));
    x += (dx / gap) * avoid * 0.17;
    y += (dy / gap) * avoid * 0.13;
    rotation = Math.sin(time * 1.1 + figure.seed) * 0.09 * stillFactor;
  }

  return { x, y, rotation };
}

function ContextLossGuard({
  onContextLostChange,
}: {
  onContextLostChange: (lost: boolean) => void;
}) {
  const gl = useThree((canvasState) => canvasState.gl);

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

function InstancedFigureGroup({
  figures,
  pose,
  reducedMotion,
  role,
  state,
}: {
  figures: CrowdFigure[];
  pose: CrowdPose;
  reducedMotion: boolean;
  role: FigureRole;
  state: SpotTheHumanState;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const geometry = useMemo(() => createPoseGeometry(pose), [pose]);
  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const position = useMemo(() => new THREE.Vector3(), []);
  const quaternion = useMemo(() => new THREE.Quaternion(), []);
  const scale = useMemo(() => new THREE.Vector3(), []);
  const euler = useMemo(() => new THREE.Euler(), []);

  useFrame((frameState) => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    const time = reducedMotion ? 0.8 : frameState.clock.elapsedTime;
    const success = successVisible(state.status);

    figures.forEach((figure, index) => {
      const animated = success
        ? { x: figure.baseX, y: figure.baseY, rotation: 0 }
        : animatedFigurePosition({
            figure,
            reducedMotion,
            round: state.currentRound,
            target: state.scene.target,
            threat: state.threat,
            time,
          });
      const z = -0.45 + figure.depth * 0.9;
      const world = normToWorld(animated, z);
      const silhouetteScale = 0.17 * figure.scale * (0.72 + figure.depth * 0.46);

      position.set(world.x, world.y, world.z);
      euler.set(0, 0, animated.rotation);
      quaternion.setFromEuler(euler);
      scale.set(silhouetteScale, silhouetteScale * 1.18, silhouetteScale);
      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(index, matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;

    if (materialRef.current) {
      const flicker =
        role === "decoy" && !reducedMotion
          ? 0.15 + Math.sin(time * 7.2 + figures.length) * 0.08
          : 0;
      materialRef.current.opacity =
        role === "decoy" ? 0.34 + flicker : role === "cluster" ? 0.48 : 0.62;
    }
  });

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, figures.length]}>
      <meshBasicMaterial
        ref={materialRef}
        color={POSE_COLORS[role]}
        depthWrite={false}
        side={THREE.DoubleSide}
        transparent
        opacity={role === "decoy" ? 0.38 : 0.62}
      />
    </instancedMesh>
  );
}

function CrowdField({
  reducedMotion,
  state,
}: {
  reducedMotion: boolean;
  state: SpotTheHumanState;
}) {
  const grouped = useMemo(() => {
    const groups = new Map<string, CrowdFigure[]>();

    state.scene.figures.forEach((figure) => {
      const key = `${figure.role}:${figure.pose}`;
      const list = groups.get(key) ?? [];
      list.push(figure);
      groups.set(key, list);
    });

    return Array.from(groups.entries()).map(([key, figures]) => {
      const [role, pose] = key.split(":") as [FigureRole, CrowdPose];
      return { key, figures, role, pose };
    });
  }, [state.scene.figures]);

  return (
    <group>
      {grouped.map((group) => (
        <InstancedFigureGroup
          key={group.key}
          figures={group.figures}
          pose={group.pose}
          reducedMotion={reducedMotion}
          role={group.role}
          state={state}
        />
      ))}
    </group>
  );
}

function TargetHuman({
  reducedMotion,
  state,
}: {
  reducedMotion: boolean;
  state: SpotTheHumanState;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const ringMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const geometry = useMemo(
    () => createPoseGeometry(state.scene.target.pose),
    [state.scene.target.pose],
  );
  const visibleSignal =
    state.scannerConfidence > 0.42 ||
    state.hintUsedRounds.includes(state.currentRound) ||
    successVisible(state.status);

  useFrame((frameState) => {
    const time = reducedMotion ? 0.8 : frameState.clock.elapsedTime;
    const target = state.scene.target;
    const animated = animatedFigurePosition({
      figure: target,
      reducedMotion,
      round: state.currentRound,
      target,
      threat: state.threat,
      time,
    });
    const world = normToWorld(animated, 0.62);
    const scale = 0.2 * target.scale;

    if (meshRef.current) {
      meshRef.current.position.copy(world);
      meshRef.current.rotation.z = animated.rotation;
      meshRef.current.scale.set(scale, scale * 1.2, scale);
    }

    if (materialRef.current) {
      materialRef.current.color.set(
        visibleSignal ? "#78837e" : successVisible(state.status) ? "#d8b35f" : "#202423",
      );
      materialRef.current.opacity = visibleSignal ? 0.92 : 0.56;
    }

    if (ringRef.current) {
      ringRef.current.position.set(world.x, world.y, 0.66);
      const pulse = 1 + Math.sin(time * 2.6) * 0.04;
      ringRef.current.scale.setScalar(
        pulse * (0.72 + state.scannerConfidence * 0.4),
      );
    }

    if (ringMaterialRef.current) {
      ringMaterialRef.current.opacity = visibleSignal
        ? 0.18 + state.scannerConfidence * 0.34
        : 0;
    }
  });

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <group>
      <mesh ref={meshRef} geometry={geometry}>
        <meshBasicMaterial
          ref={materialRef}
          color="#202423"
          depthWrite={false}
          side={THREE.DoubleSide}
          transparent
          opacity={0.58}
        />
      </mesh>
      <mesh ref={ringRef}>
        <ringGeometry args={[0.19, 0.205, 48]} />
        <meshBasicMaterial
          ref={ringMaterialRef}
          color="#d8b35f"
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          transparent
          opacity={0}
        />
      </mesh>
    </group>
  );
}

function AshField({
  reducedMotion,
  scannerRef,
  tier,
}: {
  reducedMotion: boolean;
  scannerRef: RefObject<ScannerPosition>;
  tier: ParticleQualityTier;
}) {
  const count = particleCountForTier(tier, reducedMotion);
  const particles = useMemo(() => {
    const random = createSeededRandom(count * 31 + 7);

    return Array.from({ length: count }, () => ({
      x: (random() * 2 - 1) * 5.8,
      y: random() * 6.8 - 3.1,
      z: random() * 1.6 - 0.9,
      seed: random() * 1000,
      size: 0.028 + random() * 0.05,
    }));
  }, [count]);
  const positions = useMemo(() => new Float32Array(count * 3), [count]);
  const colors = useMemo(() => new Float32Array(count * 3), [count]);
  const sizes = useMemo(() => new Float32Array(count), [count]);
  const geometryRef = useRef<THREE.BufferGeometry>(null);

  useFrame((frameState) => {
    const time = reducedMotion ? 1 : frameState.clock.elapsedTime;
    const scanner = scannerRef.current;
    const scannerWorld = normToWorld(scanner);

    particles.forEach((particle, index) => {
      let x = particle.x + Math.sin(time * 0.16 + particle.seed) * 0.15;
      let y = wrap(
        particle.y - time * (reducedMotion ? 0.015 : 0.055),
        -3.2,
        3.35,
      );

      if (scanner.active) {
        const dx = x - scannerWorld.x;
        const dy = y - scannerWorld.y;
        const dist = Math.max(0.001, Math.hypot(dx, dy));
        const influence = Math.max(0, 1 - dist / 1.1);
        x += (dx / dist) * influence * 0.12;
        y += (dy / dist) * influence * 0.1;
      }

      const offset = index * 3;
      const ember = particle.seed % 1 > 0.92;
      positions[offset] = x;
      positions[offset + 1] = y;
      positions[offset + 2] = particle.z;
      colors[offset] = ember ? 0.72 : 0.36;
      colors[offset + 1] = ember ? 0.11 : 0.31;
      colors[offset + 2] = ember ? 0.06 : 0.26;
      sizes[index] = particle.size * (ember ? 1.6 : 1);
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
            gl_PointSize = size * (240.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          varying vec3 vColor;
          void main() {
            float d = distance(gl_PointCoord, vec2(0.5));
            float alpha = smoothstep(0.5, 0.08, d);
            gl_FragColor = vec4(vColor, alpha * 0.72);
          }
        `}
      />
    </points>
  );
}

function CityBackdrop() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const position = useMemo(() => new THREE.Vector3(), []);
  const quaternion = useMemo(() => new THREE.Quaternion(), []);
  const scale = useMemo(() => new THREE.Vector3(), []);
  const buildings = useMemo(() => {
    const random = createSeededRandom(901);

    return Array.from({ length: 30 }, (_, index) => {
      const x = -5.8 + index * 0.4 + (random() - 0.5) * 0.18;
      const h = 0.55 + random() * 1.25;
      const w = 0.2 + random() * 0.28;
      const y = 1.96 - h * 0.5 + random() * 0.16;

      return { x, y, h, w };
    });
  }, []);

  useEffect(() => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    buildings.forEach((building, index) => {
      position.set(building.x, building.y, -1.24);
      quaternion.identity();
      scale.set(building.w, building.h, 0.08);
      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(index, matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  }, [buildings, matrix, position, quaternion, scale]);

  return (
    <group>
      <instancedMesh ref={meshRef} args={[undefined, undefined, buildings.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#090807" transparent opacity={0.72} />
      </instancedMesh>
      <mesh position={[0, 1.52, -1.18]} scale={[6.1, 1.6, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          color="#4b0e09"
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={0.08}
        />
      </mesh>
    </group>
  );
}

function FogBands({ threat }: { threat: number }) {
  return (
    <group>
      <mesh position={[0, -1.58, 0.82]} scale={[6.4, 1.25, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#0f0d0b" transparent opacity={0.38 + threat * 0.12} />
      </mesh>
      <mesh position={[0, 0.86, 0.76]} scale={[6.7, 0.85, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#2a211b" transparent opacity={0.12 + threat * 0.16} />
      </mesh>
    </group>
  );
}

function PulseRing({ ping }: { ping: ScanPing }) {
  const ref = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const color =
    ping.tone === "success" || ping.tone === "coherence"
      ? "#d8b35f"
      : ping.tone === "warning"
        ? "#d3170c"
        : "#f2efe6";
  const position = normToWorld(ping, 0.72);

  useFrame(() => {
    const age = (Date.now() - ping.createdAt) / 1000;
    const scale = 0.5 + age * (ping.tone === "success" ? 2.2 : 1.6);
    const opacity = Math.max(0, 0.42 - age * 0.34);

    if (ref.current) {
      ref.current.scale.setScalar(scale);
    }

    if (materialRef.current) {
      materialRef.current.opacity = opacity;
    }
  });

  return (
    <mesh ref={ref} position={[position.x, position.y, position.z]}>
      <ringGeometry args={[0.16, 0.172, 64]} />
      <meshBasicMaterial
        ref={materialRef}
        color={color}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        transparent
        opacity={0.38}
      />
    </mesh>
  );
}

function GameScene({
  scannerRef,
  state,
}: {
  scannerRef: RefObject<ScannerPosition>;
  state: SpotTheHumanState;
}) {
  const quality = useParticleQuality();
  const reducedMotion = state.reducedMotion || quality.reducedMotion;
  const heliProgressRef = useRef(0.62);

  useEffect(() => {
    heliProgressRef.current = 0.58 + state.threat * 0.38;
  }, [state.threat]);

  return (
    <>
      <fog attach="fog" args={["#18110f", 7, 14]} />
      <CityBackdrop />
      <group position={[0, -0.18, 0]}>
        <CrowdField reducedMotion={reducedMotion} state={state} />
        <TargetHuman reducedMotion={reducedMotion} state={state} />
      </group>
      {state.scanPings.map((ping) => (
        <PulseRing key={ping.id} ping={ping} />
      ))}
      <AshField
        reducedMotion={reducedMotion}
        scannerRef={scannerRef}
        tier={quality.tier}
      />
      <FogBands threat={state.threat} />
      <group position={[0.78, 0.12, 0]} scale={0.76}>
        <HelicopterModel
          progressRef={heliProgressRef}
          reducedMotion={reducedMotion}
        />
      </group>
    </>
  );
}

export default function SpotTheHumanCanvas({
  scannerRef,
  state,
}: SpotTheHumanCanvasProps) {
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(216,179,95,0.08),transparent_22%),radial-gradient(circle_at_50%_70%,rgba(211,23,12,0.16),transparent_38%),#030303]" />
    );
  }

  return (
    <Canvas
      camera={{ position: [0, 0.08, 8.2], fov: 42 }}
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
      {contextLost ? null : (
        <GameScene scannerRef={scannerRef} state={state} />
      )}
    </Canvas>
  );
}
