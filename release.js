// Decides whether a repository releases the version that its package.json declares. The repository releases when the
// remote has no tag of that version. The checks of the release workflow decide whether the code is releasable; an item
// of the checklist in the state `[ ]`, `[~]` or `[!]` does not hold the release and is carried into the next version, and
// the decision lists those items. The decision reads only the files and the remote tags of the repository, so no other
// repository takes part in it.
//
//   soksak-check release <package.json> <checklist>
//
// It prints the decision and, when GITHUB_OUTPUT names a file, writes `release` (`true` or `false`) and `version` to it.
import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import { checklist } from "./checklist.js";

const OPEN = new Set([" ", "~", "!"]);

/** The declared version of the manifest text, or an error that names the file and what it found. */
export function declaredVersion(name, text) {
  let manifest;
  try {
    manifest = JSON.parse(text);
  } catch (error) {
    throw new Error(`${name}: not JSON: ${error.message}`);
  }
  const { version } = manifest;
  if (typeof version !== "string" || !/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error(`${name}: version must be a string of the form <major>.<minor>.<patch>, found ${JSON.stringify(version)}`);
  }
  return version;
}

/** The open items of the checklist text, as `<id> [<state>]`. An open item without an identifier is an error. */
export function openItems(name, text) {
  const errors = [];
  const open = checklist(text, name, errors).filter(({ state }) => OPEN.has(state));
  const unnamed = open.filter(({ id }) => !id).length;
  if (unnamed) errors.push(`${name}: ${unnamed} open checklist items have no identifier`);
  if (errors.length) throw new Error(errors.join("\n"));
  return open.map(({ id, state }) => `${id} [${state}]`);
}

/** The decision for the manifest and checklist texts and whether the remote has the tag: { release, version, reasons, carried }. */
export function releaseDecision({ manifestName, manifestText, checklistName, checklistText, tagExists }) {
  const version = declaredVersion(manifestName, manifestText);
  const reasons = [];
  if (tagExists(`v${version}`)) reasons.push(`the tag v${version} exists`);
  const carried = openItems(checklistName, checklistText);
  return { release: reasons.length === 0, version, reasons, carried };
}

/** Whether the remote origin has the tag. A failure of git is an error, so an unknown tag set never reads as empty. */
export function remoteTagExists(tag) {
  return execFileSync("git", ["ls-remote", "--tags", "origin", `refs/tags/${tag}`], { encoding: "utf8" }).trim() !== "";
}

/** Decides the release of the repository, reports the decision, and returns the exit code. */
export function checkRelease(manifestName, checklistName) {
  let decision;
  try {
    decision = releaseDecision({
      manifestName, manifestText: readFileSync(manifestName, "utf8"),
      checklistName, checklistText: readFileSync(checklistName, "utf8"), tagExists: remoteTagExists,
    });
  } catch (error) {
    process.stderr.write(`release gate: ${error.message}\n`);
    return 1;
  }
  const { release, version, reasons, carried } = decision;
  process.stdout.write(release ? `release v${version}\n` : `no release of v${version}: ${reasons.join("; ")}\n`);
  process.stdout.write(`${carried.length} open items carried into the next version${carried.length ? `: ${carried.join(", ")}` : ""}\n`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `release=${release}\nversion=${version}\n`);
  return 0;
}
