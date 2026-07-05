"use client";

import { useEffect, useRef } from "react";
import ChapterShell from "@/components/briefing/ChapterShell";

const CLARITY_LINES = ["SURVIVAL IS NOT", "ABOUT OUTRUNNING", "THE FUTURE."];
const TINT: [number, number, number] = [0.92, 0.09, 0.045];
const HUD: [number, number, number] = [0.85, 0.7, 0.37];

const VERTEX_SHADER = `
attribute vec2 aPosition;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 uResolution;
uniform vec2 uLens;
uniform vec2 uVelocity;
uniform float uDpr;
uniform float uIntensity;
uniform float uRadius;
uniform float uTime;
uniform sampler2D uText;
uniform vec3 uBackground;
uniform vec3 uInk;
uniform vec3 uTint;
uniform vec3 uHud;

float textAt(vec2 frag) {
  return texture2D(uText, frag / uResolution).r;
}

float field(vec2 p, float time) {
  float wave = 0.0;
  wave += sin(p.x * 0.78 + time * 0.62);
  wave += sin(p.y * 1.08 - time * 0.46);
  wave += sin((p.x + p.y) * 0.58 + time * 0.86);
  wave += sin((p.x - p.y) * 0.42 - time * 0.35);
  return wave * 0.25;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 toLens = frag - uLens;
  float dist = length(toLens);

  float cell = 20.0 * uDpr;
  float aa = 1.0 * uDpr;
  float baseRadius = 1.35 * uDpr;
  float ripple = sin(dist * 0.032 / uDpr - uTime * 3.4) * exp(-dist * 0.0015 / uDpr) * uIntensity;
  float dotCoverage = 0.0;

  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 cellId = floor(frag / cell) + vec2(float(x), float(y));
      vec2 center = (cellId + 0.5) * cell;
      float waves = field(center / cell, uTime) + ripple * 1.85;
      vec2 offset = vec2(sin(waves * 3.14159), cos(waves * 3.14159)) * 4.7 * uDpr;
      float proximity = smoothstep(uRadius * 2.0, 0.0, length(center - uLens)) * uIntensity;
      float radius = baseRadius * (0.55 + 0.72 * (waves * 0.5 + 0.5) + proximity * proximity * 1.8);
      float dotDistance = length(frag - (center + offset));
      dotCoverage = max(dotCoverage, 1.0 - smoothstep(radius - aa, radius + aa, dotDistance));
    }
  }

  float warm = smoothstep(uRadius * 2.0, 0.0, dist) * uIntensity;
  vec3 dotColor = mix(mix(uBackground, uHud, 0.22), uTint, warm * 0.72);
  vec3 color = mix(uBackground, dotColor, dotCoverage * 0.62);

  float baseText = textAt(frag);
  color = mix(color, uInk, baseText);

  vec2 velocityDirection = length(uVelocity) > 1.0 ? normalize(uVelocity) : vec2(0.0);
  float along = dot(toLens, velocityDirection);
  vec2 pulled = toLens - velocityDirection * clamp(-along, 0.0, uRadius) * 0.58;
  float lensDistance = length(pulled);
  float falloff = smoothstep(uRadius, 0.0, lensDistance) * uIntensity;
  float halo = smoothstep(uRadius * 1.72, 0.0, dist) * uIntensity;
  color += mix(uTint, uHud, 0.24) * halo * halo * 0.14;

  if (falloff > 0.001) {
    vec2 dir = toLens / max(dist, 1.0);
    vec2 lensFrag = uLens + toLens * (1.0 - 0.24 * falloff);
    lensFrag += dir * sin(clamp(dist / uRadius, 0.0, 1.0) * 3.14159) * 7.0 * uDpr * falloff;

    vec2 chroma = dir * 4.2 * uDpr * falloff;
    float red = textAt(lensFrag + chroma);
    float green = textAt(lensFrag);
    float blue = textAt(lensFrag - chroma);
    float coverage = max(max(red, green), blue);

    float halftoneCell = 7.0 * uDpr;
    vec2 halftoneLocal = mod(frag, halftoneCell) - halftoneCell * 0.5;
    float halftoneRadius = sqrt(coverage) * halftoneCell * 0.68;
    float halftone = 1.0 - smoothstep(halftoneRadius - uDpr, halftoneRadius + uDpr, length(halftoneLocal));

    vec3 lensColor = uBackground;
    lensColor = mix(lensColor, mix(uTint, uHud, 0.18), halftone);
    lensColor += vec3(red - green, 0.0, blue - green) * 0.46 * halftone;

    float core = 1.0 - smoothstep(5.0 * uDpr, 8.6 * uDpr, lensDistance);
    lensColor = mix(lensColor, uHud, core);
    lensColor += mix(uTint, uHud, 0.22) * falloff * falloff * 0.22;

    color = mix(color, lensColor, clamp(falloff * 1.25, 0.0, 1.0));
  }

  gl_FragColor = vec4(color, 1.0);
}
`;

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type);

  if (!shader) {
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function createProgram(gl: WebGLRenderingContext) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);

  if (!vertex || !fragment) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    return null;
  }

  const program = gl.createProgram();

  if (!program) {
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    return null;
  }

  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

