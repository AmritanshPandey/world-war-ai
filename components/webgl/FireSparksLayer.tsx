"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  ambientEmbersFragmentShader,
  ambientEmbersVertexShader,
} from "@/components/webgl/FireSparksShader";
import { heroSparksFragmentShader } from "@/components/webgl/fire-sparks.frag";
import { heroSparksVertexShader } from "@/components/webgl/fire-sparks.vert";
import {
  type ParticleQualityTier,
  useParticleQuality,
} from "@/components/webgl/useParticleQuality";

export type FireSparksLayerProps = {
  enabled?: boolean;
  intensity?: number;
  origin?: [number, number, number];
  spread?: [number, number, number];
  mobileOrigin?: [number, number, number];
  desktopCount?: number;
  mobileCount?: number;
  heroSparkCount?: number;
  windStrength?: number;
  opacity?: number;
  className?: string;
};

type ParticleUniforms = {
  uTime: { value: number };
  uPixelRatio: { value: number };
  uIntensity: { value: number };
  uWindStrength: { value: number };
  uGlobalOpacity: { value: number };
  uReducedMotion: { value: number };
};

type SpawnMode = "ambient" | "hero";

type ParticleSystemProps = {
  count: number;
  origin: [number, number, number];
  spread: [number, number, number];
  intensity: number;
  windStrength: number;
  opacity: number;
  pixelRatio: number;
  reducedMotion: boolean;
};

function createSeededRandom(seed: number) {
  let value = seed >>> 0;

  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);

    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function resolveAmbientCount(
  qualityCount: number,
  tier: ParticleQualityTier,
  desktopCount?: number,
  mobileCount?: number,
) {
  if (tier === "low-power-mobile") {
    return Math.min(mobileCount ?? qualityCount, 120);
  }

  if (tier === "mobile") {
    return mobileCount ?? qualityCount;
  }

  if (tier === "tablet") {
    return desktopCount ? Math.round(desktopCount * 0.7) : qualityCount;
  }

  return desktopCount ?? qualityCount;
}

function resolveHeroCount(
  qualityCount: number,
  tier: ParticleQualityTier,
  heroSparkCount?: number,
) {
  if (!heroSparkCount) {
    return qualityCount;
  }

  if (tier === "low-power-mobile") {
    return Math.max(12, Math.round(heroSparkCount * 0.24));
  }

  if (tier === "mobile") {
    return Math.max(18, Math.round(heroSparkCount * 0.4));
  }

  if (tier === "tablet") {
    return Math.max(32, Math.round(heroSparkCount * 0.67));
  }

  return heroSparkCount;
}

function createParticleUniforms(
  intensity: number,
  windStrength: number,
  opacity: number,
  pixelRatio: number,
  reducedMotion: boolean,
): ParticleUniforms {
  return {
    uTime: { value: 0 },
    uPixelRatio: { value: pixelRatio },
    uIntensity: { value: intensity },
    uWindStrength: { value: windStrength },
    uGlobalOpacity: { value: opacity },
    uReducedMotion: { value: reducedMotion ? 1 : 0 },
  };
}

function updateParticleUniforms(
  material: THREE.ShaderMaterial | null,
  intensity: number,
  windStrength: number,
  opacity: number,
  pixelRatio: number,
  reducedMotion: boolean,
) {
  if (!material) {
    return;
  }

  const uniforms = material.uniforms as ParticleUniforms;

  uniforms.uPixelRatio.value = pixelRatio;
  uniforms.uIntensity.value = intensity;
  uniforms.uWindStrength.value = windStrength;
  uniforms.uGlobalOpacity.value = opacity;
  uniforms.uReducedMotion.value = reducedMotion ? 1 : 0;
}

