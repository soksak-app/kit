# 변경 기록

[English](CHANGELOG.md)

## 미출시

- KR16: 범위 검사는 각 blob을 한 번 읽고 각 text를 한 번 parse하므로 시간이 절반으로 준다. peak memory는 macOS allocator의 large block cache이고 그대로다.
- KR15: 새 체크리스트 줄은 폐기된 identifier를 쓸 수 없고, renumber는 닫힌 항목처럼 열린 항목의 이전 identifier도 폐기한다.
- KR14: 닫힌 체크리스트 항목은 commit이 폐기하지 않는 한 상태를 유지한다. `soksak-records`는 working tree를 `HEAD`와 비교하고, `soksak-records --range <revision range>`는 각 commit을 첫 parent와 비교한다.
- KR13: term `stream`은 host가 element tree를 page가 `elements` stream을 구독하는 동안에만 모으고 document region의 request를 attach부터 close까지 모은다고 적는다. Red: stream term test가 실패했다. Green: 통과한다.
- KR12: 저장소는 `pnpm install`이 쓰는 `pnpm-lock.yaml`을 추적하므로 `make test`가 추적되지 않은 파일을 남기지 않는다. Red: `make test` 뒤에 `git status --porcelain`이 `?? pnpm-lock.yaml`을 출력했다. Green: 아무것도 출력하지 않는다.
- KR21: identifier 안의 거부어를 찾는 pattern은 main pattern처럼 단어의 정규식 문자를 escape하므로, `a.b entry`가 더는 `AxbEntry`에 맞지 않는다. Red: escape test가 실패했다. Green: 통과한다.
- KR20: version은 0.0.12이므로, tag v0.0.11이 release gate를 막던 KR17, KR18, KR19, KR14, KR15, KR16을 release run이 v0.0.12로 게시한다.
- KR19: term 목록은 종류 `element`의 exposure entry인 element entry와 그 이름인 element name을 정의하고, 둘은 `dom entry`와 `dom name`을 거부한다. term 검사는 자음과 `y`로 끝나는 거부어의 복수형을 `ies`로 맞추므로 `dom entries`도 거부한다. Red: term 검사 test와 term test가 실패했다. Green: 둘 다 통과한다.
- KR18: term 목록은 mygo host의 용어 language host library, framework adapter, framework port, native workbench, native view of the window, native view element, presentation notice, settled presentation, workbench call channel, language table, framework table, baseline host, other host, element tree를 정의한다. Red: term test가 실패했다. Green: 통과한다.
- KR17: record 검사는 Markdown 문서의 link 가운데 fragment가 대상 local Markdown 문서의 어느 heading도 가리키지 않는 link를 파일, 줄, 대상과 함께 보고하고, 그런 link의 대상이 없으면 그것도 보고한다. `@soksak/kit-records/records-check`는 anchor 규칙을 `headingAnchors`로, link reader를 `markdownLinks`로 export한다. Red: anchor test가 실패했다. Green: 통과한다.
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