export default function ClarityChapter() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const title = titleRef.current;

    if (!root || !canvas || !title) {
      return;
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
    });

    if (!gl) {
      return;
    }

    const program = createProgram(gl);

    if (!program) {
      return;
    }

    gl.useProgram(program);

    const buffer = gl.createBuffer();
    if (!buffer) {
      gl.deleteProgram(program);
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );

    const positionLocation = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
      background: gl.getUniformLocation(program, "uBackground"),
      dpr: gl.getUniformLocation(program, "uDpr"),
      hud: gl.getUniformLocation(program, "uHud"),
      ink: gl.getUniformLocation(program, "uInk"),
      intensity: gl.getUniformLocation(program, "uIntensity"),
      lens: gl.getUniformLocation(program, "uLens"),
      radius: gl.getUniformLocation(program, "uRadius"),
      resolution: gl.getUniformLocation(program, "uResolution"),
      text: gl.getUniformLocation(program, "uText"),
      time: gl.getUniformLocation(program, "uTime"),
      tint: gl.getUniformLocation(program, "uTint"),
      velocity: gl.getUniformLocation(program, "uVelocity"),
    };

    const texture = gl.createTexture();
    if (!texture) {
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      return;
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const textCanvas = document.createElement("canvas");
    const context = textCanvas.getContext("2d");
    if (!context) {
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      return;
    }

    let devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    let width = 1;
    let height = 1;
    let lensX = 0.5;
    let lensY = 0.5;
    let targetX = lensX;
    let targetY = lensY;
    let previousX = lensX;
    let previousY = lensY;
    let velocityX = 0;
    let velocityY = 0;
    let intensity = reducedMotion ? 1 : 0;
    let targetIntensity = reducedMotion || coarsePointer ? 1 : 0;
    let animationFrame = 0;
    let running = true;
    let lastFrame = performance.now();
    let painted = false;

    const lensRadius = () => Math.min(width, height) * (coarsePointer ? 0.22 : 0.18);

    const revealCanvas = () => {
      if (painted) {
        return;
      }

      painted = true;
      canvas.style.opacity = "1";
    };

    const renderTextTexture = () => {
      const rect = root.getBoundingClientRect();
      const styles = getComputedStyle(title);
      const cssWidth = Math.max(1, rect.width);
      const cssHeight = Math.max(1, rect.height);
      devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.round(cssWidth * devicePixelRatio);
      height = Math.round(cssHeight * devicePixelRatio);
      canvas.width = width;
      canvas.height = height;
      textCanvas.width = width;
      textCanvas.height = height;
      gl.viewport(0, 0, width, height);

      const fontSize = Math.min(Math.max(cssWidth * 0.072, 38), 108) * devicePixelRatio;
      const lineHeight = fontSize * 1.05;
      const blockHeight = lineHeight * CLARITY_LINES.length;
      let y = (height - blockHeight) / 2;

      context.clearRect(0, 0, width, height);
      context.fillStyle = "#ffffff";
      context.textAlign = "center";
      context.textBaseline = "top";
      context.font = `700 ${fontSize}px ${styles.fontFamily}`;

      for (const line of CLARITY_LINES) {
        context.fillText(line, width / 2, y);
        y += lineHeight;
      }

      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        textCanvas,
      );
    };

    const draw = () => {
      gl.useProgram(program);
      gl.uniform2f(uniforms.resolution, width, height);
      gl.uniform2f(uniforms.lens, lensX * width, lensY * height);
      gl.uniform2f(uniforms.velocity, velocityX * width, velocityY * height);
      gl.uniform1f(uniforms.intensity, intensity);
      gl.uniform1f(uniforms.radius, lensRadius());
      gl.uniform1f(uniforms.dpr, devicePixelRatio);
      gl.uniform1f(uniforms.time, (performance.now() / 1000) % 3600);
      gl.uniform3f(uniforms.background, 0.017, 0.016, 0.014);
      gl.uniform3f(uniforms.ink, 0.95, 0.93, 0.86);
      gl.uniform3f(uniforms.tint, TINT[0], TINT[1], TINT[2]);
      gl.uniform3f(uniforms.hud, HUD[0], HUD[1], HUD[2]);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(uniforms.text, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      revealCanvas();
    };

    const updatePointer = (event: PointerEvent) => {
      if (event.pointerType === "touch") {
        return;
      }

      const rect = root.getBoundingClientRect();
      targetX = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      targetY = Math.min(1, Math.max(0, 1 - (event.clientY - rect.top) / rect.height));
      targetIntensity = 1;
    };

    const clearPointer = () => {
      targetIntensity = coarsePointer ? 1 : 0;
    };

    const loop = (now: number) => {
      const delta = Math.min((now - lastFrame) / 1000, 1 / 30);
      lastFrame = now;

      if (coarsePointer) {
        const seconds = now / 1000;
        targetX = 0.5 + Math.sin(seconds * 0.46) * 0.27;
        targetY = 0.52 + Math.sin(seconds * 0.82 + 1.1) * 0.18;
      }

      const follow = 1 - Math.exp(-7 * delta);
      lensX += (targetX - lensX) * follow;
      lensY += (targetY - lensY) * follow;
      const velocityFollow = 1 - Math.exp(-14 * delta);
      velocityX += (lensX - previousX - velocityX) * velocityFollow;
      velocityY += (lensY - previousY - velocityY) * velocityFollow;
      previousX = lensX;
      previousY = lensY;
      intensity += (targetIntensity - intensity) * (1 - Math.exp(-6 * delta));

      draw();

      if (running) {
        animationFrame = requestAnimationFrame(loop);
      }
    };

    renderTextTexture();
    draw();

    const fontReady = document.fonts?.ready;
    if (fontReady) {
      void fontReady.then(() => {
        renderTextTexture();
        draw();
      });
    }

    if (reducedMotion) {
      return () => {
        gl.deleteTexture(texture);
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
      };
    }

    const resizeObserver = new ResizeObserver(() => {
      renderTextTexture();
      draw();
    });
    resizeObserver.observe(root);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        running = entry.isIntersecting;

        if (running && !animationFrame) {
          lastFrame = performance.now();
          animationFrame = requestAnimationFrame(loop);
        } else if (!running && animationFrame) {
          cancelAnimationFrame(animationFrame);
          animationFrame = 0;
        }
      },
      { threshold: 0 },
    );
    intersectionObserver.observe(root);

    if (!coarsePointer) {
      window.addEventListener("pointermove", updatePointer, { passive: true });
      document.addEventListener("pointerleave", clearPointer);
      window.addEventListener("blur", clearPointer);
    }

    animationFrame = requestAnimationFrame(loop);

    return () => {
      running = false;
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      window.removeEventListener("pointermove", updatePointer);
      document.removeEventListener("pointerleave", clearPointer);
      window.removeEventListener("blur", clearPointer);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <ChapterShell
      id="clarity"
      eyebrow="07 / CLARITY AFTER CHAOS"
      tone="quiet"
      hideEyebrow
      className="!px-0 !py-0 md:!px-0 md:!py-0"
      innerClassName="!max-w-none"
    >
      <div
        ref={rootRef}
        className="relative min-h-svh overflow-hidden bg-[#050504]"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_44%,rgba(216,179,95,0.08),transparent_34%),radial-gradient(circle_at_72%_68%,rgba(211,23,12,0.16),transparent_32%),linear-gradient(180deg,#080806_0%,#030303_100%)]"
        />

        <div className="absolute inset-0 z-0 flex items-center justify-center px-5 text-center">
          <h2
            ref={titleRef}
            className="title-display text-[clamp(2.25rem,7.2vw,6.75rem)] font-bold leading-[1.05] text-[#f2efe6]"
          >
            {CLARITY_LINES.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h2>
        </div>

        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 z-10 h-full w-full opacity-0 transition-opacity duration-500"
        />

        <div className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(90deg,rgba(0,0,0,0.54),transparent_24%,transparent_76%,rgba(0,0,0,0.5)),linear-gradient(180deg,rgba(0,0,0,0.55),transparent_28%,transparent_70%,rgba(0,0,0,0.62))]" />

        <div className="relative z-30 mx-auto flex min-h-svh w-full max-w-7xl flex-col justify-between px-5 py-20 md:px-10 md:py-24">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/45 md:text-xs">
              07 / CLARITY AFTER CHAOS
            </p>
          </div>

          <div className="grid gap-10 md:grid-cols-[minmax(0,28rem)_1fr_minmax(0,27rem)] md:items-end">
            <div className="max-w-md">
              <p className="text-base leading-7 text-white/66 md:text-lg md:leading-8">
                It is not about seeing every possible output.
              </p>
              <p className="mt-4 text-base leading-7 text-white/58 md:text-lg md:leading-8">
                It is about seeing clearly enough to choose the one worth
                building.
              </p>
            </div>

            <div className="hidden md:block" />

            <div className="max-w-md md:justify-self-end">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#d8b35f]/70">
                Signal resolved
              </p>
              <p className="title-display mt-4 text-2xl leading-snug text-[#f2efe6] md:text-3xl">
                Make the future legible before you make it faster.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ChapterShell>
  );
}
