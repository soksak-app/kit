import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { checkCompletedItems, retiredChecklistItems } from "../checklist.js";
import { rangeDocViolations, repositoryDocViolations } from "../docs.js";

const FILE = "docs/features.md";

test("a closed item that leaves the checklist or changes state is refused unless it is retired", () => {
  for (const state of ["o", "-"]) {
    const previous = `- [${state}] F1 — P2: first\n`;
    assert.equal(checkCompletedItems(previous, "", FILE).length, 1);
    assert.equal(checkCompletedItems(previous, "- [ ] F1 — P2: first\n", FILE).length, 1);
    assert.deepEqual(checkCompletedItems(previous, "", FILE, new Set(["F1"])), []);
    assert.deepEqual(checkCompletedItems(previous, previous, FILE), []);
  }
});

test("an open line added beside a closed line of the same identifier is refused", () => {
  const previous = "- [o] F1 — P2: first\n";
  assert.equal(checkCompletedItems(previous, `- [ ] F1 — P2: first\n${previous}`, FILE).length, 1);
  assert.equal(checkCompletedItems(previous, `${previous}- [ ] F1 — P2: first\n`, FILE).length, 1);
});

test("an open item leaves the checklist only through a closed state or a retirement", () => {
  for (const state of [" ", "~", "!"]) {
    const previous = `- [${state}] F1 — P2: first\n`;
    assert.equal(checkCompletedItems(previous, "", FILE).length, 1);
    assert.deepEqual(checkCompletedItems(previous, "- [o] F1 — P2: first\n", FILE), []);
    assert.deepEqual(checkCompletedItems(previous, "", FILE, new Set(["F1"])), []);
  }
});

test("a retirement line names every identifier form of the checklist in both languages", () => {
  const ids = ["F238-c-13", "P90-terminal", "F212.12-1-10-6g", "G10"];
  const { ids: found, errors } = retiredChecklistItems(
    ids.map((id) => `- Retired checklist entry \`${id}\`: reason`).join("\n"),
    ids.map((id) => `- 체크리스트 항목 \`${id}\` 폐기: 이유`).join("\n"),
  );
  assert.deepEqual(errors, []);
  assert.deepEqual([...found].sort(), [...ids].sort());
});

test("a retirement line requires an identifier, a reason, one statement and its translation", () => {
  const en = (id, reason = " reason") => `- Retired checklist entry \`${id}\`:${reason}`;
  const ko = (id, reason = " 이유") => `- 체크리스트 항목 \`${id}\` 폐기:${reason}`;
  assert.deepEqual(retiredChecklistItems(en("G10"), ko("G10")).errors, []);
  assert.match(retiredChecklistItems(en("G10", ""), ko("G10")).errors.join(), /CHANGELOG\.md: retired checklist entry G10 requires a reason/);
  assert.match(retiredChecklistItems(`${en("G10")}\n${en("G10")}`, ko("G10")).errors.join(), /duplicate retired checklist entry G10/);
  assert.match(retiredChecklistItems(en("G10"), "").errors.join(), /differ between changelog translations/);
  assert.match(retiredChecklistItems(en("g10"), ko("g10")).errors.join(), /CHANGELOG\.md: retired checklist entry g10 is not an identifier/);
  assert.equal(retiredChecklistItems(en("G10", ""), ko("G10")).ids.size, 0);
});

