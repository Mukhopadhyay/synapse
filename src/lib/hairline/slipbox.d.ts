import type { Kernel } from "./kernel";
import type { FigureSpec } from "./mount";

/** One card: its slug, and the indexes of the cards it requires. */
export type SlipboxNote = readonly [slug: string, requires: readonly number[]];

/** The Slipbox figure over these cards, in filing order (at most nine); `start` is the card that stands proud at rest. */
export declare function createSlipbox(HL: Kernel, notes: readonly SlipboxNote[], start: number): FigureSpec & { rules: readonly number[] };
