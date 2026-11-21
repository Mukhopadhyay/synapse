import { HL, type Engine, type EngineStage, type Readout, type TourStop } from "./kernel.js";

/** A figure written for Hairline's engine, as the hairline-create skill shapes it. */
export type FigureSpec = {
  name: string;
  /** One sentence saying what the figure shows; its accessible name. */
  means: string;
  /** The figure's own number at intensity 0, 0.5 and 1. */
  range: readonly [number, number, number];
  tour?: readonly TourStop[];
  mount(stage: EngineStage, value: number): Engine;
};

export type FigureOptions = {
  /** How strongly the figure answers, from 0 to 1. Default 0.5. */
  intensity?: number;
  /** Walks the figure through its tour until a pointer or focus arrives. Default false. */
  play?: boolean;
  /** `"auto"` follows the page (`data-theme="dark"` on an ancestor). Default `"auto"`. */
  theme?: "auto" | "light" | "dark";
  /** The accessible name. Defaults to the figure's `means`. */
  label?: string;
  /** The figure's caption, each time it changes; called once at mount with the rest caption. */
  onRead?: (text: string) => void;
};

export type Figure = {
  /** Changes options on the running figure. A key set to `undefined` goes back to its default. */
  update(options: FigureOptions): void;
  /** Stops the figure and removes what it added to the element. Safe to call twice. */
  destroy(): void;
};

const NS = "http://www.w3.org/2000/svg";
const REST = "rest";
const mounted = new WeakMap<Element, () => void>();

/** Intensity to the figure's own number: two straight lines that meet at 0.5, as in the package. */
function figureValue([lo, mid, hi]: FigureSpec["range"], intensity: number | undefined) {
  const i = typeof intensity === "number" && Number.isFinite(intensity) ? Math.min(1, Math.max(0, intensity)) : 0.5;
  const value = i <= 0.5 ? lo + (i / 0.5) * (mid - lo) : mid + ((i - 0.5) / 0.5) * (hi - mid);
  return Math.round(value * 1000) / 1000;
}

/** An error from a consumer's callback, reported without unwinding the frame loop every figure shares. */
function report(error: unknown) {
  if (typeof reportError === "function") reportError(error);
  else setTimeout(() => { throw error; });
}

/**
 * Mounts a custom figure the way the package's `create()` mounts its own: the stylesheet, the host's
 * attributes, the 400 × 320 svg, the read-out and the tour. It only removes what it added.
 */
export function mountFigure(spec: FigureSpec, el: HTMLElement, options: FigureOptions = {}): Figure {
  mounted.get(el)?.();

  const opts: FigureOptions = { ...options };
  const root = el.getRootNode();
  HL.inject(root instanceof Document || root instanceof ShadowRoot ? root : el.ownerDocument);

  const owned = new Set<string>();
  const attr = (name: string, value: string | null) => {
    if (!owned.has(name) && el.hasAttribute(name)) return;
    if (value === null) {
      el.removeAttribute(name);
      owned.delete(name);
    } else {
      el.setAttribute(name, value);
      owned.add(name);
    }
  };
  const dress = () => {
    attr("data-hairline-theme", opts.theme === "light" || opts.theme === "dark" ? opts.theme : null);
    attr("aria-label", el.hasAttribute("aria-labelledby") ? null : (opts.label ?? spec.means));
  };
  attr("data-hairline", spec.name);
  attr("role", "img");
  dress();

  const svg = el.ownerDocument.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 400 320");
  svg.setAttribute("aria-hidden", "true");
  el.appendChild(svg);

  let text: string | null = null;
  let playing: { stop(): void } | null = null;
  const read: Readout = {
    get textContent() {
      return text;
    },
    set textContent(value) {
      const next = value ?? "";
      if (next === text) return;
      text = next;
      try {
        opts.onRead?.(next);
      } catch (error) {
        report(error);
      }
    },
  };

  const startTour = () => HL.tour(el, spec.tour ?? HL.LAP);
  let value = figureValue(spec.range, opts.intensity);
  playing = opts.play === true ? startTour() : null;
  let engine: Engine;
  try {
    engine = spec.mount({ stage: el, svg, read }, value);
  } catch (error) {
    playing?.stop();
    throw error;
  }
  if (text === null) read.textContent = REST;

  let dead = false;
  const destroy = () => {
    if (dead) return;
    dead = true;
    if (mounted.get(el) === destroy) mounted.delete(el);
    playing?.stop();
    playing = null;
    engine.destroy();
    svg.remove();
    for (const name of owned) el.removeAttribute(name);
    owned.clear();
  };
  mounted.set(el, destroy);

  return {
    update(next) {
      if (dead) return;
      for (const key of Object.keys(next) as (keyof FigureOptions)[]) {
        if (next[key] === undefined) delete opts[key];
        else Object.assign(opts, { [key]: next[key] });
      }
      const nextValue = figureValue(spec.range, opts.intensity);
      if (nextValue !== value) {
        value = nextValue;
        engine.set(value);
      }
      const play = opts.play === true;
      if (play !== !!playing) {
        playing?.stop();
        playing = play ? startTour() : null;
      }
      dress();
    },
    destroy,
  };
}
