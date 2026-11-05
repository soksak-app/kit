# Checks kit

모든 soksak repository가 하나의 실행 파일 `soksak-check`로 실행하는 검사다: `commits`(commit message 검사), `records`(record 검사), `census`(소스와 event catalog의 census 검사, core의 docs/spec/logging.md#census), `release`(release gate). kit은 checklist reader와 term 목록 `terms.json`도 담는다. Repository는 이 kit의 release 파일을 `devDependencies`에 pin하고, 이 검사를 hook, 검사, release workflow에서 실행한다.

- [Checklist](docs/features.ko.md)
- [Changelog](CHANGELOG.ko.md)

```sh
make hooks
make test
make check
```
