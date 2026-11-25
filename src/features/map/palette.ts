import { clampChroma, converter, parse } from "culori";

import { DOMAIN_COLORS, type DomainColor } from "@/lib/content/relations";
import type { GraphDomain } from "@/lib/content/schema";

/** [r, g, b] 0–255 and alpha 0–1. Canvas drawing can't read CSS variables, so tokens are resolved into these. */
export type RGBA = readonly [number, number, number, number];

export type Palette = {
  background: RGBA;
  surface: RGBA;
  border: RGBA;
  borderStrong: RGBA;
  foreground: RGBA;
  mutedForeground: RGBA;
  faint: RGBA;
  signal: RGBA;
  /** The ring on studied notes. */
  success: RGBA;
  edgeRest: RGBA;
  edgeFocus: RGBA;
  /** Backdrop dot grid and edge vignette. */
  grid: RGBA;
  vignette: RGBA;
  /** Dims the minimap outside the viewport rectangle. */
  minimapScrim: RGBA;
  /** Peak opacity of the cluster glows behind each cluster, and of hub halos. */
  glowOpacity: number;
  haloOpacity: number;
  /** Keyed `domain/cluster` (or `domain/` for notes without a cluster). */
  nodeColors: Map<string, RGBA>;
  /** The domain hues, for groups from the settings panel. */
  groupColors: Map<DomainColor, RGBA>;
  fontFamily: string;
  /** `opacity-cluster-label`: field and cluster names drawn over the map. */
  clusterLabelOpacity: number;
};

const toRgb = converter("rgb");
const toOklch = converter("oklch");

/** Hue and lightness offsets for cluster tints, at most five before reusing. */
const TINTS: readonly [number, number][] = [
  [0, 0],
  [12, 0.06],
  [-12, 0.06],
  [-12, -0.06],
  [12, -0.06],
];

function fromRgb(rgb: { r: number; g: number; b: number; alpha?: number }): RGBA {
  const channel = (value: number) => Math.round(Math.min(1, Math.max(0, value)) * 255);
  return [channel(rgb.r), channel(rgb.g), channel(rgb.b), rgb.alpha ?? 1];
}

/** A missing or unparsable token resolves to transparent, so it can never paint a solid block. */
function toRgba(css: string): RGBA {
  const rgb = toRgb(parse(css));
  return rgb ? fromRgb(rgb) : [0, 0, 0, 0];
}

function tint(css: string, index: number): RGBA {
  const base = toOklch(parse(css));
  if (!base) return toRgba(css);
  const [hue, lightness] = TINTS[index % TINTS.length];
  return fromRgb(toRgb(clampChroma({ ...base, h: (base.h ?? 0) + hue, l: base.l + lightness }, "oklch")));
}

/** For Canvas 2D fill and stroke styles. */
export function cssColor([r, g, b, a]: RGBA) {
  return `rgba(${r},${g},${b},${a})`;
}

export function mixColor(from: RGBA, to: RGBA, amount: number): RGBA {
  const t = Math.min(1, Math.max(0, amount));
  return [
    Math.round(from[0] + (to[0] - from[0]) * t),
    Math.round(from[1] + (to[1] - from[1]) * t),
    Math.round(from[2] + (to[2] - from[2]) * t),
    from[3] + (to[3] - from[3]) * t,
  ];
}

export function scaleAlpha([r, g, b, a]: RGBA, factor: number): RGBA {
  return [r, g, b, a * factor];
}

/** Reads the current theme's tokens from <html>. Call again after a theme change. */
export function resolvePalette(domains: GraphDomain[]): Palette {
  const styles = getComputedStyle(document.documentElement);
  const token = (name: string) => styles.getPropertyValue(`--${name}`).trim();

  const nodeColors = new Map<string, RGBA>();
  for (const domain of domains) {
    const base = token(domain.color);
    nodeColors.set(`${domain.id}/`, toRgba(base));
    domain.clusters.forEach((cluster, index) => nodeColors.set(`${domain.id}/${cluster.id}`, tint(base, index)));
  }

  return {
    background: toRgba(token("background")),
    surface: toRgba(token("surface")),
    border: toRgba(token("border")),
    borderStrong: toRgba(token("border-strong")),
    foreground: toRgba(token("foreground")),
    mutedForeground: toRgba(token("muted-foreground")),
    faint: toRgba(token("faint")),
    signal: toRgba(token("signal")),
    success: toRgba(token("success")),
    edgeRest: toRgba(token("edge-rest")),
    edgeFocus: toRgba(token("edge-focus")),
    grid: toRgba(token("grid-dot")),
    vignette: toRgba(token("map-vignette")),
    minimapScrim: toRgba(token("minimap-scrim")),
    glowOpacity: Number.parseFloat(token("opacity-map-glow")) || 0.1,
    haloOpacity: Number.parseFloat(token("opacity-map-halo")) || 0.3,
    nodeColors,
    groupColors: new Map(DOMAIN_COLORS.map((color) => [color, toRgba(token(color))])),
    fontFamily: getComputedStyle(document.body).fontFamily,
    clusterLabelOpacity: Number.parseFloat(token("opacity-cluster-label")) || 0.35,
  };
}
