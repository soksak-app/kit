// Checks the names of the commands of a repository (AGENTS.md):
//
//   sok-check commands [repository]
//
// A name states what the command does in plain words. An executable is sok or sok-<what>, a make target starts with a declared
// verb, a check target has the name of the script that it runs, no target repeats the recipe of another, and a target that a
// workflow runs exists.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { parse } from "smol-toml";

const VERBS = ["install", "fetch", "copy", "create", "build", "pack", "release", "run", "test", "check", "repeat", "measure", "benchmark", "clean"];
const EXECUTABLE = /^sok(-[a-z0-9]+)*$/;

const tracked = (root) => execFileSync("git", ["-C", root, "ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);

/** The rules of a Makefile: a target name and the lines of its recipe. A variable assignment and a special target are not rules. */
function targets(text) {
  return [...text.matchAll(/^([a-z0-9][a-z0-9-]*):(?!=)[^\n]*\n((?:\t[^\n]*\n)*)/gm)]
    .map(([, name, recipe]) => ({ name, lines: recipe.split("\n").filter(Boolean) }));
}

function makefileViolations(file, text, files) {
  const errors = [];
  const rules = targets(text);
  for (const { name, lines } of rules) {
    if (!VERBS.includes(name.split("-")[0])) errors.push(`${file}: target ${name} does not start with a declared verb`);
    if (name.startsWith("check-")) {
      for (const line of lines) {
        for (const [script, command] of line.matchAll(/\bscripts\/(check-[a-z0-9-]+)\.(?:mjs|sh)\b/g)) {
          if (lines.length === 1 && files.has(script) && command !== name && !name.startsWith(`${command}-`)) {
            errors.push(`${file}: target ${name} runs ${script}: a script and its target have one name`);
          }
        }
      }
    }
  }
  rules.forEach((one, index) => {
    if (!one.lines.length) return;
    const other = rules.find((rule, at) => at !== index && rule.lines.length > one.lines.length && one.lines.every((line) => rule.lines.includes(line)));
    if (other) errors.push(`${file}: target ${one.name} repeats the recipe of ${other.name}`);
  });
  return errors;
}

function executables(file, text) {
  const name = basename(file);
  if (name === "package.json") {
    const manifest = JSON.parse(text);
    if (typeof manifest.bin === "string") return [manifest.name.split("/").at(-1)];
    return Object.keys(manifest.bin ?? {});
  }
  if (name === "sidecar.json") {
    const manifest = JSON.parse(text);
    return [manifest.executable, ...(manifest.helpers ?? []).map((helper) => helper.executable)].filter(Boolean).map((path) => basename(path));
  }
  return (parse(text).bin ?? []).map((bin) => bin.name);
}

function workflowViolations(file, text, root, declared) {
  const errors = [];
  // A workflow may check this repository out into a folder; a make -C path starts from that folder.
  const checkouts = [...text.matchAll(/^\s*path:\s*(\S+)\s*$/gm)].map((match) => match[1]);
  // A word NAME=value sets a variable and names no target; Actions replaces each ${{ }} expression before the shell reads the line.
  const lines = text.replace(/\$\{\{.*?\}\}/g, "");
  for (const [, directory = "", words] of lines.matchAll(/^[ \t-]*(?:run:\s*)?make(?: -C (\S+))? ((?:(?:[a-z0-9][a-z0-9-]*|[A-Z_][A-Z0-9_]*=\S*) ?)+)$/gm)) {
    const checkout = checkouts.find((folder) => directory === folder || directory.startsWith(`${folder}/`));
    const folder = checkout ? directory.slice(checkout.length + 1) : directory;
    const makefile = join(root, folder, "Makefile");
    const names = declared.get(makefile);
    if (!names) continue;
    for (const word of words.trim().split(/\s+/)) {
      if (!word.includes("=") && !names.has(word)) errors.push(`${file}: make ${word} is not a target of ${makefile.slice(root.length + 1)}`);
    }
  }
  return errors;
}

/** Each violation of the command names of the repository at root. */
export function commandViolations(root) {
  const files = tracked(root);
  const known = new Set(files);
  const read = (file) => readFileSync(join(root, file), "utf8");
  const errors = [];
  const declared = new Map();
  for (const file of files) {
    const name = basename(file);
    if (name === "Makefile") {
      const text = read(file);
      declared.set(join(root, file), new Set(targets(text).map((rule) => rule.name)));
      errors.push(...makefileViolations(file, text, known));
    }
  }
  for (const file of files) {
    if (["package.json", "sidecar.json", "Cargo.toml"].includes(basename(file))) {
      for (const executable of executables(file, read(file))) {
        if (!EXECUTABLE.test(executable)) errors.push(`${file}: executable ${executable} is not sok or sok-<what>`);
      }
    }
    if (dirname(file) === ".github/workflows") errors.push(...workflowViolations(file, read(file), root, declared));
  }
  return errors;
}

/** Reports each violation of the repository, the current folder by default; returns the exit status. */
export function checkCommands(repository = ".") {
  const errors = commandViolations(execFileSync("git", ["-C", repository, "rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim());
  for (const error of errors) process.stderr.write(`${error}\n`);
  if (errors.length) return 1;
  process.stdout.write("Command checks passed\n");
  return 0;
}
