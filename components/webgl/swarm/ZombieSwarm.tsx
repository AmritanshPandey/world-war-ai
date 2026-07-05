"use client";

/* eslint-disable react-hooks/immutability --
 * The useFrame callback mutates three.js objects (instance matrices, shader
 * uniforms, per-zombie physics state, module-scope scratch math objects)
 * every frame; that imperative GPU state is the whole point. */

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { ParticleQualityTier } from "@/components/webgl/useParticleQuality";
import {
  REDUCED_MOTION_CLIMB,
  REDUCED_MOTION_TIME,
  createSeededRandom,
  createTowerCurve,
  heliMotion,
  heliPosition,
  smoothstep01,
  swarmCounts,
  towerCut,
  towerRadius,
  type HeliMotion,
  type SwarmPointer,
} from "@/components/webgl/swarm/swarm-core";

const ZOMBIE_SCALE = 0.44;
const GROUND_Y = -2.55;
const FALLER_FLOOR_Y = -4.6;

/** Glowing infection nodes + edge fragments hugging the tower surface. */
const veinNodeVertexShader = /* glsl */ `
uniform float uTime;
uniform float uCut;
uniform float uPixelRatio;
uniform vec2 uCursor;
uniform float uCursorGlow;
attribute float aSeed;
attribute float aSize;
varying float vAlpha;

void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  float cutFade = clamp((uCut - worldPosition.y) * 2.4, 0.0, 1.0);
  float twinkle = 0.55 + 0.45 * sin(uTime * (1.6 + aSeed * 2.2) + aSeed * 40.0);
  float cursorDist = distance(worldPosition.xy, uCursor);
  float boost = exp(-cursorDist * cursorDist * 2.0) * uCursorGlow;

  vAlpha = cutFade * min(1.4, twinkle + boost);

  vec4 mvPosition = viewMatrix * worldPosition;

  gl_PointSize = aSize * (1.0 + boost * 0.9) * uPixelRatio * (7.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const veinNodeFragmentShader = /* glsl */ `
uniform float uIntensity;
varying float vAlpha;

