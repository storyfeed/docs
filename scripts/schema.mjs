/**
 * Reference › Schema, generated from core's migrations.
 *
 * Reads the migration stubs in the order `StoryfeedServiceProvider` registers
 * them, replays their Blueprint calls into a model of the tables, and renders
 * that model into `docs/reference/schema.md` between `<!-- schema:… -->`
 * markers: the ER diagram, and one column table and one index table per table.
 * Column purposes live in `scripts/schema-notes.json`.
 *
 * It parses only the vocabulary core's migrations use. Anything else — a new
 * column type, a loop over something that isn't a literal list, a table it
 * cannot name — THROWS rather than guessing, so a migration this script does
 * not understand fails the build instead of shipping a page that is quietly
 * missing a column. So does a column without a purpose, or a purpose for a
 * column that no longer exists.
 *
 *   node scripts/schema.mjs           write the page (needs core)
 *   node scripts/schema.mjs --check   exit 1 when the page is stale
 *
 * The drift guard runs `--check` wherever core is present.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const page = resolve(here, '../docs/reference/schema.md');
const notesFile = resolve(here, 'schema-notes.json');

export const ROLES = ['actor', 'object', 'target', 'context', 'origin', 'result', 'instrument'];

/* ------------------------------------------------------------------ parsing */

/** The text between the bracket at `open` and its partner, honouring strings. */
function balanced(text, open) {
  const pairs = { '(': ')', '[': ']', '{': '}' };
  const close = pairs[text[open]];
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    const c = text[i];
    if (c === "'" || c === '"') {
      i++;
      while (i < text.length && text[i] !== c) { if (text[i] === '\\') i++; i++; }
      continue;
    }
    if (c === text[open]) depth++;
    else if (c === close && --depth === 0) return { inner: text.slice(open + 1, i), end: i };
  }
  throw new Error(`schema: unbalanced ${text[open]} at ${open}`);
}

/** Split on top-level commas. */
function splitArgs(text) {
  const out = [];
  let depth = 0, start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "'" || c === '"') {
      i++;
      while (i < text.length && text[i] !== c) { if (text[i] === '\\') i++; i++; }
    } else if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth--;
    else if (c === ',' && depth === 0) { out.push(text.slice(start, i)); start = i + 1; }
  }
  out.push(text.slice(start));
  return out.map(s => s.trim()).filter(s => s !== '');
}

/** Fold `'a'.'b'` into `'ab'`, after loop variables have become literals. */
const fold = text => {
  let prev;
  do { prev = text; text = text.replace(/'([^'\\]*)'\s*\.\s*'([^'\\]*)'/g, "'$1$2'"); } while (text !== prev);
  return text;
};

function value(arg, where, literals = new Map()) {
  const named = arg.match(/^\w+:\s*(.*)$/s);
  if (named) arg = named[1];
  if (/^'([^']*)'$/.test(arg)) return arg.slice(1, -1);
  if (/^-?\d+$/.test(arg)) return Number(arg);
  if (arg === 'true' || arg === 'false') return arg === 'true';
  if (arg === 'null') return null;
  if (arg.startsWith('[')) return splitArgs(balanced(arg, 0).inner).map(a => value(a, where, literals));
  if (literals.has(arg)) return literals.get(arg);
  throw new Error(`schema: cannot read the argument ${arg} in ${where}`);
}

/** The table a `config('storyfeed.tables.x', 'feed_x')` expression names. */
function tableName(expr, file, body) {
  const literal = expr.match(/^config\('storyfeed\.tables\.\w+',\s*'(\w+)'\)$/);
  if (literal) return literal[1];
  const variable = expr.match(/^\$(\w+)$/);
  if (variable) {
    const assigned = body.match(new RegExp(`\\$${variable[1]}\\s*=\\s*(config\\([^;]*\\));`));
    if (assigned) return tableName(assigned[1], file, body);
  }
  throw new Error(`schema: cannot name the table ${expr} in ${file}`);
}

/**
 * Unroll `foreach (['a', 'b'] as $v) { … }` into one copy of the body per
 * value, with `$v` replaced by the literal. Only literal lists: anything else
 * is left alone, and its Blueprint calls then fail to read, loudly.
 */
