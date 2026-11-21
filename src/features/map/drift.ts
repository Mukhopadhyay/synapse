import type { ViewOffset } from "./camera";

const IDLE_MS = 2000;
const RAMP_MS = 3000;
const TAU = Math.PI * 2;
/** The float: each motion is a slow sine with its own period, so it never visibly repeats. */
const PAN_X = { amplitude: 0.012, period: 47_000 };
const PAN_Y = { amplitude: 0.015, period: 61_000 };
const ZOOM = { amplitude: 0.012, period: 53_000 };
/** The spin: one full turn every 8 minutes, in radians per ms. */
// const SPIN = TAU / 480_000;
const SPIN = TAU / 60_000;

const smoothstep = (t: number) => t * t * (3 - 2 * t);

/** How far the spin has turned after `elapsed` ms: its speed eases in with the ramp (the integral of smoothstep), then holds. */
function spinAngle(elapsed: number) {
  if (elapsed >= RAMP_MS) return SPIN * (elapsed - RAMP_MS / 2);
  const u = elapsed / RAMP_MS;
  return SPIN * RAMP_MS * (u ** 3 - u ** 4 / 2);
}

/**
 * The drift `elapsed` ms after it began, for a viewport of `width` × `height` px at `ratio` graph
 * units per px: a slow spin with a gentle float. Every term is zero at the start and eases in over
 * 3s, so it never jumps. The pan is the float alone; the renderer keeps the spin centred.
 */
export function driftOffset(elapsed: number, width: number, height: number, ratio: number): ViewOffset {
  const ramp = smoothstep(Math.min(1, elapsed / RAMP_MS));
  const phase = (period: number) => (TAU * elapsed) / period;
  return {
    dx: ramp * PAN_X.amplitude * width * Math.sin(phase(PAN_X.period)) * ratio,
    dy: ramp * PAN_Y.amplitude * height * Math.sin(phase(PAN_Y.period)) * ratio,
    zoom: 1 + ramp * ZOOM.amplitude * (1 - Math.cos(phase(ZOOM.period))),
    angle: spinAngle(elapsed),
  };
}

type DriftHooks = {
  /** Whether drifting is allowed right now (nothing hovered, selected or moving; tab and map visible; motion allowed). */
  allowed: () => boolean;
  /** Ask the renderer's frame loop for a frame. */
  wake: () => void;
  /** Fold the current offset into the camera. */
  bake: () => void;
};

/**
 * Idle drift: after 8s without input the camera starts a slow spin, driven by the renderer's own
 * frame loop (`frame`). Any input stops it at once (`interrupt`), keeping where it got to.
 * The idle wait is a plain timeout, so nothing ticks while the map rests.
 */
export function createDrift(hooks: DriftHooks) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running = false;
  let startedAt: number | null = null;

  function arm() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!hooks.allowed()) return arm();
      running = true;
      startedAt = null;
      hooks.wake();
    }, IDLE_MS);
  }

  function stop() {
    if (!running) return;
    running = false;
    startedAt = null;
    hooks.bake();
  }

  arm();

  return {
    running: () => running,
    /** Input (or a reason to stop) arrived: stop drifting and start waiting again. */
    interrupt() {
      stop();
      arm();
    },
    /** This frame's offset, or null when not drifting. Stops by itself if drifting stops being allowed. */
    frame(now: number, width: number, height: number, ratio: number): ViewOffset | null {
      if (!running) return null;
      if (!hooks.allowed()) {
        stop();
        arm();
        return null;
      }
      startedAt ??= now;
      return driftOffset(now - startedAt, width, height, ratio);
    },
    detach() {
      clearTimeout(timer);
      running = false;
    },
  };
}

export type Drift = ReturnType<typeof createDrift>;
