"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import ChapterShell from "@/components/briefing/ChapterShell";
import Reveal from "@/components/briefing/Reveal";
import { cn } from "@/lib/utils";

const VERTEX_SHADER = `
precision mediump float;

attribute vec4 aPoint;

uniform float uAspect;
uniform float uCursorActive;
uniform float uCursorVelocity;
uniform float uDpr;
uniform float uPrimitive;
uniform float uProgress;
uniform float uTime;
uniform vec2 uCursor;

varying float vCore;
varying float vCursorGlow;
varying float vDepth;
varying float vEnergy;
varying float vKind;

mat2 rotate2d(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c);
}

mat3 rotateX(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat3(
    1.0, 0.0, 0.0,
    0.0, c, -s,
    0.0, s, c
  );
}

mat3 rotateY(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat3(
    c, 0.0, s,
    0.0, 1.0, 0.0,
    -s, 0.0, c
  );
}

void main() {
  vec3 base = aPoint.xyz;
  float kind = aPoint.w;
  float time = uTime;
  float scrollWave = sin(uProgress * 3.14159265);
  float stageSweep = smoothstep(0.05, 0.92, uProgress);

  vec3 p = base;
  float theta = atan(p.z, p.x);
  float shellNoise =
    sin(theta * 3.0 + p.y * 4.2 + time * 0.52) * 0.12 +
    cos(theta * 5.0 - p.y * 3.0 - time * 0.36) * 0.09;
  shellNoise *= 1.0 + stageSweep * 0.34;
  float rightLobe = smoothstep(-0.2, 0.95, p.x) * (0.22 + scrollWave * 0.12);
  float upperBite = smoothstep(0.12, 0.86, p.y) * smoothstep(0.95, -0.2, p.x) * (-0.16 - stageSweep * 0.08);

  p.x *= 1.55 + shellNoise + rightLobe;
  p.y *= 0.82 + shellNoise * 0.34 + upperBite;
  p.z *= 1.04 + shellNoise * 0.42;
  p.y += sin(theta * 2.0 + time * 0.7) * 0.045;

  vec2 core = vec2(0.58, 0.06);
  vec2 plane = vec2(p.x, p.y);
  vec2 fromCore = plane - core;
  float coreDist = length(fromCore);
  float coreField = smoothstep(1.22 - stageSweep * 0.18, 0.0, coreDist);
  float spiral = coreField * (1.22 + stageSweep * 0.46 + 0.45 * sin(time * 0.65 + coreDist * 6.0 + uProgress * 4.0));
  fromCore = rotate2d(spiral) * fromCore;
  plane = core + fromCore;
  p.x = plane.x;
  p.y = plane.y;
  p.z += coreField * (0.18 + sin(theta * 4.0 + time) * 0.08);

  float filament = step(0.5, kind);
  p.xy = mix(p.xy, rotate2d(time * 0.22) * p.xy, filament * 0.2);
  p *= 1.08 + scrollWave * 0.16 + filament * 0.02;
  p = rotateY(-0.22 + time * 0.1 + uProgress * 0.34) * rotateX(-0.18 + sin(time * 0.18) * 0.06 - stageSweep * 0.08) * p;

  float cameraZ = 4.25;
  float perspective = 2.18 / (cameraZ - p.z);
  vec2 screen = vec2((p.x * perspective) / uAspect, p.y * perspective);
  screen += vec2(0.32, -0.015);

  vec2 fromCursor = screen - uCursor;
  float cursorDist = length(fromCursor * vec2(uAspect, 1.0));
  float field = smoothstep(0.56, 0.0, cursorDist) * uCursorActive;
  float velocity = clamp(uCursorVelocity, 0.0, 1.0);
  vec2 dir = fromCursor / max(length(fromCursor), 0.0008);
  vec2 tangent = vec2(-dir.y, dir.x);
  screen += tangent * field * (0.055 + velocity * 0.12);
  screen += dir * field * field * (0.085 + velocity * 0.055);
  p.z += field * 0.34;

  gl_Position = vec4(screen, 0.0, 1.0);

  float hot = coreField * (0.62 + filament * 0.42);
  float energy = shellNoise * 0.5 + 0.5;
  vCore = hot;
  vCursorGlow = field * (0.5 + velocity * 0.7);
  vDepth = smoothstep(-1.45, 1.55, p.z);
  vEnergy = energy;
  vKind = kind;

  float pointPulse = sin(time * 2.5 + theta * 7.0) * 0.5 + 0.5;
  gl_PointSize = (1.45 + vDepth * 1.7 + hot * 2.6 + vCursorGlow * 3.1 + pointPulse * 0.8) * uDpr;
  gl_PointSize *= mix(1.0, 1.8, uPrimitive);
}
`;

