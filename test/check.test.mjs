import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const command = fileURLToPath(new URL("../check.js", import.meta.url));
const run = (args, cwd) => spawnSync(process.execPath, [command, ...args], { cwd, encoding: "utf8" });
const GOOD = "fix(kit): Reject an unknown check (#KR7)\n\nThe executable names each check, so an unknown name is an error.\n";

function folder(t) {
  const path = mkdtempSync(join(tmpdir(), "kit-"));
  t.after(() => rmSync(path, { recursive: true, force: true }));
  return path;
}

test("the kit has one executable, soksak-check", () => {
  const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(manifest.name, "@soksak/kit");
  assert.deepEqual(manifest.bin, { "soksak-check": "./check.js" });
});

test("a missing or an unknown check name is rejected with the usage", () => {
  for (const args of [[], ["unknown"], ["--census"]]) {
    const result = run(args);
    assert.equal(result.status, 2, args.join(" "));
    assert.match(result.stderr, /usage: soksak-check commits/);
  }
});

test("an option or a count of arguments that a check does not declare is rejected with its usage", () => {
  for (const [args, usage] of [
    [["commits"], /usage: soksak-check commits/],
    [["commits", "--unknown", "HEAD"], /usage: soksak-check commits/],
    [["records", "a", "b"], /usage: soksak-check records/],
    [["census", "--census", "census.json"], /usage: soksak-check census/],
    [["census", "--config"], /usage: soksak-check census/],
    [["release", "package.json"], /usage: soksak-check release/],
  ]) {
    const result = run(args);
    assert.equal(result.status, 2, args.join(" "));
    assert.match(result.stderr, usage);
  }
});

test("commits checks a message file", (t) => {
  const path = folder(t);
  writeFileSync(join(path, "good"), GOOD);
  writeFileSync(join(path, "bad"), "bad message\n");
  const good = run(["commits", join(path, "good")]);
  assert.equal(good.status, 0, good.stderr);
  assert.match(good.stdout, /Commit message checks passed: 1 messages/);
  assert.equal(run(["commits", join(path, "bad")]).status, 1);
});

test("records checks the repository that it names and the current folder without one", (t) => {
  const path = folder(t);
  execFileSync("git", ["init", "-q"], { cwd: path });
  for (const result of [run(["records", path]), run(["records"], path)]) {
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Record checks passed/);
  }
});

test("census reads its declaration from --config", (t) => {
  const path = folder(t);
  execFileSync("git", ["init", "-q"], { cwd: path });
  writeFileSync(join(path, "a.rs"), "fn f() {\n    let v = x.unwrap_or(0);\n}\n");
  writeFileSync(join(path, "census.json"), JSON.stringify({ pending: { "rs.unwrap-or": "F1" } }));
  execFileSync("git", ["add", "a.rs", "census.json"], { cwd: path });
  assert.equal(run(["census"], path).status, 1);
  const declared = run(["census", "--config", "census.json"], path);
  assert.equal(declared.status, 0, declared.stderr);
  assert.match(declared.stdout, /pending F1: rs.unwrap-or is not enforced/);
});

test("release reports an error of its input and exits with 1", (t) => {
  const path = folder(t);
  const result = run(["release", join(path, "package.json"), join(path, "features.md")]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /release gate: /);
});

test("a check loads only its own module, so commits runs without an installed dependency and census names what is missing", (t) => {
  const path = folder(t);
  for (const file of ["census-rules.json", "census.js", "check.js", "checklist.js", "commits.js", "records.js", "release.js", "terms.json"]) {
    copyFileSync(fileURLToPath(new URL(`../${file}`, import.meta.url)), join(path, file));
  }
  writeFileSync(join(path, "package.json"), '{ "type": "module" }');
  writeFileSync(join(path, "message"), GOOD);
  const start = (args) => spawnSync(process.execPath, [join(path, "check.js"), ...args], { cwd: path, encoding: "utf8" });
  const commits = start(["commits", join(path, "message")]);
  assert.equal(commits.status, 0, commits.stderr);
  const census = start(["census"]);
  assert.equal(census.status, 1);
  assert.match(census.stderr, /ajv/);
});
