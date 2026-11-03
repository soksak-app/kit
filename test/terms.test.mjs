import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const { terms } = JSON.parse(readFileSync(new URL("../terms.json", import.meta.url), "utf8"));

test("each term has a definition and a list of rejected synonyms", () => {
  assert.ok(terms.length > 0);
  for (const entry of terms) {
    assert.deepEqual(Object.keys(entry).sort(), ["allowed", "definition", "rejected", "term"], JSON.stringify(entry));
    assert.ok(typeof entry.term === "string" && entry.term !== "", JSON.stringify(entry));
    assert.ok(typeof entry.definition === "string" && entry.definition !== "", JSON.stringify(entry));
    assert.ok(Array.isArray(entry.rejected) && entry.rejected.every((word) => typeof word === "string" && word !== ""), JSON.stringify(entry));
    assert.ok(Array.isArray(entry.allowed) && entry.allowed.every((name) => typeof name === "string" && name !== ""), JSON.stringify(entry));
  }
});

test("the replay and screen hash terms name no terminal", () => {
  for (const name of ["replay", "screen hash"]) {
    const entry = terms.find((term) => term.term === name);
    assert.ok(entry, name);
    assert.ok(!/terminal/i.test(entry.definition), `${name}: ${entry.definition}`);
  }
});

test("a term is listed once and is no rejected synonym", () => {
  const names = terms.map((entry) => entry.term.toLowerCase());
  assert.equal(new Set(names).size, names.length);
  const rejected = terms.flatMap((entry) => entry.rejected.map((word) => word.toLowerCase()));
  assert.equal(new Set(rejected).size, rejected.length);
  for (const word of rejected) assert.ok(!names.includes(word), `${word} is a term and a rejected synonym`);
});

test("the kit term names a tool of the repositories that the application does not install", () => {
  const entry = terms.find((term) => term.term === "kit");
  assert.ok(entry, "the term list defines kit");
  assert.match(entry.definition, /build input/);
  assert.doesNotMatch(entry.definition, /static library|link/, "a kit holds tools of the repositories; a library that sidecars share belongs to core");
  assert.match(entry.definition, /never installs/);
});

test("the drawing term names when a supplier draws the raster of an image region", () => {
  const entry = terms.find((term) => term.term === "drawing");
  assert.ok(entry, "the term list defines drawing");
  assert.match(entry.definition, /image region/);
  assert.match(entry.definition, /occluded/);
  assert.match(entry.definition, /minimized/);
});

test("the presentation mode and lease terms name how the host presents the image of an image region", () => {
  const mode = terms.find((term) => term.term === "presentation mode");
  assert.ok(mode, "the term list defines presentation mode");
  assert.match(mode.definition, /copy/);
  assert.match(mode.definition, /lease/);
  const lease = terms.find((term) => term.term === "lease");
  assert.ok(lease, "the term list defines lease");
  assert.match(lease.definition, /IOSurface/);
  assert.match(lease.definition, /released/);
});

test("the mygo host terms name its host packages, its native workbench, its allowed difference tables and the hosts it is measured against", () => {
  const meanings = {
    "language host library": [/names no framework/, /framework port/],
    "framework adapter": [/framework port/, /language host library/],
    "framework port": [/`Framework`/, /`Frontend`/],
    "native workbench": [/native UI/, /main page/],
    "native view of the window": [/surface hosts/],
    "native view element": [/hole/, /covers/],
    "presentation notice": [/presented nothing/, /layout transaction/],
    "settled presentation": [/current state/, /presentation notice/],
    "workbench call channel": [/`Frontend`/, /call/],
    "language table": [/Go/, /Rust/],
    "framework table": [/framework adapters/],
    "baseline host": [/revision/, /regression/],
    "other host": [/same revision/],
    "element tree": [/binder audit/, /actions/],
  };
  for (const [name, patterns] of Object.entries(meanings)) {
    const entry = terms.find((term) => term.term === name);
    assert.ok(entry, `the term list defines ${name}`);
    assert.equal(entry.definition.split(/\.(?=\s|$)/).filter((part) => part.trim()).length, 1, `${name} is defined in one sentence: ${entry.definition}`);
    for (const pattern of patterns) assert.match(entry.definition, pattern, name);
  }
});
