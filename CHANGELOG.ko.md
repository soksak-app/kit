# 변경 기록

[English](CHANGELOG.md)

## 미출시
- KR57: 섹션 참조 규칙의 주석이 평문에서 anchor 뒤의 한글 조사는 anchor에 붙고 code span이 필요하다고 적는다. Red: 조사 시험은 바뀌지 않은 코드에서 통과했다. 주석만 틀렸기 때문이다.
- KR56: `sok-check docs`는 줄에 첫 단어가 있는 금지어만 검사하고, allowed name은 한 번만 컴파일한다. 같은 worktree에서 core 검사가 51.6~54.7초 걸리던 것이 4.1초가 되며, 출력은 바이트 단위로 같다. Red: 고정 말뭉치 시험은 변경 전후 모두 통과한다. finding이 바뀌지 않기 때문이다.
- KR55: check, docs, checklist 이력, hooks, commands, shipped imports 시험은 만든 임시 폴더를 helper `test/temporary-folder.mjs`로 지워서 실행이 `records-*`, `kit-*`, `kit-records-*` 폴더를 남기지 않는다. Red: `temp-folders.test.mjs`가 실행이 남긴 폴더를 나열했다.
- KR54: docs와 events 시험은 임시 폴더에 만든 저장소 폴더를 각자 지워서 `event-sources-`와 `invalid-event-sources-` 폴더가 남지 않는다. Red: `temp-folders.test.mjs`가 실행이 남긴 폴더를 찾았다.
- KR53: 용어 목록이 컴퓨터에 속하고 프로젝트에 속하지 않는 설정이나 페이지의 범위로 `global`을 정의하며, `common only`와 `common-only`를 거부한다. Red: terms 시험에 `global` 항목이 없었다. Green: terms 시험이 통과한다.
- KR52: 평문이나 code span의 section 참조 `docs/<path>.md#<anchor>`가 없는 제목이나 문서를 가리키면 위반으로 보고하고, 대상의 명시 anchor `<a id>`는 유효한 anchor다. Red: 새 문서 테스트가 위반을 보고하지 않아 `actual: []`로 실패했다. Green: 문서 테스트 파일이 통과한다.
- KR50: 0.0.18을 릴리즈한다.
- KR49: `sok-check docs`의 요약이 record 지적마다 경로와 줄을 적고, 테스트가 이를 확인한다. Red: 관찰하지 못했다. 테스트가 HEAD에서 통과해 제품 코드를 바꾸지 않았다. Green: 문서 테스트 파일이 34개 중 34개 통과한다.
- KR48: 용어 목록은 `plugin capability`를 `plugin category`의 거부 동의어로 두고, MCP capabilities, Tauri capabilities 폴더 및 plugin category에 해당하지 않는 다른 의미를 가리키는 단어 `capability`는 더 이상 거부하지 않는다. Red: 문서 테스트가 MCP 줄의 `capabilities`를 지적하며 실패했다. Green: 테스트가 통과하며, `node --test test/`가 151개 테스트 중 151개를 통과한다.
- KR47: `sok-check docs`의 요약이 미추적 파일과 record 줄을 각자의 표시로 센다. Red: 요약에 미추적 줄이 없어 요약 테스트가 실패했다. Green: 테스트가 통과한다.
- KR46: 용어 목록이 알림 용어 notice, notice center, toast, system notification을 정의한다.
- KR45: 용어 목록이 `settings tab`과 `project home`을 정의한다.
- KR44: 용어 목록이 `plugin category`를 정의한다.
- KR43: 용어 목록은 `account`와 `account home`을 정의한다.
- KR42: 버전은 0.0.17이며, release run이 KR39, KR40, KR41을 게시한다.
- KR41: 발견·요청 경위 record 패턴은 행위자가 program 부분인 수동문을 받고, 절 시작의 동사와 `by` 또는 사람 행위자를 거부한다.
- KR40: term 목록이 core의 owned session 명세를 위해 `owned session`과 `owner`를 정의하고, `owned terminal`과 `session owner`를 거부한다. Red: owned session term test가 실패했다. Green: `test/terms.test.mjs`가 14개 중 14개 통과한다. 전체 `pnpm test`는 설치된 dependency가 필요해서 실행하지 않았다.
- KR39: `sok-check shipped-imports`가 shipped .js 또는 .mjs module의 상대 static import, re-export, string literal dynamic import가 `pnpm pack --dry-run --json` 목록의 파일을 가리키는지 검사하고, `make check`가 이를 실행한다. acorn 8.19.0과 acorn-walk 8.3.5가 정확한 버전의 dependency다. Red: `test/shipped-imports.test.mjs`가 `shipped-imports.js`에 대해 `ERR_MODULE_NOT_FOUND`로 실패했다. Green: `pnpm test`가 147개 test 중 147개를 통과한다.
- KR38: version은 0.0.16이므로, tag v0.0.15 이후의 commit을 release run이 v0.0.16으로 게시한다.
- KR37: term 목록이 core의 agent role 명세를 위해 `fingerprint`, `generation`, `reread request`, `confirmation`, `role message`, `delivery record`, `error display`를 정의한다. `make check`가 통과한다.
- KR36: term 목록이 `agent role`, `role file`, `change message`, `stable identity`, `identity file`을 정의하고, `stable identity`에 대해 `launch identity`를 거부한다. `make check`가 통과한다.
- KR35: version은 0.0.15이므로, tag v0.0.14 이후의 commit을 release run이 v0.0.15로 게시한다.

