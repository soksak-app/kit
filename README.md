# Kit

The checks that every soksak repository runs through one executable, `soksak-check`: `commits` (the commit message check), `records` (the record check), `census` (the census check of the sources and the event catalog, docs/spec/logging.md#census of core) and `release` (the release gate). The kit also holds the checklist reader and the term list `terms.json`. A repository pins the release file of this kit in its `devDependencies` and runs these checks in its hooks, checks and release workflow.

- [Checklist](docs/features.md)
- [Changelog](CHANGELOG.md)

```sh
make hooks
make test
make check
```
