import * as THREE from "three";
import type { ParticleQualityTier } from "@/components/webgl/useParticleQuality";

export const SILHOUETTE_COLOR = "#0d0d0c";
/** Warm smoke haze matching the storm-sky backdrop. */
export const FOG_COLOR = "#6b5f4e";

const HELI_POSITION_LANDSCAPE = new THREE.Vector3(-1.55, 1.95, 0);
const HELI_POSITION_PORTRAIT = new THREE.Vector3(-0.85, 2.05, 0);

export function heliPosition(portrait: boolean) {
  return portrait ? HELI_POSITION_PORTRAIT : HELI_POSITION_LANDSCAPE;
}

/** Frozen animation clock + climb used when prefers-reduced-motion is on. */
export const REDUCED_MOTION_TIME = 4.2;
export const REDUCED_MOTION_CLIMB = 0.55;

export type SwarmPointer = { x: number; y: number; active: boolean };

export type SwarmCounts = {
  tower: number;
  ground: number;
  fallers: number;
  hangers: number;
};

export function swarmCounts(tier: ParticleQualityTier): SwarmCounts {
  switch (tier) {
    case "high-desktop":
      return { tower: 240, ground: 64, fallers: 12, hangers: 6 };
    case "desktop":
      return { tower: 200, ground: 52, fallers: 10, hangers: 6 };
    case "tablet":
      return { tower: 150, ground: 40, fallers: 8, hangers: 5 };
    case "mobile":
      return { tower: 105, ground: 28, fallers: 6, hangers: 4 };
    case "low-power-mobile":
      return { tower: 70, ground: 18, fallers: 4, hangers: 3 };
  }
}

export function createSeededRandom(seed: number) {
  let value = seed >>> 0;

  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);

    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Path the swarm tower follows, from below the frame up toward the helicopter
 * tail. Portrait viewports get a steeper, more central column so both the
 * aircraft and the swarm stay in frame.
 */
export function createTowerCurve(portrait: boolean) {
  const points = portrait
    ? [
        new THREE.Vector3(1.7, -4.2, 0.3),
        new THREE.Vector3(1.45, -2.4, 0.1),
        new THREE.Vector3(1.3, -1.0, -0.15),
        new THREE.Vector3(1.15, 0.0, 0.05),
        new THREE.Vector3(1.0, 0.9, 0.15),
        new THREE.Vector3(0.85, 1.5, 0.05),
        new THREE.Vector3(0.92, 1.85, 0.0),
        new THREE.Vector3(0.97, 2.12, -0.03),
      ]
    : [
        new THREE.Vector3(4.1, -4.2, 0.3),
        new THREE.Vector3(3.4, -2.4, 0.1),
        new THREE.Vector3(3.0, -1.0, -0.15),
        new THREE.Vector3(2.62, 0.0, 0.05),
        new THREE.Vector3(2.05, 0.9, 0.15),
        new THREE.Vector3(1.35, 1.5, 0.05),
        new THREE.Vector3(0.75, 1.78, 0.0),
        new THREE.Vector3(0.3, 1.98, -0.04),
      ];

  return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.6);
}

/** Tube/mass radius along the tower, matching zombie surface placement. */
export function towerRadius(t: number) {
  return 0.62 - 0.4 * t;
}

/** World-space y the swarm has reached; drives both the mass cutoff and zombie visibility. */
export function towerCut(climb: number) {
  return -1.1 + climb * 3.55;
}

export function smoothstep01(value: number) {
  const clamped = Math.min(Math.max(value, 0), 1);

  return clamped * clamped * (3 - 2 * clamped);
}

export type HeliMotion = { x: number; y: number; rz: number };

/**
 * Hover bob shared by the helicopter model and the zombies hanging off it.
 * `struggle` (0..1) kicks in as the swarm reaches the aircraft: it sags,
 * jitters, and rolls harder as if being dragged down.
 */
export function heliMotion(time: number, struggle: number, out: HeliMotion) {
  const jitter =
    struggle * (Math.sin(time * 7.3) * 0.02 + Math.sin(time * 11.7) * 0.012);

  out.x = Math.sin(time * 0.45) * 0.05 - struggle * 0.08;
  out.y =
    Math.sin(time * 1.05) * 0.06 +
    Math.sin(time * 2.3) * 0.015 -
    struggle * 0.18 +
    jitter;
  out.rz =
    0.07 +
    Math.sin(time * 0.7) * 0.018 +
    struggle * (0.09 + Math.sin(time * 5.9) * 0.03);

  return out;
}
