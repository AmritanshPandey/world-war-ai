export const heroSparksVertexShader = `
precision highp float;

uniform float uTime;
uniform float uPixelRatio;
uniform float uIntensity;
uniform float uWindStrength;
uniform float uGlobalOpacity;
uniform float uReducedMotion;

attribute vec3 aSpawn;
attribute float aSeed;
attribute float aStartOffset;
attribute float aLifetime;
attribute float aSize;
attribute float aSpeed;
attribute float aDrift;
attribute float aBrightness;
attribute float aRotation;
attribute float aDepth;
attribute float aBurst;
attribute float aTextAvoid;

varying vec2 vUv;
varying float vProgress;
varying float vAlpha;
varying float vBrightness;
varying float vFlicker;
varying float vScreenMask;

float textSafeMask(vec2 screenPosition) {
  float leftTextZone = 1.0 - smoothstep(0.16, 0.58, screenPosition.x);
  float verticalTextZone =
    smoothstep(-0.58, -0.42, screenPosition.y) *
    (1.0 - smoothstep(0.3, 0.48, screenPosition.y));
  float avoid = leftTextZone * verticalTextZone * aTextAvoid;

  return mix(1.0, 0.08, avoid);
}

vec3 sparkPosition(float progress, float timeValue) {
  float eased = 1.0 - pow(1.0 - progress, 1.7);
  float lateDrag = smoothstep(0.48, 1.0, progress);
  float ignitionKick = progress * (1.0 - smoothstep(0.12, 0.62, progress));
  float lift = aSpeed * (eased * 2.78 + ignitionKick * 0.55 - lateDrag * 0.45);
  float gust = sin(uTime * 0.72 + aBurst * 6.2831853 + aSeed * 9.0) * 0.5 + 0.5;
  gust *= gust * gust;
  float wind = uWindStrength * aDrift * (progress * progress * 1.44 + gust * 0.36 * progress);
  float seedAngle = aSeed * 6.2831853;
  float broadTurbulence = sin(timeValue * 0.42 + seedAngle + progress * 4.6);
  float smallTurbulence = sin(timeValue * 1.15 + seedAngle * 2.7 + progress * 12.0);
  float snap = sin(progress * 10.5 + seedAngle * 2.1) * smoothstep(0.18, 0.45, progress) * (1.0 - smoothstep(0.56, 0.9, progress));
  float lateral = wind + (broadTurbulence * 0.2 + smallTurbulence * 0.04 + snap * 0.12) * (0.25 + progress);
  float depth = cos(timeValue * 0.36 + seedAngle * 1.7 + progress * 5.4) * 0.16 * progress;

  return aSpawn + vec3(lateral, lift, depth);
}

void main() {
  float localTime = mod(uTime + aStartOffset, aLifetime);
  float progress = localTime / aLifetime;
  float timeValue = uTime + aSeed * 19.0;

  if (uReducedMotion > 0.5) {
    progress = fract(aStartOffset / aLifetime);
    timeValue = aSeed * 19.0;
  }

  vec3 center = sparkPosition(progress, timeValue);
  if (uReducedMotion > 0.5) {
    center = aSpawn + vec3(
      sin(aSeed * 32.0) * 0.08,
      progress * 0.7,
      cos(aSeed * 21.0) * 0.05
    );
  }

  float nextProgress = min(progress + 0.018, 1.0);
  vec3 nextCenter = sparkPosition(nextProgress, timeValue + 0.018);
  vec3 velocity = nextCenter - center;

  vec4 viewCenter = modelViewMatrix * vec4(center, 1.0);
  vec3 viewVelocity = mat3(modelViewMatrix) * velocity;
  vec2 direction = normalize(viewVelocity.xy + vec2(0.0001, 0.0006));
  float rotation = aRotation + sin(timeValue * 0.22 + aSeed * 8.0) * 0.25;
  float rotateSin = sin(rotation);
  float rotateCos = cos(rotation);
  direction = normalize(vec2(
    direction.x * rotateCos - direction.y * rotateSin,
    direction.x * rotateSin + direction.y * rotateCos
  ));
  vec2 side = vec2(-direction.y, direction.x);

  float fadeIn = smoothstep(0.0, 0.08, progress);
  float fadeOut = 1.0 - smoothstep(0.72, 1.0, progress);
  float burstCycle = fract(uTime * 0.18 + aBurst);
  float flareWindow =
    smoothstep(0.02, 0.18, burstCycle) *
    (1.0 - smoothstep(0.28, 0.64, burstCycle));
  float lifeAlpha = fadeIn * fadeOut * mix(0.56, 1.34, flareWindow);
  float hotPhase = 1.0 - smoothstep(0.0, 0.5, progress);
  float streak = mix(2.1, 8.6, hotPhase) * (1.0 - smoothstep(0.68, 1.0, progress));
  float size = aSize * mix(1.14, 0.44, smoothstep(0.42, 1.0, progress));
  size *= mix(1.22, 0.68, aDepth);
  size *= mix(1.0, 0.88, clamp(uPixelRatio - 1.0, 0.0, 1.0));
  streak = max(streak, 1.7);

  vec2 quad = position.xy;
  float tailBias = -0.24 - hotPhase * 0.18;
  vec2 billboardOffset =
    side * quad.x * size +
    direction * (quad.y + tailBias) * size * streak;

  viewCenter.xy += billboardOffset;

  vUv = uv;
  vProgress = progress;
  vBrightness = aBrightness;
  vec4 clipPosition = projectionMatrix * viewCenter;
  vScreenMask = textSafeMask(clipPosition.xy / clipPosition.w);
  vFlicker = uReducedMotion > 0.5
    ? 1.0
    : 0.84 + sin(uTime * 8.0 + aSeed * 41.0) * 0.12 + sin(uTime * 17.0 + aSeed * 13.0) * 0.06;
  vAlpha = lifeAlpha * uGlobalOpacity * uIntensity * aBrightness * mix(1.18, 0.54, aDepth);
  if (uReducedMotion > 0.5) {
    vAlpha *= 0.18;
  }

  gl_Position = clipPosition;
}
`;
