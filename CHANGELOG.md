# Changelog

[한국어](CHANGELOG.ko.md)

## Unreleased

- KR1-1: The pre-push hook checks every commit of the pushed ref on the first push to a remote without `main`, where it passed `origin/main..<sha>`, which git refuses. Red: `the first push to a remote without main checks every commit of the pushed ref` failed with `RANGE=origin/main..<sha>`. Green: it passes.
- KR1: The records kit holds the commit message check, the record check, the release gate, the checklist reader and the term list, with their tests, and its release workflow releases the `npm pack` file of the version that `package.json` declares. Red: `the release holds the checks, the checklist reader and the term list, and each command is in it` and `each export names a file of the release` failed on a `package.json` without `bin`, `exports` and `files`. Green: both pass, and `make test` and `make check` pass.
