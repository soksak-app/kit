# Records kit

모든 soksak repository가 자기 record에 실행하는 검사다: commit message 검사(`soksak-commits`), record 검사(`soksak-records`), release gate(`soksak-release-gate`), checklist reader, term 목록 `terms.json`. Repository는 이 kit의 release 파일을 `devDependencies`에 pin하고, 이 command를 hook, 검사, release workflow에서 실행한다.

`soksak-records`는 commit이 changelog 쌍에서 폐기하지 않는 한, 체크리스트에서 빠지거나 상태가 바뀐 닫힌 항목을 거부한다. working tree는 `HEAD`와 비교하고, `soksak-records --range <revision range>`는 범위의 각 commit을 첫 parent와 비교하며 push와 CI에서 쓴다. 새 체크리스트 줄은 폐기된 identifier를 쓸 수 없고, renumber는 닫힌 항목처럼 열린 항목의 이전 identifier도 폐기한다.

- [Checklist](docs/features.ko.md)
- [Changelog](CHANGELOG.ko.md)

```sh
make hooks
make test
make check
```