- KR33: term 목록이 하나의 바깥 윤곽선으로 그려지는 공간의 맞닿은 두 개 이상의 content card 집합인 `party`와, leader 표식과 leader 색을 가진 party의 한 card 또는 none인 `leader`를 정의한다. Red: party와 leader term test가 실패했다. Green: 통과한다.


- KR34: kit test는 git을 실행하기 전에 hook의 git 변수 `GIT_DIR`, `GIT_INDEX_FILE`, `GIT_WORK_TREE`, `GIT_OBJECT_DIRECTORY`, `GIT_COMMON_DIR`, `GIT_PREFIX`를 제거하므로 각 test repository는 자기 것이다. Red: 외부 repository test가 실패했다. Green: `pnpm test`가 변수를 설정했을 때와 설정하지 않았을 때 모두 140개 test 중 140개를 통과한다.
- KR32: commit 검사는 commit message의 subject가 아니라 body를 읽으므로, subject만으로는 체크리스트 identifier의 제거를 용서하지 않는다. Red: body만 보는 commit 및 range test가 실패했다. Green: checklist, 이력, docs, check test가 통과한다.
- KR31: pre-commit hook은 record 검사만 실행하고, commit-msg hook은 `check.js docs --message <file>`로 commit message와 함께 체크리스트 변경을 판단하므로, rename이나 보류 항목은 message가 있는 시점에 판단된다. Red: commit 시점 rename test가 실패했다. Green: checklist 이력과 checklist test가 통과한다.
- KR30: branch에만 있는 체크리스트 identifier는 body가 옛 identifier와 새 identifier를 밝히고, 영어 changelog가 옛 identifier를 밝히며, 새 줄이 상태를 유지하는 commit 하나로 rename할 수 있다. 닫힌 항목은 body가 Cause를 밝히는 commit에서 보류(`[!]`)가 될 수 있다. Red: rename과 보류 range test가 실패했다. Green: checklist 이력과 checklist test가 통과한다.
- KR29: term 목록이 `card`, 하나 이상의 탭이 콘텐츠를 담는 `content card`(window sidebar와 대비), 그리고 프로젝트의 projects.json에 저장되는 카드 배치 하나인 `space`를 정의한다. `card`는 space 배치의 사각형으로서 content card 또는 window sidebar다. Red: card, content card, space term test가 실패했다. Green: 통과한다.
- KR28: 용어 목록이 core 설정 `sidebarOrder`가 담는 네 변의 순서인 `sidebar order`를 정의하고 `dock order`와 `edge order`를 거부하며, `sidebar instance`는 `left`, `right`, `top`, `bottom`, `cardId:side`를 나열한다.

