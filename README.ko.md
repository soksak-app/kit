# Records kit

모든 soksak repository가 자기 record에 실행하는 검사다: commit message 검사(`soksak-commits`), record 검사(`soksak-records`), release gate(`soksak-release-gate`), checklist reader, term 목록 `terms.json`. Repository는 이 kit의 release 파일을 `devDependencies`에 pin하고, 이 command를 hook, 검사, release workflow에서 실행한다.

- [Checklist](docs/features.ko.md)
- [Changelog](CHANGELOG.ko.md)

```sh
make hooks
make test
make check
```
