#!/usr/bin/env node
// Checks that records state only facts about the repository. Documents are checked on every line outside code blocks, and configuration files (workflow, Makefile) only on comment lines,
// a link of a document to a heading of a local Markdown document must name a heading that the document has, and violations are reported as `path:line`.
// Each repository checks its own records with this command. A closed item keeps its state unless the commit retires it:
// the command compares the working tree with HEAD, and with --range it compares each commit of a range with its first
// parent, because no pre-commit hook runs in a rebase and a tree in CI equals its HEAD.
//
//   soksak-records [repository]
//   soksak-records --range <revision range> [repository]
import { checkCompletedItems, checkRetiredIdentifiers, itemIdentifier, retiredChecklistItems } from "./checklist.js";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

// The pattern source that matches text literally.
const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// The pattern source of a synonym followed by its plural ending: `ies` in place of a final `y` after a consonant, otherwise `s`.
const withPlural = (source) => (/[^aeiou]y$/i.test(source) ? `${source.slice(0, -1)}(?:y|ies)` : `${source}s?`);

/**
 * The rejected synonyms of terms.json, each with the term to use, the names that may hold it, such as names of external
 * libraries, and a pattern that also matches it in identifiers.
 */
export const REJECTED_TERMS = JSON.parse(readFileSync(new URL("./terms.json", import.meta.url), "utf8")).terms
  .flatMap(({ term, rejected, allowed }) => rejected.map((word) => ({
    word,
    term,
    allowed,
    pattern: new RegExp(`(?<![A-Za-z0-9])${withPlural(word.split(/[\s-]+/).map(escapeRegExp).join("[\\s_-]?"))}(?![A-Za-z0-9]|\\.json)`, "gi"),
    // The same words joined with capital initials inside an identifier.
    camel: new RegExp(`(?<=[a-z0-9])${withPlural(word.split(/[\s-]+/).map((part) => escapeRegExp(part[0].toUpperCase() + part.slice(1))).join(""))}(?![a-z])`, "g"),
  })));

/**
 * Lines of text that use a rejected synonym, as `file:line: rejected term "<word>", use "<term>": <match>`. A synonym
 * also matches in its plural, which ends in `ies` in place of a final `y` after a consonant and in `s` otherwise; one
 * followed by `.json` names a file such as package.json and is not a use.
 */
export function termViolations(text, file) {
  const errors = [];
  text.split("\n").forEach((line, index) => {
    const found = REJECTED_TERMS.flatMap(({ word, term, allowed, pattern, camel }) => {
      // An allowed name, such as the name of an external library, holds the word without using it.
      const spans = allowed.flatMap((name) => [...line.matchAll(new RegExp(escapeRegExp(name), "g"))]
        .map((match) => [match.index, match.index + name.length]));
      return [...line.matchAll(pattern), ...line.matchAll(camel)]
        .filter((match) => !spans.some(([start, end]) => match.index >= start && match.index < end))
        .map((match) => ({ word, term, text: match[0], start: match.index, end: match.index + match[0].length }));
    });
    // A match inside a longer match of another rejected synonym is the same use, so only the longer one is reported.
    for (const item of found) {
      if (found.some((other) => other !== item && other.start <= item.start && other.end >= item.end && other.end - other.start > item.end - item.start)) continue;
      errors.push(`${file}:${index + 1}: rejected term "${item.word}", use "${item.term}": ${item.text}`);
    }
  });
  return errors;
}

/**
 * Whether a file is checked for rejected terms: every tracked text file of these kinds except the term list, the
 * tests of this check, whose fixtures hold rejected synonyms, and the changelogs and checklists, which record earlier
 * changes in the words of their time.
 */
export function termChecked(file) {
  if (/(?:^|\/)terms\.json$/.test(file) || /(?:^|\/)records-check\.test\.mjs$/.test(file) || /(?:^|\/)CHANGELOG(?:\.[a-z]+)?\.md$/.test(file) || /(?:^|\/)features(?:\.[a-z]+)?\.md$/.test(file)) return false;
  if (/\.(?:md|js|mjs|cjs|ts|go|rs|m|h|json|ya?ml|toml)$/.test(file)) return true;
  return /(?:^|\/)Makefile$/.test(file);
}

