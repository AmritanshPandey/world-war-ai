"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type AsciiZombieBackgroundProps = {
  className?: string;
  opacity?: number;
  cellSize?: number;
  fontSize?: number;
  speed?: number;
  chars?: string;
  faceSrc?: string;
  faceX?: number;
  faceY?: number;
  faceScale?: number;
  faceDelay?: number;
  faceFadeIn?: number;
  faceFadeOut?: number;
  faceHold?: number;
  faceIntensity?: number;
  faceRepeatDelay?: number;
  glitchIntensity?: number;
  scareShake?: number;
  scareZoom?: number;
  triggerRootMargin?: string;
  triggerThreshold?: number;
};

type Rgb = {
  r: number;
  g: number;
  b: number;
};

type Bounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type FaceTiming = {
  cycleElapsed: number;
  hit: number;
  presence: number;
};

const DEFAULT_RAMP = " .:-=+*#%@";
const GLITCH_CHARS = "!?X@#%/&\\";
const BASE: Rgb = { r: 104, g: 102, b: 86 };
const BONE: Rgb = { r: 232, g: 220, b: 184 };
const ALERT: Rgb = { r: 211, g: 23, b: 12 };
const EYE: Rgb = { r: 255, g: 210, b: 28 };
const RAW_FLESH: Rgb = { r: 255, g: 129, b: 97 };

function clamp(value: number, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp((value - edge0) / (edge1 - edge0));

  return t * t * (3 - 2 * t);
}

function ellipse(
  x: number,
  y: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
) {
  const distance = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;

  return 1 - smoothstep(0.78, 1.05, distance);
}

function lineGlow(
  x: number,
  y: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  width: number,
) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  const t = clamp(((x - ax) * dx + (y - ay) * dy) / lengthSq);
  const px = ax + dx * t;
  const py = ay + dy * t;
  const distance = Math.hypot(x - px, y - py);

  return 1 - smoothstep(width * 0.45, width, distance);
}

function mixColor(from: Rgb, to: Rgb, amount: number) {
  return {
    r: Math.round(from.r + (to.r - from.r) * amount),
    g: Math.round(from.g + (to.g - from.g) * amount),
    b: Math.round(from.b + (to.b - from.b) * amount),
  };
}

function rotatePoint(x: number, y: number, radians: number) {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  };
}