const FRAGMENT_SHADER = `
precision mediump float;

uniform float uPrimitive;
uniform float uProgress;

varying float vCore;
varying float vCursorGlow;
varying float vDepth;
varying float vEnergy;
varying float vKind;

void main() {
  float pointMask = 1.0;
  if (uPrimitive > 0.5) {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float d = length(uv);
    pointMask = smoothstep(0.5, 0.12, d);
  }

  vec3 ember = vec3(0.86, 0.055, 0.035);
  vec3 alert = vec3(1.0, 0.12, 0.08);
  vec3 heat = vec3(1.0, 0.56, 0.33);
  vec3 whiteHot = vec3(1.0, 0.92, 0.82);
  vec3 color = mix(ember, alert, vEnergy * 0.55 + vDepth * 0.22);
  color = mix(color, heat, clamp(vCore * 0.72 + vCursorGlow * 0.48, 0.0, 1.0));
  color = mix(color, whiteHot, clamp(vCore * 0.25 + vCursorGlow * 0.35, 0.0, 0.72));

  float filament = step(0.5, vKind);
  float shell = 1.0 - filament;
  float scrollGlow = sin(uProgress * 3.14159265);
  float alpha = 0.34 + vEnergy * 0.2 + vDepth * 0.2 + vCore * 0.3 + vCursorGlow * 0.5 + scrollGlow * 0.12;
  alpha += shell * 0.16 + filament * 0.08;
  alpha *= mix(0.68, 1.0, uPrimitive);

  gl_FragColor = vec4(color, alpha * pointMask);
}
`;

const PROTOCOLS = [
  {
    title: "OBSERVE BEFORE REACTING",
    body: "Separate signal from panic before you redesign your work around the newest model.",
  },
  {
    title: "ASK SHARPER QUESTIONS",
    body: "The leverage moves from producing answers to framing the constraints that make answers useful.",
  },
  {
    title: "GENERATE WIDER",
    body: "Use AI to widen the field of options, then apply taste, judgment, and context to narrow it.",
  },
  {
    title: "KILL WEAK IDEAS EARLY",
    body: "When prototypes are cheap, attachment should be cheap too. Test the brittle parts first.",
  },
  {
    title: "VALIDATE WITH HUMANS",
    body: "Synthetic confidence is not customer evidence. Reality still has the final vote.",
  },
  {
    title: "DIRECT THE SYSTEM",
    body: "Build reusable principles, workflows, components, and decisions that make the machine serve intent.",
  },
];

type MeshGeometry = {
  data: Float32Array;
  lineVertexCount: number;
  pointVertexCount: number;
};

type Point = [number, number, number, number];

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create shader");

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) ?? "Unknown shader compile error";
    gl.deleteShader(shader);
    throw new Error(info);
  }

  return shader;
}

function createProgram(gl: WebGLRenderingContext) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!program) throw new Error("Unable to create WebGL program");

  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);

  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program) ?? "Unknown program link error";
    gl.deleteProgram(program);
    throw new Error(info);
  }

  return program;
}

function createSeededRandom(seed = 17) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function pushPoint(target: number[], point: Point) {
  target.push(point[0], point[1], point[2], point[3]);
}

function distance(a: Point, b: Point) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.hypot(dx, dy, dz);
}

