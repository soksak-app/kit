# Records kit

The checks that every soksak repository runs on its own records: the commit message check (`soksak-commits`), the record check (`soksak-records`), the release gate (`soksak-release-gate`), the checklist reader and the term list `terms.json`. A repository pins the release file of this kit in its `devDependencies` and runs these commands in its hooks, checks and release workflow.

- [Checklist](docs/features.md)
- [Changelog](CHANGELOG.md)

```sh
make hooks
make test
make check
```
