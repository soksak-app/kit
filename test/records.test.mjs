import assert from "node:assert/strict";
import test from "node:test";
import { checklistViolations, commitMessageErrors, recordKind, repositoryRecordViolations, recordViolations, termChecked, termViolations } from "../records.js";
import { execSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

test("a checklist that states one identifier on two lines is refused, in any identifier form", () => {
  assert.deepEqual(checklistViolations("- [o] F218-2.4 — P2: a\n- [ ] F218-2.4 — P2: b\n", "docs/features.md"), ["docs/features.md:2: duplicate checklist identifier F218-2.4 (first stated on line 1)"]);
  assert.deepEqual(checklistViolations("- [o] F212.7b-1 — P0: a\n  - [ ] F212.7b-1 — P0: b\n", "docs/features.ko.md"), ["docs/features.ko.md:2: duplicate checklist identifier F212.7b-1 (first stated on line 1)"]);
  assert.deepEqual(checklistViolations("- [o] F1-1 — P0: a\n- [o] F1-2 — P0: b\n", "docs/features.md"), []);
  for (const id of ["F238-c-11", "F212.10-core-3", "F239-77-files", "F212.12-1-10-6g"]) {
    assert.deepEqual(checklistViolations(`- [o] ${id} — P2: a\n- [ ] ${id} — P2: b\n`, "docs/features.md"),
      [`docs/features.md:2: duplicate checklist identifier ${id} (first stated on line 1)`], id);
  }
});

test("record checks report each statement that is not a fact about the repository", () => {
  const cases = [
    ["Fixed in (3a57f77).", "commit reference"],
    ["See commit 3a57f77b for the change.", "commit reference"],
    ["Changes in 3a57f77..9f8e7d6 were reverted.", "commit reference"],
    ["Merged as PR #2.", "pull request number"],
    ["The pull request 12 adds entries.", "pull request number"],
    ["CI run 37439493900 failed.", "CI run number"],
    ["The log is /Users/somebody/log.txt.", "personal path"],
    ["Kept in ~/backup/logs.", "personal path"],
    ["Found on 2026-10-05 by the window check.", "account of who found or requested"],
    ["Found while the release was checked.", "account of who found or requested"],
    ["Requested by the user on 2026-10-07.", "account of who found or requested"],
    ["2026-10-05 R1-5-4에서 발견: 실패를 보고하지 않았다.", "account of who found or requested"],
    ["2026-10-07에 F95를 확인하다가 발견했다.", "account of who found or requested"],
    ["사용자 요청으로 추가한다.", "account of who found or requested"],
    ["Reported by the user on 2026-10-02: the bar stayed dark.", "account of who found or requested"],
    ["Withdrawn on 2026-10-05 by the user's decision for R2-4-5.", "account of who found or requested"],
    ["2026-10-05 사용자 결정에 따라 철회한다.", "account of who found or requested"],
    ["사용자가 보고한 스크롤바를 관측했다.", "account of who found or requested"],
    ["2026-10-03 core G1.4-100이 발견했다: 연결은 계속 썼다.", "account of who found or requested"],
    ["2026-10-04 사용자가 631 point 터미널에서 오류를 보고했다.", "account of who found or requested"],
    ["`@soksak/plugin-api` is pinned to core `75709f2a`.", "commit reference"],
    ["`drawList` (core F67, pin 5b0107ec) keeps the elements.", "commit reference"],
    ["It passes on this Mac.", "local environment"],
    ["이 머신에서 통과한다.", "local environment"],
  ];
  for (const [line, category] of cases) {
    assert.deepEqual(recordViolations(`# Title\n\n${line}\n`, "doc.md").map((error) => error.split(": ")[1]), [category], line);
    assert.match(recordViolations(`# Title\n\n${line}\n`, "doc.md")[0], /^doc\.md:3: /, line);
  }
});

test("record checks accept facts that contain hexadecimal values and the rule's own words", () => {
  for (const line of [
    "The session id is 4dc4a40a-1b2c-4d5e-8f90-123456789abc.",
    "The background is #8f98a080 and the accent (#4a90e2) follows the theme.",
    "The archive sha256 is 6e13c454c01f0261e99b6bb8b8d5cc493ad67ee5fd631cc538c810f2ad2004ee.",
    "A record does not name who requested, decided or found something.",
    "기록은 누가 요청·결정·발견했는지 적지 않는다.",
    "Plugin 발견/소유 규칙.",
    "The user's settings are kept.",
    "The build-machine rehearsal이 macOS에서 통과했다.",
    "The rehearsal of this macOS runner passed.",
  ]) assert.deepEqual(recordViolations(line, "doc.md"), [], line);
  assert.deepEqual(recordViolations("```\nFound on 2026-10-05\n```\n", "doc.md"), [], "a code block is not a record statement");
});

test("configuration files are checked in their comments only", () => {
  assert.equal(recordKind(".github/workflows/release.yml"), "config");
  assert.equal(recordKind("Makefile"), "config");
  assert.equal(recordKind("native/darwin/Makefile"), "config");
  assert.equal(recordKind("docs/spec/plugins.md"), "document");
  assert.equal(recordKind("scripts/records.mjs"), null);
  assert.deepEqual(recordViolations("# Found on 2026-10-05\nrun: echo 'Found on 2026-10-05'\n", "Makefile", "config"),
    ["Makefile:1: account of who found or requested: Found on"]);
});

test("commit messages use the subject form with a checklist ID, a body and no footer", () => {
  const body = "\n\nThe body states what changed and why.\n";
  assert.deepEqual(commitMessageErrors(`fix(vt): Run PTY shells in a UTF-8 locale (#S26)${body}`), []);
  assert.deepEqual(commitMessageErrors(`docs(features): Record the release (#F101.2)${body}`), []);
  assert.deepEqual(commitMessageErrors(`chore(release): Declare 0.0.6 (#G1.4-87-1)${body}`), []);
  assert.match(commitMessageErrors(`fix(vt): Run PTY shells${body}`)[0], /subject must be/);
  assert.match(commitMessageErrors(`fix: Run PTY shells (#S26)${body}`)[0], /subject must be/);
  assert.match(commitMessageErrors(`build(vt): Run PTY shells (#S26)${body}`)[0], /type must be/);
  assert.match(commitMessageErrors(`fix(vt): run PTY shells (#S26)${body}`)[0], /capital letter/);
  assert.match(commitMessageErrors(`fix(vt): Run PTY shells. (#S26)${body}`)[0], /period/);
  assert.match(commitMessageErrors(`fix(vt): ${"A".repeat(51)} (#S26)${body}`)[0], /above 50/);
  assert.match(commitMessageErrors("fix(vt): Run PTY shells (#S26)\n")[0], /non-empty body/);
  assert.match(commitMessageErrors(`fix(vt): Run PTY shells (#S26)\n\n${"word ".repeat(15)}\n`)[0], /above 72/);
  for (const footer of ["Refs: S26", "Co-Authored-By: Someone <someone@example.com>", "Signed-off-by: Someone <someone@example.com>"]) {
    assert.match(commitMessageErrors(`fix(vt): Run PTY shells (#S26)${body}\n${footer}\n`).join("\n"), /is a footer/, footer);
  }
  assert.match(commitMessageErrors(`fix(vt): Run PTY shells (#S26)\n\nFixed after PR #3 was merged.\n`).join("\n"), /pull request number/);
});

test("a rejected synonym is reported with the term to use, also in identifiers", () => {
  assert.deepEqual(termViolations("The plugin package holds pages.\nconst pluginPackage = 1;\nfn plugin_package() {}", "a.md"), [
    'a.md:1: rejected term "plugin package", use "plugin": plugin package',
    'a.md:2: rejected term "plugin package", use "plugin": pluginPackage',
    'a.md:3: rejected term "plugin package", use "plugin": plugin_package',
  ]);
});

test("a rejected synonym joined inside an identifier is reported", () => {
  assert.deepEqual(termViolations("func isSidecarPackage(text string) bool {", "a.go"),
    ['a.go:1: rejected term "sidecar package", use "sidecar": SidecarPackage']);
  assert.deepEqual(termViolations("import \"archive/tar\"; let reader = tar::Archive::new(data);", "a.rs"), []);
});

test("a longer rejected synonym is reported once and a file name is not a use", () => {
  assert.deepEqual(termViolations("Writes a plugin package archive.", "a.md"),
    ['a.md:1: rejected term "plugin package archive", use "release": plugin package archive']);
  assert.deepEqual(termViolations("Reads the plugin package.json and the plugin folder.", "a.md"), []);
  assert.deepEqual(termViolations("installed.sidecars.leave-out-plugin-packages", "a.md"),
    ['a.md:1: rejected term "plugin package", use "plugin": plugin-packages']);
});

test("the verb of presentation is not a synonym of drawing", () => {
  assert.deepEqual(termViolations("The image layer stops presenting the surface.", "a.md"), []);
  assert.deepEqual(termViolations("The presenting state of the region follows its window.", "a.md"),
    ['a.md:1: rejected term "presenting state", use "drawing": presenting state']);
});

test("the term list, the changelogs and the checklists are not checked for rejected terms", () => {
  assert.equal(termChecked("packages/plugin-api/terms.json"), false);
  assert.equal(termChecked("CHANGELOG.ko.md"), false);
  assert.equal(termChecked("packages/plugin-api/test/records.test.mjs"), false);
  assert.equal(termChecked("docs/features.md"), false);
  assert.equal(termChecked("docs/spec/plugins.md"), true);
  assert.equal(termChecked("src/install.rs"), true);
  assert.equal(termChecked("Makefile"), true);
  assert.equal(termChecked("ui/vendor/image.png"), false);
});

test("a commit message that uses a rejected synonym is refused", () => {
  const message = "docs(spec): Rename the plugin package (#R5.2)\n\nThe plugin package is a plugin.\n";
  assert.ok(commitMessageErrors(message).some((error) => error.includes('rejected term "plugin package", use "plugin"')),
    commitMessageErrors(message).join("\n"));
});

test("a file the census declaration excludes is not a record of the repository", () => {
  const repository = mkdtempSync(join(tmpdir(), "records-exclude-"));
  execSync("git init -q .", { cwd: repository });
  writeFileSync(join(repository, "census.json"), JSON.stringify({ exclude: "^ui/vendor/" }));
  mkdirSync(join(repository, "ui", "vendor"), { recursive: true });
  writeFileSync(join(repository, "ui/vendor/bundle.js"), "// The plugin package holds pages.\n");
  writeFileSync(join(repository, "own.md"), "The plugin package holds pages.\n");
  execSync("git add .", { cwd: repository });
  const { errors } = repositoryRecordViolations(repository);
  assert.deepEqual(errors.map((error) => error.split(":")[0]), ["own.md"]);
});

test("a census declaration without an exclude checks every tracked record", () => {
  const repository = mkdtempSync(join(tmpdir(), "records-no-exclude-"));
  execSync("git init -q .", { cwd: repository });
  writeFileSync(join(repository, "census.json"), JSON.stringify({}));
  writeFileSync(join(repository, "own.md"), "The plugin package holds pages.\n");
  execSync("git add .", { cwd: repository });
  const { files, errors } = repositoryRecordViolations(repository);
  assert.ok(files.includes("own.md"));
  assert.deepEqual(errors.map((error) => error.split(":")[0]), ["own.md"]);
});

test("a census declaration rejects a non-string exclude with its file and value", () => {
  const repository = mkdtempSync(join(tmpdir(), "records-invalid-exclude-"));
  execSync("git init -q .", { cwd: repository });
  writeFileSync(join(repository, "census.json"), JSON.stringify({ exclude: 3 }));
  writeFileSync(join(repository, "own.md"), "Repository facts.\n");
  execSync("git add .", { cwd: repository });
  assert.throws(() => repositoryRecordViolations(repository), /census\.json.*exclude.*number.*3/);
});

test("a census declaration rejects null and array roots with its file and value", () => {
  for (const declaration of [null, []]) {
    const repository = mkdtempSync(join(tmpdir(), "records-invalid-census-"));
    execSync("git init -q .", { cwd: repository });
    writeFileSync(join(repository, "census.json"), JSON.stringify(declaration));
    writeFileSync(join(repository, "own.md"), "Repository facts.\n");
    execSync("git add .", { cwd: repository });
    assert.throws(() => repositoryRecordViolations(repository), /census\.json.*declaration.*object.*found/);
  }
});

test("a census declaration reports an invalid exclude pattern with its file and value", () => {
  const repository = mkdtempSync(join(tmpdir(), "records-invalid-pattern-"));
  execSync("git init -q .", { cwd: repository });
  writeFileSync(join(repository, "census.json"), JSON.stringify({ exclude: "[" }));
  writeFileSync(join(repository, "own.md"), "Repository facts.\n");
  execSync("git add .", { cwd: repository });
  assert.throws(() => repositoryRecordViolations(repository), /census\.json.*exclude pattern.*\[.*invalid/);
});

/** A git repository in a new temporary folder that tracks files, a map from a path in the repository to its text. */
function trackedRepository(prefix, files) {
  const repository = mkdtempSync(join(tmpdir(), prefix));
  execSync("git init -q .", { cwd: repository });
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(join(repository, dirname(path)), { recursive: true });
    writeFileSync(join(repository, path), text);
  }
  execSync("git add .", { cwd: repository });
  return repository;
}

test("a link to a heading that its target document does not have is reported with the file, the line and the anchor", () => {
  const repository = trackedRepository("records-anchor-", {
    "docs/features.md": "# Features\n\n- [ ] S1-1 — P0: The frame follows [the core](spec/core.md#gpu-frame).\n",
    "docs/spec/core.md": "# Core\n\n## Strip frame\n\nThe strip holds the frame.\n",
  });
  assert.deepEqual(repositoryRecordViolations(repository).errors, ["docs/features.md:3: missing heading spec/core.md#gpu-frame"]);
});

test("a link to a heading that its target has passes, also a repeated heading, a heading of the same document and an encoded fragment", () => {
  const repository = trackedRepository("records-anchor-valid-", {
    "docs/features.md": [
      "# Features", "", "## Items", "",
      "- [the frame](spec/core.md#strip-frame)",
      "- [the second frame](spec/core.md#strip-frame-1)",
      "- [the items](#items)",
      "- [the Korean heading](spec/core.md#그림-frame)",
      "- [the encoded heading](spec/core.md#%EA%B7%B8%EB%A6%BC-frame)",
      "- [the bracketed target](<spec/core.md#strip-frame>)",
      "- [the folder](spec/) and [the document](spec/core.md)",
      "- [an address](https://example.com/core.md#gpu-frame)",
      "- `[a code span](spec/core.md#gpu-frame)`",
      "", "```", "[a code block](spec/core.md#gpu-frame)", "```", "",
    ].join("\n"),
    "docs/spec/core.md": "# Core\n\n## Strip frame\n\n## Strip frame\n\n## 그림 frame\n",
  });
  assert.deepEqual(repositoryRecordViolations(repository).errors, []);
});

test("a link to a third repeated heading, a missing heading of the same document, a fenced heading and a missing document is reported", () => {
  const repository = trackedRepository("records-anchor-missing-", {
    "docs/features.md": [
      "# Features", "",
      "- [the third frame](spec/core.md#strip-frame-2)",
      "- [the items](#items)",
      "- [the fenced heading](spec/core.md#fenced-heading)",
      "- [the removed document](spec/gone.md#strip-frame)", "",
    ].join("\n"),
    "docs/spec/core.md": "# Core\n\n## Strip frame\n\n## Strip frame\n\n```md\n## Fenced heading\n```\n",
  });
  assert.deepEqual(repositoryRecordViolations(repository).errors, [
    "docs/features.md:3: missing heading spec/core.md#strip-frame-2",
    "docs/features.md:4: missing heading #items",
    "docs/features.md:5: missing heading spec/core.md#fenced-heading",
    "docs/features.md:6: missing link target spec/gone.md#strip-frame",
  ]);
});

test("the package exports the anchor rule of the record check for the documentation checks of other repositories", async () => {
  const { headingAnchors, markdownLinks } = await import("@soksak/kit/records");
  assert.equal(typeof headingAnchors, "function", "the package exports headingAnchors");
  assert.equal(typeof markdownLinks, "function", "the package exports markdownLinks");
  assert.deepEqual([...headingAnchors("# A b\n\n## A b\n\n```\n## Fenced\n```\n\n### 그림, frame!\n#### snake_case  two\n")],
    ["a-b", "a-b-1", "그림-frame", "snake_case--two"]);
  assert.deepEqual(markdownLinks("See [a](b.md#c).\n`[d](e.md)`\n"), [{ start: 8, end: 14, target: "b.md#c" }]);
});

test("a link target that is not URI-encoded is an error with its file and line", () => {
  const repository = trackedRepository("records-anchor-encoding-", {
    "docs/features.md": "# Features\n\n[the frame](spec/core.md#strip%E0frame)\n",
    "docs/spec/core.md": "# Core\n",
  });
  assert.throws(() => repositoryRecordViolations(repository), /^Error: docs\/features\.md:3: link target spec\/core\.md#strip%E0frame is not URI-encoded/);
});

test("dom entry and dom name are rejected for element entry and element name, also in their plurals and in identifiers", () => {
  assert.deepEqual(termViolations("A dom entry names an element.\nEach dom name is declared.\nThe DOM entries and dom names of a view.\nconst domName = exposeDomEntry();\n", "a.md"), [
    'a.md:1: rejected term "dom entry", use "element entry": dom entry',
    'a.md:2: rejected term "dom name", use "element name": dom name',
    'a.md:3: rejected term "dom entry", use "element entry": DOM entries',
    'a.md:3: rejected term "dom name", use "element name": dom names',
    'a.md:4: rejected term "dom entry", use "element entry": DomEntry',
    'a.md:4: rejected term "dom name", use "element name": domName',
  ]);
  assert.deepEqual(termViolations('The region input `input: "dom"` keeps its name, and a random entry names the DOM of a view page.', "a.md"), []);
});

test("a rejected phrase with a regular expression character matches only its own words, also in identifiers", async () => {
  // A copy of the check with a term list whose rejected phrase holds `.`, which a pattern must match literally.
  const kit = mkdtempSync(join(tmpdir(), "records-escape-"));
  for (const file of ["records.js", "checklist.js"]) copyFileSync(new URL(`../${file}`, import.meta.url), join(kit, file));
  writeFileSync(join(kit, "terms.json"), JSON.stringify({ terms: [{ term: "dotted term", definition: "A term.", rejected: ["a.b entry"], allowed: [] }] }));
  const { termViolations: check } = await import(pathToFileURL(join(kit, "records.js")).href);
  assert.deepEqual(check("const value = makeAxbEntry();\nThe a.b entry is used.\nconst value = makeA.bEntry();", "a.js"), [
    'a.js:2: rejected term "a.b entry", use "dotted term": a.b entry',
    'a.js:3: rejected term "a.b entry", use "dotted term": A.bEntry',
  ]);
});

test("a record does not cite a log of the local build folder", () => {
  const violations = recordViolations("Red: the test failed (`build/logs/F1/red.log`).\n", "docs/features.md");
  assert.equal(violations.length, 1);
  assert.match(violations[0], /local build log/);
});