function unroll(text) {
  const re = /foreach\s*\(\s*\[/g;
  let m;
  while ((m = re.exec(text))) {
    const list = balanced(text, m.index + m[0].length - 1);
    const rest = text.slice(list.end + 1).match(/^\s*as\s+\$(\w+)\s*\)\s*\{/);
    if (!rest) continue;
    const braceAt = list.end + 1 + rest[0].length - 1;
    const block = balanced(text, braceAt);
    const values = splitArgs(list.inner).map(a => value(a, 'a foreach list'));
    const copies = values.map(v => block.inner.replace(new RegExp(`\\$${rest[1]}\\b`, 'g'), `'${v}'`)).join('\n');
    text = text.slice(0, m.index) + copies + text.slice(block.end + 1);
    re.lastIndex = m.index;
  }
  return fold(text);
}

/** `function up()` body of a migration. */
function upBody(source, file) {
  const at = source.search(/function\s+up\s*\(\s*\)\s*:\s*void\s*\{/);
  if (at < 0) throw new Error(`schema: no up() in ${file}`);
  return balanced(source, source.indexOf('{', at)).inner;
}

const TYPES = {
  id: () => ({ type: 'bigint, increments' }),
  ulid: () => ({ type: 'ulid' }),
  char: (a) => ({ type: `char(${a[1] ?? 255})` }),
  string: (a) => ({ type: `string(${a[1] ?? 255})` }),
  text: () => ({ type: 'text' }),
  json: () => ({ type: 'json' }),
  boolean: () => ({ type: 'boolean' }),
  unsignedInteger: () => ({ type: 'unsigned int' }),
  unsignedTinyInteger: () => ({ type: 'unsigned tinyint' }),
  unsignedBigInteger: () => ({ type: 'unsigned bigint' }),
  foreignId: () => ({ type: 'unsigned bigint' }),
  timestamp: (a) => ({ type: a[1] ? `timestamp(${a[1]})` : 'timestamp' }),
  dateTime: (a) => ({ type: a[1] ? `datetime(${a[1]})` : 'datetime' }),
};

function apply(tables, table, statement, file, literals) {
  const helper = statement.startsWith('MorphKeyType::');
  const call = statement.match(helper ? /^MorphKeyType::(\w+)\(/ : /^\$\w+->(\w+)\(/);
  if (!call) throw new Error(`schema: cannot read ${statement} in ${file}`);
  const first = balanced(statement, call[0].length - 1);
  const rawArgs = splitArgs(first.inner);
  if (helper && !/^\$\w+$/.test(rawArgs.shift() ?? '')) throw new Error(`schema: MorphKeyType requires a Blueprint argument in ${file}`);
  const args = rawArgs.map(a => value(a, file, literals));
  if (helper && !['nullableMorphs', 'id'].includes(call[1])) throw new Error(`schema: unknown MorphKeyType method ${call[1]}() in ${file}; teach scripts/schema.mjs`);
  const chain = [];
  for (let rest = statement.slice(first.end + 1); rest.trim() !== '';) {
    const link = rest.match(/^\s*->(\w+)\(/);
    if (!link) throw new Error(`schema: cannot read the chain ${rest} in ${file}`);
    const b = balanced(rest, link[0].length - 1);
    chain.push([link[1], splitArgs(b.inner).map(a => value(a, file, literals))]);
    rest = rest.slice(b.end + 1);
  }
  const t = tables.get(table) ?? (() => { throw new Error(`schema: ${file} alters ${table} before it exists`); })();
  const method = call[1];
  const add = (name, def) => {
    const column = { name, nullable: false, default: undefined, ...def };
    const existing = t.columns.find(c => c.name === name);
    if (!existing) { t.columns.push(column); return column; }
    // A later migration re-adding a column (`->after()`, `->change()`) restates it.
    return Object.assign(existing, column);
  };
  const index = (kind, columns, name) => {
    // A later migration may repeat an index the create already declares.
    if (!t.indexes.some(i => i.kind === kind && i.columns.join() === columns.join())) t.indexes.push({ kind, columns, name });
  };

  if (method === 'dropUnique') {
    const columns = Array.isArray(args[0]) ? args[0] : null;
    t.indexes = t.indexes.filter(i => !(i.kind === 'unique' &&
      (columns ? i.columns.join() === columns.join() : i.name === args[0])));
    return;
  }
  if (method === 'index' || method === 'unique' || method === 'primary') {
    index(method, [args[0]].flat(), args[1]);
    return;
  }
  if (method === 'timestamps') {
    for (const name of ['created_at', 'updated_at']) add(name, { ...TYPES.timestamp([name, args[0]]), nullable: true });
    return;
  }
  if (method === 'softDeletes') {
    add(args[0] ?? 'deleted_at', { ...TYPES.timestamp([null, args[1]]), nullable: true });
    return;
  }
  if (method === 'nullableMorphs') {
    add(`${args[0]}_type`, { type: 'string(255)', nullable: true });
    add(`${args[0]}_id`, { type: helper ? 'string(36)' : 'unsigned bigint', nullable: true });
    index('index', [`${args[0]}_type`, `${args[0]}_id`]);
    return;
  }
  if (!TYPES[method]) throw new Error(`schema: unknown Blueprint method ${method}() in ${file}; teach scripts/schema.mjs`);

  const name = method === 'id' && !helper ? 'id' : args[0];
  if (typeof name !== 'string') throw new Error(`schema: ${method}() without a column name in ${file}`);
  const column = add(name, helper ? TYPES.string([name, 36]) : TYPES[method](args));
  if (method === 'id' && !helper) index('primary', ['id']);
  for (const [modifier, margs] of chain) {
    if (modifier === 'nullable') column.nullable = margs[0] ?? true;
    else if (modifier === 'default') column.default = margs[0];
    else if (modifier === 'index') index('index', [name]);
    else if (modifier === 'primary') index('primary', [name]);
    else if (modifier === 'unique') index('unique', [name]);
    else if (modifier === 'after' || modifier === 'change') { /* placement only; the column is restated above */ }
    else throw new Error(`schema: unknown column modifier ${modifier}() in ${file}; teach scripts/schema.mjs`);
  }
}

/**
 * The precision migration loops over `$this->columns()`, a table => column =>
 * nullable map, and widens each to `timestamp(6)`. Read that map; if its
 * shape changes, throw.
 */
function precision(tables, source, file) {
  const at = source.search(/function\s+columns\s*\(\s*\)\s*:\s*array\s*\{/);
  const body = balanced(source, source.indexOf('{', at)).inner;
  const ret = body.match(/return\s*\[/);
  if (at < 0 || !ret) throw new Error(`schema: ${file} no longer has the columns() map this script reads`);
  const map = balanced(body, ret.index + ret[0].length - 1).inner;
  for (const entry of splitArgs(map)) {
    const [, key, list] = entry.match(/^(config\([^)]*\))\s*=>\s*(\[[\s\S]*\])$/) ?? [];
    if (!key) throw new Error(`schema: cannot read ${entry} in ${file}`);
    const table = tableName(key, file, '');
    for (const pair of splitArgs(balanced(list, 0).inner)) {
      const [, column, nullable] = pair.match(/^'(\w+)'\s*=>\s*(true|false)$/) ?? [];
      if (!column) throw new Error(`schema: cannot read ${pair} in ${file}`);
      const c = tables.get(table)?.columns.find(c => c.name === column);
      if (!c) throw new Error(`schema: ${file} widens ${table}.${column}, which does not exist`);
      Object.assign(c, { type: 'timestamp(6)', nullable: nullable === 'true' });
    }
  }
}

/** The migration names, in the order the service provider registers them. */
export function migrationOrder(core) {
  const provider = readFileSync(resolve(core, 'src/StoryfeedServiceProvider.php'), 'utf8');
  const at = provider.indexOf('->hasMigrations([');
  if (at < 0) throw new Error('schema: StoryfeedServiceProvider no longer calls hasMigrations([...])');
  return splitArgs(balanced(provider, at + '->hasMigrations('.length).inner).map(a => value(a, 'hasMigrations'));
}

/**
 * Migrations that only reshape tables published by an older release. A fresh
 * install runs them and changes nothing, so the page describes no change.
 */
const UPGRADES_ONLY = new Set(['change_feed_references_to_strings.php.stub']);

/** @returns {Map<string, {columns: object[], indexes: object[]}>} */
export function extract(sources) {
  const tables = new Map();
  for (const [file, raw] of sources) {
    if (UPGRADES_ONLY.has(file)) continue;
    // Comments first: an apostrophe in "doesn't" would read as a string.
    const source = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"])\/\/.*$/gm, '$1');
    if (/function\s+columns\s*\(\s*\)\s*:\s*array/.test(source) && /->change\(\)/.test(source)) {
      precision(tables, source, file);
      continue;
    }
    const body = unroll(upBody(source, file));
    // Named index strings in guarded upgrades. Resolve only a single literal
    // assignment; expressions and reassigned variables still fail in value().
    const literals = new Map();
    for (const match of body.matchAll(/(\$\w+)\s*=\s*'([^'\\]*)'\s*;/g)) {
      const assignments = body.match(new RegExp(`\\${match[1]}\\s*=(?!=|>)`, 'g'));
      if (assignments?.length === 1) literals.set(match[1], match[2]);
    }
    const re = /Schema::(create|table)\(/g;
    let m;
    while ((m = re.exec(body))) {
      const args = balanced(body, m.index + m[0].length - 1);
      const [expr] = splitArgs(args.inner);
      const closure = args.inner.match(/(?:function|fn)\s*\(\s*Blueprint\s+\$(\w+)\s*\)/);
      if (!closure) throw new Error(`schema: Schema::${m[1]} without a Blueprint closure in ${file}`);
      const table = tableName(expr, file, body);
      if (m[1] === 'create') tables.set(table, { columns: [], indexes: [] });
      const arrow = closure[0].startsWith('fn');
      const open = m.index + m[0].length + args.inner.indexOf('{', args.inner.indexOf(closure[0]));
      const block = arrow ? args.inner.slice(args.inner.indexOf('=>') + 2) : balanced(body, open).inner;
      const statements = block.split('\n').map(l => l.replace(/\/\/.*$/, '')).join('\n')
        .split(';').map(s => s.replace(/\s+/g, ' ').trim()).filter(s => s.startsWith(`$${closure[1]}->`) || s.startsWith('MorphKeyType::'));
      for (const s of statements) apply(tables, table, s, file, literals);
      re.lastIndex = args.end;
    }
  }
  return tables;
}

export function fromCore(core) {
  return extract(migrationOrder(core).map(name => {
    const file = resolve(core, 'database/migrations', `${name}.php.stub`);
    if (!existsSync(file)) throw new Error(`schema: ${name}.php.stub is registered but missing`);
    return [`${name}.php.stub`, readFileSync(file, 'utf8')];
  }));
}

/* ---------------------------------------------------------------- rendering */

const code = s => `\`${s}\``;

function keyOf(t, column) {
  const single = t.indexes.filter(i => i.columns.length === 1 && i.columns[0] === column);
  return single.map(i => ({ primary: 'PK', unique: 'unique', index: 'index' })[i.kind]).join(', ');
}

function renderDefault(c) {
  if (c.default === undefined) return '';
  return code(typeof c.default === 'string' ? `'${c.default}'` : String(c.default));
}

export function renderTable(name, t, notes) {
  const purposes = notes[name] ?? {};
  for (const column of Object.keys(purposes)) {
    if (!t.columns.some(c => c.name === column)) throw new Error(`schema: schema-notes.json describes ${name}.${column}, which the migrations do not create`);
  }
  const rows = t.columns.map(c => {
    const purpose = purposes[c.name];
    if (!purpose) throw new Error(`schema: ${name}.${c.name} has no purpose in scripts/schema-notes.json`);
    const attributes = [keyOf(t, c.name), c.nullable ? 'nullable' : '', renderDefault(c) && `default ${renderDefault(c)}`].filter(Boolean).join(', ');
    return `| ${code(c.name)} | ${c.type} | ${attributes} | ${purpose} |`;
  });
  const composite = t.indexes.filter(i => i.columns.length > 1);
  const out = ['| Column | Type | Attributes | Purpose |', '|---|---|---|---|', ...rows];
  if (composite.length) {
    out.push('', '| Index | Columns |', '|---|---|');
    for (const i of composite) out.push(`| ${i.kind === 'primary' ? 'primary key' : i.kind} | ${i.columns.map(code).join(', ')} |`);
  }
  return out.join('\n');
}

/* ------------------------------------------------------------------ diagram */

/**
 * The ER diagram's layout: where each box goes and which rows it shows.
 * Rows name real columns (`{role}` stands for all seven roles); every one is
 * checked against the extracted schema, and every table must have a box.
 */
const LEFT = 10, RIGHT = 380, W = 300, RH = 22, HH = 30;
const DIAGRAM = {
  feed_activities: [RIGHT, 10, [['id', 'PK'], ['uid', 'ULID · unique'], ['verb', 'index'],
    ['cached_{role}_id', 'snapshot × 7'], ['{role}_type, {role}_id', 'morph × 7'],
    ['data', 'json'], ['published_at', 'timestamp(6)'], ['created_at, updated_at', ''], ['deleted_at', 'soft delete']],
    ['(published_at, id)', '({role}_type, {role}_id,', '   published_at, id)', '   actor, object, target, context']],
  feed_snapshots: [LEFT, 10, [['id', 'PK'], ['model_type, model_id', 'unique'], ['label', ''], ['data, body', 'json'],
    ['content, media_type', ''], ['attributed_to', ''], ['shape', 'index'], ['source_updated_at', ''], ['meta', 'json']], []],
  feed_parties: [LEFT, 300, [['id', 'PK'], ['key', 'unique'], ['name, type', ''], ['data', 'json']], []],
  feed_tombstones: [LEFT, 440, [['id', 'PK'], ['model_type, model_id', 'unique'], ['restorable, approximate', 'bool'], ['deleted_at, label', ''], ['meta', 'json']], []],
  feed_groupings: [RIGHT, 345, [['id', 'PK'], ['activity_id', '→ activity'], ['bucket', 'axis name'], ['hash', 'group key'], ['winner', 'bool or null']],
    ['unique (activity_id, bucket)', '(bucket, hash)', '(winner, bucket, hash)']],
  feed_participants: [RIGHT, 575, [['id', 'PK'], ['activity_id', '→ activity'], ['role', ''], ['entity_type, entity_id', ''], ['published_at', 'copied']],
    ['unique (activity_id, role)', '(entity_type, entity_id,', '   published_at, activity_id)']],
  feed_batches: [RIGHT, 805, [['id', 'PK'], ['uid', 'ULID · unique'], ['actor_type, actor_id', ''], ['opened_at, closes_at', ''], ['closed_at', 'null = open'], ['activities_count', '']],
    ['(actor_type, actor_id, closed_at)', '(closed_at, closes_at)']],
  feed_batch_locks: [LEFT, 790, [['actor_type, actor_id', 'PK'], ['open_batches', 'json'], ['locked_at', '']], []],
  feed_grouping_bursts: [LEFT, 900, [['key', 'PK'], ['hash', 'burst hash'], ['opened_at, last_activity_at', ''], ['within_seconds, ceiling_seconds', ''], ['locked_at', '']], []],
  feed_meta: [LEFT, 640, [['key', 'unique'], ['value', 'sync_token']], []],
};

function checkDiagram(tables) {
  for (const name of tables.keys()) if (!DIAGRAM[name]) throw new Error(`schema: ${name} has no box in the diagram (scripts/schema.mjs DIAGRAM)`);
  for (const [name, [, , rows]] of Object.entries(DIAGRAM)) {
    const t = tables.get(name);
    if (!t) throw new Error(`schema: the diagram draws ${name}, which the migrations do not create`);
    for (const [label] of rows) {
      for (const column of label.split(',').map(s => s.trim())) {
        const names = column.includes('{role}') ? ROLES.map(r => column.replace('{role}', r)) : [column];
        for (const n of names) if (!t.columns.some(c => c.name === n)) throw new Error(`schema: the diagram shows ${name}.${n}, which the migrations do not create`);
      }
    }
  }
}

export function renderDiagram(tables) {
  checkDiagram(tables);
  const height = name => { const [, , rows, idx] = DIAGRAM[name]; return HH + RH * rows.length + (idx.length ? 10 + 18 * idx.length : 6); };
  const ry = (name, i) => DIAGRAM[name][1] + HH + RH * i + 11;
  const RE = RIGHT + W, LE = LEFT + W;
  const A = 'marker-end="url(#arr)"';
  const edges = [
    `<path class="e" d="M${RIGHT} ${ry('feed_activities', 3)} H${LE + 30} V${ry('feed_snapshots', 0)} H${LE + 3}" ${A}/>`,
    `<path class="e d" d="M${RIGHT} ${ry('feed_activities', 4)} H${LE + 48} V${ry('feed_tombstones', 0)} H${LE + 3}" ${A}/>`,
    `<path class="e d" d="M${LE + 48} ${ry('feed_parties', 0)} H${LE + 3}" ${A}/>`,
    `<path class="e" d="M${RE} ${ry('feed_groupings', 1)} H${RE + 18} V${ry('feed_activities', 0)} H${RE + 3}" ${A}/>`,
    `<path class="e" d="M${RE} ${ry('feed_participants', 1)} H${RE + 18} V${ry('feed_groupings', 1)}"/>`,
    `<path class="e d" d="M${RE} ${ry('feed_groupings', 3)} H${RE + 34} V${ry('feed_batches', 1)} H${RE + 3}" ${A}/>`,
    `<path class="e d" d="M${LE} ${ry('feed_batch_locks', 1)} H${LE + 40} V${ry('feed_batches', 0)} H${RIGHT - 3}" ${A}/>`,
    `<text class="el" x="${LEFT}" y="1075">solid: an id column Storyfeed joins on · dashed: a morph reference, or a key</text>`,
    `<text class="el" x="${LEFT}" y="1093">held in another column · no foreign key constraints are declared</text>`,
    `<text class="el" x="${RE - 4}" y="${DIAGRAM.feed_groupings[1] - 8}" text-anchor="end">batch rows: hash = feed_batches.uid</text>`,
  ];
  const boxes = Object.entries(DIAGRAM).map(([name, [x, y, rows, idx]]) => {
    const h = height(name);
    const o = [`<g transform="translate(${x},${y})">`, `<rect class="box" width="${W}" height="${h}" rx="8"/>`,
      `<path class="head" d="M0 8a8 8 0 0 1 8-8h${W - 16}a8 8 0 0 1 8 8v${HH - 8}h-${W}z"/>`,
      `<text class="tn" x="12" y="20">${name}</text>`];
    rows.forEach(([c, n], i) => {
      const yy = HH + RH * i + 16;
      o.push(`<text class="c" x="12" y="${yy}">${c}</text>`);
      if (n) o.push(`<text class="n" x="${W - 12}" y="${yy}" text-anchor="end">${n}</text>`);
    });
    if (idx.length) {
      const top = HH + RH * rows.length + 4;
      o.push(`<line class="sep" x1="8" x2="${W - 8}" y1="${top}" y2="${top}"/>`);
      idx.forEach((s, i) => o.push(`<text class="i" x="12" y="${top + 16 + 18 * i}" xml:space="preserve">${s}</text>`));
    }
    o.push('</g>');
    return o.join('\n');
  });
  const H = Math.max(1093, ...Object.keys(DIAGRAM).map(n => DIAGRAM[n][1] + height(n))) + 12;
  return `<div class="er-wrap">
<svg class="er" viewBox="0 0 ${RE + 44} ${H}" role="img" aria-labelledby="er-title" xmlns="http://www.w3.org/2000/svg">
<title id="er-title">The ${tables.size} tables Storyfeed creates, and how they reference each other</title>
<defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="ah"/></marker></defs>
${edges.join('\n')}
${boxes.join('\n')}
</svg>
</div>`;
}

/* --------------------------------------------------------------------- page */

const BLOCK = /<!-- schema:([\w.-]+) -->[\s\S]*?<!-- \/schema -->/g;

export function renderPage(text, tables, notes) {
  const seen = new Set();
  const out = text.replace(BLOCK, (_, key) => {
    seen.add(key);
    const body = key === 'diagram' ? renderDiagram(tables)
      : key === 'count' ? (['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'][tables.size] ?? String(tables.size))
      : tables.has(key) ? renderTable(key, tables.get(key), notes)
      : (() => { throw new Error(`schema: schema.md has a block for ${key}, which the migrations do not create`); })();
    return key === 'count' ? `<!-- schema:${key} -->${body}<!-- /schema -->` : `<!-- schema:${key} -->\n${body}\n<!-- /schema -->`;
  });
  for (const name of tables.keys()) if (!seen.has(name)) throw new Error(`schema: schema.md has no <!-- schema:${name} --> block`);
  for (const name of Object.keys(notes)) if (!tables.has(name)) throw new Error(`schema: schema-notes.json describes ${name}, which the migrations do not create`);
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const core = process.env.STORYFEED_CORE || '/Users/jasper/Dev/projects/storyfeed';
  const check = process.argv.includes('--check');
  try {
    const tables = fromCore(core);
    const notes = JSON.parse(readFileSync(notesFile, 'utf8'));
    const current = readFileSync(page, 'utf8');
    const next = renderPage(current, tables, notes);
    if (check) {
      if (next !== current) {
        console.error('schema: docs/reference/schema.md does not match core\'s migrations. Run `npm run schema`.');
        process.exit(1);
      }
      console.log(`schema: ${tables.size} tables match core's migrations`);
    } else {
      writeFileSync(page, next);
      console.log(`schema: wrote ${tables.size} tables to docs/reference/schema.md`);
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
