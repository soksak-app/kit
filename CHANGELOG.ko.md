# 변경 기록

[English](CHANGELOG.md)

## 미출시

- KR13: 실행 파일은 `sok-check`이고, `sok-check commands`가 실행 파일과 make target의 이름을 검사한다. Red: `test/commands.test.mjs`가 실패했다. Green: 통과한다.
- KR12: 검사는 `soksak-check docs`와 `soksak-check events`이고 선언 파일은 `event-sources.json`이며 `docs`는 추적되지 않은 파일마다 보고한다. Red: `test/check.test.mjs`가 실패했다. Green: 통과한다.
- KR11: record 검사가 임시 폴더 log의 인용을 보고한다. Red: `test/records.test.mjs`의 새 test가 실패했다. Green: 통과한다.
- KR10: 저장소는 `soksak-app/kit`이고 package는 `@soksak/kit`이다.
- KR9: record 검사가 local build 폴더 log의 인용을 보고한다. Red: `test/records.test.mjs`의 새 test가 실패했다. Green: 통과한다.
- KR8: 각 검사는 자기 module만 읽고 kit에는 설치 단계가 없다. Red: `test/check.test.mjs`의 새 test가 실패했다. Green: 통과한다.
- KR7-1: release gate job이 pnpm을 설치한다.
- KR7: kit은 실행 파일 하나 `soksak-check`를 가진 checks kit이고 census 검사를 담는다. Red: `test/check.test.mjs`가 실패했다. Green: 통과한다.
- KR6: `drawing`의 거부어는 `presenting state`이므로 record가 호스트의 frame 표시를 적을 수 있고, version은 0.0.6이다. Red: term 검사 test가 실패했다. Green: 통과한다.
- KR5: term 목록은 호스트가 그림 영역의 그림을 보이는 방식인 `presentation mode`와 `lease`를 정의하고, version은 0.0.5이다. Red: term test가 실패했다. Green: 통과한다.
- KR4: term 목록은 image region의 공급자가 raster를 그리는지를 뜻하는 `drawing`을 정의하고, version은 0.0.4이다. Red: drawing term test가 실패했다. Green: 통과한다.
- KR3: term `kit`은 KR2의 static library 없이 여러 repository가 검사나 release에서 실행하는 도구를 가리키고, checklist reader는 `Closed:`와 비지 않은 사유가 있는 닫힌 항목을 받는다. version은 0.0.3이다. Red: 두 test가 실패했다. Green: 둘 다 통과한다.
- KR2: term 목록은 `kit`을 여러 repository가 공유하는 build 입력을 release로 내는 repository로 정의하고, version은 0.0.2다. Red: `the kit term names a build input that the application does not install`가 실패했다. Green: 통과한다.
- KR1-1: pre-push hook은 `main`이 없는 remote로의 첫 push에서 push한 ref의 모든 commit을 검사한다. 이전에는 git이 거부하는 `origin/main..<sha>`를 넘겼다. Red: `the first push to a remote without main checks every commit of the pushed ref`가 `RANGE=origin/main..<sha>`로 실패했다. Green: 통과한다.
- KR1: records kit은 commit message 검사, record 검사, release gate, checklist reader, term 목록과 그 test를 담고, release workflow는 `package.json`이 선언한 version의 `npm pack` 파일을 release한다. Red: `the release holds the checks, the checklist reader and the term list, and each command is in it`와 `each export names a file of the release`는 `bin`, `exports`, `files`가 없는 `package.json`에서 실패했다. Green: 둘 다 통과하고 `make test`와 `make check`가 통과한다.
