import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { placeHoverCard, type HoverPlacementInput, type Neighbour } from "../src/features/map/hover-placement.ts";
import { MAX_WHEEL_STEP, wheelZoomFactor, zoomOutLimit, zoomPercent } from "../src/features/map/zoom.ts";
import { overlayBoxes, overlayFromLayout, overlaySides, type MapOverlay } from "../src/lib/overlays.ts";

const VIEWPORT = { width: 1440, height: 900 };
const NO_PANEL = { right: 0, bottom: 0 };

describe("zoom against fit", () => {
  it("reads 100% at fit and stops zooming out at half of it", () => {
    assert.equal(zoomPercent(3, 3), 100);
    assert.equal(zoomPercent(3, 1.5), 200);
    assert.equal(zoomPercent(3, zoomOutLimit(3)), 50);
  });

  it("turns five 100px wheel notches into about 50%, not 2×", () => {
    const notch = wheelZoomFactor({ deltaY: 100, deltaMode: 0, ctrlKey: false }, 900);
    const five = notch ** 5;
    assert.ok(five > 1.4 && five < 1.7, `five notches zoomed by ${five.toFixed(2)}×`);
  });

  it("treats three lines like one pixel notch and caps any single event", () => {
    const pixels = wheelZoomFactor({ deltaY: 100, deltaMode: 0, ctrlKey: false }, 900);
    const lines = wheelZoomFactor({ deltaY: 3, deltaMode: 1, ctrlKey: false }, 900);
    assert.ok(Math.abs(pixels - lines) < 1e-9);
    assert.equal(wheelZoomFactor({ deltaY: 1, deltaMode: 2, ctrlKey: false }, 900), MAX_WHEEL_STEP);
    assert.equal(wheelZoomFactor({ deltaY: -5000, deltaMode: 0, ctrlKey: false }, 900), 1 / MAX_WHEEL_STEP);
  });

  it("keeps trackpad pinch finer per px but still capped", () => {
    const pinch = wheelZoomFactor({ deltaY: 4, deltaMode: 0, ctrlKey: true }, 900);
    const scroll = wheelZoomFactor({ deltaY: 4, deltaMode: 0, ctrlKey: false }, 900);
    assert.ok(pinch > scroll && pinch <= MAX_WHEEL_STEP);
  });
});

describe("map overlays", () => {
  const welcome: MapOverlay = { corner: "top-left", x: 12, y: 68, width: 384, height: 460 };
  const legendButton: MapOverlay = { corner: "bottom-left", x: 12, y: 12, width: 96, height: 32 };
  const controls: MapOverlay = { corner: "bottom-right", x: 12, y: 12, width: 248, height: 40 };

  it("reads the corner and edge distances from a layout box", () => {
    assert.deepEqual(overlayFromLayout({ left: 1180, top: 848, width: 248, height: 40 }, VIEWPORT), controls);
    assert.deepEqual(overlayFromLayout({ left: 12, top: 68, width: 384, height: 460 }, VIEWPORT), welcome);
  });

  it("lets a tall card take width and a low bar take height", () => {
    const sides = overlaySides([welcome, legendButton, controls], VIEWPORT.width, VIEWPORT.height, NO_PANEL);
    assert.deepEqual(sides, { top: 0, right: 0, bottom: 52, left: 396 });
  });

  it("takes height from the welcome card on a portrait tablet", () => {
    const sides = overlaySides([welcome], 820, 1180, NO_PANEL);
    assert.equal(sides.top, 528);
    assert.equal(sides.left, 0);
  });

  it("counts right-hand overlays past the note panel and ignores hidden ones", () => {
    const settings: MapOverlay = { corner: "bottom-right", x: 12, y: 12, width: 288, height: 600 };
    const hidden: MapOverlay = { corner: "bottom-left", x: 0, y: 0, width: 0, height: 0 };
    const sides = overlaySides([settings, hidden], VIEWPORT.width, VIEWPORT.height, { right: 440, bottom: 0 });
    assert.equal(sides.right, 740);
    assert.deepEqual(overlayBoxes([settings, hidden], VIEWPORT.width, VIEWPORT.height, { right: 440, bottom: 0 }), [
      { left: 700, top: 288, width: 288, height: 600 },
    ]);
  });
});

describe("hover card placement", () => {
  const card = { width: 280, height: 140 };
  const input = (node: HoverPlacementInput["node"], neighbours: Neighbour[]): HoverPlacementInput => ({
    node,
    card,
    viewport: VIEWPORT,
    neighbours,
    gap: 12,
    minTop: 64,
  });
  const around = (x: number, y: number): Neighbour => ({
    dot: { left: x - 10, top: y - 10, width: 20, height: 20 },
    label: { left: x + 16, top: y - 8, width: 70, height: 16 },
  });

  it("prefers the right when nothing is in the way", () => {
    const placement = placeHoverCard(input({ x: 400, y: 400, radius: 8 }, []));
    assert.equal(placement.side, "right");
    assert.equal(placement.left, 420);
  });

  it("goes to the left when the neighbours sit to the right", () => {
    const avoid = [around(480, 380), around(520, 420), around(600, 400)];
    assert.equal(placeHoverCard(input({ x: 400, y: 400, radius: 8 }, avoid)).side, "left");
  });

  it("goes below when neighbours fill both sides and above", () => {
    const avoid = [around(480, 400), around(250, 400), around(400, 300)];
    assert.equal(placeHoverCard(input({ x: 400, y: 400, radius: 8 }, avoid)).side, "below");
  });

  it("slides along a side to clear a neighbour sitting off-centre", () => {
    const avoid = [around(480, 400), around(250, 400), around(400, 300), around(520, 470)];
    const placement = placeHoverCard(input({ x: 400, y: 400, radius: 8 }, avoid));
    const box = { left: placement.left, top: placement.top, right: placement.left + card.width, bottom: placement.top + card.height };
    for (const { dot } of avoid) {
      const hit = box.left < dot.left + dot.width && dot.left < box.right && box.top < dot.top + dot.height && dot.top < box.bottom;
      assert.equal(hit, false, `covers the dot at ${dot.left},${dot.top}`);
    }
  });

  it("stays on screen near the edges and clear of the top bar", () => {
    const placement = placeHoverCard(input({ x: 1430, y: 20, radius: 8 }, []));
    assert.ok(placement.left + card.width <= VIEWPORT.width - 12);
    assert.ok(placement.top >= 64);
  });

  it("never covers the hovered node when another side is free", () => {
    const placement = placeHoverCard(input({ x: 1420, y: 450, radius: 10 }, []));
    const right = placement.left + card.width;
    const coversNode = placement.left < 1430 && right > 1410 && placement.top < 460 && placement.top + card.height > 440;
    assert.equal(coversNode, false);
  });
});
