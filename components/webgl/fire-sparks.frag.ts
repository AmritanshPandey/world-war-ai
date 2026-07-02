export const heroSparksFragmentShader = `
precision mediump float;

varying vec2 vUv;
varying float vProgress;
varying float vAlpha;
varying float vBrightness;
varying float vFlicker;
varying float vScreenMask;

void main() {
  vec2 centered = vec2(vUv.x - 0.5, vUv.y);
  float width = mix(0.32, 0.115, smoothstep(0.18, 0.86, vUv.y));
  float x = abs(centered.x) / width;
  float edgeMask = 1.0 - smoothstep(0.72, 1.22, x);
  edgeMask *= smoothstep(0.0, 0.08, vUv.y);
  edgeMask *= 1.0 - smoothstep(0.96, 1.0, vUv.y);

  float hotCore = exp(-(x * x * 2.6 + pow(vUv.y - 0.72, 2.0) * 20.0));
  float emberBody = exp(-(x * x * 1.25 + pow(vUv.y - 0.48, 2.0) * 5.0));
  float coolingTail = exp(-(x * x * 1.55 + pow(vUv.y - 0.16, 2.0) * 2.8));
  float shape = hotCore * 1.32 + emberBody * 0.66 + coolingTail * 0.28;

  vec3 ignition = vec3(1.0, 0.87, 0.58);
  vec3 gold = vec3(1.0, 0.58, 0.18);
  vec3 orange = vec3(1.0, 0.35, 0.08);
  vec3 ember = vec3(0.42, 0.06, 0.025);
  vec3 color = mix(ignition, gold, smoothstep(0.04, 0.22, vProgress));
  color = mix(color, orange, smoothstep(0.22, 0.68, vProgress));
  color = mix(color, ember, smoothstep(0.74, 1.0, vProgress));
  color += ignition * hotCore * (1.0 - smoothstep(0.0, 0.28, vProgress)) * 0.55;

  float alpha = shape * edgeMask * vAlpha * vFlicker * vScreenMask * 2.35;
  alpha *= mix(0.86, 1.18, clamp(vBrightness, 0.0, 1.3));

  if (alpha < 0.003) {
    discard;
  }

  gl_FragColor = vec4(color, alpha);
}
`;
