unlimited-design-hero.tsx

import React, {
  forwardRef,
  useState,
  useEffect,
  useRef,
  useId,
  useCallback,
} from "react";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ShowcaseSlide {
  id: string;
  title: string;
  category: string;
  imageSrc: string;
  alt: string;
}

export interface StartupLogoItem {
  id: string;
  name: string;
  svg: React.ReactNode;
}

export interface LeaderAvatar {
  id: string;
  name: string;
  role: string;
  src: string;
}

export interface PricingPlanOption {
  id: string;
  name: string;
  price: string;
  cadence: string;
  description: string;
  turnaround: string;
  badge?: string;
  features: string[];
}

export interface UnlimitedDesignHeroProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  "onSelect"
> {
  /** Top availability status text */
  statusText?: string;
  /** Number of open booking spots remaining */
  spotsLeft?: number;
  /** Whether booking is currently open */
  isBookingOpen?: boolean;
  /** Main headline segments */
  headlineTopLeft?: string;
  headlineTopRight?: string;
  headlineBottomLeft?: string;
  headlineBottomRight?: string;
  /** Supporting value proposition copy */
  subtitleLine1?: string;
  subtitleLine2?: string;
  /** Primary CTA button label */
  ctaText?: string;
  /** Social proof caption below leader avatars */
  trustedText?: string;
  /** Showcase slides inside the top inline pill */
  showcaseSlides?: ShowcaseSlide[];
  /** Auto-advance interval in milliseconds for the top showcase pill */
  slideIntervalMs?: number;
  /** Controlled active slide index */
  activeSlideIndex?: number;
  /** Callback when active slide changes */
  onSlideChange?: (index: number) => void;
  /** Startup logos inside the bottom inline marquee pill */
  logos?: StartupLogoItem[];
  /** Marquee loop duration in seconds */
  marqueeDurationSec?: number;
  /** Leader avatars for social proof stack */
  avatars?: LeaderAvatar[];
  /** Subscription plans displayed when clicking "Choose your plan" */
  plans?: PricingPlanOption[];
  /** Callback when user clicks the primary CTA or selects a plan */
  onCtaClick?: () => void;
  onSelectPlan?: (plan: PricingPlanOption) => void;
}

// ============================================================================
// REDUCED MOTION HOOK (ZERO EXTERNAL DEPENDENCIES)
// ============================================================================

function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return prefersReducedMotion;
}

// ============================================================================
// WEBGL1 "WAVES" SHADER BACKGROUND
// ============================================================================

