// Checks that every relative import of a shipped module names a file of the release (E68), so a release that omits a module
// which a shipped module imports is refused before it is published. Each violation is reported as `path: <text>`.
//
//   sok-check shipped-imports [repository]
//
// The release is the file list of `pnpm pack --dry-run --json` for the package at the repository. Each shipped .js and .mjs
// module is parsed as an ES module by acorn, and each relative static import, re-export and dynamic import with a string
// literal must name a file of that list, resolved from the folder of the module. A module that does not parse is reported;
// a CommonJS require() and a dynamic import with a computed specifier are not read, because the rule has no literal to resolve.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "acorn";
import { simple } from "acorn-walk";

const SHIPPED_MODULE = /\.m?js$/;

/** The paths of the files that the release of the package at root holds, as pnpm pack lists them. */
function shippedFiles(root) {
  const listing = JSON.parse(execFileSync("pnpm", ["pack", "--dry-run", "--json"], { cwd: root, encoding: "utf8" }));
  return new Set(listing.files.map((file) => file.path));
}

/** The relative specifiers of the static imports, re-exports and dynamic imports of a module. */
function relativeSpecifiers(source) {
  const specifiers = [];
  const add = (node) => {
    if (node.source?.type === "Literal" && typeof node.source.value === "string") specifiers.push(node.source.value);
  };
  simple(parse(source, { ecmaVersion: "latest", sourceType: "module" }), {
    ImportDeclaration: add,
    ExportNamedDeclaration: add,
    ExportAllDeclaration: add,
    ImportExpression: add,
  });
  return specifiers.filter((specifier) => specifier.startsWith("./") || specifier.startsWith("../"));
}

/** Each violation of the release of the package at root, as `path: <text>`. */
export function shippedImportViolations(root) {
  const shipped = shippedFiles(root);
  const errors = [];
  for (const file of [...shipped].filter((name) => SHIPPED_MODULE.test(name)).sort()) {
    let specifiers;
    try {
      specifiers = relativeSpecifiers(readFileSync(path.join(root, file), "utf8"));
    } catch (error) {
      errors.push(`${file}: ${error.message}`);
      continue;
    }
    for (const specifier of specifiers) {
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier));
      if (!shipped.has(target)) errors.push(`${file}: imports ${specifier}, which the release does not hold`);
    }
  }
  return errors;
}

/** Reports each violation of the package at the repository, the current folder by default; returns the exit status. */
export function checkShippedImports(repository = ".") {
  const errors = shippedImportViolations(repository);
  for (const error of errors) process.stderr.write(`${error}\n`);
  if (errors.length) return 1;
  process.stdout.write("Shipped import checks passed\n");
  return 0;
}
