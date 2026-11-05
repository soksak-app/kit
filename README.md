# Kit

The checks that every soksak repository runs through one executable, `soksak-check`: `commits` (the commit message check), `records` (the record check), `census` (the census check of the sources and the event catalog, docs/spec/logging.md#census of core) and `release` (the release gate). The kit also holds the checklist reader and the term list `terms.json`. A repository pins the release file of this kit in its `devDependencies` and runs these checks in its hooks, checks and release workflow.

`soksak-check records` refuses a closed checklist item that leaves its checklist or changes state unless the commit retires it in the changelog pair. It compares the working tree with `HEAD`; `soksak-check records --range <revision range>` compares each commit of a range with its first parent, for a push and for CI. A new checklist line takes no retired identifier, and a renumbering retires the old identifier of an open item as it does for a closed item.

- [Checklist](docs/features.md)
- [Changelog](CHANGELOG.md)

```sh
make hooks
make test
make check
```
