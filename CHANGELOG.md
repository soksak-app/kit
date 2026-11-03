# Changelog

[한국어](CHANGELOG.ko.md)

## Unreleased

- KR10: The version is 0.0.7, so the release run publishes KR7, KR8 and KR9 as v0.0.7, where the tag v0.0.6 held the release gate.
- KR9: The term list defines element entry, an exposure entry of the kind `element`, and element name, its name, which reject `dom entry` and `dom name`; the term check matches the plural of a rejected phrase that ends in a consonant and `y` with `ies`, so `dom entries` is rejected as well. Red: the term check test and the term test failed. Green: both pass.
- KR8: The term list defines the terms of the mygo host: language host library, framework adapter, framework port, native workbench, native view of the window, native view element, presentation notice, settled presentation, workbench call channel, language table, framework table, baseline host, other host and element tree. Red: the term test failed. Green: it passes.
- KR7: The record check reports each link of a Markdown document whose fragment names no heading of the local Markdown document it targets, with the file, the line and the target, and each such link whose target does not exist; `@soksak/kit-records/records-check` exports the anchor rule as `headingAnchors` and the link reader as `markdownLinks`. Red: the anchor tests failed. Green: they pass.
- KR6: The rejected synonym of `drawing` is `presenting state`, so records may state that the host presents a frame, and the version is 0.0.6. Red: the term check test failed. Green: it passes.
- KR5: The term list defines `presentation mode` and `lease`, how the host presents the image of an image region, and the version is 0.0.5. Red: the term test failed. Green: it passes.
- KR4: The term list defines `drawing`, whether the supplier of an image region draws its raster, and the version is 0.0.4. Red: the drawing term test failed. Green: it passes.
- KR3: The term `kit` names a tool that several repositories run in their checks or releases, without the static library of KR2, and the checklist reader accepts a closed item with `Closed:` and a nonempty reason; the version is 0.0.3. Red: both tests failed. Green: both pass.
- KR2: The term list defines `kit` as a repository whose release is a build input that several repositories share, and the version is 0.0.2. Red: `the kit term names a build input that the application does not install` failed. Green: it passes.
- KR1-1: The pre-push hook checks every commit of the pushed ref on the first push to a remote without `main`, where it passed `origin/main..<sha>`, which git refuses. Red: `the first push to a remote without main checks every commit of the pushed ref` failed with `RANGE=origin/main..<sha>`. Green: it passes.
- KR1: The records kit holds the commit message check, the record check, the release gate, the checklist reader and the term list, with their tests, and its release workflow releases the `npm pack` file of the version that `package.json` declares. Red: `the release holds the checks, the checklist reader and the term list, and each command is in it` and `each export names a file of the release` failed on a `package.json` without `bin`, `exports` and `files`. Green: both pass, and `make test` and `make check` pass.