- KR26: 기록 검사는 invalid pointer found on stack 같은 기술적 진단과 파일 위치의 사실을 허용하며 Markdown·주석 경계·날짜·수동 결함 주어·found-while 절의 발견 경위 검사는 유지한다. 소유 회귀 사례와 kit test 120개가 통과한다. 이 수정은 아직 공개 릴리스에 포함되지 않았다.

- KR25: CI는 push된 범위를 `make check-push`로 검사하므로 이전 이름 `records` 대신 Makefile의 검사를 실행하고, `sok-check commands`는 변수도 정하는 make 줄의 target을 검사한다.
- KR16: 범위 검사는 각 blob을 한 번 읽고 각 text를 한 번 parse하므로 시간이 절반으로 준다. peak memory는 macOS allocator의 large block cache이고 그대로다.
- KR15: 새 체크리스트 줄은 폐기된 identifier를 쓸 수 없고, renumber는 닫힌 항목처럼 열린 항목의 이전 identifier도 폐기한다.
- KR14: 닫힌 체크리스트 항목은 commit이 폐기하지 않는 한 상태를 유지한다. `soksak-records`는 working tree를 `HEAD`와 비교하고, `soksak-records --range <revision range>`는 각 commit을 첫 parent와 비교한다.
- KR24: `sok-check docs`는 tracked text 파일의 conflict marker 줄을 파일과 줄로 거부한다.
- KR23: term `stream`은 host가 element tree를 page가 `elements` stream을 구독하는 동안에만 모으고 document region의 request를 attach부터 close까지 모은다고 적는다. Red: stream term test가 실패했다. Green: 통과한다.
- KR22: 저장소는 `pnpm install`이 쓰는 `pnpm-lock.yaml`을 추적하므로 `make test`가 추적되지 않은 파일을 남기지 않는다. Red: `make test` 뒤에 `git status --porcelain`이 `?? pnpm-lock.yaml`을 출력했다. Green: 아무것도 출력하지 않는다.
- KR21: identifier 안의 거부어를 찾는 pattern은 main pattern처럼 단어의 정규식 문자를 escape하므로, `a.b entry`가 더는 `AxbEntry`에 맞지 않는다. Red: escape test가 실패했다. Green: 통과한다.
- KR20: version은 0.0.14이므로, tag v0.0.13이 release gate를 막던 KR17, KR18, KR19, KR14, KR15, KR16을 release run이 v0.0.14로 게시한다.
- KR19: term 목록은 종류 `element`의 exposure entry인 element entry와 그 이름인 element name을 정의하고, 둘은 `dom entry`와 `dom name`을 거부한다. term 검사는 자음과 `y`로 끝나는 거부어의 복수형을 `ies`로 맞추므로 `dom entries`도 거부한다. Red: term 검사 test와 term test가 실패했다. Green: 둘 다 통과한다.
- KR18: term 목록은 mygo host의 용어 language host library, framework adapter, framework port, native workbench, native view of the window, native view element, presentation notice, settled presentation, workbench call channel, language table, framework table, baseline host, other host, element tree를 정의한다. Red: term test가 실패했다. Green: 통과한다.
- KR17: record 검사는 Markdown 문서의 link 가운데 fragment가 대상 local Markdown 문서의 어느 heading도 가리키지 않는 link를 파일, 줄, 대상과 함께 보고하고, 그런 link의 대상이 없으면 그것도 보고한다. `@soksak/kit-records/records-check`는 anchor 규칙을 `headingAnchors`로, link reader를 `markdownLinks`로 export한다. Red: anchor test가 실패했다. Green: 통과한다.
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
