"use client";

/* eslint-disable react-hooks/immutability --
 * The useFrame callback mutates three.js objects (uniforms, group transforms,
 * scratch vectors) every frame; that imperative GPU state is the whole point. */

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import {
  REDUCED_MOTION_CLIMB,
  REDUCED_MOTION_TIME,
  SILHOUETTE_COLOR,
  heliMotion,
  heliPosition,
  smoothstep01,
  type HeliMotion,
} from "@/components/webgl/swarm/swarm-core";

const rotorBlurVertexShader = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const rotorBlurFragmentShader = /* glsl */ `
uniform float uTime;
uniform float uOpacity;
varying vec2 vUv;

void main() {
  vec2 centered = vUv - 0.5;
  float radius = length(centered) * 2.0;

  if (radius > 1.0) {
    discard;
  }

  float angle = atan(centered.y, centered.x);
  float smear = 0.55 + 0.45 * sin(angle * 2.0 - uTime * 26.0);
  float band = smoothstep(0.08, 0.3, radius) * smoothstep(1.0, 0.84, radius);
  float alpha = band * (0.14 + smear * 0.2) * (1.0 - radius * 0.35) * uOpacity;

  gl_FragColor = vec4(vec3(0.05, 0.05, 0.05), alpha);
}
`;

function createRotorBlurMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 1 },
    },
    vertexShader: rotorBlurVertexShader,
    fragmentShader: rotorBlurFragmentShader,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

type HelicopterModelProps = {
  progressRef: RefObject<number>;
  reducedMotion: boolean;
};

/**
 * Poster-style silhouette Huey built from primitives: nose points -x, tail
 * boom reaches +x toward the swarm tower. Two-blade main rotor spins with a
 * shader blur disc; the whole aircraft bobs and, as the swarm reaches it,
 * sags and jitters via the shared heliMotion curve.
 */
