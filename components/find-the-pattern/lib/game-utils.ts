import { FIELD_BOUNDS, type ScannerPosition, type SignalZone } from "./game-config";

export function clamp01(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

export function clampRange(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function normalizedDistance(
  scanner: ScannerPosition,
  zone: SignalZone,
  isMobile: boolean,
) {
  const radius = isMobile ? zone.mobileRadius : zone.radius;
  const dx = scanner.x - zone.x;
  const dy = scanner.y - zone.y;

  return Math.sqrt(dx * dx + dy * dy) / radius;
}

export function isInsideZone(
  scanner: ScannerPosition,
  zone: SignalZone,
  isMobile: boolean,
) {
  return scanner.active && normalizedDistance(scanner, zone, isMobile) <= 1;
}

export function normalizedToWorld(position: { x: number; y: number }) {
  return {
    x: position.x * FIELD_BOUNDS.halfWidth,
    y: -position.y * FIELD_BOUNDS.halfHeight,
  };
}

export function formatScore(score: number) {
  return String(Math.round(score)).padStart(3, "0");
}

export function formatElapsed(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function seededRandom(seed: number) {
  let value = seed >>> 0;

  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);

    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}
