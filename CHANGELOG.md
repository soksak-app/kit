# Changelog

[한국어](CHANGELOG.ko.md)

## Unreleased

- KR33: The term list defines `party`, a set of two or more touching content cards of one space drawn with one outer outline, with an optional leader card, and `leader`, the one card of a party that carries the leader mark and the leader color, or none. Red: the party and leader term test failed. Green: it passes.


- KR34: The kit tests remove the git variables of a hook, `GIT_DIR`, `GIT_INDEX_FILE`, `GIT_WORK_TREE`, `GIT_OBJECT_DIRECTORY`, `GIT_COMMON_DIR` and `GIT_PREFIX`, before they run git, so each test repository is its own. Red: the foreign repository test failed. Green: `pnpm test` passes 140 of 140 tests with the variables set and without them.
- KR32: The commit checks read the body of a commit message and not its subject, so a subject alone excuses no removal of a checklist identifier. Red: the body-only commit and range tests failed. Green: the checklist, history, docs and check tests pass.
- KR31: The pre-commit hook runs the record checks only, and the commit-msg hook judges the checklist changes with the commit message through `check.js docs --message <file>`, so a rename or a held item is judged where its message exists. Red: the commit-time rename tests failed. Green: the checklist history and checklist tests pass.
- KR30: A checklist identifier that only the branch carries may be renamed in one commit whose body names the old and new identifiers, whose English changelog names the old identifier and whose new row keeps the state; a closed row may become held in a commit whose body states its Cause. Red: the rename and held range tests failed. Green: the checklist history and checklist tests pass.
- KR29: The term list defines `card`, a rectangle of the layout of a space that is a content card or a window sidebar, `content card`, a card whose one or more tabs hold content as opposed to a window sidebar, and `space`, one arrangement of the cards of a project saved in its projects.json. Red: the card, content card and space term test failed. Green: it passes.
- KR28: The term list defines `sidebar order`, the order of the four sides that the core setting `sidebarOrder` holds, which rejects `dock order` and `edge order`, and `sidebar instance` names `left`, `right`, `top`, `bottom` or `cardId:side`.

- KR26: Record validation accepts technical diagnostics such as invalid pointer found on stack and file-location facts, while retaining discovery-account checks at Markdown and comment boundaries, dates, passive defect subjects and found-while clauses. The owning regression cases and all 120 kit tests pass. This correction is not yet published.

- KR25: CI checks the pushed range with `make check-push`, so it runs the checks of the Makefile instead of the earlier name `records`, and `sok-check commands` checks the target of a make line that also sets a variable.
- KR16: The range check reads each blob once and parses each text once, so a range takes half the time; its peak memory is the large block cache of the macOS allocator and stays.
- KR15: A new checklist line takes no retired identifier, and a renumbering retires the old identifier of an open item as it does for a closed item.
- KR14: A closed checklist item keeps its state unless the commit retires it: `soksak-records` compares the working tree with `HEAD`, and `soksak-records --range <revision range>` judges each commit against its first parent.
- KR24: `sok-check docs` refuses each conflict marker line of a tracked text file with its file and line.
- KR23: The term `stream` states that the host collects the element tree only while a page subscribes to the `elements` stream and the requests of a document region from its attach to its close. Red: the stream term test failed. Green: it passes.
- KR22: The repository tracks the `pnpm-lock.yaml` that `pnpm install` writes, so `make test` leaves no untracked file. Red: `git status --porcelain` printed `?? pnpm-lock.yaml` after `make test`. Green: it prints nothing.
- KR21: The pattern that finds a rejected phrase inside an identifier escapes the regular expression characters of its words, as the main pattern does, so `a.b entry` no longer matches `AxbEntry`. Red: the escape test failed. Green: it passes.
- KR20: The version is 0.0.14, so the release run publishes KR17, KR18, KR19, KR14, KR15 and KR16 as v0.0.14, where the tag v0.0.13 held the release gate.
- KR19: The term list defines element entry, an exposure entry of the kind `element`, and element name, its name, which reject `dom entry` and `dom name`; the term check matches the plural of a rejected phrase that ends in a consonant and `y` with `ies`, so `dom entries` is rejected as well. Red: the term check test and the term test failed. Green: both pass.
- KR18: The term list defines the terms of the mygo host: language host library, framework adapter, framework port, native workbench, native view of the window, native view element, presentation notice, settled presentation, workbench call channel, language table, framework table, baseline host, other host and element tree. Red: the term test failed. Green: it passes.
- KR17: The record check reports each link of a Markdown document whose fragment names no heading of the local Markdown document it targets, with the file, the line and the target, and each such link whose target does not exist; `@soksak/kit-records/records-check` exports the anchor rule as `headingAnchors` and the link reader as `markdownLinks`. Red: the anchor tests failed. Green: they pass.
- KR13: The executable is `sok-check`, and `sok-check commands` checks the names of executables and make targets. Red: `test/commands.test.mjs` failed. Green: it passes.
- KR12: The checks are `soksak-check docs` and `soksak-check events`, the declaration file is `event-sources.json`, and `docs` reports each untracked file. Red: `test/check.test.mjs` failed. Green: it passes.
- KR11: The record check reports a citation of a log of the temporary folder. Red: the new test of `test/records.test.mjs` failed. Green: it passes.
- KR10: The repository is `soksak-app/kit`, and the package is `@soksak/kit`.
- KR9: The record check reports a citation of a log of the local build folder. Red: the new test of `test/records.test.mjs` failed. Green: it passes.
- KR8: A check loads only its own module, and the kit holds no installation step. Red: the new test of `test/check.test.mjs` failed. Green: it passes.
- KR7-1: The release gate job sets up pnpm.
- KR7: The kit is the checks kit with one executable, `soksak-check`, and it holds the census check. Red: `test/check.test.mjs` failed. Green: it passes.
- KR6: The rejected synonym of `drawing` is `presenting state`, so records may state that the host presents a frame, and the version is 0.0.6. Red: the term check test failed. Green: it passes.
- KR5: The term list defines `presentation mode` and `lease`, how the host presents the image of an image region, and the version is 0.0.5. Red: the term test failed. Green: it passes.
- KR4: The term list defines `drawing`, whether the supplier of an image region draws its raster, and the version is 0.0.4. Red: the drawing term test failed. Green: it passes.
- KR3: The term `kit` names a tool that several repositories run in their checks or releases, without the static library of KR2, and the checklist reader accepts a closed item with `Closed:` and a nonempty reason; the version is 0.0.3. Red: both tests failed. Green: both pass.
- KR2: The term list defines `kit` as a repository whose release is a build input that several repositories share, and the version is 0.0.2. Red: `the kit term names a build input that the application does not install` failed. Green: it passes.
- KR1-1: The pre-push hook checks every commit of the pushed ref on the first push to a remote without `main`, where it passed `origin/main..<sha>`, which git refuses. Red: `the first push to a remote without main checks every commit of the pushed ref` failed with `RANGE=origin/main..<sha>`. Green: it passes.
- KR1: The records kit holds the commit message check, the record check, the release gate, the checklist reader and the term list, with their tests, and its release workflow releases the `npm pack` file of the version that `package.json` declares. Red: `the release holds the checks, the checklist reader and the term list, and each command is in it` and `each export names a file of the release` failed on a `package.json` without `bin`, `exports` and `files`. Green: both pass, and `make test` and `make check` pass.
