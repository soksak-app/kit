# 기능

[English](features.md)

- [~] KR1 — P0, core F355-3-1 연결: records kit 0.0.1은 commit message 검사, record 검사, release gate, checklist reader, term 목록과 그 test를 담고, 그것을 GitHub release의 `npm pack` 파일로 release한다. 남은 것: release run.
  - [o] KR1-1 — P0: pre-push hook은 `main`이 없는 remote로의 첫 push에서 push한 ref의 모든 commit을 검사한다. 입력: hook은 `origin/main..<sha>`를 넘겼고, `origin/main`이 없으면 git이 그것을 거부하므로 repository의 첫 push가 실패했다. 기대: remote에 `main`이 없으면 범위는 `<sha>`이다. 결과: `the first push to a remote without main checks every commit of the pushed ref`는 실패했고(Red) 통과한다(Green).
