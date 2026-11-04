# Tests and releases the records kit (docs/features.md). The kit checks its own records with its own source.
.PHONY: test check push-check release hooks

# Each test reports its result and its elapsed time, and each test has a limit of 60 seconds.
test:
	pnpm test

check:
	node records-check.js

# The checks that a push needs: make test, make check, and the commit messages and the checklist history of the pushed range.
# RANGE holds the commits of the pushed refs; the pre-push hook sets it, and it defaults to origin/main..HEAD.
push-check: test check
	node commits-check.js "$(or $(RANGE),origin/main..HEAD)"
	node records-check.js --range "$(or $(RANGE),origin/main..HEAD)"

# The release of the kit: the npm pack file of this repository, which the other repositories pin by its release URL.
release:
	@test -n "$(OUT)" || { echo "make release OUT=<folder>" >&2; exit 2; }
	@mkdir -p $(OUT)
	npm pack --silent --pack-destination $(OUT)

# Sets this repository to use .githooks, which checks commit messages and records at commit time.
hooks:
	@git config core.hooksPath .githooks
