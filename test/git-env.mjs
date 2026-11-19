// The git variables that a git hook sets for the repository that runs it. A test repository is its own only without them, so
// every test file imports this module, and each test repository helper calls clearHookGitVariables before it runs git.

export const HOOK_GIT_VARIABLES = ["GIT_DIR", "GIT_INDEX_FILE", "GIT_WORK_TREE", "GIT_OBJECT_DIRECTORY", "GIT_COMMON_DIR", "GIT_PREFIX"];

/** Removes HOOK_GIT_VARIABLES from the environment of this process, which every git run of a test inherits. */
export function clearHookGitVariables() {
  for (const name of HOOK_GIT_VARIABLES) delete process.env[name];
}

clearHookGitVariables();