/** A repository with docs/features.md, its translation and the changelog pair of one closed item, committed once. */
function repository(t, initial = "- [o] F1 — P2: first\n") {
  const folder = mkdtempSync(join(tmpdir(), "kit-records-history-"));
  t.after(() => rmSync(folder, { recursive: true, force: true }));
  const git = (...args) => execFileSync("git", args, { cwd: folder, encoding: "utf8" }).trim();
  const write = (features, english = "# Changelog\n", korean = "# 변경 기록\n") => {
    writeFileSync(join(folder, "docs/features.md"), features);
    writeFileSync(join(folder, "docs/features.ko.md"), features);
    writeFileSync(join(folder, "CHANGELOG.md"), english);
    writeFileSync(join(folder, "CHANGELOG.ko.md"), korean);
  };
  const commit = (subject, body = "") => {
    git("add", "docs", "CHANGELOG.md", "CHANGELOG.ko.md");
    git("-c", "user.name=test", "-c", "user.email=test@example.com", "commit", "-q", "--allow-empty", "-m", subject, ...(body ? ["-m", body] : []));
    return git("rev-parse", "HEAD");
  };
  git("init", "-q", "-b", "main");
  mkdirSync(join(folder, "docs"));
  write(initial);
  const root = commit("first");
  return { folder, git, write, commit, root };
}

test("the record check compares the working tree with HEAD", (t) => {
  const { folder, write } = repository(t);
  assert.deepEqual(repositoryDocViolations(folder, "").errors, []);
  write("");
  assert.deepEqual(repositoryDocViolations(folder, "").errors, [
    "docs/features.md: completed checklist item F1 must remain complete; add a linked follow-up identifier",
    "docs/features.ko.md: completed checklist item F1 must remain complete; add a linked follow-up identifier",
  ]);
  write("", "- Retired checklist entry `F1`: reason\n", "- 체크리스트 항목 `F1` 폐기: 이유\n");
  assert.deepEqual(repositoryDocViolations(folder, "").errors, []);
});

test("a repository without a commit has no earlier checklist", (t) => {
  const folder = mkdtempSync(join(tmpdir(), "kit-records-unborn-"));
  t.after(() => rmSync(folder, { recursive: true, force: true }));
  execFileSync("git", ["init", "-q"], { cwd: folder });
  assert.deepEqual(repositoryDocViolations(folder, "").errors, []);
});

test("the range check judges each commit against its parent, where the tree equals HEAD", (t) => {
  const { folder, write, commit, root } = repository(t);
  write("");
  const removed = commit("remove");
  write("- [o] F1 — P2: first\n");
  commit("restore");
  assert.deepEqual(repositoryDocViolations(folder, "").errors, []);
  const { commits, errors } = rangeDocViolations(folder, `${root}..HEAD`);
  assert.equal(commits, 2);
  assert.deepEqual(errors, [
    `${removed.slice(0, 12)}: docs/features.md: completed checklist item F1 must remain complete; add a linked follow-up identifier`,
    `${removed.slice(0, 12)}: docs/features.ko.md: completed checklist item F1 must remain complete; add a linked follow-up identifier`,
  ]);
});

test("a retirement of an earlier commit does not excuse a later removal", (t) => {
  const { folder, write, commit } = repository(t);
  const english = "- Retired checklist entry `F1`: reason\n", korean = "- 체크리스트 항목 `F1` 폐기: 이유\n";
  write("- [o] F1 — P2: first\n", english, korean);
  commit("retire an earlier use of the identifier");
  write("", english, korean);
  assert.match(repositoryDocViolations(folder, "").errors.join("\n"), /completed checklist item F1 must remain complete/);
});

test("the range check reads a root commit and a merge", (t) => {
  const { folder, git, write, commit } = repository(t);
  git("checkout", "-q", "-b", "side");
  write("- [o] F1 — P2: first\n- [ ] F2 — P2: second\n");
  commit("side");
  git("checkout", "-q", "main");
  git("-c", "user.name=test", "-c", "user.email=test@example.com", "merge", "-q", "--no-ff", "-m", "merge", "side");
  assert.deepEqual(rangeDocViolations(folder, "HEAD").errors, []);
  assert.equal(rangeDocViolations(folder, "HEAD").commits, 3);
});