function buildProtocolMesh(): MeshGeometry {
  const random = createSeededRandom(206);
  const shellPoints: Point[] = [];
  const lines: number[] = [];
  const points: number[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const shellCount = 640;

  for (let i = 0; i < shellCount; i += 1) {
    const y = 1 - (i / (shellCount - 1)) * 2;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = i * goldenAngle;
    const jitter = 1 + (random() - 0.5) * 0.08;
    shellPoints.push([
      Math.cos(theta) * radius * jitter,
      y * (0.98 + (random() - 0.5) * 0.05),
      Math.sin(theta) * radius * jitter,
      0,
    ]);
  }

  for (let i = 0; i < shellPoints.length; i += 1) {
    const neighbors: Array<{ index: number; score: number }> = [];

    for (let j = 0; j < shellPoints.length; j += 1) {
      if (i === j) continue;
      const score = distance(shellPoints[i], shellPoints[j]);
      if (score < 0.32) neighbors.push({ index: j, score });
    }

    neighbors
      .sort((a, b) => a.score - b.score)
      .slice(0, 4)
      .forEach(({ index }) => {
        if (index <= i) return;
        if (random() < 0.12) return;
        pushPoint(lines, shellPoints[i]);
        pushPoint(lines, shellPoints[index]);
      });
  }

  const strandCount = 62;
  const strandSegments = 34;
  for (let strand = 0; strand < strandCount; strand += 1) {
    const start = random() * Math.PI * 2;
    const radiusOffset = random() * 0.12;
    const lift = (random() - 0.5) * 0.22;
    let previous: Point | null = null;

    for (let segment = 0; segment <= strandSegments; segment += 1) {
      const progress = segment / strandSegments;
      const angle = start + progress * (Math.PI * 2.5 + random() * 0.05);
      const radius = 0.82 - progress * 0.62 + radiusOffset;
      const point: Point = [
        0.3 + Math.cos(angle) * radius,
        0.03 + Math.sin(angle) * radius * 0.56 + lift * (1 - progress),
        Math.sin(angle * 0.72 + strand * 0.17) * 0.32 + (random() - 0.5) * 0.045,
        1,
      ];

      if (previous) {
        pushPoint(lines, previous);
        pushPoint(lines, point);
      }

      previous = point;
    }
  }

  shellPoints.forEach((point, index) => {
    if (index % 2 === 0 || random() > 0.44) {
      pushPoint(points, point);
    }
  });

  const lineVertexCount = lines.length / 4;
  const pointVertexCount = points.length / 4;
  return {
    data: new Float32Array([...lines, ...points]),
    lineVertexCount,
    pointVertexCount,
  };
}

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function ProtocolMesh({
  scrollTargetRef,
}: {
  scrollTargetRef: RefObject<HTMLDivElement | null>;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: true,
      depth: false,
      premultipliedAlpha: false,
    });
    if (!gl) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const program = createProgram(gl);
    const geometry = buildProtocolMesh();
    const buffer = gl.createBuffer();
    if (!buffer) {
      gl.deleteProgram(program);
      return;
    }

    const pointLocation = gl.getAttribLocation(program, "aPoint");
    const aspectLocation = gl.getUniformLocation(program, "uAspect");
    const cursorLocation = gl.getUniformLocation(program, "uCursor");
    const cursorActiveLocation = gl.getUniformLocation(program, "uCursorActive");
    const cursorVelocityLocation = gl.getUniformLocation(
      program,
      "uCursorVelocity",
    );
    const dprLocation = gl.getUniformLocation(program, "uDpr");
    const primitiveLocation = gl.getUniformLocation(program, "uPrimitive");
    const progressLocation = gl.getUniformLocation(program, "uProgress");
    const timeLocation = gl.getUniformLocation(program, "uTime");

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, geometry.data, gl.STATIC_DRAW);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.disable(gl.DEPTH_TEST);

    let width = 1;
    let height = 1;
    let dpr = 1;
    let raf = 0;
    let frameTime = 0;
    let currentProgress = 0;
    let targetProgress = 0;
    let currentCursorX = 0.18;
    let currentCursorY = 0.04;
    let targetCursorX = 0.18;
    let targetCursorY = 0.04;
    let previousCursorX = 0.18;
    let previousCursorY = 0.04;
    let currentCursorActive = 0;
    let targetCursorActive = 0;
    let currentCursorVelocity = 0;
    let targetCursorVelocity = 0;
    let hasCursorPosition = false;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const updateProgress = () => {
      const target = scrollTargetRef.current;
      if (!target) return;

      const rect = target.getBoundingClientRect();
      const scrollable = Math.max(1, rect.height - window.innerHeight);
      targetProgress = clamp(-rect.top / scrollable);
    };

    const updateCursor = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;

      const rect = canvas.getBoundingClientRect();
      const isInside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      if (!isInside) {
        clearCursor();
        return;
      }

      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      targetCursorX = x;
      targetCursorY = y;

      const velocity = hasCursorPosition
        ? Math.hypot(x - previousCursorX, y - previousCursorY)
        : 0;
      targetCursorVelocity = clamp(velocity * 8.5, 0, 1);
      previousCursorX = x;
      previousCursorY = y;
      hasCursorPosition = true;
      targetCursorActive = 1;
    };

    const clearCursor = () => {
      targetCursorActive = 0;
      targetCursorVelocity = 0;
      hasCursorPosition = false;
    };

    const draw = (time: number) => {
      frameTime = reduceMotion ? 0 : time;
      updateProgress();
      currentProgress = reduceMotion
        ? targetProgress
        : currentProgress + (targetProgress - currentProgress) * 0.08;
      currentCursorX += (targetCursorX - currentCursorX) * 0.14;
      currentCursorY += (targetCursorY - currentCursorY) * 0.14;
      currentCursorActive += (targetCursorActive - currentCursorActive) * 0.14;
      currentCursorVelocity += (targetCursorVelocity - currentCursorVelocity) * 0.18;
      targetCursorVelocity *= 0.82;

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(pointLocation);
      gl.vertexAttribPointer(pointLocation, 4, gl.FLOAT, false, 0, 0);
      gl.uniform1f(aspectLocation, width / height);
      gl.uniform2f(cursorLocation, currentCursorX, currentCursorY);
      gl.uniform1f(cursorActiveLocation, reduceMotion ? 0 : currentCursorActive);
      gl.uniform1f(cursorVelocityLocation, reduceMotion ? 0 : currentCursorVelocity);
      gl.uniform1f(dprLocation, dpr);
      gl.uniform1f(progressLocation, currentProgress);
      gl.uniform1f(timeLocation, frameTime * 0.001);

      gl.uniform1f(primitiveLocation, 0);
      gl.drawArrays(gl.LINES, 0, geometry.lineVertexCount);
      gl.uniform1f(primitiveLocation, 1);
      gl.drawArrays(
        gl.POINTS,
        geometry.lineVertexCount,
        geometry.pointVertexCount,
      );

      raf = requestAnimationFrame(draw);
    };

    let running = false;
    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(draw);
    };
    const stop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        start();
      } else {
        stop();
      }
    });
    visibilityObserver.observe(section);

    window.addEventListener("pointermove", updateCursor, { passive: true });
    window.addEventListener("pointerleave", clearCursor);
    window.addEventListener("blur", clearCursor);
    resize();
    updateProgress();
    start();

    return () => {
      stop();
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      window.removeEventListener("pointermove", updateCursor);
      window.removeEventListener("pointerleave", clearCursor);
      window.removeEventListener("blur", clearCursor);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, [scrollTargetRef]);

  return (
    <div ref={sectionRef} className="pointer-events-auto absolute inset-0">
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}

