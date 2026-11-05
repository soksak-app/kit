#!/usr/bin/env node
// Runs one check of a repository, as its hooks, checks and release workflow call it:
//
//   soksak-check commits <message file | revision range...>
//   soksak-check records [repository]
//   soksak-check census [--config <file>] [--catalog <file>] [--list] [repository]
//   soksak-check release <package.json> <checklist>
//
// A name, an option or a count of arguments that the usage does not declare exits with 2; a failed check exits with 1.
import { parseArgs } from "node:util";
import { checkCensus } from "./census.js";
import { checkCommits } from "./commits.js";
import { checkRecords } from "./records.js";
import { checkRelease } from "./release.js";

const CHECKS = {
  commits: {
    usage: "commits <message file | revision range...>", least: 1, most: Infinity,
    run: (_values, positionals) => checkCommits(positionals),
  },
  records: {
    usage: "records [repository]", least: 0, most: 1,
    run: (_values, [repository]) => checkRecords(repository),
  },
  census: {
    usage: "census [--config <file>] [--catalog <file>] [--list] [repository]", least: 0, most: 1,
    options: { config: { type: "string" }, catalog: { type: "string" }, list: { type: "boolean" } },
    run: (values, [repository]) => checkCensus(values, repository),
  },
  release: {
    usage: "release <package.json> <checklist>", least: 2, most: 2,
    run: (_values, [manifest, list]) => checkRelease(manifest, list),
  },
};

const usage = (check) => `usage: soksak-check ${check.usage}\n`;

function main([name, ...argv]) {
  const check = Object.hasOwn(CHECKS, name ?? "") ? CHECKS[name] : null;
  if (!check) {
    process.stderr.write(Object.values(CHECKS).map(usage).join(""));
    return 2;
  }
  let parsed;
  try {
    parsed = parseArgs({ args: argv, options: check.options ?? {}, allowPositionals: true });
  } catch (error) {
    process.stderr.write(`${error.message}\n${usage(check)}`);
    return 2;
  }
  const { values, positionals } = parsed;
  if (positionals.length < check.least || positionals.length > check.most) {
    process.stderr.write(usage(check));
    return 2;
  }
  try {
    return check.run(values, positionals);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 1;
  }
}

process.exitCode = main(process.argv.slice(2));
