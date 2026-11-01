# Features

[한국어](features.ko.md)

- [o] KR1 — P0, linked to core F355-3-1: The records kit at version 0.0.1 holds the commit message check, the record check, the release gate, the checklist reader and the term list, with their tests, and releases them as the `npm pack` file of a GitHub release. The release run published `v0.0.1` with `soksak-kit-records-0.0.1.tgz`.
  - [o] KR1-1 — P0: The pre-push hook checks every commit of the pushed ref on the first push to a remote without `main`. Input: the hook passed `origin/main..<sha>`, which git refuses when `origin/main` does not exist, so the first push of the repository failed. Expected: the range is `<sha>` when the remote has no `main`. Result: `the first push to a remote without main checks every commit of the pushed ref` failed (Red) and passes (Green).
