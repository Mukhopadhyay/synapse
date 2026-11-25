import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { countedStudied, readFocus, readStudied, setStudied, shortDate, toggleStudied } from "../src/lib/progress/ops.ts";

const NOW = new Date("2026-11-24T18:02:11.000Z");

describe("studied ops", () => {
  it("marks a note with the date and never mutates the input", () => {
    const before = {};
    const after = toggleStudied(before, "attention", NOW);
    assert.deepEqual(after, { attention: "2026-11-24T18:02:11.000Z" });
    assert.deepEqual(before, {});
  });

  it("toggles off again and keeps the original date when marked twice", () => {
    const marked = setStudied({}, "attention", true, NOW);
    assert.equal(setStudied(marked, "attention", true, new Date("2027-01-01")), marked);
    assert.deepEqual(toggleStudied(marked, "attention"), {});
  });

  it("counts only studyable slugs and keeps unknown ones stored", () => {
    const studied = { attention: "2026-11-24T00:00:00.000Z", gone: "2026-11-24T00:00:00.000Z", ghost: "2026-11-24T00:00:00.000Z" };
    const studyable = new Set(["attention", "softmax"]);
    assert.deepEqual(countedStudied(studied, studyable), ["attention"]);
    assert.equal(Object.keys(studied).length, 3);
  });
});

describe("reading saved values", () => {
  it("drops anything that isn't a string date or a valid focus", () => {
    assert.deepEqual(readStudied({ a: "2026-01-01T00:00:00.000Z", b: 3 }), { a: "2026-01-01T00:00:00.000Z" });
    assert.deepEqual(readStudied([1, 2]), {});
    assert.deepEqual(readFocus({ kind: "note", id: "transformer" }), { kind: "note", id: "transformer" });
    assert.equal(readFocus({ kind: "galaxy", id: "x" }), null);
    assert.equal(readFocus(null), null);
  });

  it("formats a short date and tolerates a bad one", () => {
    assert.equal(shortDate("2026-11-24T18:02:11.000Z"), "24 Nov");
    assert.equal(shortDate("nonsense"), "");
  });
});
