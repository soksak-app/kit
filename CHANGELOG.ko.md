# 변경 기록

[English](CHANGELOG.md)

## 미출시

- KR1-1: pre-push hook은 `main`이 없는 remote로의 첫 push에서 push한 ref의 모든 commit을 검사한다. 이전에는 git이 거부하는 `origin/main..<sha>`를 넘겼다. Red: `the first push to a remote without main checks every commit of the pushed ref`가 `RANGE=origin/main..<sha>`로 실패했다. Green: 통과한다.
- KR1: records kit은 commit message 검사, record 검사, release gate, checklist reader, term 목록과 그 test를 담고, release workflow는 `package.json`이 선언한 version의 `npm pack` 파일을 release한다. Red: `the release holds the checks, the checklist reader and the term list, and each command is in it`와 `each export names a file of the release`는 `bin`, `exports`, `files`가 없는 `package.json`에서 실패했다. Green: 둘 다 통과하고 `make test`와 `make check`가 통과한다.
