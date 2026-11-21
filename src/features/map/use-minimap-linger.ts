"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** How long the minimap stays after the last camera move. */
const MINIMAP_LINGER_MS = 1500;

/**
 * Whether the minimap should show: from each `subscribe` event until 1.5s after the last one.
 * `hold(true)` keeps it open (pointer over it, focus inside), `hold(false)` lets it linger out,
 * and `keepAlive` restarts the linger without holding.
 */
export function useMinimapLinger(subscribe: (listener: () => void) => () => void) {
  const [active, setActive] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const held = useRef(false);

  const keepAlive = useCallback(() => {
    clearTimeout(timer.current);
    if (held.current) return;
    timer.current = setTimeout(() => setActive(false), MINIMAP_LINGER_MS);
  }, []);

  const hold = useCallback(
    (on: boolean) => {
      held.current = on;
      if (on) {
        clearTimeout(timer.current);
        setActive(true);
      } else keepAlive();
    },
    [keepAlive],
  );

  useEffect(() => {
    const stop = subscribe(() => {
      setActive(true);
      keepAlive();
    });
    return () => {
      stop();
      clearTimeout(timer.current);
    };
  }, [subscribe, keepAlive]);

  return { active, keepAlive, hold };
}