test("a new line of a retired identifier is refused, and a line older than the retirement stays", (t) => {
  const { folder, write, commit, root } = repository(t);
  const english = "- Retired checklist entry `F2`: reason\n- Retired checklist entry `F1`: reason\n";
  const korean = "- 체크리스트 항목 `F2` 폐기: 이유\n- 체크리스트 항목 `F1` 폐기: 이유\n";
  write("- [o] F1 — P2: first\n", english, korean);
  commit("retire");
  assert.deepEqual(repositoryDocViolations(folder, "").errors, []);
  write("- [o] F1 — P2: first\n- [ ] F2 — P2: another item\n", english, korean);
  const refused = [
    "docs/features.md: retired checklist identifier F2 must not name a new item; take the next free identifier",
    "docs/features.ko.md: retired checklist identifier F2 must not name a new item; take the next free identifier",
  ];
  assert.deepEqual(repositoryDocViolations(folder, "").errors, refused);
  const added = commit("reuse");
  assert.deepEqual(rangeDocViolations(folder, `${root}..HEAD`).errors, refused.map((error) => `${added.slice(0, 12)}: ${error}`));
});

test("a renumbering retires the old identifier of an open item as it does for a closed item", (t) => {
  for (const state of [" ", "o"]) {
    const { folder, write, commit } = repository(t);
    write(`- [${state}] F1 — P2: first\n`);
    commit("register");
    write(`- [${state}] F2 — P2: first\n`);
    assert.match(repositoryDocViolations(folder, "").errors[0], /checklist item F1 /);
    write(`- [${state}] F2 — P2: first\n`, "- Retired checklist entry `F1`: reason\n", "- 체크리스트 항목 `F1` 폐기: 이유\n");
    assert.deepEqual(repositoryDocViolations(folder, "").errors, []);
  }
});

test("the range check reads each blob once, also across a commit and its child", (t) => {
  const { folder, write, commit, root } = repository(t);
  write("- [o] F1 — P2: first\n- [ ] F2 — P2: second\n");
  commit("change the checklist");
  write("- [o] F1 — P2: first\n- [o] F2 — P2: second\n");
  commit("close the item");
  const log = join(folder, "reads");
  const bin = join(folder, "bin");
  mkdirSync(bin);
  const git = join(bin, "git");
  const real = execFileSync("which", ["git"], { encoding: "utf8" }).trim();
  writeFileSync(git, `#!/bin/sh\n[ "$1" = cat-file ] && echo "$3" >> "${log}"\nexec "${real}" "$@"\n`);
  chmodSync(git, 0o755);
  const path = process.env.PATH;
  t.after(() => { process.env.PATH = path; });
  process.env.PATH = `${bin}:${path}`;
  assert.deepEqual(rangeDocViolations(folder, `${root}..HEAD`).errors, []);
  const reads = existsSync(log) ? readFileSync(log, "utf8").trim().split("\n") : [];
  // Both languages hold one text in this repository, so the range has three checklist blobs and two changelog blobs.
  assert.equal(reads.length, 5);
  assert.equal(new Set(reads).size, 5);
});

/**
 * The range errors of one commit that changes the checklist on a branch of a repository whose main holds `initial`. The
 * branch first commits `before` when given, then commits `features` (and `featuresKo` for the Korean checklist), the
 * changelog and the commit body.
 */
function branchChange(t, { initial, before = null, features, featuresKo = features, changelog = "# Changelog\n", subject = "change the checklist", body = "" }) {
  const { folder, git, write, commit, root } = repository(t, initial);
  git("checkout", "-q", "-b", "branch");
  if (before !== null) {
    write(before);
    commit("add the branch item");
  }
  write(features, changelog);
  writeFileSync(join(folder, "docs/features.ko.md"), featuresKo);
  commit(subject, body);
  return rangeDocViolations(folder, `${root}..HEAD`).errors;
}

const ITEM_F2 = "- [o] F2 — P2: branch item\n";
const RENAME_F2 = "# Changelog\n\n- F2 is renamed to F3.\n";
const HELD_F1 = "- [!] F1 — P2: first. Cause: the library is absent. Retry when: the library returns.\n";
const HELD_F1_KO = "- [!] F1 — P2: first. 원인: the library is absent. 재시도 조건: the library returns.\n";
const CLOSED_F1 = "- [-] F1 — P2: first. Closed: the library stays in core.\n";