void main() {
  float dist = length(gl_PointCoord - 0.5);
  float core = smoothstep(0.5, 0.06, dist);
  vec3 color = mix(vec3(0.55, 0.05, 0.03), vec3(1.0, 0.32, 0.16), core);

  gl_FragColor = vec4(color, core * vAlpha * uIntensity);
}
`;

const HANGER_ANCHORS: Array<[number, number, number]> = [
  [0.25, -0.62, 0.19],
  [-0.35, -0.62, -0.19],
  [0.6, -0.58, 0.12],
  [1.1, -0.05, 0.05],
  [1.45, 0.0, -0.05],
  [0.85, -0.55, -0.12],
];

type ZombieKind = "tower" | "ground" | "faller" | "hanger";

type Zombie = {
  kind: ZombieKind;
  baseT: number;
  angle: number;
  phase: number;
  speed: number;
  scale: number;
  width: number;
  raise: number;
  tint: number;
  anchor: THREE.Vector3;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  spin: THREE.Vector3;
  rotation: THREE.Euler;
  delay: number;
  active: boolean;
};

type PartPose = {
  hunch: number;
  headX: number;
  armLX: number;
  armLZ: number;
  armRX: number;
  armRZ: number;
  legLX: number;
  legRX: number;
};

const _point = new THREE.Vector3();
const _tangent = new THREE.Vector3();
const _normal = new THREE.Vector3();
const _binormal = new THREE.Vector3();
const _radial = new THREE.Vector3();
const _right = new THREE.Vector3();
const _outward = new THREE.Vector3();
const _up = new THREE.Vector3();
const _rootMatrix = new THREE.Matrix4();
const _localMatrix = new THREE.Matrix4();
const _partMatrix = new THREE.Matrix4();
const _twist = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _euler = new THREE.Euler();
const _vec = new THREE.Vector3();
const _one = new THREE.Vector3(1, 1, 1);
const _zAxis = new THREE.Vector3(0, 0, 1);
const _heli: HeliMotion = { x: 0, y: 0, rz: 0 };
const _zeroMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
const _pose: PartPose = {
  hunch: 0.25,
  headX: 0.3,
  armLX: 0,
  armLZ: -0.3,
  armRX: 0,
  armRZ: 0.3,
  legLX: 0,
  legRX: 0,
};

function buildZombies(counts: ReturnType<typeof swarmCounts>, portrait: boolean) {
  const random = createSeededRandom(140673);
  const zombies: Zombie[] = [];
  const pushZombie = (kind: ZombieKind, anchor: THREE.Vector3, tint: number) =>
    zombies.push({
      kind,
      baseT: Math.pow(random(), 1.25),
      angle: random() * Math.PI * 2,
      phase: random() * Math.PI * 2,
      speed: 0.7 + random() * 0.8,
      scale: 0.85 + random() * 0.4,
      width: 0.82 + random() * 0.38,
      raise: random(),
      tint,
      anchor,
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      spin: new THREE.Vector3(
        (random() - 0.5) * 7,
        (random() - 0.5) * 5,
        (random() - 0.5) * 7,
      ),
      rotation: new THREE.Euler(),
      delay: random() * 3,
      active: false,
    });

  for (let index = 0; index < counts.tower; index += 1) {
    pushZombie("tower", new THREE.Vector3(), random() * 0.28);
  }

  for (let index = 0; index < counts.ground; index += 1) {
    pushZombie(
      "ground",
      new THREE.Vector3(
        portrait ? -1.3 + random() * 2.9 : 1.0 + random() * 4.2,
        GROUND_Y - random() * 0.55,
        0.35 + random() * 0.75,
      ),
      random() * 0.2,
    );
  }

  for (let index = 0; index < counts.fallers; index += 1) {
    pushZombie("faller", new THREE.Vector3(), 0);
  }

  for (let index = 0; index < counts.hangers; index += 1) {
    const [ax, ay, az] = HANGER_ANCHORS[index % HANGER_ANCHORS.length];

    pushZombie("hanger", new THREE.Vector3(ax, ay, az), 0);
  }

  return zombies;
}

type ZombieSwarmProps = {
  progressRef: RefObject<number>;
  pointerRef: RefObject<SwarmPointer>;
  tier: ParticleQualityTier;
  reducedMotion: boolean;
};

/**
 * The swarm: a writhing black mass (tapered, noise-displaced tube along the
 * tower curve, clipped at a scroll-driven height) crawling with instanced
 * articulated silhouettes. Six InstancedMeshes (head/torso/arms/legs) share
 * one pool covering climbers, the ground crowd, tumbling fallers, and the
 * zombies that grab the helicopter at the climax.
 */
export default function ZombieSwarm({
  progressRef,
  pointerRef,
  tier,
  reducedMotion,
}: ZombieSwarmProps) {
  // Smoothed world-space cursor the swarm reacts to.
  const cursorRef = useRef({ x: 0, y: -10, strength: 0 });
  // Auto build-up on load: 0 → 1 over ~5s (small negative start = delay).
  const introRef = useRef(-0.12);
  const portrait = useThree((state) => state.viewport.aspect < 0.85);
  const counts = useMemo(() => swarmCounts(tier), [tier]);
  const zombies = useMemo(
    () => buildZombies(counts, portrait),
    [counts, portrait],
  );
  const curve = useMemo(() => createTowerCurve(portrait), [portrait]);
  const curveYSamples = useMemo(() => {
    const samples: number[] = [];

    for (let index = 0; index <= 64; index += 1) {
      samples.push(curve.getPointAt(index / 64, _point).y);
    }

    return samples;
  }, [curve]);

  const headRef = useRef<THREE.InstancedMesh>(null);
  const torsoRef = useRef<THREE.InstancedMesh>(null);
  const armLRef = useRef<THREE.InstancedMesh>(null);
  const armRRef = useRef<THREE.InstancedMesh>(null);
  const legLRef = useRef<THREE.InstancedMesh>(null);
  const legRRef = useRef<THREE.InstancedMesh>(null);

  // Rounded bodies with elbow/knee bends baked into merged limb geometry;
  // limb origins sit at the shoulder/hip so instance rotation swings them.
  const partGeometries = useMemo(() => {
    const skull = new THREE.SphereGeometry(0.062, 10, 8);

    skull.scale(0.92, 1.08, 0.98);

    const neck = new THREE.CapsuleGeometry(0.022, 0.05, 3, 6);

    neck.translate(0, -0.075, 0.01);

    const head = mergeGeometries([skull, neck]);

    // hunched two-piece spine: chest tips forward over the pelvis
    const chest = new THREE.CapsuleGeometry(0.08, 0.13, 4, 10);

    chest.scale(1.06, 1, 0.62);
    chest.rotateX(0.2);
    chest.translate(0, 0.09, 0.012);

    const pelvis = new THREE.CapsuleGeometry(0.068, 0.08, 4, 10);

    pelvis.scale(1, 1, 0.66);
    pelvis.translate(0, -0.095, 0);

    const torso = mergeGeometries([chest, pelvis]);

    const upperArm = new THREE.CapsuleGeometry(0.025, 0.13, 4, 8);

    upperArm.translate(0, -0.09, 0);

    const forearm = new THREE.CapsuleGeometry(0.021, 0.135, 4, 8);

    forearm.translate(0, -0.088, 0);
    forearm.rotateX(0.6);
    forearm.translate(0, -0.175, 0);

    const arm = mergeGeometries([upperArm, forearm]);

    const thigh = new THREE.CapsuleGeometry(0.03, 0.14, 4, 8);

    thigh.translate(0, -0.1, 0);

    const shin = new THREE.CapsuleGeometry(0.024, 0.13, 4, 8);

    shin.translate(0, -0.089, 0);
    shin.rotateX(0.45);
    shin.translate(0, -0.19, 0);

    const leg = mergeGeometries([thigh, shin]);

    skull.dispose();
    neck.dispose();
    chest.dispose();
    pelvis.dispose();
    upperArm.dispose();
    forearm.dispose();
    thigh.dispose();
    shin.dispose();

    return { head, torso, arm, leg };
  }, []);

  const zombieMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#ffffff" }),
    [],
  );

  const coreUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCut: { value: towerCut(0) },
      uVein: { value: 0.3 },
      uCursor: { value: new THREE.Vector2(0, -10) },
      uCursorGlow: { value: 0 },
    }),
    [],
  );
  const coreMaterial = useMemo(() => {
    const material = new THREE.MeshBasicMaterial({ color: "#0d0d0c" });

    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = coreUniforms.uTime;
      shader.uniforms.uCut = coreUniforms.uCut;
      shader.uniforms.uVein = coreUniforms.uVein;
      shader.uniforms.uCursor = coreUniforms.uCursor;
      shader.uniforms.uCursorGlow = coreUniforms.uCursorGlow;
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          "#include <common>\nuniform float uTime;\nvarying float vWorldY;\nvarying vec2 vWorldXY;\nvarying vec3 vCorePos;",
        )
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
          transformed += normal * (sin(position.y * 5.0 + uTime * 1.7 + position.x * 3.0) * 0.05 + sin(position.y * 11.0 - uTime * 2.3) * 0.025);
          vCorePos = transformed;
          vec4 coreWorld = modelMatrix * vec4(transformed, 1.0);
          vWorldY = coreWorld.y;
          vWorldXY = coreWorld.xy;`,
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          "#include <common>\nuniform float uCut;\nuniform float uTime;\nuniform float uVein;\nuniform vec2 uCursor;\nuniform float uCursorGlow;\nvarying float vWorldY;\nvarying vec2 vWorldXY;\nvarying vec3 vCorePos;",
        )
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
          if (vWorldY > uCut) discard;
          // Grainy dissolve at the base so the mass melts into the ground crowd
          // instead of ending in a hard silhouette edge.
          float baseFade = smoothstep(-3.3, -1.7, vWorldY);
          float grain = fract(sin(dot(vCorePos.xy, vec2(15.13, 78.23))) * 43758.5453);
          if (grain > baseFade + 0.04) discard;
          // infection veins crawling through the mass; intensity scroll-driven
          float veinA = sin(vCorePos.y * 12.0 + sin(vCorePos.x * 7.0 + uTime * 0.6) * 2.4 + vCorePos.z * 5.0);
          float veinB = sin(vCorePos.x * 15.0 - vCorePos.y * 9.0 + uTime * 0.45);
          float veins = smoothstep(0.978, 1.0, veinA) * 0.7 + smoothstep(0.987, 1.0, veinB) * 0.5;
          float pulse = 0.7 + 0.3 * sin(uTime * 1.8 + vCorePos.y * 3.0);
          diffuseColor.rgb += vec3(0.78, 0.09, 0.05) * veins * pulse * uVein * baseFade;
          // the mass stirs under the cursor
          float cursorDist = distance(vWorldXY, uCursor);
          float reactGlow = exp(-cursorDist * cursorDist * 2.2) * uCursorGlow;
          diffuseColor.rgb += vec3(0.82, 0.1, 0.06) * reactGlow;`,
        );
    };

    return material;
  }, [coreUniforms]);

  const nodeUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCut: { value: towerCut(0) },
      uIntensity: { value: 0.3 },
      uPixelRatio: { value: 1.5 },
      uCursor: { value: new THREE.Vector2(0, -10) },
      uCursorGlow: { value: 0 },
    }),
    [],
  );
  const nodeMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: nodeUniforms,
        vertexShader: veinNodeVertexShader,
        fragmentShader: veinNodeFragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [nodeUniforms],
  );
  // Infection nodes on the tower surface + loose fragments drifting off its
  // edges, matching the zombies' surface-placement math.
  const nodeGeometry = useMemo(() => {
    const count = Math.max(60, Math.round(counts.tower * 0.55));
    const random = createSeededRandom(52101);
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const sizes = new Float32Array(count);
    const point = new THREE.Vector3();
    const tangent = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const binormal = new THREE.Vector3();
    const radial = new THREE.Vector3();
    const zAxis = new THREE.Vector3(0, 0, 1);

    for (let index = 0; index < count; index += 1) {
      const t = Math.pow(random(), 1.1) * 0.97;
      const angle = random() * Math.PI * 2;
      const isFragment = random() < 0.3;

      curve.getPointAt(t, point);
      curve.getTangentAt(t, tangent).normalize();
      normal.crossVectors(tangent, zAxis);

      if (normal.lengthSq() < 1e-6) {
        normal.set(1, 0, 0);
      }

      normal.normalize();
      binormal.crossVectors(tangent, normal).normalize();
      radial
        .copy(normal)
        .multiplyScalar(Math.cos(angle))
        .addScaledVector(binormal, Math.sin(angle));

      const outward =
        towerRadius(t) +
        0.03 +
        (isFragment ? 0.12 + random() * 0.5 : 0);

      point.addScaledVector(radial, outward);

      if (isFragment) {
        point.addScaledVector(tangent, (random() - 0.5) * 0.4);
      }

      positions[index * 3] = point.x;
      positions[index * 3 + 1] = point.y;
      positions[index * 3 + 2] = point.z;
      seeds[index] = random();
      sizes[index] = isFragment
        ? 1.6 + random() * 2.2
        : 2.6 + random() * 4.0;
    }

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

    return geometry;
  }, [counts, curve]);

  const coreGeometry = useMemo(() => {
    const tubularSegments = 90;
    const radialSegments = 12;
    const geometry = new THREE.TubeGeometry(
      curve,
      tubularSegments,
      1,
      radialSegments,
      false,
    );
    const positions = geometry.attributes.position;
    const center = new THREE.Vector3();
    const vertex = new THREE.Vector3();

    for (let ring = 0; ring <= tubularSegments; ring += 1) {
      const t = ring / tubularSegments;

      curve.getPointAt(t, center);

      for (let segment = 0; segment <= radialSegments; segment += 1) {
        const index = ring * (radialSegments + 1) + segment;

        vertex.fromBufferAttribute(positions, index);
        vertex.sub(center);

        const lump =
          0.78 +
          0.5 *
            Math.abs(
              Math.sin(ring * 12.9898 + segment * 78.233) * 43758.5453 % 1,
            );

        vertex.multiplyScalar(Math.max(0.08, towerRadius(t)) * lump);
        vertex.add(center);
        positions.setXYZ(index, vertex.x, vertex.y, vertex.z);
      }
    }

    positions.needsUpdate = true;
    geometry.computeVertexNormals();

    return geometry;
  }, [curve]);

  useEffect(
    () => () => {
      partGeometries.head.dispose();
      partGeometries.torso.dispose();
      partGeometries.arm.dispose();
      partGeometries.leg.dispose();
      zombieMaterial.dispose();
      coreMaterial.dispose();
      coreGeometry.dispose();
      nodeMaterial.dispose();
      nodeGeometry.dispose();
    },
    [
      partGeometries,
      zombieMaterial,
      coreMaterial,
      coreGeometry,
      nodeMaterial,
      nodeGeometry,
    ],
  );

  // Per-instance depth tint: farther / lumpier zombies fade toward the haze.
  useEffect(() => {
    const meshes = [
      headRef.current,
      torsoRef.current,
      armLRef.current,
      armRRef.current,
      legLRef.current,
      legRRef.current,
    ];
    const dark = new THREE.Color("#0a0a09");
    const haze = new THREE.Color("#4a4339");
    const color = new THREE.Color();

    zombies.forEach((zombie, index) => {
      color.copy(dark).lerp(haze, zombie.tint);

      for (const mesh of meshes) {
        mesh?.setColorAt(index, color);
      }
    });

    for (const mesh of meshes) {
      if (mesh?.instanceColor) {
        mesh.instanceColor.needsUpdate = true;
      }
    }
  }, [zombies]);

  useFrame((state, delta) => {
    const head = headRef.current;
    const torso = torsoRef.current;
    const armL = armLRef.current;
    const armR = armRRef.current;
    const legL = legLRef.current;
    const legR = legRRef.current;

    if (!head || !torso || !armL || !armR || !legL || !legR) {
      return;
    }

    const time = reducedMotion ? REDUCED_MOTION_TIME : state.clock.elapsedTime;
    const progress = reducedMotion
      ? REDUCED_MOTION_CLIMB
      : (progressRef.current ?? 0);
    const climb = smoothstep01(progress);
    const struggle = smoothstep01((climb - 0.78) / 0.22);

    // Intro build-up: the swarm piles itself up out of the crowd on load,
    // stops at the resting height, and scroll drives it from there.
    if (reducedMotion) {
      introRef.current = 1;
    } else if (introRef.current < 1) {
      introRef.current = Math.min(1, introRef.current + delta / 5.2);
    }

    const introEase = smoothstep01(introRef.current);
    const buildWobble =
      reducedMotion ? 0 : (1 - introEase) * Math.sin(time * 2.3) * 0.05;
    const cut = -3.1 + (towerCut(climb) + 3.1) * introEase + buildWobble;

    coreUniforms.uTime.value = time;
    coreUniforms.uCut.value = cut;
    // The red pattern reveals itself as the climb progresses.
    coreUniforms.uVein.value = 0.14 + climb * 0.55;
    nodeUniforms.uTime.value = time;
    nodeUniforms.uCut.value = cut;
    nodeUniforms.uIntensity.value = 0.25 + climb * 0.95;
    nodeUniforms.uPixelRatio.value = state.gl.getPixelRatio();

    // Project the pointer onto the z=0 scene plane and ease toward it.
    const pointer = pointerRef.current;
    const cursorState = cursorRef.current;
    const cursorTargetX = (pointer?.x ?? 0) * (state.viewport.width / 2);
    const cursorTargetY = 0.4 - (pointer?.y ?? 0) * (state.viewport.height / 2);
    const cursorTargetStrength =
      pointer?.active && !reducedMotion ? 1 : 0;

    cursorState.x += (cursorTargetX - cursorState.x) * 0.1;
    cursorState.y += (cursorTargetY - cursorState.y) * 0.1;
    cursorState.strength +=
      (cursorTargetStrength - cursorState.strength) * 0.06;
    coreUniforms.uCursor.value.set(cursorState.x, cursorState.y);
    coreUniforms.uCursorGlow.value =
      cursorState.strength * (0.2 + climb * 0.22);
    nodeUniforms.uCursor.value.set(cursorState.x, cursorState.y);
    nodeUniforms.uCursorGlow.value = cursorState.strength;

    heliMotion(time, struggle, _heli);

    const writeParts = (index: number, pose: PartPose) => {
      const setPart = (
        mesh: THREE.InstancedMesh,
        px: number,
        py: number,
        pz: number,
        rx: number,
        ry: number,
        rz: number,
      ) => {
        _quat.setFromEuler(_euler.set(rx, ry, rz));
        _localMatrix.compose(_vec.set(px, py, pz), _quat, _one);
        _partMatrix.multiplyMatrices(_rootMatrix, _localMatrix);
        mesh.setMatrixAt(index, _partMatrix);
      };

      setPart(head, 0, 0.43, 0.02, pose.headX, 0, 0);
      setPart(torso, 0, 0.17, 0, pose.hunch, 0, 0);
      setPart(armL, -0.105, 0.3, 0, pose.armLX, 0, pose.armLZ);
      setPart(armR, 0.105, 0.3, 0, pose.armRX, 0, pose.armRZ);
      setPart(legL, -0.05, 0, 0, pose.legLX, 0, -0.08);
      setPart(legR, 0.05, 0, 0, pose.legRX, 0, 0.08);
    };

    const hideZombie = (index: number) => {
      head.setMatrixAt(index, _zeroMatrix);
      torso.setMatrixAt(index, _zeroMatrix);
      armL.setMatrixAt(index, _zeroMatrix);
      armR.setMatrixAt(index, _zeroMatrix);
      legL.setMatrixAt(index, _zeroMatrix);
      legR.setMatrixAt(index, _zeroMatrix);
    };

    for (let index = 0; index < zombies.length; index += 1) {
      const zombie = zombies[index];

      if (zombie.kind === "tower") {
        const shimmer = reducedMotion
          ? 0
          : 0.015 * (1 + Math.sin(time * 0.25 * zombie.speed + zombie.phase));
        const t = Math.min(0.985, Math.max(0.005, zombie.baseT + shimmer));

        curve.getPointAt(t, _point);
        curve.getTangentAt(t, _tangent).normalize();
        _normal.crossVectors(_tangent, _zAxis);

        if (_normal.lengthSq() < 1e-6) {
          _normal.set(1, 0, 0);
        }

        _normal.normalize();
        _binormal.crossVectors(_tangent, _normal).normalize();
        _radial
          .copy(_normal)
          .multiplyScalar(Math.cos(zombie.angle))
          .addScaledVector(_binormal, Math.sin(zombie.angle));

        const surface = towerRadius(t) + 0.02;

        _point.addScaledVector(_radial, surface);

        const fade = Math.min(1, Math.max(0, (cut - _point.y) * 2.2));

        if (fade <= 0.01) {
          hideZombie(index);
          continue;
        }

        _up.copy(_tangent);
        _right.crossVectors(_up, _radial).normalize();
        _outward.crossVectors(_right, _up).normalize();

        if (!reducedMotion) {
          _point.addScaledVector(
            _outward,
            Math.sin(time * 1.3 + zombie.phase) * 0.015,
          );
        }

        // Nearby cursor makes climbers rear up off the mass and grasp at it.
        const cdx = _point.x - cursorState.x;
        const cdy = _point.y - cursorState.y;
        const influence =
          cursorState.strength *
          Math.max(0, 1 - (cdx * cdx + cdy * cdy) / 1.5);

        if (influence > 0.01) {
          _point.addScaledVector(_outward, influence * 0.06);
        }

        const scale = ZOMBIE_SCALE * zombie.scale * fade;

        _rootMatrix.makeBasis(
          _right.multiplyScalar(scale * zombie.width),
          _up.multiplyScalar(scale),
          _outward.multiplyScalar(scale * zombie.width),
        );
        _rootMatrix.setPosition(_point);
        _twist.makeRotationX(-0.28 + influence * 0.3);
        _rootMatrix.multiply(_twist);

        const flail = Math.sin(time * zombie.speed * 2.2 + zombie.phase);
        const grasp =
          influence * (0.45 + Math.sin(time * 9 + zombie.phase) * 0.3);

        _pose.hunch = 0.22 + zombie.raise * 0.16 - influence * 0.1;
        _pose.headX = 0.35 - influence * 0.55;
        _pose.armLX = 2.55 + flail * 0.5 + grasp;
        _pose.armLZ = -0.35 - zombie.raise * 0.15;
        _pose.armRX = 2.55 - flail * 0.5 + grasp;
        _pose.armRZ = 0.35 + zombie.raise * 0.15;
        _pose.legLX = -0.3 - flail * 0.35;
        _pose.legRX = -0.3 + flail * 0.35;
        writeParts(index, _pose);
        continue;
      }

      if (zombie.kind === "ground") {
        const sway = reducedMotion
          ? 0
          : Math.sin(time * 0.4 + zombie.phase) * 0.12;

        _point.set(
          zombie.anchor.x + sway,
          zombie.anchor.y,
          zombie.anchor.z,
        );

        const scale = ZOMBIE_SCALE * zombie.scale;

        _quat.setFromEuler(
          _euler.set(
            0,
            zombie.phase * 3 +
              (reducedMotion ? 0 : Math.sin(time * 0.2 + zombie.phase) * 0.3),
            Math.sin(zombie.phase) * 0.08,
          ),
        );
        _rootMatrix.compose(
          _point,
          _quat,
          _vec.set(scale * zombie.width, scale, scale * zombie.width),
        );

        const reach = zombie.raise > 0.45 ? 1 : 0.2;
        const wave = reducedMotion
          ? 0
          : Math.sin(time * 2.6 * zombie.speed + zombie.phase) * 0.35;

        _pose.hunch = 0.18;
        _pose.headX = -0.25;
        _pose.armLX = 0.4 + reach * (2.3 + wave);
        _pose.armLZ = -0.3;
        _pose.armRX = 0.4 + reach * (2.3 - wave);
        _pose.armRZ = 0.3;
        _pose.legLX = wave * 0.2;
        _pose.legRX = -wave * 0.2;
        writeParts(index, _pose);
        continue;
      }

      if (zombie.kind === "faller") {
        if (reducedMotion) {
          hideZombie(index);
          continue;
        }

        if (!zombie.active) {
          if (climb > 0.6) {
            zombie.delay -= delta;
          }

          if (zombie.delay <= 0 && climb > 0.6) {
            // Drop from wherever the swarm has currently reached.
            let spawnT = 0.9;

            for (let sample = 0; sample < curveYSamples.length; sample += 1) {
              if (curveYSamples[sample] > cut - 0.35) {
                spawnT = sample / 64;
                break;
              }
            }

            curve.getPointAt(
              Math.min(0.95, Math.max(0.25, spawnT)),
              zombie.position,
            );
            zombie.position.x += (zombie.raise - 0.5) * 0.5;
            zombie.position.z += 0.3;
            zombie.velocity.set(-0.5 - zombie.raise * 0.7, 0.6, 0.15);
            zombie.rotation.set(0, 0, 0);
            zombie.active = true;
          } else {
            hideZombie(index);
            continue;
          }
        }

        zombie.velocity.y -= 5.2 * delta;
        zombie.position.addScaledVector(zombie.velocity, delta);
        zombie.rotation.x += zombie.spin.x * delta;
        zombie.rotation.y += zombie.spin.y * delta;
        zombie.rotation.z += zombie.spin.z * delta;

        if (zombie.position.y < FALLER_FLOOR_Y) {
          zombie.active = false;
          zombie.delay = 0.6 + zombie.raise * 2.4;
          hideZombie(index);
          continue;
        }

        const scale = ZOMBIE_SCALE * zombie.scale;

        _quat.setFromEuler(zombie.rotation);
        _rootMatrix.compose(
          zombie.position,
          _quat,
          _vec.set(scale * zombie.width, scale, scale * zombie.width),
        );

        const thrash = Math.sin(time * 9 + zombie.phase);

        _pose.hunch = 0.1;
        _pose.headX = -0.4;
        _pose.armLX = 2.4 + thrash * 0.9;
        _pose.armLZ = -0.9;
        _pose.armRX = 2.4 - thrash * 0.9;
        _pose.armRZ = 0.9;
        _pose.legLX = 0.7 * thrash;
        _pose.legRX = -0.7 * thrash;
        writeParts(index, _pose);
        continue;
      }

      // hanger
      const visible = Math.min(1, Math.max(0, (climb - 0.8) / 0.12));

      if (visible <= 0.01) {
        hideZombie(index);
        continue;
      }

      const cos = Math.cos(_heli.rz);
      const sin = Math.sin(_heli.rz);
      const localX = zombie.anchor.x * cos - zombie.anchor.y * sin;
      const localY = zombie.anchor.x * sin + zombie.anchor.y * cos;
      const heliBase = heliPosition(portrait);

      _point.set(
        heliBase.x + _heli.x + localX,
        heliBase.y + _heli.y + localY - (1 - visible) * 0.3,
        heliBase.z + zombie.anchor.z,
      );

      const swing = reducedMotion
        ? 0
        : Math.sin(time * 1.9 + zombie.phase) * 0.25;
      const scale = ZOMBIE_SCALE * zombie.scale * visible;

      _quat.setFromEuler(_euler.set(0.1, 0, _heli.rz + swing));
      _rootMatrix.compose(
        _point,
        _quat,
        _vec.set(scale * zombie.width, scale, scale * zombie.width),
      );

      const kick = reducedMotion ? 0 : Math.sin(time * 5 + zombie.phase);

      _pose.hunch = 0.05;
      _pose.headX = -0.5;
      _pose.armLX = Math.PI - 0.12;
      _pose.armLZ = -0.16;
      _pose.armRX = Math.PI + 0.08;
      _pose.armRZ = 0.16;
      _pose.legLX = 0.4 * kick;
      _pose.legRX = -0.4 * kick;
      writeParts(index, _pose);
    }

    head.instanceMatrix.needsUpdate = true;
    torso.instanceMatrix.needsUpdate = true;
    armL.instanceMatrix.needsUpdate = true;
    armR.instanceMatrix.needsUpdate = true;
    legL.instanceMatrix.needsUpdate = true;
    legR.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* writhing swarm mass */}
      <mesh geometry={coreGeometry} material={coreMaterial} frustumCulled={false} />
      {/* infection nodes + edge fragments */}
      <points
        geometry={nodeGeometry}
        material={nodeMaterial}
        frustumCulled={false}
      />
      {/* base mass merging tower into the ground crowd */}
      <mesh
        material={coreMaterial}
        position={[portrait ? 1.2 : 3.6, -4.1, 0]}
        scale={[3.4, 1.3, 1.6]}
      >
        <sphereGeometry args={[1, 20, 14]} />
      </mesh>
      <mesh
        material={coreMaterial}
        position={[portrait ? -0.9 : 1.4, -4.35, 0.3]}
        scale={[4.0, 0.95, 1.2]}
      >
        <sphereGeometry args={[1, 20, 14]} />
      </mesh>

      <instancedMesh
        ref={headRef}
        args={[partGeometries.head, zombieMaterial, zombies.length]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={torsoRef}
        args={[partGeometries.torso, zombieMaterial, zombies.length]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={armLRef}
        args={[partGeometries.arm, zombieMaterial, zombies.length]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={armRRef}
        args={[partGeometries.arm, zombieMaterial, zombies.length]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={legLRef}
        args={[partGeometries.leg, zombieMaterial, zombies.length]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={legRRef}
        args={[partGeometries.leg, zombieMaterial, zombies.length]}
        frustumCulled={false}
      />
    </group>
  );
}