export default function ProtocolChapter() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeProtocol, setActiveProtocol] = useState(0);

  useEffect(() => {
    const blocks = stageRefs.current.filter(Boolean) as HTMLDivElement[];
    if (blocks.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;

          const index = Number(entry.target.getAttribute("data-stage"));
          if (!Number.isNaN(index)) {
            setActiveProtocol(index);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );

    blocks.forEach((block) => observer.observe(block));
    return () => observer.disconnect();
  }, []);

  const scrollToStage = (index: number) => {
    stageRefs.current[index]?.scrollIntoView({
      block: "start",
      behavior: "smooth",
    });
  };

  return (
    <ChapterShell
      id="protocol"
      eyebrow="06 / SURVIVAL PROTOCOL"
      hideEyebrow
      className="!block !min-h-[640svh] !overflow-visible !px-0 !py-0 md:!px-0 md:!py-0"
      innerClassName="!max-w-none"
    >
      <div
        ref={sectionRef}
        className="relative min-h-[640svh] bg-[#030303] text-white"
      >
        <div className="sticky top-0 h-svh overflow-hidden px-5 py-8 md:px-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_45%,rgba(211,23,12,0.24),transparent_38%),radial-gradient(circle_at_15%_28%,rgba(216,179,95,0.08),transparent_24rem),linear-gradient(180deg,rgba(3,3,3,0.2),#030303_92%)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.075] [background-image:linear-gradient(rgba(245,245,240,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(245,245,240,0.5)_1px,transparent_1px)] [background-size:54px_54px]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_66%_48%,transparent_0%,transparent_35%,rgba(3,3,3,0.72)_78%)]"
          />

          <ProtocolMesh scrollTargetRef={sectionRef} />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-5 border border-[#d3170c]/18 md:inset-8"
          >
            <span className="absolute -left-px -top-px h-5 w-5 border-l-2 border-t-2 border-[#d3170c]" />
            <span className="absolute -right-px -top-px h-5 w-5 border-r-2 border-t-2 border-[#d3170c]" />
            <span className="absolute -bottom-px -left-px h-5 w-5 border-b-2 border-l-2 border-[#d3170c]" />
            <span className="absolute -bottom-px -right-px h-5 w-5 border-b-2 border-r-2 border-[#d3170c]" />
          </div>

          <div className="relative z-10 mx-auto grid h-full w-full max-w-[96rem] grid-rows-[auto_1fr_auto] gap-6 pt-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#d3170c] md:text-xs">
              <span className="mr-3 inline-block h-2 w-2 bg-[#d3170c] align-middle shadow-[0_0_18px_rgba(211,23,12,0.9)]" />
              06 / Survival Protocol
              <span className="ml-3 text-white/32">{" // Z-06"}</span>
            </p>

            <div className="max-w-[45rem] self-center">
            <Reveal>
              <h2 className="title-display text-4xl font-bold leading-[1.02] text-[#f2efe6] [text-shadow:0_3px_24px_rgba(0,0,0,0.82)] sm:text-5xl lg:text-[3.35rem] xl:text-[3.75rem] 2xl:text-[4.15rem]">
                <span className="block xl:whitespace-nowrap">
                  DO NOT COMPETE WITH AI
                </span>
                <span className="block">AT BEING AI.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="title-display mt-4 text-3xl font-bold leading-[1.02] text-[#d3170c] [text-shadow:0_0_24px_rgba(211,23,12,0.28)] sm:text-4xl lg:text-[3.05rem] xl:text-[3.3rem] 2xl:text-[3.7rem]">
                <span className="block xl:whitespace-nowrap">
                  BECOME THE PERSON
                </span>
                <span className="block">WHO DIRECTS IT.</span>
              </p>
            </Reveal>
            <Reveal delay={0.25}>
              <p className="mt-8 max-w-xl font-mono text-sm leading-7 text-white/58 md:text-base md:leading-8">
                Scroll through the protocol. Move the cursor through the field
                to disturb the mesh locally.
              </p>
            </Reveal>
            </div>

            <div className="hidden font-mono text-[10px] uppercase tracking-[0.24em] text-white/34 lg:block lg:justify-self-end">
              <p>
                Signal{" "}
                <span className="ml-3 text-[#d3170c]">Operator stable</span>
              </p>
              <p className="mt-2">
                Protocol <span className="ml-3 text-hud">Z-06</span>
              </p>
            </div>
          </div>

          <ol
            aria-label="Survival protocol selector"
            className="absolute right-5 top-1/2 z-30 hidden -translate-y-1/2 space-y-6 md:right-8 lg:block"
          >
            {PROTOCOLS.map((item, index) => {
              const active = index === activeProtocol;

              return (
                <li key={item.title}>
                  <button
                    type="button"
                    aria-current={active ? "step" : undefined}
                    onClick={() => scrollToStage(index)}
                    className="group flex w-full items-center justify-end gap-4 py-1 text-right font-mono text-sm tabular-nums focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d3170c]"
                  >
                    <span
                      className={cn(
                        "transition-colors duration-300",
                        active ? "text-[#d3170c]" : "text-white/34",
                      )}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={cn(
                        "h-px transition-all duration-300",
                        active
                          ? "w-8 bg-[#d3170c] shadow-[0_0_16px_rgba(211,23,12,0.85)]"
                          : "w-4 bg-white/26 group-hover:w-6 group-hover:bg-white/50",
                      )}
                    />
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="pointer-events-none relative z-20 -mt-[100svh]">
          {PROTOCOLS.map((protocol, index) => (
            <div
              key={protocol.title}
              ref={(node) => {
                stageRefs.current[index] = node;
              }}
              data-stage={index}
              className="story-slide mx-auto flex h-svh w-full max-w-[96rem] items-end px-5 pb-10 pt-28 md:px-10 md:pb-12"
            >
              <div className="max-w-lg border border-white/12 bg-black/48 p-4 shadow-[0_26px_90px_rgba(0,0,0,0.48)] backdrop-blur-md md:p-5">
                <p className="font-mono text-sm font-semibold tabular-nums text-[#d3170c]">
                  {String(index + 1).padStart(2, "0")} / 06
                </p>
                <h3 className="mt-3 cinematic-text text-xl leading-tight text-[#f2efe6] md:text-2xl">
                  {protocol.title}
                </h3>
                <p className="mt-3 text-base leading-7 text-white/65">
                  {protocol.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ChapterShell>
  );
}
