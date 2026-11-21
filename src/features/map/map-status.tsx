"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const LOADING_NOTICE_DELAY = 800;

/** Shown only if graph.json takes longer than 800ms. */
export function LoadingNotice() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), LOADING_NOTICE_DELAY);
    return () => window.clearTimeout(timer);
  }, []);
  if (!visible) return null;
  return <p className="absolute inset-0 grid place-items-center text-ui text-faint">Loading map…</p>;
}

export function LoadFailure({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="absolute inset-0 grid place-items-center p-4">
      <div className="floating flex flex-col items-center gap-4 p-6">
        <p className="text-ui text-foreground">Couldn&apos;t load the map</p>
        <Button onClick={onRetry}>Retry</Button>
      </div>
    </div>
  );
}