/** The expressions that records do not use, with their categories. Hexadecimal values such as color codes and UUIDs are not commit references. */
export const RECORD_PATTERNS = [
  ["commit reference", /\((?:[0-9a-f]{7,40})\)|`[0-9a-f]{7,40}`|\b(?:commit|pin) [0-9a-f]{7,40}\b|\b[0-9a-f]{7,40}\.\.[0-9a-f]{7,40}\b/i],
  ["pull request number", /\bPR #?\d+\b|\bpull request #?\d+\b/i],
  ["CI run number", /\brun \d{8,}\b/i],
  ["personal path", /\/Users\/|~\/backup/],
  ["account of who found or requested", /\bFound (?:on|while)\b|\b(?:Requested|Reported|Found|Decided) by\b|\bthe user's (?:decision|request|report)\b|사용자 결정|사용자가 (?:보고|발견|결정)|\bas the user asked\b|\bthe user (?:asked|decided|requested)\b|사용자 요청|사용자가 요청|발견:|\d{4}-\d{2}-\d{2}(?:[^.\n]|\.(?! )){0,80}?발견했|사용자가(?:[^.\n]|\.(?! )){0,120}?보고했/i],
  // macOS is an operating system name. "Mac" refers to that computer only when no letter follows it.
  ["local environment", /\b[Tt]his (?:machine|Mac)(?![A-Za-z])|이 (?:머신|Mac)(?![A-Za-z])/],
];

// Replaces a Markdown code block with the same number of blank lines. The line numbers of violations stay equal to the original.
const withoutCode = (text) => text.replace(/^(`{3,}|~{3,}).*\n[\s\S]*?^\1\s*$/gm, (block) => block.replace(/[^\n]/g, ""));

/** Replaces each character of a Markdown code block or code span with a space, so positions in the result match the source. */
const maskCode = (text) => {
  const blank = (part) => part.replace(/[^\n]/g, " ");
  return text.replace(/^(`{3,}|~{3,}).*\n[\s\S]*?^\1\s*$/gm, blank).replace(/(`+)[^`\n][\s\S]*?\1/g, blank);
};

/** The inline links of a Markdown text outside code blocks and code spans as { start, end, target }, where start and end bound the target inside its parentheses. */
export function markdownLinks(text) {
  return [...maskCode(text).matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].map((match) => {
    const start = match.index + match[0].length - 1 - match[1].length;
    return { start, end: start + match[1].length, target: text.slice(start, start + match[1].length) };
  });
}

/**
 * The anchors of the headings of a Markdown text outside code blocks. An anchor is the heading text in lower case without
 * the characters that are not a letter, a number, whitespace, `_` or `-`, trimmed, with each whitespace character as `-`;
 * a heading whose anchor an earlier heading has takes the first free one of `<anchor>-1`, `<anchor>-2`, ….
 */
export function headingAnchors(text) {
  const found = new Set();
  for (const match of withoutCode(text).matchAll(/^#{1,6}\s+(.+)$/gm)) {
    const base = match[1].toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, "").trim().replace(/\s/g, "-");
    let anchor = base, count = 0;
    while (found.has(anchor)) anchor = `${base}-${++count}`;
    found.add(anchor);
  }
  return found;
}

/**
 * The links of a Markdown document, a path relative to repository, whose target is a local Markdown document with a
 * fragment: `file:line: missing link target <target>` when the target does not exist, and `file:line: missing heading
 * <target>` when the fragment, URI-decoded, is no anchor of its headings. A fragment alone names a heading of the document itself.
 */
export function anchorViolations(text, file, repository) {
  const errors = [];
  const anchors = new Map();
  for (const link of markdownLinks(text)) {
    const target = link.target.replace(/^<|>$/g, "");
    // A target with a scheme, such as https:, is an address outside the repository.
    if (/^[a-z][a-z\d+.-]*:/i.test(target)) continue;
    const [path, fragment] = target.split("#");
    if (!fragment) continue;
    const line = text.slice(0, link.start).split("\n").length;
    const decode = (part) => {
      try {
        return decodeURIComponent(part);
      } catch (error) {
        throw new Error(`${file}:${line}: link target ${target} is not URI-encoded: ${error.message}`, { cause: error });
      }
    };
    const full = path ? resolve(repository, dirname(file), decode(path)) : resolve(repository, file);
    if (extname(full) !== ".md") continue;
    if (!existsSync(full)) {
      errors.push(`${file}:${line}: missing link target ${target}`);
      continue;
    }
    if (!anchors.has(full)) anchors.set(full, headingAnchors(readFileSync(full, "utf8")));
    if (!anchors.get(full).has(decode(fragment))) errors.push(`${file}:${line}: missing heading ${target}`);
  }
  return errors;
}

/** Returns the lines of text that break a record rule as `file:line: category: match`. kind is `document` or `config`. */
export function recordViolations(text, file, kind = "document") {
  const lines = (kind === "document" ? withoutCode(text) : text).split("\n");
  const errors = [];
  lines.forEach((line, index) => {
    if (kind === "config" && !/^\s*#/.test(line)) return;
    for (const [category, pattern] of RECORD_PATTERNS) {
      const match = pattern.exec(line);
      if (match) errors.push(`${file}:${index + 1}: ${category}: ${match[0]}`);
    }
  });
  return errors;
}

/**
 * The checklist lines of a features file that state an identifier which an earlier line of the same file states, as
 * `file:line: duplicate checklist identifier <id> (first stated on line <n>)`. The identifier is the one of checklist.js.
 */
export function checklistViolations(text, file) {
  const errors = [];
  const first = new Map();
  text.split("\n").forEach((line, index) => {
    const label = line.match(/^\s*- \[[^\]]*\] (.*)$/)?.[1];
    const id = label === undefined ? null : itemIdentifier(label).id;
    if (!id) return;
    if (first.has(id)) errors.push(`${file}:${index + 1}: duplicate checklist identifier ${id} (first stated on line ${first.get(id)})`);
    else first.set(id, index + 1);
  });
  return errors;
}

/** The kind of a file to check. A document is `.md`, and a configuration is a workflow or a Makefile. Any other file is null. */
export function recordKind(file) {
  if (file.endsWith(".md")) return "document";
  if (/^\.github\/workflows\/[^/]+\.ya?ml$/.test(file) || /(?:^|\/)Makefile$/.test(file)) return "config";
  return null;
}

const COMMIT_TYPES = ["feat", "fix", "docs", "style", "refactor", "test", "chore"];
const FOOTER = /^(?:Refs|Co-Authored-By|Signed-off-by|Generated(?: with| by)?|Reviewed-by)\b|^🤖|claude\.ai\/code/i;

/** Checks that a commit message has the form `type(scope): Subject (#ID)`, a blank line, a body wrapped at 72 characters and no footer. */
export function commitMessageErrors(message) {
  const lines = message.replace(/\n+$/, "").split("\n");
  const errors = [];
  const subject = /^([a-z]+)\(([a-z0-9-]+)\): (.+) \(#([A-Z][A-Za-z0-9]*(?:[.-][A-Za-z0-9]+)*)\)$/.exec(lines[0]);
  if (!subject) errors.push(`subject must be "type(scope): Subject (#ID)": ${lines[0]}`);
  else {
    const [, type, , text] = subject;
    if (!COMMIT_TYPES.includes(type)) errors.push(`type must be one of ${COMMIT_TYPES.join(", ")}: ${type}`);
    if (text.length > 50) errors.push(`subject is ${text.length} characters, above 50: ${text}`);
    if (!/^[A-Z]/.test(text)) errors.push(`subject must start with a capital letter: ${text}`);
    if (text.endsWith(".")) errors.push(`subject must not end with a period: ${text}`);
  }
  if (lines.length < 3 || lines[1] !== "" || !lines.slice(2).some((line) => line.trim())) {
    errors.push("a blank line and a non-empty body must follow the subject");
  }
  lines.slice(2).forEach((line, index) => {
    if (line.length > 72) errors.push(`body line ${index + 3} is ${line.length} characters, above 72`);
    if (FOOTER.test(line)) errors.push(`body line ${index + 3} is a footer: ${line}`);
  });
  for (const error of recordViolations(lines.join("\n"), "message")) errors.push(error.replace(/^message:/, "line "));
  for (const error of termViolations(lines.join("\n"), "message")) errors.push(error.replace(/^message:/, "line "));
  return errors;
}

/** The violations of the record files that the repository tracks. */
/** The tracked files of the repository that its census declaration does not exclude; an excluded file, a vendored third-party bundle, is not a record of the repository. */
function declaredFiles(repository, tracked) {
  const census = join(repository, "census.json");
  // default: a census declaration without an exclude excludes nothing, so every tracked file is a record of the repository.
  const declaration = existsSync(census) ? JSON.parse(readFileSync(census, "utf8")) : undefined;
  if (declaration !== undefined && (declaration === null || typeof declaration !== "object" || Array.isArray(declaration))) {
    throw new Error(`${census}: declaration must be an object; found ${declaration === null ? "null" : Array.isArray(declaration) ? "array" : typeof declaration} ${JSON.stringify(declaration)}`);
  }
  if (declaration && Object.hasOwn(declaration, "exclude") && typeof declaration.exclude !== "string") {
    throw new Error(`${census}: exclude must be a string; found ${typeof declaration.exclude} ${JSON.stringify(declaration.exclude)}`);
  }
  let exclude = null;
  if (declaration && Object.hasOwn(declaration, "exclude")) {
    try {
      exclude = new RegExp(declaration.exclude);
    } catch (error) {
      throw new Error(`${census}: exclude pattern ${JSON.stringify(declaration.exclude)} is invalid: ${error.message}`, { cause: error });
    }
  }
  return exclude ? tracked.filter((file) => !exclude.test(file)) : tracked;
}

const FEATURES = ["docs/features.md", "docs/features.ko.md"];
const CHANGELOGS = ["CHANGELOG.md", "CHANGELOG.ko.md"];

/** The text of a file at a revision, and the empty text at no revision or where the revision has no such file. */
function revisionText(repository, revision, file) {
  if (!revision) return "";
  const git = (args, options) => execFileSync("git", args, { cwd: repository, encoding: "utf8", ...options });
  const listed = git(["ls-tree", "--long", revision, "--", file]).trim();
  if (!listed) return "";
  // The default output limit of execFileSync (1 MiB) is smaller than a checklist, so the size of the file is the limit.
  return git(["cat-file", "blob", `${revision}:${file}`], { maxBuffer: Number(listed.split(/\s+/)[3]) + 1 });
}

/** The errors of one change of the checklist pair, whose texts `before` and `after` give by file. */
function changeViolations(before, after) {
  const retired = retiredChecklistItems(after(CHANGELOGS[0]), after(CHANGELOGS[1]));
  const earlier = retiredChecklistItems(before(CHANGELOGS[0]), before(CHANGELOGS[1])).ids;
  const retiredHere = new Set([...retired.ids].filter((id) => !earlier.has(id)));
  return [...retired.errors, ...FEATURES.flatMap((file) => [
    ...checkCompletedItems(before(file), after(file), file, retiredHere),
    ...checkRetiredIdentifiers(before(file), after(file), file, retired.ids),
  ])];
}

/** The commit that a revision resolves to, or null. */
function resolved(repository, revision) {
  try {
    return execFileSync("git", ["rev-parse", "-q", "--verify", `${revision}^{commit}`], { cwd: repository, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch (error) {
    if (error.status === 1) return null;
    throw error;
  }
}

/** The errors of the working tree against HEAD. */
function workingTreeViolations(repository) {
  const head = resolved(repository, "HEAD");
  const present = (file) => (existsSync(join(repository, file)) ? readFileSync(join(repository, file), "utf8") : "");
  return changeViolations((file) => revisionText(repository, head, file), present);
}

/**
 * The errors of each commit of a range against its first parent, as `<commit>: <error>`, one commit at a time. Only the
 * commits that change the checklist or the changelog pair read their texts, so memory follows the largest pair.
 */
export function rangeRecordViolations(repository, range) {
  const git = (...args) => execFileSync("git", args, { cwd: repository, encoding: "utf8" });
  const commits = git("rev-list", "--reverse", ...range.split(" ")).split("\n").filter(Boolean);
  const errors = commits.flatMap((commit) => {
    const parent = resolved(repository, `${commit}^`);
    const changed = git("diff-tree", "--root", "--no-commit-id", "--name-only", "-r", ...(parent ? [parent] : []), commit, "--", ...FEATURES, ...CHANGELOGS);
    if (!changed.trim()) return [];
    return changeViolations((file) => revisionText(repository, parent, file), (file) => revisionText(repository, commit, file))
      .map((error) => `${commit.slice(0, 12)}: ${error}`);
  });
  return { commits: commits.length, errors };
}

export function repositoryRecordViolations(repository) {
  const tracked = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { cwd: repository, encoding: "utf8" })
    .split("\0").filter((file) => file && existsSync(join(repository, file)));
  const files = declaredFiles(repository, tracked).filter((file) => recordKind(file) !== null || termChecked(file));
  return { files, errors: [...files.flatMap((file) => {
    const text = readFileSync(join(repository, file), "utf8");
    return [
      ...(recordKind(file) ? recordViolations(text, file, recordKind(file)) : []),
      ...(recordKind(file) === "document" ? anchorViolations(text, file, repository) : []),
      ...(termChecked(file) ? termViolations(text, file) : []),
      ...(/(?:^|\/)features(?:\.[a-z]+)?\.md$/.test(file) ? checklistViolations(text, file) : []),
    ];
  }), ...workingTreeViolations(repository)] };
}

// A package manager places a package as a link, so the started path is resolved before it is compared with this module.
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  const ranged = process.argv[2] === "--range";
  if (ranged && !process.argv[3]) {
    process.stderr.write("usage: soksak-records --range <revision range> [repository]\n");
    process.exit(2);
  }
  // default: when [repository] of the usage is omitted, the repository in the current folder is checked.
  const repository = resolve(process.argv[ranged ? 4 : 2] ?? ".");
  if (ranged) {
    const { commits, errors } = rangeRecordViolations(repository, process.argv[3]);
    if (errors.length) {
      process.stderr.write(errors.map((error) => `${error}\n`).join(""));
      process.exit(1);
    }
    process.stdout.write(`Checklist history checks passed: ${commits} commits\n`);
    process.exit(0);
  }
  const { files, errors } = repositoryRecordViolations(repository);
  if (errors.length) {
    process.stderr.write(errors.map((error) => `${error}\n`).join(""));
    process.stderr.write(`${errors.length} record lines state something other than facts about this repository\n`);
    process.exit(1);
  }
  process.stdout.write(`Record checks passed: ${files.length} files\n`);
}
