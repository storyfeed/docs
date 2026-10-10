import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyze, surface, documents, defaultCore } from './index.mjs';
const here = dirname(fileURLToPath(import.meta.url)), root = resolve(here, '../..');
const core = process.env.STORYFEED_CORE || defaultCore;
const api = surface(core);
// `FeedLink` is a live class again — the name was taken back on 2026-09-08 for a
// different value object — and the Unreleased section has long since moved past
// the `toFeedLink()` removal. The retirement fixture pins that bygone moment so
// the regressions keep testing the detector rather than today's core surface.
const { 'Storyfeed\\FeedLink': _live, ...withoutFeedLink } = api.classes;
const retired = { ...api, classes: withoutFeedLink, removed: [...api.removed, 'Storyfeed\\FeedLink'], changelog: api.changelog + '\n- `Feedable::toFeedLink()` was removed.\n' };
const scan = (text, a = api) => analyze(a, [{file:'docs/test.md', text}]);
const php = code => '```php\n' + code + '\n```';

test('real main regression, pinned before the correction: all four pages and eight removed-method references', () => {
  const r = analyze(retired, documents(root, '244a79e'));
  assert.equal(r.stale.filter(s => s.identifier === 'toFeedLink').length, 8);
  assert.ok(r.stale.some(s => s.identifier.includes('FeedLink')));
  assert.equal(new Set(r.stale.filter(s => /FeedLink/.test(s.identifier)).map(s => s.file)).size, 4);
  // Everything else stale on that ref is a later rename the detector also catches.
  for (const id of ['Collectable', 'PendingStory']) assert.ok(r.stale.some(s => s.identifier.includes(id)), id);
});
test('contract-refresh committed docs no longer teach either removed identifier', t => {
  if (spawnSync('git', ['-C', root, 'rev-parse', '--verify', 'contract-refresh'], {stdio:'ignore'}).status !== 0) { t.skip('contract-refresh unavailable; pinned main regression still runs'); return; }
  const r = analyze(retired, documents(root, 'contract-refresh'));
  assert.equal(r.stale.filter(s => /(?:toFeedLink|FeedLink)/.test(s.identifier)).length, 0);
});
test('removed Noun::phrase and Support\\Noun in a synthetic page; no docs edits', () => {
  const r = scan('`Noun::phrase(3)` and `Support\\Noun`');
  assert.deepEqual(r.stale.map(s => s.identifier), ['Noun::phrase', 'Support\\Noun']);
  assert.ok(r.stale.every(s => s.suggestion));
});
test('current FeedNoun, feedMedia, FeedContext and FeedImage survive', () => {
  const r = scan(php('use Storyfeed\\FeedNoun;\nuse Storyfeed\\FeedContext;\nuse Storyfeed\\FeedImage;\nuse Storyfeed\\Contracts\\Feedable;\nFeedNoun::trans("noun"); FeedImage::make("url"); Feedable::feedMedia($context);'));
  assert.equal(r.stale.length, 0);
  assert.equal(r.unresolved.filter(s => /FeedNoun|feedMedia|FeedContext|FeedImage/.test(s.identifier)).length, 0);
});
test('unknown names and unknown method receivers always remain unresolved', () => {
  const r = scan(php('Mystery::oops(); $thing->notInCore(); $thing->toFeedLink(); $thing->unknownProperty;'));
  assert.equal(r.stale.length, 0);
  for (const id of ['Mystery::oops', 'notInCore', 'toFeedLink', '->unknownProperty']) assert.ok(r.unresolved.some(s => s.identifier === id));
});
test('framework, inherited, trait, facade and constant members are not stale', () => {
  const r = scan(php('use Storyfeed\\Models\\Activity;\nuse Storyfeed\\Facades\\Storyfeed;\nActivity::where("id", 1); Storyfeed::feed(); FeedImage::SOME_CONSTANT; Model::find(1);'));
  assert.equal(r.stale.length, 0);
  assert.ok(r.unresolved.some(s => s.identifier === 'Activity::where'));
});
test('application imports and declarations shadow retired short names', () => {
  for (const code of ['use App\\FeedLink; FeedLink::make();', 'class FeedLink {} FeedLink::make();', 'class Thing { public static function toFeedLink() {} }', 'function toFeedLink() {} toFeedLink();', 'use App\\Noun; Noun::phrase(2);']) assert.equal(scan(php(code), retired).stale.length, 0, code);
});
// A fixed closed surface: FeedImage now uses Conditionable, so unknown
// methods on its live surface correctly remain unresolved (traits are open).
const closedApi = { ...api, classes: { ...api.classes,
  'Storyfeed\\ClosedExample': { methods: ['make'], properties: [], open: false },
} };
test('explicit missing package imports and closed-class methods are stale', () => {
  const r = scan(php('use Storyfeed\\DefinitelyMissing; ClosedExample::notHere();'), closedApi);
  assert.deepEqual(r.stale.map(s => s.identifier), ['Storyfeed\\DefinitelyMissing', 'ClosedExample::notHere']);
});
test('aliased core imports resolve', () => {
  const r = scan(php('use Storyfeed\\ClosedExample as Picture; Picture::make("url"); Picture::notHere();'), closedApi);
  assert.deepEqual(r.stale.map(s => s.identifier), ['Picture::notHere']);
});
test('grouped imports are unresolved rather than falsely stale namespace prefixes', () => {
  const r = scan(php('use Storyfeed\\{FeedImage, FeedContext};'));
  assert.equal(r.stale.length, 0); assert.equal(r.unresolved.length, 1);
});
test('only explicit absent config lookups are stale; route/view/translation names are ambiguous', () => {
  const r = scan(php('config("storyfeed.grouping.children_limit"); config("storyfeed.grouping.no_such_key"); route("storyfeed.example");') + '\n`storyfeed.party`');
  assert.deepEqual(r.stale.map(s => s.identifier), ['storyfeed.grouping.no_such_key']);
  assert.ok(r.unresolved.some(s => s.identifier === 'storyfeed.party'));
});
test('comments, prose and non-PHP fences do not introduce stale code; line numbers survive', () => {
  const r = scan('FeedLink in plain prose.\n```js\nFeedLink::make()\n```\n```php\n// FeedLink::make()\n```\n`FeedLink`', retired);
  assert.deepEqual(r.stale.map(s => s.line), [8]);
});
test('tokenizer does not mistake comments or private members for public API and captures promoted properties', () => {
  const files = {'src/Example.php': '<?php namespace Storyfeed; /* class Fake { public function nope() {} } */ final class Example { public function __construct(public string $name, private int $secret) {} public function yes() {} protected function hidden() {} private $private; public $visible; }', 'config/storyfeed.php': "<?php return ['outer' => ['enabled' => env('FLAG', true), 'list' => []], 'other' => null];"};
  const s = JSON.parse(execFileSync(process.env.PHP_BINARY || 'php', [resolve(here,'surface.php')], {input:JSON.stringify(files),encoding:'utf8'}));
  assert.deepEqual(Object.keys(s.classes), ['Storyfeed\\Example']);
  assert.deepEqual(s.classes['Storyfeed\\Example'].methods, ['__construct', 'yes']);
  assert.deepEqual(s.classes['Storyfeed\\Example'].properties, ['name', 'visible']);
  assert.deepEqual(s.config, ['outer','outer.enabled','outer.list','other']);
});
test('filesystem scan excludes generated trees and symlinks', () => {
  const tmp = mkdtempSync(resolve(tmpdir(), 'drift-docs-'));
  try {
    for (const dir of ['docs', 'docs/.vitepress/dist', 'docs/cache', 'docs/node_modules']) { mkdirSync(resolve(tmp,dir),{recursive:true}); writeFileSync(resolve(tmp,dir,'page.md'), '`FeedLink`'); }
    assert.deepEqual(documents(tmp).map(d => d.file), ['docs/page.md']);
  } finally { rmSync(tmp,{recursive:true,force:true}); }
});
for (const [kind, declaration, methods, properties] of [
  ['backed', "enum Period: string { case Week = 'week'; case Month = 'month'; }", ['cases', 'from', 'tryFrom'], ['name', 'value', 'Week', 'Month']],
  ['pure', 'enum Cadence { case Daily; case Weekly; }', ['cases'], ['name', 'Daily', 'Weekly']],
]) {
  test(`enum tokenizer preserves ${kind} cases and built-in members through drift analysis`, () => {
    const name = kind === 'backed' ? 'Period' : 'Cadence';
    const files = { [`src/${name}.php`]: `<?php namespace Storyfeed; ${declaration}` };
    const s = JSON.parse(execFileSync(process.env.PHP_BINARY || 'php', [resolve(here, 'surface.php')], { input: JSON.stringify(files), encoding: 'utf8' }));
    assert.deepEqual(Object.keys(s.classes), [`Storyfeed\\${name}`]);
    assert.deepEqual(s.classes[`Storyfeed\\${name}`], { methods, properties, open: false, parents: [], signatures: [] });
    const enumApi = { ...api, classes: s.classes, removed: [] };
    const cases = properties.filter(member => !['name', 'value'].includes(member));
    const code = `use Storyfeed\\${name};\n`
      + methods.map(member => `${name}::${member}(${member === 'cases' ? '' : "'week'"});`).join('\n')
      + '\n' + cases.map(member => `${name}::${member};`).join('\n')
      + `\n${name}::${cases[0]}->name;`
      + (kind === 'backed' ? `\n${name}::${cases[0]}->value;` : '');
    const r = scan(php(code), enumApi);
    assert.deepEqual(r.stale, []);
    assert.deepEqual(r.unresolved, []);
    // A closed enum must still reject an absent case; recognizing cases must
    // not turn arbitrary PascalCase members into accepted API.
    assert.deepEqual(scan(php(`${name}::Fortnight;`), enumApi).stale.map(s => s.identifier), [`${name}::Fortnight`]);
  });
}
test('missing is informational, prioritizes Unreleased, and excludes removed classes', () => {
  // Pin the changelog evidence: a release can remove today's Unreleased
  // section without changing the detector's prioritization contract.
  const r = scan('', { ...api, changelog: '- Added `FeedContext`.\n' });
  assert.equal(r.stale.length, 0); assert.equal(r.missing[0].source, 'Unreleased');
  assert.equal(r.missing.find(s => s.identifier === 'Storyfeed\\FeedContext').source, 'Unreleased');
  assert.ok(!r.missing.some(s => s.identifier === 'Storyfeed\\Support\\Noun'));
  const released = scan('', { ...api, changelog: '' });
  assert.ok(released.missing.every(s => s.source === 'public class backstop'));
  assert.ok(released.missing.some(s => s.identifier === 'Storyfeed\\FeedContext'));
});
test('CLI exits 1 on stale, 0 on only missing/unresolved, 2 on operational errors', () => {
  const tmp = mkdtempSync(resolve(tmpdir(), 'drift-cli-'));
  try {
    mkdirSync(resolve(tmp,'docs')); writeFileSync(resolve(tmp,'docs/test.md'),'`Noun::phrase()`');
    const run = args => spawnSync(process.execPath, [resolve(here,'index.mjs'),'--core',core,...args],{encoding:'utf8'});
    assert.equal(run(['--docs-root',tmp,'--json']).status,1);
    writeFileSync(resolve(tmp,'docs/test.md'),'`Unknown::method()`');
    const clean = run(['--docs-root',tmp,'--json']); assert.equal(clean.status,0); assert.ok(JSON.parse(clean.stdout).missing.length);
    assert.equal(run(['--docs-root',resolve(tmp,'absent')]).status,2);
  } finally { rmSync(tmp,{recursive:true,force:true}); }
});
test('conflicting page aliases and application grouped imports stay unresolved', () => {
  for (const text of [php('use App\\FeedLink; FeedLink::make();') + '\n' + php('use Storyfeed\\FeedLink; FeedLink::make();'), php('use App\\{Noun, FeedLink}; Noun::phrase(); FeedLink::make();')]) {
    const r = scan(text, retired);
    assert.ok(!r.stale.some(s => ['FeedLink::make', 'Noun::phrase'].includes(s.identifier)));
  }
});
test('block comments and string contents do not teach PHP class references', () => {
  const r = scan(php('/*\nStoryfeed\\NotReal::missing();\n*/\necho "Storyfeed\\NotReal"; // FeedLink'));
  assert.equal(r.stale.length, 0);
});
test('application static removed-method homonyms and namespace prefixes are unresolved', () => {
  const r = scan(php('use App\\Thing; Thing::toFeedLink();') + '\n`Storyfeed\\Support`', retired);
  assert.equal(r.stale.length, 0);
  assert.ok(r.unresolved.some(s => s.identifier === 'Thing::toFeedLink'));
});