const WAVES_VERTEX_SHADER = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const WAVES_FRAGMENT_SHADER = `
// "Waves" — made with the 21st.dev Shader Builder
// Packed WebGL1 uniforms (the shader exposes readable u_* aliases as macros):
//   u_colors[8] (first 4 used)
//   vec3(0.102, 0.078, 0.137)
//   vec3(0.718, 0.365, 0.412)
//   vec3(0.918, 0.804, 0.761)
//   vec3(1.000, 0.961, 0.922)
//   u_scene = vec4(canvas width, canvas height, seconds * -0.67, 4.0)
//   u_shape = vec4(1.32, 0.49, 0.84, 0.01)
//   u_surface = vec4(1.73, 1.08, 0.07, 2.00)
//   u_finish = vec4(2.27, 0.00, 0.040, 0.35)
//   u_transform = vec4(4984.0, 3.37, 0.40, 1.0)
//   u_space = vec4(-0.13, 0.05, pointer x, pointer y)
//   u_cursor = vec4(presence, 3.0, 0.54, 0.56)

#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec3 u_colors[8];
// Seven packed vectors + eight colour vectors = 15 fragment uniform vectors,
// one below WebGL1's guaranteed minimum. Macros preserve the public u_* API.
uniform vec4 u_scene;      // resolution.xy, time, colour count
uniform vec4 u_shape;      // scale, intensity, paramA, warp
uniform vec4 u_surface;    // detail, contrast, brightness, saturation
uniform vec4 u_finish;     // hue, vignette, blur, grain
uniform vec4 u_transform;  // seed, rotation, drift, OKLab toggle
uniform vec4 u_space;      // offset.xy, pointer.xy
uniform vec4 u_cursor;

#define u_resolution u_scene.xy
#define u_time u_scene.z
#define u_colorCount u_scene.w
#define u_scale u_shape.x
#define u_intensity u_shape.y
#define u_paramA u_shape.z
#define u_warp u_shape.w
#define u_detail u_surface.x
#define u_contrast u_surface.y
#define u_brightness u_surface.z
#define u_saturation u_surface.w
#define u_hue u_finish.x
#define u_vignette u_finish.y
#define u_blur u_finish.z
#define u_grain u_finish.w
#ifdef GL_FRAGMENT_PRECISION_HIGH
#define u_seed u_transform.x
#else
// Keep hash inputs inside mediump's guaranteed +-2^14 range.
#define u_seed mod(u_transform.x, 31.0)
#endif
#define u_rotate u_transform.y
#define u_drift u_transform.z
#define u_oklab u_transform.w
#define u_offset u_space.xy
#define u_mouse u_space.zw
#define u_cursorPresence u_cursor.x
#define u_cursorEffect u_cursor.y
#define u_cursorStrength u_cursor.z
#define u_cursorRadius u_cursor.w

float hash21(vec2 p) {
#ifndef GL_FRAGMENT_PRECISION_HIGH
  p = mod(p, 31.0);
#endif
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

// Even, un-structured white noise for film grain (Dave Hoskins hash12). The
// multiply hash above is fine for value noise but shows a faint axis-aligned
// mesh at integer fragment coords, which reads as a net over flat areas.
float grainHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
#ifndef GL_FRAGMENT_PRECISION_HIGH
  p = mod(p, 31.0);
#endif
  float n = sin(dot(p, vec2(41.0, 289.0)));
  return fract(vec2(15731.743, 7892.321) * n);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
    u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(17.0, 9.2);
    a *= 0.5;
  }
  return v;
}

// --- OKLab colour mixing (perceptual), gated by u_oklab -----------------------
vec3 srgbToLinear(vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)),
    step(0.04045, c));
}
vec3 linearToSrgb(vec3 c) {
  // max() guards the sRGB branch: out-of-gamut OKLab interpolations can send a
  // channel negative, and pow(negative, ...) is NaN which mix()/step() would
  // then propagate. The linear branch clips such channels to 0 downstream.
  return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055,
    step(0.0031308, c));
}
vec3 linToOklab(vec3 c) {
  float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;
  float m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;
  float s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;
  l = pow(max(l, 0.0), 1.0 / 3.0);
  m = pow(max(m, 0.0), 1.0 / 3.0);
  s = pow(max(s, 0.0), 1.0 / 3.0);
  return vec3(
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s);
}
vec3 oklabToLin(vec3 c) {
  float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  l = l * l * l; m = m * m * m; s = s * s * s;
  return vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
}
vec3 mixColour(vec3 a, vec3 b, float t) {
  if (u_oklab > 0.5) {
    vec3 la = linToOklab(srgbToLinear(a));
    vec3 lb = linToOklab(srgbToLinear(b));
    return clamp(linearToSrgb(oklabToLin(mix(la, lb, t))), 0.0, 1.0);
  }
  return mix(a, b, t);
}

// Mix through the recipe colours; x is clamped to 0..1. WebGL1 forbids
// dynamic uniform indexing in fragment shaders, hence the constant loop.
vec3 palette(float x) {
  float n = max(u_colorCount - 1.0, 1.0);
  float f = clamp(x, 0.0, 1.0) * n;
  vec3 col = u_colors[0];
  for (int i = 0; i < 7; i++) {
    if (float(i) < n)
      col = mixColour(col, u_colors[i + 1],
        smoothstep(0.0, 1.0, clamp(f - float(i), 0.0, 1.0)));
  }
  return col;
}

vec3 hueRotate(vec3 col, float a) {
  const mat3 toYIQ = mat3(0.299, 0.596, 0.211,
                          0.587, -0.274, -0.523,
                          0.114, -0.322, 0.312);
  const mat3 toRGB = mat3(1.0, 1.0, 1.0,
                          0.956, -0.272, -1.106,
                          0.621, -0.647, 1.703);
  vec3 yiq = toYIQ * col;
  float ca = cos(a), sa = sin(a);
  yiq = vec3(yiq.x, yiq.y * ca - yiq.z * sa, yiq.y * sa + yiq.z * ca);
  return toRGB * yiq;
}

vec3 shade(vec2 uv, vec2 p, float t) {
  float y = uv.y
    + sin(uv.x * (3.0 + u_intensity * 9.0) + t * 0.8) * 0.08
    + (fbm(p * 2.0 + t * 0.1) - 0.5) * u_intensity * 0.6;
  return palette(y);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 screenUv = uv;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy)
    / min(u_resolution.x, u_resolution.y);
  float cursorMask = 0.0;

  // Cursor modes 1-3 are local distortions. Push shifts the same screen-space
  // coordinates before field transforms, so Zoom/Rotate don't change its feel.
  if (u_cursorPresence > 0.001) {
    // u_mouse is normalized to -1..1 in canvas space. Convert it to the same
    // aspect-corrected screen space as p so effects stay under the cursor.
    vec2 cursor = (0.5 * u_mouse * u_resolution.xy)
      / min(u_resolution.x, u_resolution.y);
    vec2 cursorDelta = p - cursor;
    if (u_cursorEffect < 0.5) {
      p += cursor * u_cursorPresence * u_cursorStrength * 0.55;
    } else {
      float cursorDistance = length(cursorDelta);
      vec2 cursorDirection = cursorDelta / max(cursorDistance, 0.0001);
      cursorMask = u_cursorPresence
        * (1.0 - smoothstep(0.0, u_cursorRadius, cursorDistance));
      if (u_cursorEffect < 1.5) {
        p -= cursorDirection * cursorMask * u_cursorStrength * 0.24;
      } else if (u_cursorEffect < 2.5) {
        float cursorAngle = cursorMask * u_cursorStrength * 2.2;
        float cc = cos(cursorAngle), cs = sin(cursorAngle);
        p = cursor + mat2(cc, -cs, cs, cc) * cursorDelta;
      } else if (u_cursorEffect < 3.5) {
        float ripple = sin(
          cursorDistance / max(u_cursorRadius, 0.001) * 18.0 - u_time * 5.0);
        p -= cursorDirection * ripple * cursorMask * u_cursorStrength * 0.07;
      }
    }
  }

  // Keep presets that read uv (rather than p) in the same warped space.
  uv = p * min(u_resolution.x, u_resolution.y) / u_resolution.xy + 0.5;
  p *= u_scale;
  // Field transform: rotate, pan, pointer push, slow drift.
  if (abs(u_rotate) > 0.0001) {
    float cr = cos(u_rotate), sr = sin(u_rotate);
    p = mat2(cr, -sr, sr, cr) * p;
  }
  p += u_offset;
  if (u_drift > 0.0001)
    p += u_drift * vec2(sin(u_time * 0.31), cos(u_time * 0.23));
  // Organic domain warp.
  if (u_warp > 0.0) {
    p += u_warp * (vec2(
      fbm(p * u_detail + u_seed),
      fbm(p * u_detail + vec2(5.2, 1.3))) - 0.5);
  }
  // Shade, with an optional soft 5-tap blur.
  vec3 col;
  if (u_blur > 0.0) {
    float e = u_blur;
    float pe = e * u_scale;
    vec2 uvE = vec2(e) * min(u_resolution.x, u_resolution.y) / u_resolution.xy;
    col  = shade(uv, p, u_time) * 0.36;
    col += shade(uv + vec2(uvE.x, 0.0), p + vec2(pe, 0.0), u_time) * 0.16;
    col += shade(uv - vec2(uvE.x, 0.0), p - vec2(pe, 0.0), u_time) * 0.16;
    col += shade(uv + vec2(0.0, uvE.y), p + vec2(0.0, pe), u_time) * 0.16;
    col += shade(uv - vec2(0.0, uvE.y), p - vec2(0.0, pe), u_time) * 0.16;
  } else {
    col = shade(uv, p, u_time);
  }
  // Post: contrast, saturation, hue, brightness, vignette, grain.
  if (abs(u_contrast - 1.0) > 0.0001)
    col = (col - 0.5) * u_contrast + 0.5;
  if (abs(u_saturation - 1.0) > 0.0001) {
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(luma), col, u_saturation);
  }
  if (abs(u_hue) > 0.0001)
    col = hueRotate(col, u_hue);
  if (abs(u_brightness) > 0.0001)
    col += u_brightness;
  if (u_vignette > 0.0001) {
    float vd = length(screenUv - 0.5) * 1.41421356;
    col *= 1.0 - u_vignette * smoothstep(0.35, 1.0, vd);
  }
  if (u_cursorPresence > 0.001 && u_cursorEffect > 3.5)
    col += (vec3(0.18) + col * 0.12) * cursorMask * u_cursorStrength;
  if (u_grain > 0.0001)
    col += (grainHash(
      gl_FragCoord.xy + vec2(u_seed * 17.0, u_seed * 31.0)) - 0.5) * u_grain;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

const WAVES_COLORS = new Float32Array([
  0.102, 0.078, 0.137, 0.718, 0.365, 0.412, 0.918, 0.804, 0.761, 1.0, 0.961,
  0.922, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
]);

interface WavesShaderBackgroundProps {
  reduceMotion?: boolean;
}

const WavesShaderBackground: React.FC<WavesShaderBackgroundProps> = ({
  reduceMotion = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      (canvas.getContext("webgl", {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
      }) as WebGLRenderingContext | null) ||
      (canvas.getContext("experimental-webgl", {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
      }) as WebGLRenderingContext | null);

    if (!gl) return;

    const compileShader = (
      type: number,
      source: string
    ): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(gl.VERTEX_SHADER, WAVES_VERTEX_SHADER);
    const fs = compileShader(gl.FRAGMENT_SHADER, WAVES_FRAGMENT_SHADER);
    if (!vs || !fs) {
      if (vs) gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      return;
    }

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      return;
    }

    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, "a_position");
    if (positionLocation >= 0) {
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    }

    const uColorsLoc = gl.getUniformLocation(program, "u_colors");
    const uSceneLoc = gl.getUniformLocation(program, "u_scene");
    const uShapeLoc = gl.getUniformLocation(program, "u_shape");
    const uSurfaceLoc = gl.getUniformLocation(program, "u_surface");
    const uFinishLoc = gl.getUniformLocation(program, "u_finish");
    const uTransformLoc = gl.getUniformLocation(program, "u_transform");
    const uSpaceLoc = gl.getUniformLocation(program, "u_space");
    const uCursorLoc = gl.getUniformLocation(program, "u_cursor");

    if (uColorsLoc) gl.uniform3fv(uColorsLoc, WAVES_COLORS);
    if (uShapeLoc) gl.uniform4f(uShapeLoc, 1.32, 0.49, 0.84, 0.01);
    if (uSurfaceLoc) gl.uniform4f(uSurfaceLoc, 1.73, 1.08, 0.07, 2.0);
    if (uFinishLoc) gl.uniform4f(uFinishLoc, 2.27, 0.0, 0.04, 0.35);
    if (uTransformLoc) gl.uniform4f(uTransformLoc, 4984.0, 3.37, 0.4, 1.0);
    if (uSpaceLoc) gl.uniform4f(uSpaceLoc, -0.13, 0.05, 0.0, 0.0);
    if (uCursorLoc) gl.uniform4f(uCursorLoc, 0.0, 3.0, 0.54, 0.56);

    const updateSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    updateSize();

    let rafId: number | null = null;
    let elapsedMs = 0;
    let lastTimestamp: number | null = null;

    const drawFrame = (seconds: number) => {
      if (uSceneLoc) {
        gl.uniform4f(
          uSceneLoc,
          canvas.width,
          canvas.height,
          seconds * -0.67,
          4.0
        );
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const tick = (now: number) => {
      if (document.hidden) {
        rafId = null;
        lastTimestamp = null;
        return;
      }
      if (lastTimestamp !== null) {
        elapsedMs += now - lastTimestamp;
      }
      lastTimestamp = now;
      drawFrame(elapsedMs * 0.001);
      rafId = requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (reduceMotion) {
        drawFrame(0);
        return;
      }
      if (!document.hidden && rafId === null) {
        lastTimestamp = null;
        rafId = requestAnimationFrame(tick);
      }
    };

    const stopLoop = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      lastTimestamp = null;
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopLoop();
      } else {
        startLoop();
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
      if (reduceMotion || document.hidden) {
        drawFrame(elapsedMs * 0.001);
      }
    });
    resizeObserver.observe(canvas);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    startLoop();

    return () => {
      stopLoop();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (buffer) gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [reduceMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
};

// ============================================================================
// CRITICALLY-DAMPED MOTION CONSTANTS & KEYFRAMES (ZERO LAYOUT SHIFT)
// ============================================================================

const EASE_OUT_EXPO_CSS = "cubic-bezier(0.22, 1, 0.36, 1)";

const HERO_KEYFRAMES_CSS = `
@keyframes udh-badge-in {
  0% {
    opacity: 0;
    transform: translateY(-14px) scale(0.92);
    filter: blur(6px);
  }
  100% {
    opacity: 1;
    transform: translateY(0px) scale(1);
    filter: blur(0px);
  }
}

