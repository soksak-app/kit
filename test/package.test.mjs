import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const manifest = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));

test("the release holds the checks, the checklist reader, the census rules and the term list, and its executable is in it", () => {
  const [{ files }] = JSON.parse(execFileSync("npm", ["pack", "--dry-run", "--json", "--silent"], { cwd: root, encoding: "utf8" }));
  const paths = files.map(({ path }) => path).sort();
  assert.deepEqual(paths, ["README.ko.md", "README.md", "census-rules.json", "census.js", "check.js", "checklist.js", "commits.js", "package.json", "records.js", "release.js", "terms.json"]);
  for (const target of Object.values(manifest.bin)) assert.ok(paths.includes(target.replace(/^\.\//, "")), target);
});

test("each export names a file of the release", () => {
  const files = manifest.files ?? [];
  for (const [name, target] of Object.entries(manifest.exports ?? {})) {
    const path = target.replace(/^\.\//, "");
    assert.ok(path === "package.json" || files.includes(path), `${name}: ${target}`);
  }
  assert.ok(Object.keys(manifest.exports ?? {}).includes("./terms.json"));
});
