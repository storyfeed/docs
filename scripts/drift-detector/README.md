# Docs/core drift detector

Run from this checkout with Node 22+, PHP 8.1+ CLI, and Git. No packages,
network, Laravel boot, or executable config loading are involved.

```sh
npm run drift -- --docs-ref main
npm run drift -- --core /path/to/storyfeed --json
npm run test:drift
```

`--core` defaults to `/Users/jasper/Dev/projects/storyfeed`.
`--docs-root` selects another docs checkout. Without `--docs-ref`, the script
reads its own checkout's working `docs/` directory; with a ref it reads committed
files using `git show` without checking out or modifying that branch.
`PHP_BINARY` selects the PHP executable; `STORYFEED_CORE` selects core for tests.
On Jasper's machine, Homebrew PHP has a broken library dependency, so use:

```sh
export PHP_BINARY='/Users/jasper/Library/Application Support/Herd/bin/php'
npm run drift -- --docs-ref main
npm run test:drift
```

Exit codes: **1** for STALE, **0** when only MISSING/UNRESOLVED remain, **2** for
input/tool failures. All buckets print counts and complete lists. JSON has the
same records, including file, 1-based line, reason and optional replacement.

The PHP helper tokenizes `src/**/*.php` and `config/storyfeed.php` without
executing them. It indexes class/interface/trait/enum names, declared public
methods, public properties (including constructor promotion), enum built-ins,
and literal nested config keys. Comments/private methods are not surface.
Inherited, trait and magic dispatch are explicitly open surfaces: an absent
member there is UNRESOLVED, not STALE. A method on a closed, known class can be
proven absent. Unknown `->` receivers are never evidence of a removed member.

Markdown extraction covers PHP, Blade and unlabeled fences, plus inline code;
other fences, prose, PHP comments and string contents are not class references.
Literal `config('storyfeed.…')` calls are checked separately. Known bare config
keys count as mentions; absent dotted strings are ambiguous unless explicitly
passed to `config()`. Generated `dist/`, `cache/`, `node_modules/`, Git metadata,
and symlinks are excluded. Aliases and local class declarations beat short-name
guesses. Conflicting aliases and grouped imports stay unresolved.

Removed class identities come from deleted PSR-4 `src/` paths in core's HEAD
ancestry, with rename detection disabled (so `Support\\Noun` is retained).
Current classes always win. Bare `toFeedLink()` is the one explicit migration
rule: it requires a deleted method declaration in history, a mention in
Unreleased, absence from today's methods, and no conflicting local declaration.
Declarations are only treated as that contract when `implements Feedable` binds
to the core interface. Static calls use their class binding, never this rule.
The advisory rename map is `toFeedLink → feedMedia`, `FeedLink → FeedMedia`,
`Noun → FeedNoun`, `Noun::phrase → FeedNoun::of / FeedNoun::trans`; replacement
signatures are not asserted interchangeable. These rules are covered by tests.

MISSING starts with live public identifiers mentioned in Unreleased, then adds
unmentioned classes as a backstop. Removed changelog identifiers are excluded.
This deliberately reports implementation classes too. Mention detection is
lexical, not a claim that an API has adequate documentation.

Limits favor recall loss over incorrect stale failures: no PHP type inference,
framework autoload/reflection, inherited member expansion, grouped import
expansion, arbitrary config expressions, or general removal-prose NLP. Markdown
snippets are not full PHP programs; multiline strings/heredocs and complex
trait adaptations are not supported. Core history must be available locally;
shallow history reduces recognition of retired short names. Core's current
working source is used, with HEAD recorded for provenance (uncommitted core
changes are therefore included). Inputs are never fetched.

Tests use the real pre-correction main revision `244a79e` as a stable regression,
read `contract-refresh` if available, and inject removed APIs only into in-memory
or temporary pages. See [verification.md](verification.md) for the dated results,
full stale/missing lists, and every unresolved candidate with its suppression
reason. UNRESOLVED is uncertainty, not a list of proven false positives.
