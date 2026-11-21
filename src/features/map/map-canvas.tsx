"use client";

import dynamic from "next/dynamic";

/** The map needs the DOM (canvas, pointer events, matchMedia), so it is client-only. */
export const MapCanvas = dynamic(() => import("./map-view"), { ssr: false });