@keyframes udh-char-in {
  0% {
    opacity: 0;
    transform: translateY(0.24em);
    filter: blur(8px);
  }
  100% {
    opacity: 1;
    transform: translateY(0em);
    filter: blur(0px);
  }
}

@keyframes udh-word-in {
  0% {
    opacity: 0;
    transform: translateY(8px);
    filter: blur(4px);
  }
  100% {
    opacity: 1;
    transform: translateY(0px);
    filter: blur(0px);
  }
}

@keyframes udh-pill1-in {
  0% {
    opacity: 0;
    transform: translateY(14px) rotate(-9deg) skewX(3.5deg) scale(0.72);
    filter: blur(8px);
  }
  100% {
    opacity: 1;
    transform: translateY(0px) rotate(-0.8deg) skewX(3.5deg) scale(1);
    filter: blur(0px);
  }
}

@keyframes udh-pill2-in {
  0% {
    opacity: 0;
    transform: translateY(14px) rotate(8deg) skewX(3.5deg) scale(0.72);
    filter: blur(8px);
  }
  100% {
    opacity: 1;
    transform: translateY(0px) rotate(-0.6deg) skewX(3.5deg) scale(1);
    filter: blur(0px);
  }
}

@keyframes udh-cta-in {
  0% {
    opacity: 0;
    transform: translateY(16px) scale(0.94);
    filter: blur(6px);
  }
  100% {
    opacity: 1;
    transform: translateY(0px) scale(1);
    filter: blur(0px);
  }
}

