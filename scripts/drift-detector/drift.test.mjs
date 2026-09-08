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
const scan = text => analyze(api, [{file:'docs/test.md', text}]);
const php = code => '```php\n' + code + '\n```';

test('real main regression, pinned before the correction: all four pages and eight removed-method references', () => {
  const r = analyze(api, documents(root, '244a79e'));
  assert.equal(r.stale.filter(s => s.identifier === 'toFeedLink').length, 8);
  assert.ok(r.stale.some(s => s.identifier.includes('FeedLink')));
  assert.equal(new Set(r.stale.map(s => s.file)).size, 4);
  assert.ok(r.stale.every(s => /FeedLink/.test(s.identifier)));
});
test('contract-refresh committed docs no longer teach either removed identifier', t => {
  if (spawnSync('git', ['-C', root, 'rev-parse', '--verify', 'contract-refresh'], {stdio:'ignore'}).status !== 0) { t.skip('contract-refresh unavailable; pinned main regression still runs'); return; }
  const r = analyze(api, documents(root, 'contract-refresh'));
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
  for (const code of ['use App\\FeedLink; FeedLink::make();', 'class FeedLink {} FeedLink::make();', 'class Thing { public static function toFeedLink() {} }', 'function toFeedLink() {} toFeedLink();', 'use App\\Noun; Noun::phrase(2);']) assert.equal(scan(php(code)).stale.length, 0, code);
});
test('explicit missing package imports and closed-class methods are stale', () => {
  const r = scan(php('use Storyfeed\\DefinitelyMissing; FeedImage::notHere();'));
  assert.deepEqual(r.stale.map(s => s.identifier), ['Storyfeed\\DefinitelyMissing', 'FeedImage::notHere']);
});
test('aliased core imports resolve', () => {
  const r = scan(php('use Storyfeed\\FeedImage as Picture; Picture::make("url"); Picture::notHere();'));
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
  const r = scan('FeedLink in plain prose.\n```js\nFeedLink::make()\n```\n```php\n// FeedLink::make()\n```\n`FeedLink`');
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
test('missing is informational, prioritizes Unreleased, and excludes removed classes', () => {
  const r = scan('');
  assert.equal(r.stale.length, 0); assert.equal(r.missing[0].source, 'Unreleased');
  assert.ok(r.missing.some(s => s.identifier === 'Storyfeed\\FeedContext'));
  assert.ok(!r.missing.some(s => s.identifier === 'Storyfeed\\FeedLink'));
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
    const r = scan(text);
    assert.ok(!r.stale.some(s => ['FeedLink::make', 'Noun::phrase'].includes(s.identifier)));
  }
});
test('block comments and string contents do not teach PHP class references', () => {
  const r = scan(php('/*\nStoryfeed\\NotReal::missing();\n*/\necho "Storyfeed\\NotReal"; // FeedLink'));
  assert.equal(r.stale.length, 0);
});
test('application static removed-method homonyms and namespace prefixes are unresolved', () => {
  const r = scan(php('use App\\Thing; Thing::toFeedLink();') + '\n`Storyfeed\\Support`');
  assert.equal(r.stale.length, 0);
  assert.ok(r.unresolved.some(s => s.identifier === 'Thing::toFeedLink'));
});