function sampleSpawn(
  random: () => number,
  origin: [number, number, number],
  spread: [number, number, number],
  mode: SpawnMode,
  depthBias: number,
) {
  const sourcePick = random();
  const sourceOffset =
    sourcePick < 0.52
      ? [-0.18, 0.01, 0.08]
      : sourcePick < 0.82
        ? [0.1, 0, -0.05]
        : [0.34, 0.03, 0.14];
  const distribution = random();
  const isHero = mode === "hero";
  const spreadScale = distribution < 0.72 ? 0.24 : distribution < 0.92 ? 0.52 : 0.92;
  const heightScale = distribution < 0.72 ? 0.22 : distribution < 0.92 ? 0.48 : 0.9;
  const ambientScale = isHero ? 1 : 1.58;
  const x =
    origin[0] +
    sourceOffset[0] * spread[0] +
    (random() - 0.5) * spread[0] * spreadScale * ambientScale;
  const y = origin[1] + sourceOffset[1] + random() * spread[1] * heightScale;
  const z =
    origin[2] +
    sourceOffset[2] +
    (random() - 0.5) * spread[2] * (0.75 + depthBias * 0.5) -
    depthBias * (isHero ? 0.26 : 0.38);

  return [x, y, z] as const;
}

function createAmbientGeometry(
  count: number,
  origin: [number, number, number],
  spread: [number, number, number],
) {
  const random = createSeededRandom(91423);
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const startOffsets = new Float32Array(count);
  const lifetimes = new Float32Array(count);
  const sizes = new Float32Array(count);
  const speeds = new Float32Array(count);
  const drifts = new Float32Array(count);
  const brightness = new Float32Array(count);
  const depths = new Float32Array(count);
  const textAvoids = new Float32Array(count);

  for (let index = 0; index < count; index += 1) {
    const depthBias = random();
    const [x, y, z] = sampleSpawn(
      random,
      [origin[0] - 0.18, origin[1] - 0.05, origin[2]],
      [spread[0] * 1.85, spread[1] * 1.45, spread[2] * 1.6],
      "ambient",
      depthBias,
    );

    positions[index * 3] = x;
    positions[index * 3 + 1] = y;
    positions[index * 3 + 2] = z;
    seeds[index] = random();
    lifetimes[index] = 5.6 + random() * 6.2;
    startOffsets[index] = random() * lifetimes[index];
    sizes[index] = (1.7 + random() * 4.2) * (1.15 - depthBias * 0.38);
    speeds[index] = 0.42 + random() * 0.46;
    drifts[index] = (random() - 0.24) * 1.2;
    brightness[index] = (0.38 + random() * 0.68) * (1.18 - depthBias * 0.44);
    depths[index] = depthBias;
    textAvoids[index] = 0.58 + random() * 0.32;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute(
    "aStartOffset",
    new THREE.BufferAttribute(startOffsets, 1),
  );
  geometry.setAttribute("aLifetime", new THREE.BufferAttribute(lifetimes, 1));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
  geometry.setAttribute("aDrift", new THREE.BufferAttribute(drifts, 1));
  geometry.setAttribute("aBrightness", new THREE.BufferAttribute(brightness, 1));
  geometry.setAttribute("aDepth", new THREE.BufferAttribute(depths, 1));
  geometry.setAttribute("aTextAvoid", new THREE.BufferAttribute(textAvoids, 1));
  geometry.computeBoundingSphere();

  return geometry;
}

function createHeroSparkGeometry(
  count: number,
  origin: [number, number, number],
  spread: [number, number, number],
) {
  const random = createSeededRandom(321987);
  const geometry = new THREE.InstancedBufferGeometry();
  const positions = new Float32Array([
    -0.5, -0.5, 0,
    0.5, -0.5, 0,
    -0.5, 0.5, 0,
    0.5, 0.5, 0,
  ]);
  const uvs = new Float32Array([
    0, 0,
    1, 0,
    0, 1,
    1, 1,
  ]);
  const indices = new Uint16Array([0, 1, 2, 2, 1, 3]);
  const spawns = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const startOffsets = new Float32Array(count);
  const lifetimes = new Float32Array(count);
  const sizes = new Float32Array(count);
  const speeds = new Float32Array(count);
  const drifts = new Float32Array(count);
  const brightness = new Float32Array(count);
  const rotations = new Float32Array(count);
  const depths = new Float32Array(count);
  const bursts = new Float32Array(count);
  const textAvoids = new Float32Array(count);

  for (let index = 0; index < count; index += 1) {
    const depthBias = random();
    const [x, y, z] = sampleSpawn(random, origin, spread, "hero", depthBias);

    spawns[index * 3] = x;
    spawns[index * 3 + 1] = y;
    spawns[index * 3 + 2] = z;
    seeds[index] = random();
    lifetimes[index] = 1.45 + random() * 2.15;
    startOffsets[index] = random() * lifetimes[index];
    sizes[index] = (0.064 + random() * 0.13) * (1.38 - depthBias * 0.58);
    speeds[index] = 1.0 + random() * 1.28;
    drifts[index] = (random() - 0.18) * 1.45;
    brightness[index] = (0.86 + random() * 0.92) * (1.22 - depthBias * 0.5);
    rotations[index] = (random() - 0.5) * 0.62;
    depths[index] = depthBias;
    bursts[index] = random();
    textAvoids[index] = 0.82 + random() * 0.18;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.setAttribute("aSpawn", new THREE.InstancedBufferAttribute(spawns, 3));
  geometry.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 1));
  geometry.setAttribute(
    "aStartOffset",
    new THREE.InstancedBufferAttribute(startOffsets, 1),
  );
  geometry.setAttribute(
    "aLifetime",
    new THREE.InstancedBufferAttribute(lifetimes, 1),
  );
  geometry.setAttribute("aSize", new THREE.InstancedBufferAttribute(sizes, 1));
  geometry.setAttribute("aSpeed", new THREE.InstancedBufferAttribute(speeds, 1));
  geometry.setAttribute("aDrift", new THREE.InstancedBufferAttribute(drifts, 1));
  geometry.setAttribute(
    "aBrightness",
    new THREE.InstancedBufferAttribute(brightness, 1),
  );
  geometry.setAttribute(
    "aRotation",
    new THREE.InstancedBufferAttribute(rotations, 1),
  );
  geometry.setAttribute("aDepth", new THREE.InstancedBufferAttribute(depths, 1));
  geometry.setAttribute("aBurst", new THREE.InstancedBufferAttribute(bursts, 1));
  geometry.setAttribute(
    "aTextAvoid",
    new THREE.InstancedBufferAttribute(textAvoids, 1),
  );
  geometry.instanceCount = count;
  geometry.computeBoundingSphere();

  return geometry;
}