test("a branch-only identifier renamed in one commit that names old and new is accepted", { timeout: 10000 }, (t) => {
  const errors = branchChange(t, {
    initial: "- [o] F1 — P2: first\n",
    before: `- [o] F1 — P2: first\n${ITEM_F2}`,
    features: "- [o] F1 — P2: first\n- [o] F3 — P2: branch item\n",
    changelog: RENAME_F2,
    body: "Rename F2 to F3. The state of the item stays complete.",
  });
  assert.deepEqual(errors, []);
});

test("a closed item that becomes held is accepted when its body names its cause", { timeout: 10000 }, (t) => {
  const errors = branchChange(t, {
    initial: CLOSED_F1,
    features: HELD_F1,
    featuresKo: HELD_F1_KO,
    body: "Hold F1 until the library returns.\nCause: the library is absent.",
  });
  assert.deepEqual(errors, []);
});

test("a rename of an identifier that the base carries is refused, whatever its commit names", { timeout: 10000 }, (t) => {
  const errors = branchChange(t, {
    initial: "- [o] F1 — P2: first\n",
    features: "- [o] F3 — P2: first\n",
    changelog: "# Changelog\n\n- F1 is renamed to F3.\n",
    body: "Rename F1 to F3. The state of the item stays complete.",
  });
  assert.equal(errors.length, 2);
  assert.ok(errors.every((error) => /completed checklist item F1 must remain complete/.test(error)), errors.join("\n"));
});

test("a rename of a branch-only identifier is refused when its body does not name both identifiers", { timeout: 10000 }, (t) => {
  const errors = branchChange(t, {
    initial: "- [o] F1 — P2: first\n",
    before: `- [o] F1 — P2: first\n${ITEM_F2}`,
    features: "- [o] F1 — P2: first\n- [o] F3 — P2: branch item\n",
    changelog: RENAME_F2,
    body: "Rename the branch item.",
  });
  assert.equal(errors.length, 2);
  assert.ok(errors.every((error) => /completed checklist item F2 must remain complete/.test(error)), errors.join("\n"));
});

test("a rename of a branch-only identifier is refused when the changelog does not name the old identifier", { timeout: 10000 }, (t) => {
  const errors = branchChange(t, {
    initial: "- [o] F1 — P2: first\n",
    before: `- [o] F1 — P2: first\n${ITEM_F2}`,
    features: "- [o] F1 — P2: first\n- [o] F3 — P2: branch item\n",
    changelog: "# Changelog\n",
    body: "Rename F2 to F3. The state of the item stays complete.",
  });
  assert.equal(errors.length, 2);
  assert.ok(errors.every((error) => /completed checklist item F2 must remain complete/.test(error)), errors.join("\n"));
});

test("a rename of a branch-only identifier is refused when the new identifier has another state", { timeout: 10000 }, (t) => {
  const errors = branchChange(t, {
    initial: "- [o] F1 — P2: first\n",
    before: `- [o] F1 — P2: first\n${ITEM_F2}`,
    features: "- [o] F1 — P2: first\n- [ ] F3 — P2: branch item\n",
    changelog: RENAME_F2,
    body: "Rename F2 to F3. The state of the item stays complete.",
  });
  assert.equal(errors.length, 2);
  assert.ok(errors.every((error) => /completed checklist item F2 must remain complete/.test(error)), errors.join("\n"));
});

test("a closed item that becomes held is refused when its body does not name the cause", { timeout: 10000 }, (t) => {
  const errors = branchChange(t, {
    initial: CLOSED_F1,
    features: HELD_F1,
    featuresKo: HELD_F1_KO,
    body: "Hold F1 until the library returns.",
  });
  assert.match(errors.join("\n"), /closed checklist item F1 must remain closed/);
});