@keyframes udh-avatar-in {
  0% {
    opacity: 0;
    transform: translateX(-10px) scale(0.78);
  }
  100% {
    opacity: 1;
    transform: translateX(0px) scale(1);
  }
}

@keyframes udh-marquee {
  0% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(-33.333%);
  }
}

@keyframes udh-cursor-blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

@keyframes udh-backdrop-in {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes udh-backdrop-out {
  0% { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes udh-modal-in {
  0% {
    opacity: 0;
    transform: translateY(16px) scale(0.97);
  }
  100% {
    opacity: 1;
    transform: translateY(0px) scale(1);
  }
}

@keyframes udh-modal-out {
  0% {
    opacity: 1;
    transform: translateY(0px) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
}

.udh-pill-1-interactive {
  transform: rotate(-0.8deg) skewX(3.5deg);
  transition: transform 0.25s ${EASE_OUT_EXPO_CSS};
}
.udh-pill-1-interactive:hover {
  transform: translateY(-2px) rotate(-1.6deg) skewX(3.5deg) scale(1.035);
}
.udh-pill-1-interactive:active {
  transform: rotate(-0.8deg) skewX(3.5deg) scale(0.975);
}

.udh-pill-2-interactive {
  transform: rotate(-0.6deg) skewX(3.5deg);
  transition: transform 0.25s ${EASE_OUT_EXPO_CSS};
}
.udh-pill-2-interactive:hover {
  transform: translateY(-2px) rotate(0.5deg) skewX(3.5deg) scale(1.03);
}
`;

// ============================================================================
// SUBCOMPONENTS: TYPED HEADLINE & TYPEWRITER BADGE/SUBTITLE
// ============================================================================

interface TypedHeadlineSegmentProps {
  text: string;
  delay?: number;
  stagger?: number;
  className?: string;
  reduceMotion?: boolean;
}

/**
 * Splits a headline segment into individual character spans that type/unblur
 * into place sequentially without shifting layout coordinates.
 */
const TypedHeadlineSegment: React.FC<TypedHeadlineSegmentProps> = ({
  text,
  delay = 0,
  stagger = 0.028,
  className = "",
  reduceMotion = false,
}) => {
  if (reduceMotion) {
    return <span className={className}>{text}</span>;
  }

  const chars = Array.from(text);

  return (
    <span
      aria-label={text}
      className={cn("inline-flex whitespace-pre", className)}
    >
      {chars.map((char, index) => (
        <span
          key={`${char}-${index}`}
          aria-hidden="true"
          className="inline-block will-change-[transform,opacity,filter]"
          style={{
            animation: `udh-char-in 0.42s ${EASE_OUT_EXPO_CSS} ${delay + index * stagger}s both`,
          }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
};

interface TypewriterStreamTextProps {
  text: string;
  startDelayMs?: number;
  charSpeedMs?: number;
  showCursorWhileTyping?: boolean;
  reduceMotion?: boolean;
  className?: string;
}

/**
 * True character-stream typewriter effect with an auto-hiding terminal cursor
 * for status badges and micro-copy. Reserves full width so bounding box never jumps.
 */
const TypewriterStreamText: React.FC<TypewriterStreamTextProps> = ({
  text,
  startDelayMs = 120,
  charSpeedMs = 24,
  showCursorWhileTyping = true,
  reduceMotion = false,
  className = "",
}) => {
  const [visibleCount, setVisibleCount] = useState(
    reduceMotion ? text.length : 0
  );
  const [isTypingDone, setIsTypingDone] = useState(reduceMotion);

  useEffect(() => {
    if (reduceMotion) {
      setVisibleCount(text.length);
      setIsTypingDone(true);
      return;
    }

    setVisibleCount(0);
    setIsTypingDone(false);

    let intervalId: ReturnType<typeof setInterval> | null = null;
    const startTimeout = setTimeout(() => {
      let idx = 0;
      intervalId = setInterval(() => {
        idx += 1;
        setVisibleCount(idx);
        if (idx >= text.length) {
          if (intervalId) clearInterval(intervalId);
          setIsTypingDone(true);
        }
      }, charSpeedMs);
    }, startDelayMs);

    return () => {
      clearTimeout(startTimeout);
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, startDelayMs, charSpeedMs, reduceMotion]);

  const typedSlice = text.slice(0, visibleCount);
  const untypedSlice = text.slice(visibleCount);

  return (
    <span className={cn("relative inline-block", className)} aria-label={text}>
      <span aria-hidden="true">{typedSlice}</span>
      {showCursorWhileTyping && !isTypingDone && (
        <span
          aria-hidden="true"
          className="ml-[1px] inline-block h-[0.88em] w-[1.5px] translate-y-[1.5px] bg-[hsl(var(--primary))] align-baseline"
          style={{ animation: "udh-cursor-blink 0.55s linear infinite" }}
        />
      )}
      {/* Invisible reserve text prevents width reflow while typing */}
      <span
        aria-hidden="true"
        className="pointer-events-none select-none opacity-0"
      >
        {untypedSlice}
      </span>
    </span>
  );
};

interface AnimatedLeaderAvatarProps {
  avatar: LeaderAvatar;
  index: number;
  reduceMotion: boolean;
}

const AnimatedLeaderAvatar: React.FC<AnimatedLeaderAvatarProps> = ({
  avatar,
  index,
  reduceMotion,
}) => {
  const [entered, setEntered] = useState(reduceMotion);

  return (
    <div
      title={`${avatar.name} — ${avatar.role}`}
      onAnimationEnd={() => setEntered(true)}
      className="relative h-[30px] w-[30px] shrink-0 overflow-hidden rounded-full ring-[1.5px] ring-[#E2E2E2] transition-transform duration-200 hover:z-20 hover:-translate-y-0.5 dark:ring-[#2A2A30]"
      style={{
        zIndex: index + 1,
        animation:
          reduceMotion || entered
            ? undefined
            : `udh-avatar-in 0.4s ${EASE_OUT_EXPO_CSS} ${1.32 + index * 0.055}s both`,
      }}
    >
      <img
        src={avatar.src}
        alt={avatar.name}
        className="h-full w-full object-cover"
        draggable={false}
      />
    </div>
  );
};

// ============================================================================
// DEFAULT REFERENCE ASSETS (EXTRACTED 1:1 FROM REFERENCE MEDIA)
// ============================================================================

const DEFAULT_SLIDES: ShowcaseSlide[] = [];
const DEFAULT_AVATARS: LeaderAvatar[] = [];
const DEFAULT_LOGOS: StartupLogoItem[] = [];
const DEFAULT_PLANS: PricingPlanOption[] = [];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const UnlimitedDesignHero = forwardRef<
  HTMLElement,
  UnlimitedDesignHeroProps
>(
  (
    {
      statusText,
      spotsLeft = 2,
      isBookingOpen = true,
      headlineTopLeft = "Unlimited",
      headlineTopRight = "Design",
      headlineBottomLeft = "for",
      headlineBottomRight = "Solid Startups",
      subtitleLine1 = "We help startups and brands create beautiful,",
      subtitleLine2 = "functional products — fast and hassle-free.",
      ctaText = "Choose your plan",
      trustedText = "Trusted by Leaders",
      showcaseSlides = DEFAULT_SLIDES,
      slideIntervalMs = 2800,
      activeSlideIndex: controlledSlideIndex,
      onSlideChange,
      logos = DEFAULT_LOGOS,
      marqueeDurationSec = 10,
      avatars = DEFAULT_AVATARS,
      plans = DEFAULT_PLANS,
      onCtaClick,
      onSelectPlan,
      className,
      style,
      ...rest
    },
    ref
  ) => {
    const instanceId = useId();
    const shouldReduceMotion = usePrefersReducedMotion();

    // Uncontrolled / Controlled state for Pill 1 vertical carousel
    const [internalSlide, setInternalSlide] = useState(0);
    const [isPill1Hovered, setIsPill1Hovered] = useState(false);
    const [pill1Entered, setPill1Entered] = useState(false);
    const [pill2Entered, setPill2Entered] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModalRendered, setIsModalRendered] = useState(false);
    const [isModalClosing, setIsModalClosing] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState<string>(
      plans[1]?.id || plans[0]?.id || "growth-scale"
    );
    const [confirmedPlan, setConfirmedPlan] =
      useState<PricingPlanOption | null>(null);
    // Replay key so user can re-trigger the frame-in & typing sequence anytime
    const [animCycleKey, setAnimCycleKey] = useState(0);

    const modalCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
      null
    );
    const confirmCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

    const currentSlide =
      controlledSlideIndex !== undefined ? controlledSlideIndex : internalSlide;

    const advanceSlide = useCallback(() => {
      if (showcaseSlides.length <= 1) return;
      const next = (currentSlide + 1) % showcaseSlides.length;
      if (controlledSlideIndex === undefined) {
        setInternalSlide(next);
      }
      onSlideChange?.(next);
    }, [
      currentSlide,
      showcaseSlides.length,
      controlledSlideIndex,
      onSlideChange,
    ]);

    const openModal = useCallback(() => {
      if (modalCloseTimerRef.current) {
        clearTimeout(modalCloseTimerRef.current);
        modalCloseTimerRef.current = null;
      }
      setIsModalClosing(false);
      setIsModalOpen(true);
      setIsModalRendered(true);
    }, []);

    const closeModal = useCallback(() => {
      setIsModalOpen(false);
      if (shouldReduceMotion) {
        setIsModalRendered(false);
        setIsModalClosing(false);
        return;
      }
      setIsModalClosing(true);
      if (modalCloseTimerRef.current) {
        clearTimeout(modalCloseTimerRef.current);
      }
      modalCloseTimerRef.current = setTimeout(() => {
        setIsModalRendered(false);
        setIsModalClosing(false);
        modalCloseTimerRef.current = null;
      }, 220);
    }, [shouldReduceMotion]);

    useEffect(() => {
      return () => {
        if (modalCloseTimerRef.current) {
          clearTimeout(modalCloseTimerRef.current);
        }
        if (confirmCloseTimerRef.current) {
          clearTimeout(confirmCloseTimerRef.current);
        }
      };
    }, []);

    useEffect(() => {
      if (!isModalOpen) return;
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          closeModal();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isModalOpen, closeModal]);

    useEffect(() => {
      if (
        shouldReduceMotion ||
        isPill1Hovered ||
        isModalOpen ||
        showcaseSlides.length <= 1 ||
        controlledSlideIndex !== undefined
      ) {
        return;
      }
      const timer = setInterval(advanceSlide, slideIntervalMs);
      return () => clearInterval(timer);
    }, [
      shouldReduceMotion,
      isPill1Hovered,
      isModalOpen,
      showcaseSlides.length,
      controlledSlideIndex,
      slideIntervalMs,
      advanceSlide,
    ]);

    const handleCtaAction = () => {
      if (onCtaClick) {
        onCtaClick();
      } else {
        openModal();
      }
    };

    const handleConfirmPlan = (plan: PricingPlanOption) => {
      setConfirmedPlan(plan);
      onSelectPlan?.(plan);
      if (confirmCloseTimerRef.current) {
        clearTimeout(confirmCloseTimerRef.current);
      }
      confirmCloseTimerRef.current = setTimeout(() => {
        closeModal();
      }, 900);
    };

    const handleReplayEntrance = () => {
      setPill1Entered(false);
      setPill2Entered(false);
      setAnimCycleKey((k) => k + 1);
    };

    const resolvedStatusLabel =
      statusText ??
      (isBookingOpen
        ? `Booking Open — ${spotsLeft} ${spotsLeft === 1 ? "Spot" : "Spots"} Left`
        : "Currently Fully Booked — Join Waitlist");

    const repeatedLogos = [...logos, ...logos, ...logos];
    const subtitleWordsLine1 = subtitleLine1.split(" ");
    const subtitleWordsLine2 = subtitleLine2.split(" ");

    return (
      <section
        ref={ref}
        aria-labelledby={`${instanceId}-hero-heading`}
        className={cn(
          "relative flex min-h-[685px] w-full flex-col items-center justify-center overflow-hidden bg-[#DFDFDF] px-4 py-12 text-[#050505] antialiased selection:bg-[hsl(var(--primary))] selection:text-[#050505] dark:bg-[#0E0E0E] dark:text-[#F5F5F5] dark:selection:text-white",
          className
        )}
        style={{
          fontFamily:
            "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Plus Jakarta Sans', sans-serif",
          ...style,
        }}
        {...rest}
      >
        <style>{HERO_KEYFRAMES_CSS}</style>

        {/* Animated WebGL1 "Waves" Shader Background */}
        <WavesShaderBackground reduceMotion={shouldReduceMotion} />

        {/* Dark-theme atmospheric scrim for deeper contrast over the WebGL shader */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(circle_at_50%_40%,rgba(14,12,20,0.48)_0%,rgba(9,8,13,0.78)_100%)] dark:block"
        />

        {/* Main Choreographed Container */}
        <div
          key={animCycleKey}
          className="relative z-10 mx-auto flex w-full max-w-[1040px] flex-col items-center"
        >
          {/* 1. Top Availability Status Badge — Frame-In + Typewriter Stream */}
          <button
            type="button"
            onClick={handleReplayEntrance}
            title="Click to replay entrance & typing animation"
            role="status"
            aria-live="polite"
            style={
              shouldReduceMotion
                ? undefined
                : {
                    animation: `udh-badge-in 0.52s ${EASE_OUT_EXPO_CSS} both`,
                  }
            }
            className="mb-[44px] inline-flex h-[43px] cursor-pointer items-center gap-[10px] rounded-full bg-white px-[19px] shadow-[0_2px_10px_rgba(0,0,0,0.03)] ring-1 ring-black/[0.02] transition-shadow hover:shadow-[0_4px_14px_rgba(0,0,0,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] dark:bg-[#18181B]/90 dark:ring-white/15 dark:backdrop-blur-md dark:shadow-[0_4px_16px_rgba(0,0,0,0.45)] dark:hover:bg-[#222226] dark:hover:shadow-[0_6px_20px_rgba(0,0,0,0.55)]"
          >
            <span className="relative flex h-[6px] w-[6px] shrink-0">
              {isBookingOpen && !shouldReduceMotion && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0CB300] opacity-60" />
              )}
              <span
                className={cn(
                  "relative inline-flex h-[6px] w-[6px] rounded-full",
                  isBookingOpen ? "bg-[#0CB300]" : "bg-amber-500"
                )}
              />
            </span>
            <TypewriterStreamText
              text={
                confirmedPlan
                  ? `Spot Reserved — ${confirmedPlan.name} Selected`
                  : resolvedStatusLabel
              }
              startDelayMs={110}
              charSpeedMs={22}
              reduceMotion={shouldReduceMotion}
              className="text-[14.5px] font-medium leading-none tracking-[-0.018em] text-[#141414] tabular-nums dark:text-[#F4F4F5]"
            />
          </button>

          {/* 2. Hero Display Headline with Character-Typed Segments & Spring-Framed Pills */}
          <h1
            id={`${instanceId}-hero-heading`}
            className="flex flex-col items-center text-center font-medium tracking-[-0.056em]"
          >
            {/* ROW 1: "Unlimited" + [Pill 1: Showcase Carousel] + "Design" */}
            <span className="flex flex-wrap items-center justify-center gap-x-[26px] gap-y-3 sm:gap-x-[34px]">
              {/* "Unlimited" — Staggered Character Typing Reveal */}
              <TypedHeadlineSegment
                text={headlineTopLeft}
                delay={0.14}
                stagger={0.028}
                reduceMotion={shouldReduceMotion}
                className="text-[54px] leading-[1.05] text-[#050505] dark:text-[#FAFAFA] sm:text-[82px] md:text-[100px]"
              />

              {/* PILL 1: Vertical Portfolio Showcase Carousel — Frame-In Spring Pop */}
              <button
                type="button"
                onClick={advanceSlide}
                onMouseEnter={() => setIsPill1Hovered(true)}
                onMouseLeave={() => setIsPill1Hovered(false)}
                onAnimationEnd={() => setPill1Entered(true)}
                aria-label={`Featured design work showcase (${
                  showcaseSlides[currentSlide]?.title || "Slide"
                }). Click to switch slide.`}
                className={cn(
                  "group relative inline-flex h-[84px] w-[112px] shrink-0 cursor-pointer overflow-hidden rounded-[30px] border-[2.5px] border-[#141414] bg-[hsl(var(--accent))] p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 dark:border-white/20 dark:focus-visible:ring-offset-[#0E0E0E] sm:h-[98px] sm:w-[130px] sm:rounded-[34px] md:h-[111px] md:w-[146px] md:rounded-[38px]",
                  !shouldReduceMotion && pill1Entered && "udh-pill-1-interactive"
                )}
                style={{
                  boxShadow:
                    "6px 9px 16px rgba(0, 0, 0, 0.28), 2px 3px 5px rgba(0, 0, 0, 0.22), 1.5px 1.5px 0px #0A0A0A",
                  ...(shouldReduceMotion
                    ? { transform: "rotate(-0.8deg) skewX(3.5deg)" }
                    : !pill1Entered
                      ? {
                          animation: `udh-pill1-in 0.62s ${EASE_OUT_EXPO_CSS} 0.34s both`,
                        }
                      : undefined),
                }}
              >
                <div
                  className="flex h-full w-full flex-col"
                  style={{
                    transform: `translateY(-${currentSlide * 100}%)`,
                    transition: shouldReduceMotion
                      ? "none"
                      : `transform 0.56s ${EASE_OUT_EXPO_CSS}`,
                  }}
                >
                  {showcaseSlides.map((slide) => (
                    <div
                      key={slide.id}
                      className="relative h-full w-full shrink-0 overflow-hidden select-none"
                    >
                      <img
                        src={slide.imageSrc}
                        alt={slide.alt}
                        draggable={false}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>

                {/* Subtle top specular rim highlight */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/20"
                />
              </button>

              {/* "Design" — Staggered Character Typing Reveal */}
              <TypedHeadlineSegment
                text={headlineTopRight}
                delay={0.44}
                stagger={0.03}
                reduceMotion={shouldReduceMotion}
                className="text-[54px] leading-[1.05] text-[#707070] dark:text-[#A6A6AE] sm:text-[82px] md:text-[100px]"
              />
            </span>

            {/* ROW 2: "for" + [Pill 2: Infinite Startup Logo Marquee] + "Solid Startups" */}
            <span className="mt-[14px] flex flex-wrap items-center justify-center gap-x-[24px] gap-y-3 sm:mt-[22px] sm:gap-x-[32px]">
              {/* "for" — Staggered Character Typing Reveal */}
              <TypedHeadlineSegment
                text={headlineBottomLeft}
                delay={0.56}
                stagger={0.032}
                reduceMotion={shouldReduceMotion}
                className="text-[54px] leading-[1.05] text-[#747474] dark:text-[#A6A6AE] sm:text-[82px] md:text-[100px]"
              />

              {/* PILL 2: Dark Infinite Startup Logo Marquee — Frame-In Spring Pop */}
              <div
                role="region"
                aria-label="Partner startup logos"
                onAnimationEnd={() => setPill2Entered(true)}
                className={cn(
                  "relative inline-flex h-[84px] w-[112px] shrink-0 items-center overflow-hidden rounded-[30px] border-[2.5px] border-[#121212] bg-[#262626] dark:border-white/20 dark:bg-[#18181B] sm:h-[98px] sm:w-[130px] sm:rounded-[34px] md:h-[111px] md:w-[146px] md:rounded-[38px]",
                  !shouldReduceMotion && pill2Entered && "udh-pill-2-interactive"
                )}
                style={{
                  boxShadow:
                    "6px 9px 16px rgba(0, 0, 0, 0.28), 2px 3px 5px rgba(0, 0, 0, 0.22), 1.5px 1.5px 0px #0A0A0A",
                  ...(shouldReduceMotion
                    ? { transform: "rotate(-0.6deg) skewX(3.5deg)" }
                    : !pill2Entered
                      ? {
                          animation: `udh-pill2-in 0.62s ${EASE_OUT_EXPO_CSS} 0.64s both`,
                        }
                      : undefined),
                }}
              >
                {/* Continuous Right-to-Left Marquee Track */}
                <div
                  className="flex items-center gap-[26px] pr-[26px] text-[#707070] dark:text-[#A1A1AA]"
                  style={
                    shouldReduceMotion
                      ? undefined
                      : {
                          animation: `udh-marquee ${marqueeDurationSec}s linear infinite`,
                        }
                  }
                >
                  {repeatedLogos.map((logo, idx) => (
                    <span
                      key={`${logo.id}-${idx}`}
                      className="inline-flex items-center justify-center select-none"
                      title={logo.name}
                    >
                      {logo.svg}
                    </span>
                  ))}
                </div>

                {/* Soft Edge Vignette & Inner Specular Rim */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-[inherit]"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(38,38,38,0.65) 0%, rgba(38,38,38,0) 18%, rgba(38,38,38,0) 82%, rgba(38,38,38,0.65) 100%)",
                    boxShadow: "inset 0 1px 1px rgba(255,255,255,0.12)",
                  }}
                />
              </div>

              {/* "Solid Startups" — Staggered Character Typing Reveal */}
              <TypedHeadlineSegment
                text={headlineBottomRight}
                delay={0.72}
                stagger={0.024}
                reduceMotion={shouldReduceMotion}
                className="text-[54px] leading-[1.05] text-[#050505] dark:text-[#FAFAFA] sm:text-[82px] md:text-[100px]"
              />
            </span>
          </h1>

          {/* 3. Supporting Subtitle — Staggered Word Typing Stream */}
          <p className="mt-[46px] max-w-[340px] text-center text-[15.5px] font-normal leading-[1.52] tracking-[-0.015em] text-[#727272] dark:text-[#B4B4BC]">
            <span className="inline">
              {subtitleWordsLine1.map((word, idx) => (
                <React.Fragment key={`l1-${idx}`}>
                  <span
                    className="inline-block"
                    style={
                      shouldReduceMotion
                        ? undefined
                        : {
                            animation: `udh-word-in 0.36s ${EASE_OUT_EXPO_CSS} ${1.02 + idx * 0.036}s both`,
                          }
                    }
                  >
                    {word}
                  </span>
                  {idx < subtitleWordsLine1.length - 1 ? " " : ""}
                </React.Fragment>
              ))}
            </span>
            <br />
            <span className="inline">
              {subtitleWordsLine2.map((word, idx) => (
                <React.Fragment key={`l2-${idx}`}>
                  <span
                    className="inline-block"
                    style={
                      shouldReduceMotion
                        ? undefined
                        : {
                            animation: `udh-word-in 0.36s ${EASE_OUT_EXPO_CSS} ${1.02 + (subtitleWordsLine1.length + idx) * 0.036}s both`,
                          }
                    }
                  >
                    {word}
                  </span>
                  {idx < subtitleWordsLine2.length - 1 ? " " : ""}
                </React.Fragment>
              ))}
            </span>
          </p>

          {/* 4. Bottom Action Bar: Dual-Layer Skeuomorphic CTA + Staggered Leader Avatars */}
          <div className="mt-[52px] flex flex-wrap items-center justify-center gap-[24px]">
            {/* Outer Recessed Pill Bezel (210x64px) — Frame-In Entrance */}
            <div
              style={
                shouldReduceMotion
                  ? undefined
                  : {
                      animation: `udh-cta-in 0.56s ${EASE_OUT_EXPO_CSS} 1.24s both`,
                    }
              }
              className="rounded-full bg-[linear-gradient(180deg,#F4F4F4_0%,#E7E7E7_100%)] p-[7px] shadow-[0_10px_22px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:bg-[linear-gradient(180deg,#2A2A2E_0%,#16161A_100%)] dark:ring-1 dark:ring-white/10 dark:shadow-[0_10px_24px_rgba(0,0,0,0.55),0_2px_6px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.12)]"
            >
              {/* Inner Black Pill CTA Button (196x50px) with Video-Verified Hover Metallic Sheen */}
              <button
                type="button"
                onClick={handleCtaAction}
                className="group relative flex h-[50px] w-[196px] cursor-pointer items-center justify-start overflow-hidden rounded-full bg-[#050505] pl-[25px] pr-[20px] text-left text-[15.5px] font-medium tracking-[-0.015em] text-white shadow-[0_2px_5px_rgba(0,0,0,0.35)] transition-transform duration-200 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] dark:bg-[#FAFAFA] dark:text-[#09090B] dark:shadow-[0_2px_10px_rgba(255,255,255,0.12)]"
              >
                {/* Hover Metallic Graphite Gradient Overlay (Light Mode) */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 dark:hidden"
                  style={{
                    background:
                      "linear-gradient(90deg, #474747 0%, #242424 46%, #525252 100%)",
                  }}
                />
                {/* Hover Metallic Pearl Gradient Overlay (Dark Mode) */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 hidden opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 dark:block"
                  style={{
                    background:
                      "linear-gradient(90deg, #FFFFFF 0%, #E4E4E7 48%, #FFFFFF 100%)",
                  }}
                />
                {/* Top subtle inner specular line */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/10 group-hover:ring-white/20 dark:ring-black/10 dark:group-hover:ring-black/20"
                />
                <span className="relative z-10">
                  {confirmedPlan ? `Selected: ${confirmedPlan.name}` : ctaText}
                </span>
              </button>
            </div>

            {/* Social Proof Stack: 5 Overlapping Leader Avatars + Typed "Trusted by Leaders" */}
            <div className="flex flex-col items-start justify-center">
              <div
                className="flex items-center -space-x-[5px]"
                role="group"
                aria-label="Startup leaders who trust our design studio"
              >
                {avatars.map((avatar, i) => (
                  <AnimatedLeaderAvatar
                    key={avatar.id}
                    avatar={avatar}
                    index={i}
                    reduceMotion={shouldReduceMotion}
                  />
                ))}
              </div>
              <TypewriterStreamText
                text={trustedText}
                startDelayMs={1480}
                charSpeedMs={26}
                showCursorWhileTyping={false}
                reduceMotion={shouldReduceMotion}
                className="mt-[5px] pl-[2px] text-[12.5px] font-normal leading-none tracking-[-0.01em] text-[#767676] dark:text-[#B4B4BC]"
              />
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* CONTEXT-AWARE UX: INTERACTIVE PLAN SELECTION MODAL                */}
        {/* ================================================================= */}
        {isModalRendered && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs dark:bg-black/75"
            style={
              shouldReduceMotion
                ? undefined
                : {
                    animation: `${isModalClosing ? "udh-backdrop-out" : "udh-backdrop-in"} 0.2s ease both`,
                  }
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${instanceId}-modal-title`}
            onClick={(e) => {
              if (e.target === e.currentTarget) closeModal();
            }}
          >
            <div
              style={
                shouldReduceMotion
                  ? undefined
                  : {
                      animation: `${isModalClosing ? "udh-modal-out" : "udh-modal-in"} 0.24s ${EASE_OUT_EXPO_CSS} both`,
                    }
              }
              className="relative w-full max-w-[640px] overflow-hidden rounded-[28px] border border-black/10 bg-[#F7F7F7] p-6 text-[#0A0A0A] shadow-2xl dark:border-white/15 dark:bg-[#141417] dark:text-[#F5F5F5] sm:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-[#141414] shadow-2xs tabular-nums dark:bg-[#242424] dark:text-[#EAEAEA]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#0CB300]" />
                    {spotsLeft} Booking Spots Available This Month
                  </div>
                  <h2
                    id={`${instanceId}-modal-title`}
                    className="mt-3 text-2xl font-semibold tracking-tight text-[#050505] dark:text-[#FAFAFA]"
                  >
                    Choose your unlimited design plan
                  </h2>
                  <p className="mt-1 text-sm text-[#666666] dark:text-[#A1A1A1]">
                    Transparent monthly subscription. Pause or cancel anytime.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  aria-label="Close plan selector"
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white text-[#444] shadow-2xs transition hover:bg-neutral-200 dark:bg-[#242424] dark:text-[#D4D4D4] dark:hover:bg-[#333333]"
                >
                  ✕
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {plans.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedPlanId(plan.id);
                        }
                      }}
                      className={cn(
                        "flex cursor-pointer flex-col justify-between rounded-[20px] border p-5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]",
                        isSelected
                          ? "border-[#050505] bg-white shadow-md ring-1 ring-[#050505] dark:border-white dark:bg-[#1F1F23] dark:ring-white"
                          : "border-black/10 bg-white/70 hover:bg-white dark:border-white/10 dark:bg-[#1B1B1F]/80 dark:hover:bg-[#222227]"
                      )}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-base font-semibold text-[#050505] dark:text-[#FAFAFA]">
                            {plan.name}
                          </span>
                          {plan.badge && (
                            <span className="rounded-full bg-[hsl(var(--primary))]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[hsl(var(--primary))]">
                              {plan.badge}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-baseline gap-1">
                          <span className="text-3xl font-semibold tracking-tight text-[#050505] tabular-nums dark:text-[#FAFAFA]">
                            {plan.price}
                          </span>
                          <span className="text-xs text-[#666666] dark:text-[#A1A1A1]">
                            {plan.cadence}
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-[#666666] dark:text-[#A1A1A1]">
                          {plan.description}
                        </p>
                        <ul className="mt-4 space-y-2 border-t border-black/5 pt-3 text-xs text-[#222222] dark:border-white/10 dark:text-[#E0E0E0]">
                          {plan.features.map((feat, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-[#0CB300]">✓</span>
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirmPlan(plan);
                        }}
                        className={cn(
                          "mt-5 w-full cursor-pointer rounded-full py-2.5 text-xs font-medium transition",
                          isSelected
                            ? "bg-[#050505] text-white hover:bg-[#242424] dark:bg-white dark:text-[#050505] dark:hover:bg-neutral-200"
                            : "bg-neutral-200 text-[#141414] hover:bg-neutral-300 dark:bg-[#2A2A2A] dark:text-[#F0F0F0] dark:hover:bg-[#363636]"
                        )}
                      >
                        {confirmedPlan?.id === plan.id
                          ? "Spot Reserved ✓"
                          : `Reserve ${plan.name}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }
);

UnlimitedDesignHero.displayName = "UnlimitedDesignHero";

export { UnlimitedDesignHero as Component };
export type { UnlimitedDesignHeroProps as ComponentProps };

export default UnlimitedDesignHero;


demo.tsx
// This is a file with a demo for your component
// That's what users will see in the preview
// Create new files in this directory to add more demos

import { Component } from "@/components/ui/unlimited-design-hero";

// ONLY DEFAULT EXPORT WILL BE TREATED AS A DEMO
export default function DemoOne() {
  return <Component />;
}
