export const ambientEmbersVertexShader = `
precision highp float;

uniform float uTime;
uniform float uPixelRatio;
uniform float uIntensity;
uniform float uWindStrength;
uniform float uGlobalOpacity;
uniform float uReducedMotion;

attribute float aSeed;
attribute float aStartOffset;
attribute float aLifetime;
attribute float aSize;
attribute float aSpeed;
attribute float aDrift;
attribute float aBrightness;
attribute float aDepth;
attribute float aTextAvoid;

varying float vProgress;
varying float vAlpha;
varying float vBrightness;
varying float vScreenMask;

float textSafeMask(vec2 screenPosition) {
  float leftTextZone = 1.0 - smoothstep(0.16, 0.58, screenPosition.x);
  float verticalTextZone =
    smoothstep(-0.58, -0.42, screenPosition.y) *
    (1.0 - smoothstep(0.3, 0.48, screenPosition.y));
  float avoid = leftTextZone * verticalTextZone * aTextAvoid;

  return mix(1.0, 0.14, avoid);
}

vec3 emberPosition(float progress, float timeValue) {
  float eased = 1.0 - pow(1.0 - progress, 1.8);
  float drag = smoothstep(0.55, 1.0, progress);
  float lift = aSpeed * (eased * 2.35 - drag * 0.18);
  float gust = sin(uTime * 0.48 + aSeed * 18.0) * 0.5 + 0.5;
  gust *= gust;
  float wind = uWindStrength * aDrift * (progress * progress * 1.08 + gust * 0.16 * progress);
  float phase = aSeed * 6.2831853;
  float softDrift = sin(timeValue * 0.22 + phase + progress * 4.2) * mix(0.24, 0.12, aDepth);
  float flutter = cos(timeValue * 0.52 + phase * 1.9 + progress * 7.5) * 0.055;
  float depth = sin(timeValue * 0.18 + phase * 1.4 + progress * 3.6) * 0.18 * progress;

  return position + vec3(wind + softDrift + flutter, lift, depth);
}

void main() {
  float localTime = mod(uTime + aStartOffset, aLifetime);
  float progress = localTime / aLifetime;
  float timeValue = uTime + aSeed * 23.0;

  if (uReducedMotion > 0.5) {
    progress = fract(aStartOffset / aLifetime);
    timeValue = aSeed * 23.0;
  }

  vec3 finalPosition = emberPosition(progress, timeValue);
  if (uReducedMotion > 0.5) {
    finalPosition = position + vec3(
      sin(aSeed * 18.0) * 0.09,
      progress * 0.35,
      cos(aSeed * 14.0) * 0.04
    );
  }

  vec4 viewPosition = modelViewMatrix * vec4(finalPosition, 1.0);
  float fadeIn = smoothstep(0.0, 0.14, progress);
  float fadeOut = 1.0 - smoothstep(0.66, 1.0, progress);
  float depthScale = clamp(4.5 / max(2.2, -viewPosition.z), 0.64, 1.28);
  float pointSize = aSize * uPixelRatio * depthScale;
  pointSize *= mix(1.0, 0.78, smoothstep(0.58, 1.0, progress));

  vec4 clipPosition = projectionMatrix * viewPosition;
  vScreenMask = textSafeMask(clipPosition.xy / clipPosition.w);
  vProgress = progress;
  vBrightness = aBrightness;
  vAlpha = fadeIn * fadeOut * uGlobalOpacity * uIntensity * aBrightness * mix(1.1, 0.5, aDepth);
  if (uReducedMotion > 0.5) {
    vAlpha *= 0.28;
  }

  gl_PointSize = pointSize;
  gl_Position = clipPosition;
}
`;

export const ambientEmbersFragmentShader = `
precision mediump float;

varying float vProgress;
varying float vAlpha;
varying float vBrightness;
varying float vScreenMask;

void main() {
  vec2 point = gl_PointCoord - vec2(0.5);
  point.y *= 1.35;
  float distanceFromCenter = length(point);
  float emberShape = 1.0 - smoothstep(0.05, 0.5, distanceFromCenter);
  float core = 1.0 - smoothstep(0.0, 0.23, distanceFromCenter);

  vec3 mutedOrange = vec3(1.0, 0.36, 0.08);
  vec3 emberRed = vec3(0.58, 0.09, 0.035);
  vec3 coal = vec3(0.18, 0.025, 0.012);
  vec3 color = mix(mutedOrange, emberRed, smoothstep(0.22, 0.72, vProgress));
  color = mix(color, coal, smoothstep(0.74, 1.0, vProgress));
  color += vec3(1.0, 0.56, 0.16) * core * (1.0 - smoothstep(0.0, 0.46, vProgress)) * 0.42;

  float alpha = emberShape * vAlpha * vScreenMask * mix(0.9, 1.42, vBrightness) * 1.35;
  if (alpha < 0.002) {
    discard;
  }

  gl_FragColor = vec4(color, alpha);
}
`;
