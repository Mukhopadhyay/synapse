"use client";

import { useEffect, useEffectEvent } from "react";

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

/** Single-letter shortcut, ignored while typing or when a modifier is held. */
export function useHotkey(key: string, handler: () => void) {
  const onHotkey = useEffectEvent(handler);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
      if (isTypingTarget(event.target)) return;
      if (event.key.toLowerCase() !== key) return;
      event.preventDefault();
      onHotkey();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [key]);
}