function findAlphaBounds(imageData: ImageData): Bounds {
  const { data, width, height } = imageData;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] <= 8) {
        continue;
      }

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (minX > maxX || minY > maxY) {
    return { x: 0, y: 0, width, height };
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

export default function AsciiZombieBackground({
  className,
  opacity = 0.82,
  cellSize = 12,
  fontSize,
  speed = 1,
  chars = DEFAULT_RAMP,
  faceSrc,
  faceX = 0.68,
  faceY = 0.5,
  faceScale = 0.58,
  faceDelay = 1.1,
  faceFadeIn = 0.22,
  faceFadeOut = 1.15,
  faceHold = 4.6,
  faceIntensity = 1,
  faceRepeatDelay = 0,
  glitchIntensity = 1,
  scareShake = 1,
  scareZoom = 1,
  triggerRootMargin = "-18% 0px -18% 0px",
  triggerThreshold = 0,
}: AsciiZombieBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ramp = chars.length > 0 ? chars : DEFAULT_RAMP;
    const glyph = fontSize ?? cellSize;

    let cols = 0;
    let rows = 0;
    let width = 0;
    let height = 0;
    let raf = 0;
    let running = false;
    let activeSince = 0;
    let hasReferenceFace = false;
    let sourceImageData: ImageData | null = null;
    let sourceBounds: Bounds | null = null;
    let faceSignalMap = new Float32Array(0);
    let faceHeatMap = new Float32Array(0);
    let faceEyeMap = new Float32Array(0);
    let faceRawMap = new Float32Array(0);
    let faceRMap = new Uint8ClampedArray(0);
    let faceGMap = new Uint8ClampedArray(0);
    let faceBMap = new Uint8ClampedArray(0);
    let cancelled = false;

    const buildFaceMap = () => {
      const total = cols * rows;

      faceSignalMap = new Float32Array(total);
      faceHeatMap = new Float32Array(total);
      faceEyeMap = new Float32Array(total);
      faceRawMap = new Float32Array(total);
      faceRMap = new Uint8ClampedArray(total);
      faceGMap = new Uint8ClampedArray(total);
      faceBMap = new Uint8ClampedArray(total);
      hasReferenceFace = Boolean(sourceImageData && sourceBounds);

      if (!sourceImageData || !sourceBounds || width <= 0 || height <= 0) {
        return;
      }

      const data = sourceImageData.data;
      const sourceWidth = sourceImageData.width;
      const sourceHeight = sourceImageData.height;
      const faceWidth = Math.max(1, Math.min(width, height) * faceScale * 1.55);
      const faceHeight = faceWidth * (sourceBounds.height / sourceBounds.width);
      const centerX = width * faceX;
      const centerY = height * faceY;
      const intensity = Math.max(0.1, faceIntensity);

      for (let cy = 0; cy < rows; cy += 1) {
        for (let cx = 0; cx < cols; cx += 1) {
          const sampleIndex = cy * cols + cx;
          const px = cx * cellSize + cellSize / 2;
          const py = cy * cellSize + cellSize / 2;
          const local = rotatePoint(
            (px - centerX) / faceWidth,
            (py - centerY) / faceHeight,
            -0.025,
          );
          const u = local.x + 0.5;
          const v = local.y + 0.5;

          if (u < 0 || u > 1 || v < 0 || v > 1) {
            continue;
          }

          const sx = Math.min(
            sourceWidth - 1,
            Math.max(0, Math.floor(sourceBounds.x + u * sourceBounds.width)),
          );
          const sy = Math.min(
            sourceHeight - 1,
            Math.max(0, Math.floor(sourceBounds.y + v * sourceBounds.height)),
          );
          const offset = (sy * sourceWidth + sx) * 4;
          const alpha = data[offset + 3] / 255;

          if (alpha < 0.04) {
            continue;
          }

          const r = data[offset];
          const g = data[offset + 1];
          const b = data[offset + 2];
          const maxChannel = Math.max(r, g, b);
          const minChannel = Math.min(r, g, b);
          const saturation = maxChannel === 0 ? 0 : (maxChannel - minChannel) / maxChannel;
          const luminance = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255;
          const darkInk = alpha * (1 - smoothstep(0.08, 0.24, luminance));
          const yellow = clamp(
            ((r - 150) / 95) *
              ((g - 110) / 115) *
              (1 - smoothstep(105 / 255, 185 / 255, b / 255)),
          ) * alpha;
          const redDominance = clamp((r - Math.max(g, b) * 0.74) / 125);
          const raw = clamp(((r - 120) / 125) * saturation * (0.45 + redDominance)) *
            alpha *
            (1 - yellow * 0.35);
          const visibleInk =
            0.1 +
            smoothstep(0.07, 0.8, luminance) * 0.86 +
            saturation * 0.16;
          const shape = clamp(
            (alpha * visibleInk + darkInk * 0.42 + yellow * 0.38 + raw * 0.22) *
              intensity,
          );
          const liftedColor = mixColor(
            mixColor(BASE, BONE, darkInk * 0.34),
            { r, g, b },
            smoothstep(0.1, 0.52, luminance),
          );

          faceSignalMap[sampleIndex] = shape;
          faceHeatMap[sampleIndex] = clamp((raw * 0.9 + yellow * 0.54) * intensity);
          faceEyeMap[sampleIndex] = clamp(yellow * intensity);
          faceRawMap[sampleIndex] = clamp(raw * intensity);
          faceRMap[sampleIndex] = liftedColor.r;
          faceGMap[sampleIndex] = liftedColor.g;
          faceBMap[sampleIndex] = liftedColor.b;
        }
      }
    };

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      cols = Math.max(1, Math.ceil(width / cellSize));
      rows = Math.max(1, Math.ceil(height / cellSize));
      buildFaceMap();
    };

    const faceTimingAt = (elapsed: number): FaceTiming => {
      if (reduced) {
        return {
          cycleElapsed: faceDelay + faceFadeIn + faceHold * 0.35,
          hit: 0,
          presence: 0.82,
        };
      }

      const fadeIn = Math.max(0.01, faceFadeIn);
      const fadeOut = Math.max(0.01, faceFadeOut);
      const rest = Math.max(0, faceRepeatDelay);
      const cycleDuration = faceDelay + fadeIn + faceHold + fadeOut + rest;
      const cycleElapsed =
        rest > 0 && elapsed > cycleDuration ? elapsed % cycleDuration : elapsed;
      const revealed = smoothstep(faceDelay, faceDelay + fadeIn, cycleElapsed);
      const held =
        1 -
        smoothstep(
          faceDelay + faceHold,
          faceDelay + faceHold + fadeOut,
          cycleElapsed,
        );
      const impactWindow =
        1 - smoothstep(faceDelay + 0.75, faceDelay + 1.6, cycleElapsed);
      const impact =
        0.86 +
        Math.sin(Math.max(0, cycleElapsed - faceDelay) * 34) * 0.14 * impactWindow;
      const hit =
        revealed *
        (1 - smoothstep(faceDelay + 0.5, faceDelay + 1.35, cycleElapsed));

      return {
        cycleElapsed,
        hit: clamp(hit),
        presence: clamp(revealed * held * impact),
      };
    };

    const drawScareBurst = (time: number, hit: number) => {
      if (hit <= 0.02 || glitchIntensity <= 0) {
        return;
      }

      const centerX = width * faceX;
      const centerY = height * faceY;
      const radius = Math.min(width, height) * faceScale * (0.34 + hit * 0.12);
      const burst = hit * Math.max(0, glitchIntensity);

      ctx.save();
      ctx.font = `900 ${glyph * (1.2 + hit * 0.7)}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;

      for (let index = 0; index < 48; index += 1) {
        const angle = index * 2.399 + Math.sin(time * 5.7 + index) * 0.16;
        const spread = radius * (0.82 + ((index * 29) % 100) / 92);
        const x =
          centerX +
          Math.cos(angle) * spread +
          Math.sin(time * 28 + index * 3.1) * 18 * burst;
        const y =
          centerY +
          Math.sin(angle) * spread +
          Math.cos(time * 24 + index * 2.7) * 12 * burst;
        const char =
          GLITCH_CHARS[(index + Math.floor(time * 22)) % GLITCH_CHARS.length];
        const warm = index % 4 === 0;

        ctx.globalAlpha = opacity * burst * (warm ? 0.54 : 0.32);
        ctx.fillStyle = warm ? "rgb(255, 210, 28)" : "rgb(211, 23, 12)";
        ctx.fillText(char, x, y);
      }

      ctx.globalAlpha = opacity * burst * 0.34;
      ctx.fillStyle = "rgb(255, 210, 28)";
      for (let index = 0; index < 4; index += 1) {
        const y =
          centerY +
          Math.sin(time * 18 + index * 1.9) * radius * 0.62;

        ctx.fillRect(centerX - radius * 1.05, y, radius * 2.1, 1.5);
      }

      ctx.restore();
    };

    const signalAt = (
      cx: number,
      cy: number,
      time: number,
      faceTiming: FaceTiming,
      sampleIndex: number,
    ) => {
      const px = cx * cellSize + cellSize / 2;
      const py = cy * cellSize + cellSize / 2;
      const faceSize = Math.min(width, height) * faceScale;
      const rawX = (px - width * faceX) / faceSize;
      const rawY = (py - height * faceY) / faceSize;
      const rotated = rotatePoint(rawX, rawY, -0.08);
      const x = rotated.x;
      const y = rotated.y;
      const facePresence = faceTiming.presence;
      const ragged =
        0.5 +
        0.5 *
          Math.sin(cx * 0.7 + Math.sin(cy * 0.23) * 2.2 + time * 0.25);

      const cranium = ellipse(x, y, 0.02, -0.18, 0.64, 0.78);
      const swollenLeft = ellipse(x, y, -0.24, -0.08, 0.46, 0.68);
      const sunkenRight = ellipse(x, y, 0.3, -0.04, 0.36, 0.58);
      const jaw = ellipse(x, y, -0.05, 0.5, 0.43, 0.43);
      const brokenJaw = ellipse(x, y, 0.16, 0.72, 0.28, 0.22);
      const neck = ellipse(x, y, -0.02, 1.03, 0.32, 0.38);
      const shoulderLeft = ellipse(x, y, -0.42, 1.3, 0.58, 0.28);
      const shoulderRight = ellipse(x, y, 0.35, 1.34, 0.5, 0.24);

      const missingTemple = ellipse(x, y, 0.53, -0.18, 0.18, 0.42);
      const missingCheek = ellipse(x, y, 0.38, 0.28, 0.17, 0.24);
      const tornScalp = ellipse(x, y, -0.18, -0.86, 0.46, 0.13) * ragged;
      const decay = clamp(missingTemple * 0.55 + missingCheek * 0.5 + tornScalp * 0.32);
      const head = clamp(
        cranium * 0.72 +
          swollenLeft * 0.32 +
          sunkenRight * 0.2 +
          jaw * 0.42 +
          brokenJaw * 0.24 -
          decay,
      );
      const shoulders = clamp((shoulderLeft + shoulderRight) * 0.13 + neck * 0.16);

      const leftEye = ellipse(x, y, -0.24, -0.2, 0.16, 0.12);
      const rightEye = ellipse(x, y, 0.22, -0.15, 0.13, 0.11);
      const nose = ellipse(x, y, -0.03, 0.11, 0.1, 0.23);
      const mouth = ellipse(x, y, 0.02, 0.43, 0.35, 0.12);
      const brow = lineGlow(x, y, -0.47, -0.37, 0.4, -0.29, 0.038);
      const cheekLeft = lineGlow(x, y, -0.43, 0.11, -0.13, 0.45, 0.032);
      const cheekRight = lineGlow(x, y, 0.42, 0.1, 0.12, 0.52, 0.026);
      const scar = lineGlow(x, y, 0.08, -0.62, 0.44, -0.05, 0.024);
      const rippedMouth = lineGlow(x, y, -0.33, 0.43, 0.36, 0.49, 0.024);
      const teeth =
        rippedMouth *
        (0.55 + 0.45 * Math.sin(cx * 2.2));
      const eyePulse = 0.72 + 0.28 * Math.sin(time * 3.4 + cy * 0.16);
      const eyeGlow =
        (ellipse(x, y, -0.25, -0.2, 0.055, 0.04) +
          ellipse(x, y, 0.23, -0.15, 0.045, 0.035)) *
        eyePulse;

      const holes = clamp(
        (leftEye + rightEye) * 0.56 + nose * 0.3 + mouth * 0.36 + missingCheek * 0.28,
      );
      const features = clamp(
        brow * 0.3 +
          cheekLeft * 0.2 +
          cheekRight * 0.18 +
          scar * 0.46 +
          rippedMouth * 0.22,
      );
      const edgeBreak = 0.75 + ragged * 0.25;
      const face = clamp((head + shoulders + features + teeth * 0.48 - holes) * edgeBreak);

      const flowX = cx * 0.13;
      const flowY = cy * 0.16;
      const flow =
        (Math.sin(flowX + time * 0.7) +
          Math.sin(flowY - time * 0.55) +
          Math.sin((flowX + flowY) * 0.62 + time * 0.45)) /
        3;
      const ambient =
        (0.18 + Math.max(0, flow * 0.5 + 0.5) * 0.36) *
        (0.65 + 0.35 * Math.sin(cx * 0.09 - time * 0.5) ** 2);
      const scan = 1 - smoothstep(0, 5.5, Math.abs(((time * 14) % (rows + 14)) - cy));
      const shimmer =
        0.78 +
        0.18 * Math.sin(time * 4.6 + cx * 0.21 + cy * 0.1) +
        scan * 0.32;
      let faceSignal = hasReferenceFace ? 0 : face * facePresence * shimmer;
      let eyeSignal = hasReferenceFace ? 0 : eyeGlow * facePresence;
      let referenceMix = 0;
      let referenceEye = 0;
      let referenceRaw = 0;
      let referenceColor: Rgb | null = null;

      if (hasReferenceFace) {
        const referenceSignal = faceSignalMap[sampleIndex] ?? 0;

        if (referenceSignal > 0) {
          const referenceShimmer =
            0.8 +
            0.16 * Math.sin(time * 5.1 + cx * 0.18 + cy * 0.13) +
            scan * 0.34;

          referenceEye = faceEyeMap[sampleIndex] * facePresence;
          referenceRaw = faceRawMap[sampleIndex] * facePresence;
          faceSignal = referenceSignal * facePresence * referenceShimmer;
          eyeSignal =
            referenceEye *
            (0.9 + 0.18 * Math.sin(time * 8.2 + cy * 0.18) + faceTiming.hit * 0.72);
          referenceMix = clamp((faceSignal + eyeSignal * 0.85) * (1.28 + faceTiming.hit * 0.34));
          referenceColor = {
            r: faceRMap[sampleIndex],
            g: faceGMap[sampleIndex],
            b: faceBMap[sampleIndex],
          };
        }
      }

      const brightness = clamp(Math.max(ambient, faceSignal, eyeSignal * 0.98));
      const heat = clamp(
        ambient * 0.24 +
          eyeSignal +
          (hasReferenceFace ? faceHeatMap[sampleIndex] * facePresence : scar * facePresence * 0.55) +
          scan * faceSignal * 0.36,
      );

      return {
        brightness,
        heat,
        referenceColor,
        referenceEye,
        referenceMix,
        referenceRaw,
      };
    };

    const draw = (timestamp: number) => {
      const elapsed = reduced
        ? faceDelay + faceFadeIn + faceHold * 0.35
        : activeSince > 0
          ? Math.max(0, (timestamp - activeSince) / 1000)
          : 0;
      const faceTiming = faceTimingAt(elapsed);
      const time = reduced ? 0 : elapsed * speed;
      const half = cellSize / 2;
      const hit = faceTiming.hit;
      const shake = reduced ? 0 : hit * Math.max(0, scareShake);
      const zoom = reduced ? 1 : 1 + hit * Math.max(0, scareZoom) * 0.028;

      ctx.clearRect(0, 0, width, height);
      ctx.font = `700 ${glyph}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;

      if (hit > 0.02) {
        ctx.save();
        ctx.globalAlpha = opacity * hit * 0.08;
        ctx.fillStyle = "rgb(211, 23, 12)";
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      ctx.save();
      if (shake > 0.001 || zoom !== 1) {
        const centerX = width * faceX;
        const centerY = height * faceY;
        const dx = Math.sin(time * 64) * 8 * shake;
        const dy = Math.cos(time * 51) * 5 * shake;

        ctx.translate(centerX + dx, centerY + dy);
        ctx.scale(zoom, zoom);
        ctx.translate(-centerX, -centerY);
      }

      for (let cy = 0; cy < rows; cy += 1) {
        for (let cx = 0; cx < cols; cx += 1) {
          const sampleIndex = cy * cols + cx;
          const {
            brightness,
            heat,
            referenceColor,
            referenceEye,
            referenceMix,
            referenceRaw,
          } = signalAt(cx, cy, time, faceTiming, sampleIndex);
          const shaped = brightness * brightness * (3 - 2 * brightness);
          const rampIndex = Math.min(ramp.length - 1, Math.floor(shaped * ramp.length));
          let char = ramp[rampIndex];

          if (char === " ") {
            continue;
          }

          if (
            hit > 0.22 &&
            referenceMix > 0 &&
            (sampleIndex + Math.floor(time * 38)) % 43 < 2
          ) {
            char =
              GLITCH_CHARS[
                (sampleIndex + Math.floor(time * 19)) % GLITCH_CHARS.length
              ];
          }

          let color = mixColor(mixColor(BASE, BONE, shaped), ALERT, heat);

          if (referenceColor) {
            const sampledColor = mixColor(
              BASE,
              referenceColor,
              clamp(0.46 + shaped * 0.44),
            );

            color = mixColor(color, sampledColor, referenceMix);
            color = mixColor(color, EYE, clamp(referenceEye * 0.86));
            color = mixColor(color, RAW_FLESH, clamp(referenceRaw * 0.64));
            color = mixColor(color, ALERT, clamp(hit * referenceMix * 0.28));
          }

          ctx.globalAlpha = opacity * clamp(0.14 + shaped * 0.82 + referenceMix * 0.12);
          ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
          ctx.fillText(char, cx * cellSize + half, cy * cellSize + half);
        }
      }

      drawScareBurst(time, hit);
      ctx.restore();
      ctx.globalAlpha = 1;
    };

    const loop = (timestamp: number) => {
      draw(timestamp);
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (running || reduced) {
        return;
      }

      activeSince = performance.now();
      running = true;
      raf = requestAnimationFrame(loop);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    build();
    draw(0);

    if (reduced) {
      draw(0);
    }

    if (faceSrc) {
      const image = new Image();

      image.decoding = "async";
      image.onload = () => {
        if (cancelled || image.naturalWidth === 0 || image.naturalHeight === 0) {
          return;
        }

        const sourceCanvas = document.createElement("canvas");
        const sourceContext = sourceCanvas.getContext("2d", {
          willReadFrequently: true,
        });

        if (!sourceContext) {
          return;
        }

        sourceCanvas.width = image.naturalWidth;
        sourceCanvas.height = image.naturalHeight;
        sourceContext.drawImage(image, 0, 0);
        sourceImageData = sourceContext.getImageData(
          0,
          0,
          sourceCanvas.width,
          sourceCanvas.height,
        );
        sourceBounds = findAlphaBounds(sourceImageData);
        buildFaceMap();
        draw(reduced ? 0 : performance.now());
      };
      image.src = faceSrc;
    }

    const resizeObserver = new ResizeObserver(() => {
      build();

      if (reduced || !running) {
        draw(0);
      }
    });
    resizeObserver.observe(canvas);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        const isArmed =
          entry.isIntersecting && entry.intersectionRatio >= triggerThreshold;

        if (isArmed) {
          start();
        } else {
          stop();
        }
      },
      {
        rootMargin: triggerRootMargin,
        threshold: triggerThreshold > 0 ? [0, triggerThreshold] : 0,
      },
    );
    intersectionObserver.observe(canvas);

    return () => {
      cancelled = true;
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [
    cellSize,
    chars,
    faceDelay,
    faceFadeIn,
    faceFadeOut,
    faceHold,
    faceIntensity,
    faceRepeatDelay,
    faceScale,
    faceSrc,
    faceX,
    faceY,
    fontSize,
    glitchIntensity,
    opacity,
    scareShake,
    scareZoom,
    speed,
    triggerRootMargin,
    triggerThreshold,
  ]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn("absolute inset-0 h-full w-full", className)}
    />
  );
}
