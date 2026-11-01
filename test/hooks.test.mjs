import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const hook = new URL("../.githooks/pre-push", import.meta.url).pathname;
const zero = "0".repeat(40);

/** Runs the pre-push hook in a new repository with one commit, with a make that records its arguments. */
function prePush(t, remoteRef) {
  const folder = mkdtempSync(join(tmpdir(), "kit-records-hook-"));
  t.after(() => rmSync(folder, { recursive: true, force: true }));
  const git = (...args) => execFileSync("git", args, { cwd: folder, encoding: "utf8" }).trim();
  git("init", "-q", "-b", "main");
  git("-c", "user.name=test", "-c", "user.email=test@example.com", "commit", "-q", "--allow-empty", "-m", "first");
  const sha = git("rev-parse", "HEAD");
  if (remoteRef) git("update-ref", "refs/remotes/origin/main", sha);
  const make = join(folder, "make");
  writeFileSync(make, `#!/bin/sh\nprintf '%s\\n' "$@" > "${join(folder, "arguments")}"\n`);
  chmodSync(make, 0o755);
  execFileSync(hook, [], { cwd: folder, input: `refs/heads/main ${sha} refs/heads/main ${zero}\n`, env: { ...process.env, PATH: `${folder}:${process.env.PATH}` } });
  return { sha, args: readFileSync(join(folder, "arguments"), "utf8").trim().split("\n") };
}

test("the first push to a remote without main checks every commit of the pushed ref", (t) => {
  const { sha, args } = prePush(t, false);
  assert.equal(args.at(-1), `RANGE=${sha}`);
});

test("a push of a new ref to a remote with main checks the commits after origin/main", (t) => {
  const { sha, args } = prePush(t, true);
  assert.equal(args.at(-1), `RANGE=origin/main..${sha}`);
});
