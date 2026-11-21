"use client";

import { useLayoutEffect, useRef, type ComponentProps } from "react";

import { HL } from "@/lib/hairline/kernel.js";
import { mountFigure, type Figure, type FigureOptions } from "@/lib/hairline/mount";
import { createSlipbox, type SlipboxNote } from "@/lib/hairline/slipbox";
import { cn } from "@/lib/utils";

type Props = FigureOptions & {
  /** The cards in filing order, each with the indexes of the cards it requires. Keep the array stable: a new one remounts the figure. */
  notes: readonly SlipboxNote[];
  /** The card that stands proud at rest. */
  start: number;
} & Omit<ComponentProps<"div">, "children" | "ref" | keyof FigureOptions>;

/**
 * The Slipbox figure, shaped like the package's React components: one empty 5:4 box on the server,
 * the drawing mounted in a layout effect. Options reach the running figure through `update`, and
 * `onRead` is called through a ref, so neither remounts it.
 */
export function Slipbox({ notes, start, intensity, play, label, theme, onRead, className, ...attrs }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const figure = useRef<Figure | null>(null);
  const read = useRef(onRead);
  const options = useRef<FigureOptions>({ intensity, play, label, theme });

  useLayoutEffect(() => {
    read.current = onRead;
    options.current = { intensity, play, label, theme };
  });

  useLayoutEffect(() => {
    if (!host.current) return;
    const mounted = mountFigure(createSlipbox(HL, notes, start), host.current, {
      ...options.current,
      onRead: (text) => read.current?.(text),
    });
    figure.current = mounted;
    return () => {
      mounted.destroy();
      figure.current = null;
    };
  }, [notes, start]);

  useLayoutEffect(() => {
    figure.current?.update({ intensity, play, label, theme });
  }, [intensity, play, label, theme]);

  return <div {...attrs} ref={host} className={cn("aspect-[5/4]", className)} />;
}