// Fence metadata must not hide PHP code or turn memo text into API references.
test('PHP fences with memos, tabs and highlights retain drift detection', () => {
  const code = 'use Storyfeed\\DefinitelyMissing;';
  const plain = scan(php(code));
  const decorated = scan('```php {1} [Example] memo="Storyfeed\\NotAnImport"\n' + code + '\n```');
  assert.deepEqual(decorated, plain);
  assert.deepEqual(decorated.stale.map(s => s.identifier), ['Storyfeed\\DefinitelyMissing']);
});

test('Storyfeed UI classes are separate-package references while missing core classes stay stale', () => {
  const r = scan(php('use Storyfeed\\Ui\\Support\\BodyComponents;\nBodyComponents::class;\nuse Storyfeed\\MissingCoreClass;'));
  assert.ok(r.unresolved.some(f => f.identifier.includes('BodyComponents') && f.reason.includes('separate')));
  assert.ok(r.stale.some(f => f.identifier.includes('MissingCoreClass')));
  assert.ok(!r.stale.some(f => f.identifier.includes('BodyComponents')));
});
test('real main regression, pinned before the correction: methods removed from a fluent chain', () => {
  const r = analyze(api, documents(root, 'c7eba8f'));
  const ids = r.stale.map(s => `${s.file}:${s.identifier}`);
  for (const id of ['docs/basics/feed-media.md:FeedMedia::modal', 'docs/basics/feed-media.md:Image::withPreview', 'docs/basics/activity-content.md:Image::withPreview', 'docs/reference/feedable.md:FeedMedia::attributes', 'docs/reference/feedable.md:FeedMedia::make(modal:)', 'docs/reference/feedable.md:FeedMedia::make(attributes:)']) assert.ok(ids.includes(id), id);
});
test('a chain is followed through static and self returns, inherited methods and traits', () => {
  const ok = scan(php('use Storyfeed\\FeedMedia;\nuse Storyfeed\\FeedLink;\nuse Storyfeed\\Body\\Image;\nuse Storyfeed\\Body\\Table;\nuse Storyfeed\\Facades\\Storyfeed;\nFeedMedia::make(url: $u)\n    ->link(FeedLink::to($u)->modal()->attributes(["a" => 1]))\n    ->when($x, fn ($m) => $m)\n    ->preview($t);\nImage::make(image: $u, caption: "c")->alt("a")->fullHeight()->tap(fn () => null);\nTable::make(headers: [], rows: [])->footer([]);\nStoryfeed::activity()->by($u)->nothingKnown();\nFeedMedia::make()->media()->anything();'));
  assert.deepEqual(ok.stale, []);
  const bad = scan(php('use Storyfeed\\FeedMedia;\nuse Storyfeed\\Body\\Image;\nuse Storyfeed\\Body\\Table;\nImage::make()\n    ->caption("c")\n    ->withIcon();\nTable::make(columns: []);\nFeedMedia::make()->url($u)->modal();'));
  assert.deepEqual(bad.stale.map(s => `${s.line}:${s.identifier}`), ['7:Image::withIcon', '8:Table::make(columns:)', '9:FeedMedia::modal']);
});
