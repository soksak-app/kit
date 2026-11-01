# 기능

[English](features.md)

- [o] KR2 — P0, core F355-4-1-1 연결: term 목록은 `kit`을 정의한다. 입력: 명세는 kit을 공유 build 입력의 repository로 부르지만 `terms.json`에는 `kit` 항목이 없었다. 기대: `kit` 항목은 release가 여러 repository가 공유하는 build 입력, 곧 application이 설치하지 않는 도구나 static library인 repository로 정의하고 `kit package`를 거부하며, release `0.0.2`가 그것을 담는다. 결과: `the kit term names a build input that the application does not install`는 실패했고(Red) 통과한다(Green).
- [o] KR1 — P0, core F355-3-1 연결: records kit 0.0.1은 commit message 검사, record 검사, release gate, checklist reader, term 목록과 그 test를 담고, 그것을 GitHub release의 `npm pack` 파일로 release한다. release run이 `soksak-kit-records-0.0.1.tgz`와 함께 `v0.0.1`을 게시했다.
  - [o] KR1-1 — P0: pre-push hook은 `main`이 없는 remote로의 첫 push에서 push한 ref의 모든 commit을 검사한다. 입력: hook은 `origin/main..<sha>`를 넘겼고, `origin/main`이 없으면 git이 그것을 거부하므로 repository의 첫 push가 실패했다. 기대: remote에 `main`이 없으면 범위는 `<sha>`이다. 결과: `the first push to a remote without main checks every commit of the pushed ref`는 실패했고(Red) 통과한다(Green).
