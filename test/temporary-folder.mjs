// The temporary folders that the kit tests create. A test file calls removeTemporaryFolders from node:test's after at its top level,
// so each folder is removed when the file ends, also when an assertion fails.
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const folders = [];

/** Creates an empty folder in the temporary directory, named with prefix, that removeTemporaryFolders removes. */
export function temporaryFolder(prefix) {
  const folder = mkdtempSync(join(tmpdir(), prefix));
  folders.push(folder);
  return folder;
}

/** Removes the folders that temporaryFolder created. */
export function removeTemporaryFolders() {
  for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true });
}
