"use client";

import { useEffect, useState } from "react";
import { GitFork } from "lucide-react";

/** A tiny graph around the mark, on a 240 × 160 stage. Classes are literal so Tailwind can see them. */
const NODES = [
  { position: "left-[40px] top-[44px]", size: "size-3", tint: "0" },
  { position: "left-[180px] top-[30px]", size: "size-2.5", tint: "1" },
  { position: "left-[206px] top-[104px]", size: "size-3.5", tint: "2" },
  { position: "left-[136px] top-[142px]", size: "size-2.5", tint: "3" },
  { position: "left-[70px] top-[130px]", size: "size-3", tint: "4" },
  { position: "left-[18px] top-[100px]", size: "size-2", tint: "1" },
] as const;

const CENTRE = { x: 120, y: 80 };
const POINTS = [
  { x: 40, y: 44 },
  { x: 180, y: 30 },
  { x: 206, y: 104 },
  { x: 136, y: 142 },
  { x: 70, y: 130 },
  { x: 18, y: 100 },
];
const LINKS: [number, number][] = [
  [-1, 0],
  [-1, 1],
  [-1, 2],
  [-1, 4],
  [0, 5],
  [1, 2],
  [2, 3],
  [3, 4],
];
const point = (index: number) => (index < 0 ? CENTRE : POINTS[index]);

type Phase = "playing" | "leaving" | "done";

/**
 * The once-per-session splash: the mark, a handful of notes linking up around it, then a fade and
 * scale into the map, which has been mounting and settling underneath the whole time. Server
 * rendered so it's in the first paint; the animation is CSS, so it plays before hydration. A click
 * or any key skips it. Reduced motion shows the mark and fades.
 */
export function Splash() {
  const [phase, setPhase] = useState<Phase>("playing");

  useEffect(() => {
    if (document.documentElement.dataset.splash === "seen") return;
    const skip = () => setPhase((current) => (current === "playing" ? "leaving" : current));
    const options = { capture: true, once: true };
    window.addEventListener("keydown", skip, options);
    window.addEventListener("pointerdown", skip, options);
    return () => {
      window.removeEventListener("keydown", skip, options);
      window.removeEventListener("pointerdown", skip, options);
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      aria-hidden
      data-state={phase}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) setPhase("done");
      }}
      className="splash fixed inset-0 z-splash grid place-items-center bg-background"
    >
      <div className="splash-stage flex flex-col items-center gap-5">
        <div className="relative h-40 w-60">
          <svg viewBox="0 0 240 160" className="absolute inset-0 size-full overflow-visible">
            {LINKS.map(([from, to]) => (
              <line
                key={`${from}-${to}`}
                className="splash-link stroke-edge-focus"
                x1={point(from).x}
                y1={point(from).y}
                x2={point(to).x}
                y2={point(to).y}
                pathLength={1}
                strokeWidth={1}
              />
            ))}
          </svg>
          {NODES.map((node, index) => (
            <span
              key={index}
              data-node-dot=""
              data-domain="domain-1"
              data-tint={node.tint}
              className={`splash-node absolute -translate-1/2 rounded-full ${node.position} ${node.size}`}
            />
          ))}
          <span className="splash-mark absolute top-20 left-30 size-4 -translate-1/2 rounded-full bg-foreground" />
        </div>
        <span className="splash-mark flex items-center gap-2 text-ui font-semibold text-foreground">
          <GitFork className="size-icon" />
          Synapse
        </span>
      </div>
    </div>
  );
}