test("an open or complete item that becomes held is refused, whatever its body names", { timeout: 10000 }, (t) => {
  const errors = branchChange(t, {
    initial: "- [o] F1 — P2: first\n",
    features: HELD_F1,
    featuresKo: HELD_F1_KO,
    body: "Hold F1 until the library returns.\nCause: the library is absent.",
  });
  assert.match(errors.join("\n"), /completed checklist item F1 must remain complete/);
});

test("a complete item that is reopened is refused", { timeout: 10000 }, (t) => {
  const errors = branchChange(t, {
    initial: "- [o] F1 — P2: first\n",
    features: "- [ ] F1 — P2: first\n",
    body: "Reopen F1.",
  });
  assert.match(errors.join("\n"), /completed checklist item F1 must remain complete/);
});

/** A branch of a repository whose main holds F1 and whose origin/main ref is main, with F2 committed and a rename of F2 to F3 in the working tree only. */
function renameInWorkingTree(t) {
  const { folder, git, write, commit, root } = repository(t, "- [o] F1 — P2: first\n");
  git("update-ref", "refs/remotes/origin/main", root);
  git("checkout", "-q", "-b", "rename");
  write(`- [o] F1 — P2: first\n${ITEM_F2}`);
  commit("add the branch item");
  write("- [o] F1 — P2: first\n- [o] F3 — P2: branch item\n", RENAME_F2);
  return { folder };
}

test("the record check at commit time does not judge a staged change of the checklist", { timeout: 10000 }, (t) => {
  const { folder } = renameInWorkingTree(t);
  assert.deepEqual(repositoryDocViolations(folder).errors, []);
});

test("the commit message check accepts a staged rename that its message names", { timeout: 10000 }, (t) => {
  const { folder } = renameInWorkingTree(t);
  assert.deepEqual(repositoryDocViolations(folder, "fix(checklist): Rename the item (#KR31)\n\nRename F2 to F3. The state of the item stays complete.\n").errors, []);
});

test("the commit message check refuses a staged removal that its message does not excuse", { timeout: 10000 }, (t) => {
  const { folder } = renameInWorkingTree(t);
  assert.match(repositoryDocViolations(folder, "Rename the branch item.").errors.join("\n"), /completed checklist item F2 must remain complete/);
});

test("the commit message check reads the body of a message and not its subject", { timeout: 10000 }, (t) => {
  const { folder } = renameInWorkingTree(t);
  assert.match(repositoryDocViolations(folder, "fix(checklist): Rename F2 to F3 (#KR31)\n").errors.join("\n"), /completed checklist item F2 must remain complete/);
  assert.deepEqual(repositoryDocViolations(folder, "fix(checklist): Rename the item (#KR31)\n\nRename F2 to F3. The state of the item stays complete.\n").errors, []);
});

test("the range check reads the body of a commit and not its subject", { timeout: 10000 }, (t) => {
  const errors = branchChange(t, {
    initial: "- [o] F1 — P2: first\n",
    before: `- [o] F1 — P2: first\n${ITEM_F2}`,
    features: "- [o] F1 — P2: first\n- [o] F3 — P2: branch item\n",
    changelog: RENAME_F2,
    subject: "fix(checklist): Rename F2 to F3 (#KR31)",
    body: "",
  });
  assert.match(errors.join("\n"), /completed checklist item F2 must remain complete/);
});

test("a test repository is its own when the environment names a foreign repository", { timeout: 20000 }, (t) => {
  const foreign = mkdtempSync(join(tmpdir(), "kit-foreign-"));
  t.after(() => rmSync(foreign, { recursive: true, force: true }));
  execFileSync("git", ["init", "-q", "-b", "foreign"], { cwd: foreign });
  const saved = { GIT_DIR: process.env.GIT_DIR, GIT_INDEX_FILE: process.env.GIT_INDEX_FILE };
  t.after(() => {
    for (const [name, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  });
  process.env.GIT_DIR = join(foreign, ".git");
  process.env.GIT_INDEX_FILE = join(foreign, ".git", "index");
  const { folder, git } = repository(t);
  assert.equal(git("rev-parse", "--absolute-git-dir"), join(realpathSync(folder), ".git"));
});
