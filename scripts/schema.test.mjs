// The schema extractor (scripts/schema.mjs) on migrations written the way
// core writes them. These run without core; the drift guard runs the real
// migrations wherever core is present.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { extract, renderTable, renderPage } from './schema.mjs'

const create = `<?php
return new class extends Migration {
    public function up(): void
    {
        // An apostrophe in a comment isn't a string.
        Schema::create(config('storyfeed.tables.widgets', 'feed_widgets'), function (Blueprint $table) {
            $table->id();
            $table->ulid('uid')->unique();
            $table->nullableMorphs('actor');
            $table->string('kind', 20)->default('plain');
            $table->timestamps(6);
            $table->index(['kind', 'id'], 'widgets_kind_index');
        });
    }
};`

const add = `<?php
return new class extends Migration {
    public function up(): void
    {
        $table = config('storyfeed.tables.widgets', 'feed_widgets');

        foreach (['origin', 'result'] as $role) {
            if (! Schema::hasColumn($table, $role.'_type')) {
                Schema::table($table, function (Blueprint $blueprint) use ($role) {
                    $blueprint->foreignId('cached_'.$role.'_id')->nullable();
                });
            }
        }

        Schema::table($table, function (Blueprint $blueprint) {
            $blueprint->string('kind', 40)->nullable()->change();
        });
    }
};`

test('replays creates, loops and changes into one table', () => {
  const t = extract([['create.php.stub', create], ['add.php.stub', add]]).get('feed_widgets')
  assert.deepEqual(t.columns.map(c => c.name), ['id', 'uid', 'actor_type', 'actor_id', 'kind', 'created_at', 'updated_at', 'cached_origin_id', 'cached_result_id'])
  assert.deepEqual(t.columns.find(c => c.name === 'kind'), { name: 'kind', nullable: true, default: undefined, type: 'string(40)' })
  assert.equal(t.columns.find(c => c.name === 'created_at').type, 'timestamp(6)')
  assert.deepEqual(t.indexes.map(i => `${i.kind}:${i.columns}`), ['primary:id', 'unique:uid', 'index:actor_type,actor_id', 'index:kind,id'])
})

test('an unknown column type fails instead of disappearing', () => {
  const unknown = create.replace("$table->id();", "$table->id();\n            $table->geometry('area');")
  assert.throws(() => extract([['create.php.stub', unknown]]), /unknown Blueprint method geometry\(\)/)
})

test('a column without a purpose, or a purpose without a column, fails', () => {
  const t = extract([['create.php.stub', create]]).get('feed_widgets')
  assert.throws(() => renderTable('feed_widgets', t, { feed_widgets: {} }), /feed_widgets\.id has no purpose/)
  const all = Object.fromEntries(t.columns.map(c => [c.name, 'x']))
  assert.throws(() => renderTable('feed_widgets', t, { feed_widgets: { ...all, gone: 'x' } }), /describes feed_widgets\.gone/)
})

test('every table needs a block on the page', () => {
  const tables = extract([['create.php.stub', create]])
  assert.throws(() => renderPage('no blocks here', tables, {}), /no <!-- schema:feed_widgets --> block/)
})
