import { after } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { shippedImportViolations } from "../shipped-imports.js";
import "./git-env.mjs";
import { removeTemporaryFolders, temporaryFolder } from "./temporary-folder.mjs";

after(removeTemporaryFolders);

/** A package folder with the given manifest `files` list and modules, and the violations that the check reports for it. */
function violations(t, files, modules) {
  const root = temporaryFolder("kit-shipped-imports-");
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(join(root, "package.json"), JSON.stringify({ name: "@soksak/fixture", version: "0.0.0", files }));
  for (const [path, text] of Object.entries(modules)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return shippedImportViolations(root);
}

test("a package whose modules import only shipped files passes", (t) => {
  assert.deepEqual(violations(t, ["index.js", "lib/util.js", "lib/more.js", "lib/dyn.js"], {
    "index.js": 'import { u } from "./lib/util.js";\nexport * from "./lib/more.js";\nconst dyn = await import("./lib/dyn.js");\n',
    "lib/util.js": 'export const u = 1;\nimport("../index.js");\n',
    "lib/more.js": "export const m = 2;\n",
    "lib/dyn.js": "export const d = 3;\n",
  }), []);
});

test("a static import of a module that the release does not hold is reported", (t) => {
  assert.deepEqual(violations(t, ["index.js"], {
    "index.js": 'import { x } from "./lib/missing.js";\n',
  }), ["index.js: imports ./lib/missing.js, which the release does not hold"]);
});

test("an export from a module that the release does not hold is reported", (t) => {
  assert.deepEqual(violations(t, ["index.js"], {
    "index.js": 'export { x } from "./lib/missing.js";\n',
  }), ["index.js: imports ./lib/missing.js, which the release does not hold"]);
});

test("a dynamic import of a module that the release does not hold is reported, resolved from the importing folder", (t) => {
  assert.deepEqual(violations(t, ["lib/a.js", "shared.js"], {
    "lib/a.js": 'const m = await import("../shared/missing.js");\n',
    "shared.js": "",
  }), ["lib/a.js: imports ../shared/missing.js, which the release does not hold"]);
});

test("a module that the release does not hold is not read, and a bare specifier is not a relative import", (t) => {
  assert.deepEqual(violations(t, ["index.js"], {
    "index.js": 'import fs from "node:fs";\nimport pkg from "some-package";\n',
    "test/unshipped.test.mjs": 'import { x } from "./missing.mjs";\n',
  }), []);
});

test("a shipped module that does not parse is reported with its file", (t) => {
  const [error] = violations(t, ["index.js"], { "index.js": "import {\n" });
  assert.match(error, /^index\.js: /);
});

test("a shipped .mjs module is checked like a .js module", (t) => {
  assert.deepEqual(violations(t, ["bin/run.mjs"], {
    "bin/run.mjs": 'import "../lib/gone.mjs";\n',
  }), ["bin/run.mjs: imports ../lib/gone.mjs, which the release does not hold"]);
});
