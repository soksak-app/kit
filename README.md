# Records kit

The checks that every soksak repository runs on its own records: the commit message check (`soksak-commits`), the record check (`soksak-records`), the release gate (`soksak-release-gate`), the checklist reader and the term list `terms.json`. A repository pins the release file of this kit in its `devDependencies` and runs these commands in its hooks, checks and release workflow.

`soksak-records` refuses a closed checklist item that leaves its checklist or changes state unless the commit retires it in the changelog pair. It compares the working tree with `HEAD`; `soksak-records --range <revision range>` compares each commit of a range with its first parent, for a push and for CI.

- [Checklist](docs/features.md)
- [Changelog](CHANGELOG.md)

```sh
make hooks
make test
make check
```
