import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// The event source tests create repositories in the temporary directory, and each must remove its repository when it ends. The
// run gets an empty temporary directory of its own, so only the folders of this run are counted.
test("the event source tests leave no repository folder in the temporary directory", { timeout: 60000 }, () => {
  const temporary = mkdtempSync(join(tmpdir(), "kit-temp-folders-"));
  try {
    // The variable of an enclosing test run makes the child report through that run, so the child gets its own environment.
    const env = { ...process.env, TMPDIR: temporary };
    delete env.NODE_TEST_CONTEXT;
    const run = spawnSync(process.execPath, ["--test", "test/events.test.mjs", "test/docs.test.mjs"], {
      cwd: fileURLToPath(new URL("..", import.meta.url)),
      encoding: "utf8",
      env,
    });
    assert.equal(run.status, 0, `${run.stdout}\n${run.stderr}`);
    assert.deepEqual(readdirSync(temporary).filter((name) => /^(invalid-)?event-sources-/.test(name)), [],
      "the event source tests left repository folders in the temporary directory");
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});
