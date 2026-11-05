// Checks that a commit message has the form `type(scope): Subject (#ID)`, a blank line, a non-empty body and no footer. When the argument is a file, it checks that
// message (commit-msg hook); otherwise it checks each commit of the git ranges given as arguments.
//
//   sok-check commits <message file | revision range...>
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { commitMessageErrors } from "./docs.js";

/** [name, message] for each message of targets. A single file is that one message; ranges give each commit that is not a merge. */
export function commitMessages(targets) {
  const [target] = targets;
  if (targets.length === 1 && existsSync(target)) return [["message", readFileSync(target, "utf8").replace(/^#.*\n?/gm, "")]];
  return execFileSync("git", ["rev-list", "--no-merges", ...targets], { encoding: "utf8" }).split("\n").filter(Boolean)
    .map((commit) => [commit.slice(0, 12), execFileSync("git", ["log", "-1", "--format=%B", commit], { encoding: "utf8" })]);
}

/** Checks the messages of targets, reports each error, and returns the exit code. */
export function checkCommits(targets) {
  const messages = commitMessages(targets);
  const errors = messages.flatMap(([name, message]) => commitMessageErrors(message).map((error) => `${name}: ${error}`));
  if (errors.length) {
    process.stderr.write(errors.map((error) => `${error}\n`).join(""));
    return 1;
  }
  process.stdout.write(`Commit message checks passed: ${messages.length} messages\n`);
  return 0;
}
