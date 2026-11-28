import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import "./git-env.mjs";
import { termViolations } from "../docs.js";

// The term violations of the pinned corpus: every rejected synonym in its plural, identifier, allowed-name and noise forms. The
// recorded lines are the findings of the check before any change of its matching, so a faster matcher must report the same lines.
test("the term violations of the pinned corpus are the recorded ones", () => {
  const corpus = readFileSync(new URL("./fixtures/term-violations.txt", import.meta.url), "utf8");
  const expected = readFileSync(new URL("./fixtures/term-violations.expected.txt", import.meta.url), "utf8").split("\n").filter(Boolean);
  assert.equal(expected.length, 4925);
  assert.deepEqual(termViolations(corpus, "corpus.txt"), expected);
});
