import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { commandViolations } from "../commands.js";

/** A git repository that tracks the given files, and the violations that the check reports for it. */
function violations(t, files) {
  const root = mkdtempSync(join(tmpdir(), "kit-commands-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  execFileSync("git", ["init", "-q"], { cwd: root });
  execFileSync("git", ["add", "."], { cwd: root });
  return commandViolations(root);
}

test("targets that start with a declared verb and executables named sok pass", (t) => {
  assert.deepEqual(violations(t, {
    Makefile: "VALUE := 1\n.PHONY: test check-docs\n\ntest:\n\tpnpm test\n\ncheck-docs: test\n\tnode scripts/check-docs.mjs\n",
    "scripts/check-docs.mjs": "",
    "package.json": JSON.stringify({ bin: { "sok-check": "./check.js" } }),
    "sidecar.json": JSON.stringify({ executable: "build/sok-files", helpers: [{ executable: "build/sok-files-replay" }] }),
    "Cargo.toml": '[package]\nname = "soksak-tool"\n\n[[bin]]\nname = "sok"\n',
  }), []);
});

test("a target that does not start with a declared verb is reported", (t) => {
  assert.deepEqual(violations(t, { Makefile: "docs-check:\n\tnode a.js\n\nverify:\n\tnode b.js\n" }), [
    "Makefile: target docs-check does not start with a declared verb",
    "Makefile: target verify does not start with a declared verb",
  ]);
});

test("a check target names the script that it runs", (t) => {
  assert.deepEqual(violations(t, { Makefile: "check-tests:\n\tnode scripts/check-test-parity.mjs\n", "scripts/check-test-parity.mjs": "" }), [
    "Makefile: target check-tests runs scripts/check-test-parity.mjs: a script and its target have one name",
  ]);
});

test("a target that repeats the recipe of another is reported", (t) => {
  assert.deepEqual(violations(t, { Makefile: "check-docs:\n\tnode a.js\n\tnode b.js\n\ncheck-records:\n\tnode b.js\n" }), [
    "Makefile: target check-records repeats the recipe of check-docs",
  ]);
});

test("an executable that is not sok or sok-<what> is reported in each declaration", (t) => {
  assert.deepEqual(violations(t, {
    "package.json": JSON.stringify({ name: "@soksak/tool", bin: { "soksak-check": "./check.js" } }),
    "pkg/package.json": JSON.stringify({ name: "soksak-tool", bin: "./tool.js" }),
    "sidecar.json": JSON.stringify({ executable: "build/soksak-files", helpers: [{ executable: "build/replay" }] }),
    "Cargo.toml": '[[bin]]\nname = "soksak-vt"\n',
  }), [
    "Cargo.toml: executable soksak-vt is not sok or sok-<what>",
    "package.json: executable soksak-check is not sok or sok-<what>",
    "pkg/package.json: executable soksak-tool is not sok or sok-<what>",
    "sidecar.json: executable soksak-files is not sok or sok-<what>",
    "sidecar.json: executable replay is not sok or sok-<what>",
  ]);
});

test("a make target that a workflow runs must exist", (t) => {
  assert.deepEqual(violations(t, {
    Makefile: "test:\n\tpnpm test\n",
    ".github/workflows/ci.yml": "jobs:\n  a:\n    steps:\n      - uses: actions/checkout@v5\n        with:\n          path: core\n      - run: make test check-docs\n      - run: make -C core check-tests\n      - run: |\n          make test\n          make -C native/darwin fetch\n",
  }), [
    ".github/workflows/ci.yml: make check-docs is not a target of Makefile",
    ".github/workflows/ci.yml: make check-tests is not a target of Makefile",
  ]);
});