export default function HelicopterModel({
  progressRef,
  reducedMotion,
}: HelicopterModelProps) {
  const portrait = useThree((state) => state.viewport.aspect < 0.85);
  const basePosition = heliPosition(portrait);
  const groupRef = useRef<THREE.Group>(null);
  const mainRotorRef = useRef<THREE.Group>(null);
  const tailRotorRef = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.Group>(null);
  const bodyMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: SILHOUETTE_COLOR }),
    [],
  );
  const mainBlurMaterial = useMemo(() => createRotorBlurMaterial(), []);
  const tailBlurMaterial = useMemo(() => createRotorBlurMaterial(), []);
  const beamOuterMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#f7ecd4",
        transparent: true,
        opacity: 0.033,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [],
  );
  const beamInnerMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#fdf6e4",
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [],
  );
  const motionRef = useRef<HeliMotion>({ x: 0, y: 0, rz: 0 });

  useEffect(
    () => () => {
      bodyMaterial.dispose();
      mainBlurMaterial.dispose();
      tailBlurMaterial.dispose();
      beamOuterMaterial.dispose();
      beamInnerMaterial.dispose();
    },
    [
      bodyMaterial,
      mainBlurMaterial,
      tailBlurMaterial,
      beamOuterMaterial,
      beamInnerMaterial,
    ],
  );

  useFrame((state) => {
    const group = groupRef.current;

    if (!group) {
      return;
    }

    const time = reducedMotion ? REDUCED_MOTION_TIME : state.clock.elapsedTime;
    const progress = reducedMotion
      ? REDUCED_MOTION_CLIMB
      : (progressRef.current ?? 0);
    const climb = smoothstep01(progress);
    const struggle = smoothstep01((climb - 0.78) / 0.22);
    const motion = heliMotion(time, struggle, motionRef.current);
    group.position.set(
      basePosition.x + motion.x,
      basePosition.y + motion.y,
      basePosition.z,
    );
    group.rotation.z = motion.rz;
    group.rotation.x = -0.06 + Math.sin(time * 0.8) * 0.012;

    if (!reducedMotion) {
      if (mainRotorRef.current) {
        mainRotorRef.current.rotation.y = time * 23;
      }

      if (tailRotorRef.current) {
        tailRotorRef.current.rotation.z = time * 40;
      }
    }

    if (beamRef.current) {
      // Searchlight sweeps slowly across the swarm, tightening as it struggles.
      beamRef.current.rotation.z =
        0.36 + Math.sin(time * 0.45) * 0.06 + struggle * 0.08;
      beamRef.current.rotation.x = Math.sin(time * 0.3) * 0.04;
    }

    beamInnerMaterial.opacity = 0.08 + Math.sin(time * 6.7) * 0.012;

    mainBlurMaterial.uniforms.uTime.value = time;
    tailBlurMaterial.uniforms.uTime.value = time * 1.7;
  });

  return (
    <group ref={groupRef}>
      {/* hull — one smooth teardrop from nose to cabin, no lumpy joins */}
      <mesh
        material={bodyMaterial}
        position={[-0.28, 0.02, 0]}
        scale={[1.55, 0.6, 0.58]}
      >
        <sphereGeometry args={[0.5, 26, 18]} />
      </mesh>
      {/* cockpit chin, tucked into the hull front */}
      <mesh
        material={bodyMaterial}
        position={[-0.8, -0.06, 0]}
        scale={[0.6, 0.44, 0.5]}
      >
        <sphereGeometry args={[0.5, 18, 14]} />
      </mesh>
      {/* flat cabin floor line */}
      <mesh material={bodyMaterial} position={[-0.1, -0.2, 0]}>
        <boxGeometry args={[0.8, 0.2, 0.46]} />
      </mesh>
      {/* engine deck */}
      <mesh
        material={bodyMaterial}
        position={[0.08, 0.28, 0]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.095, 0.105, 0.72, 12]} />
      </mesh>
      {/* exhaust stack */}
      <mesh
        material={bodyMaterial}
        position={[0.46, 0.3, 0]}
        rotation={[0, 0, -0.55]}
      >
        <cylinderGeometry args={[0.04, 0.045, 0.16, 8]} />
      </mesh>
      {/* tail boom, rising slightly into the fin */}
      <mesh
        material={bodyMaterial}
        position={[1.08, 0.15, 0]}
        rotation={[0, 0, -Math.PI / 2 + 0.07]}
      >
        <cylinderGeometry args={[0.026, 0.075, 1.45, 10]} />
      </mesh>
      {/* swept tail fin */}
      <mesh
        material={bodyMaterial}
        position={[1.76, 0.3, 0]}
        rotation={[0, 0, -0.28]}
      >
        <boxGeometry args={[0.09, 0.4, 0.04]} />
      </mesh>
      {/* ventral fin */}
      <mesh
        material={bodyMaterial}
        position={[1.72, 0, 0]}
        rotation={[0, 0, 0.22]}
      >
        <boxGeometry args={[0.06, 0.18, 0.035]} />
      </mesh>
      {/* horizontal stabilizer */}
      <mesh material={bodyMaterial} position={[1.32, 0.17, 0]}>
        <boxGeometry args={[0.36, 0.028, 0.11]} />
      </mesh>
  
      {/* tail rotor on a gearbox that bridges it to the fin */}
      <mesh material={bodyMaterial} position={[1.8, 0.4, 0.03]}>
        <boxGeometry args={[0.09, 0.09, 0.06]} />
      </mesh>
      <group position={[1.82, 0.42, 0.065]}>
        <mesh material={bodyMaterial} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.06, 8]} />
        </mesh>
        <group ref={tailRotorRef}>
          <mesh material={bodyMaterial}>
            <boxGeometry args={[0.026, 0.44, 0.018]} />
          </mesh>
        </group>
        <mesh material={tailBlurMaterial}>
          <circleGeometry args={[0.25, 24]} />
        </mesh>
      </group>
      {/* rotor mast */}
      <mesh material={bodyMaterial} position={[-0.02, 0.44, 0]}>
        <cylinderGeometry args={[0.028, 0.045, 0.2, 8]} />
      </mesh>
      {/* main rotor: hub, blade grips, two-blade span, Bell stabilizer bar */}
      <group position={[-0.02, 0.56, 0]}>
        <group ref={mainRotorRef}>
          <mesh material={bodyMaterial}>
            <cylinderGeometry args={[0.055, 0.07, 0.09, 10]} />
          </mesh>
          <mesh material={bodyMaterial}>
            <boxGeometry args={[0.3, 0.035, 0.05]} />
          </mesh>
          <mesh material={bodyMaterial}>
            <boxGeometry args={[3.0, 0.022, 0.12]} />
          </mesh>
          <mesh
            material={bodyMaterial}
            position={[0, -0.03, 0]}
            rotation={[0, Math.PI / 2, 0]}
          >
            <boxGeometry args={[0.7, 0.012, 0.025]} />
          </mesh>
        </group>
        <mesh
          material={mainBlurMaterial}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.014, 0]}
        >
          <circleGeometry args={[1.52, 48]} />
        </mesh>
      </group>
      {/* belly searchlight raking the swarm */}
      <group ref={beamRef} position={[-0.12, -0.48, 0]} rotation={[0, 0, 0.36]}>
        <mesh material={bodyMaterial} position={[0, 0.02, 0]}>
          <sphereGeometry args={[0.06, 8, 8]} />
        </mesh>
        <mesh material={beamInnerMaterial} position={[0, -0.02, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
        </mesh>
        <mesh material={beamOuterMaterial} position={[0, -2.32, 0]}>
          <coneGeometry args={[1.15, 4.6, 24, 1, true]} />
        </mesh>
        <mesh material={beamInnerMaterial} position={[0, -2.32, 0]}>
          <coneGeometry args={[0.48, 4.6, 18, 1, true]} />
        </mesh>
      </group>

      {/* skids: rails, upturned tips, struts that actually reach the belly */}
      {[0.19, -0.19].map((z) => (
        <group key={z}>
          <mesh
            material={bodyMaterial}
            position={[-0.18, -0.52, z]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.017, 0.017, 1.35, 8]} />
          </mesh>
          <mesh
            material={bodyMaterial}
            position={[-0.88, -0.47, z]}
            rotation={[0, 0, -0.9]}
          >
           
          </mesh>
          {[-0.5, 0.2].map((x) => (
            <mesh
              key={x}
              material={bodyMaterial}
              position={[x, -0.4, z * 0.82]}
              rotation={[z > 0 ? -0.28 : 0.28, 0, 0]}
            >
              <cylinderGeometry args={[0.014, 0.014, 0.27, 6]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
