/** Types for kernel.js, Hairline's engine (the package's src/core). Only what Synapse calls directly is typed. */

/** A point in the figure's 400 × 320 viewBox. */
export type ViewPoint = readonly [x: number, y: number];

/** Where the unseen pointer stops when a figure plays; null leaves the stage. */
export type TourStop = ViewPoint | null;

/** What an engine writes its caption to. */
export type Readout = { textContent: string | null };

/** What an engine is handed: the host element, the svg it draws into, and its read-out. */
export type EngineStage = { stage: HTMLElement; svg: SVGSVGElement; read: Readout };

/** A running engine: `set` takes the figure's own number on its range. */
export type Engine = { set(value: number): void; destroy(): void };

export type Kernel = {
  /** Adds Hairline's stylesheet to a document or shadow root, once. */
  inject(root: Document | ShadowRoot): void;
  /** An unseen pointer that walks the stops until a real one arrives. */
  tour(stage: HTMLElement, stops: readonly TourStop[], onStop?: (index: number) => void): { stop(): void };
  /** The default tour: a diamond around the centre, then a leave. */
  LAP: readonly TourStop[];
};

export declare const HL: Kernel;