function AmbientEmbers({
  count,
  origin,
  spread,
  intensity,
  windStrength,
  opacity,
  pixelRatio,
  reducedMotion,
}: ParticleSystemProps) {
  const [originX, originY, originZ] = origin;
  const [spreadX, spreadY, spreadZ] = spread;
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const initialUniforms = useMemo(
    () => createParticleUniforms(1, 0, 1, 1, false),
    [],
  );
  const geometry = useMemo(
    () =>
      createAmbientGeometry(
        count,
        [originX, originY, originZ],
        [spreadX, spreadY, spreadZ],
      ),
    [count, originX, originY, originZ, spreadX, spreadY, spreadZ],
  );

  useEffect(() => {
    updateParticleUniforms(
      materialRef.current,
      intensity,
      windStrength,
      opacity,
      pixelRatio,
      reducedMotion,
    );
  }, [intensity, opacity, pixelRatio, reducedMotion, windStrength]);

  useEffect(
    () => () => {
      geometry.dispose();
    },
    [geometry],
  );

  useEffect(() => () => materialRef.current?.dispose(), []);

  useFrame(({ clock }) => {
    const uniforms = materialRef.current?.uniforms as
      | ParticleUniforms
      | undefined;

    if (uniforms) {
      // R3F shader uniforms are imperative GPU state; only uTime changes per frame.
      // eslint-disable-next-line react-hooks/immutability
      uniforms.uTime.value = reducedMotion ? 0 : clock.elapsedTime;
    }
  });

  return (
    <points frustumCulled={false} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        uniforms={initialUniforms}
        vertexShader={ambientEmbersVertexShader}
        fragmentShader={ambientEmbersFragmentShader}
        transparent
        depthWrite={false}
        depthTest
        toneMapped={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function HeroSparks({
  count,
  origin,
  spread,
  intensity,
  windStrength,
  opacity,
  pixelRatio,
  reducedMotion,
}: ParticleSystemProps) {
  const [originX, originY, originZ] = origin;
  const [spreadX, spreadY, spreadZ] = spread;
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const initialUniforms = useMemo(
    () => createParticleUniforms(1, 0, 1, 1, false),
    [],
  );
  const geometry = useMemo(
    () =>
      createHeroSparkGeometry(
        count,
        [originX, originY, originZ],
        [spreadX, spreadY, spreadZ],
      ),
    [count, originX, originY, originZ, spreadX, spreadY, spreadZ],
  );

  useEffect(() => {
    updateParticleUniforms(
      materialRef.current,
      intensity,
      windStrength,
      opacity,
      pixelRatio,
      reducedMotion,
    );
  }, [intensity, opacity, pixelRatio, reducedMotion, windStrength]);

  useEffect(
    () => () => {
      geometry.dispose();
    },
    [geometry],
  );

  useEffect(() => () => materialRef.current?.dispose(), []);

  useFrame(({ clock }) => {
    const uniforms = materialRef.current?.uniforms as
      | ParticleUniforms
      | undefined;

    if (uniforms) {
      // R3F shader uniforms are imperative GPU state; only uTime changes per frame.
      // eslint-disable-next-line react-hooks/immutability
      uniforms.uTime.value = reducedMotion ? 0 : clock.elapsedTime;
    }
  });

  return (
    <mesh frustumCulled={false} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        uniforms={initialUniforms}
        vertexShader={heroSparksVertexShader}
        fragmentShader={heroSparksFragmentShader}
        transparent
        depthWrite={false}
        depthTest
        toneMapped={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/**
 * Renders a two-pass cinematic ember layer for the hero: a restrained ambient
 * ash field plus brighter instanced fire sparks. Particle budgets come from
 * viewport and device-capability checks, with desktop/tablet/mobile overrides
 * exposed through count props. Reduced motion disables moving hero sparks and
 * leaves only a low-opacity static ember field. Tune origin/spread, intensity,
 * windStrength, opacity, and counts per scene.
 */
export default function FireSparksLayer({
  enabled = true,
  intensity = 0.86,
  origin = [1.28, -2.05, 0],
  spread = [2.1, 0.34, 0.95],
  mobileOrigin = [0.42, -2.08, 0],
  desktopCount,
  mobileCount,
  heroSparkCount,
  windStrength = 0.34,
  opacity = 0.74,
}: FireSparksLayerProps) {
  const quality = useParticleQuality();

  if (!enabled) {
    return null;
  }

  const isMobileTier =
    quality.tier === "mobile" || quality.tier === "low-power-mobile";
  const resolvedOrigin = isMobileTier ? mobileOrigin : origin;
  const ambientCount = resolveAmbientCount(
    quality.ambientCount,
    quality.tier,
    desktopCount,
    mobileCount,
  );
  const sparkCount = quality.reducedMotion
    ? 0
    : resolveHeroCount(quality.heroSparkCount, quality.tier, heroSparkCount);
  const reducedOpacity = quality.reducedMotion ? opacity * 0.42 : opacity;
  const pixelRatio = quality.dpr[1];

  return (
    <group>
      <AmbientEmbers
        count={ambientCount}
        origin={resolvedOrigin}
        spread={spread}
        intensity={quality.reducedMotion ? intensity * 0.45 : intensity * 0.68}
        windStrength={windStrength * 0.72}
        opacity={reducedOpacity}
        pixelRatio={pixelRatio}
        reducedMotion={quality.reducedMotion}
      />
      {sparkCount > 0 ? (
        <HeroSparks
          count={sparkCount}
          origin={resolvedOrigin}
          spread={spread}
          intensity={intensity}
          windStrength={windStrength}
          opacity={opacity}
          pixelRatio={pixelRatio}
          reducedMotion={quality.reducedMotion}
        />
      ) : null}
    </group>
  );
}
