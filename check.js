#!/usr/bin/env node
// Runs one check of a repository, as its hooks, checks and release workflow call it:
//
//   sok-check commands [repository]
//   sok-check commits <message file | revision range...>
//   sok-check docs [repository]
//   sok-check events [--config <file>] [--catalog <file>] [--list] [repository]
//   sok-check release <package.json> <checklist>
//
// A name, an option or a count of arguments that the usage does not declare exits with 2; a failed check exits with 1.
// Each check loads only its own module, so a check without a dependency needs no installation.
import { parseArgs } from "node:util";

const CHECKS = {
  commands: {
    usage: "commands [repository]", least: 0, most: 1,
    run: async (_values, [repository]) => (await import("./commands.js")).checkCommands(repository),
  },
  commits: {
    usage: "commits <message file | revision range...>", least: 1, most: Infinity,
    run: async (_values, positionals) => (await import("./commits.js")).checkCommits(positionals),
  },
  docs: {
    usage: "docs [repository]", least: 0, most: 1,
    run: async (_values, [repository]) => (await import("./docs.js")).checkDocs(repository),
  },
  events: {
    usage: "events [--config <file>] [--catalog <file>] [--list] [repository]", least: 0, most: 1,
    options: { config: { type: "string" }, catalog: { type: "string" }, list: { type: "boolean" } },
    run: async (values, [repository]) => (await import("./events.js")).checkEvents(values, repository),
  },
  release: {
    usage: "release <package.json> <checklist>", least: 2, most: 2,
    run: async (_values, [manifest, list]) => (await import("./release.js")).checkRelease(manifest, list),
  },
};

const usage = (check) => `usage: sok-check ${check.usage}\n`;

async function main([name, ...argv]) {
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
    return await check.run(values, positionals);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 1;
  }
}

process.exitCode = await main(process.argv.slice(2));
