/**
 * Check the UI reference pages against the kits' code.
 *
 * Storyfeed UI › the reference pages (`docs/ui/reference/*.md`) list every
 * component, attribute, prop, slot, event, renderer and seam the kits accept.
 * The kits are the source of truth, so a page that documents a name the kit
 * does not have fails the build, and so does a documented default the kit
 * does not use. Names the kit has and the page leaves out are listed, not
 * failed: an addition to a kit should not break the docs build.
 *
 * A page declares its kit in front matter (`kit: blade`, `vue` or `react`).
 * An H3 whose text holds a component in backticks (`<x-storyfeed::feed>`,
 * `FeedStream`) owns the tables below it, up to the next heading. A table
 * whose first header is one of the kinds below is checked; its first column
 * holds the names in backticks, and a `Default` column, when present, holds
 * the default as the kit spells it.
 *
 * Across every reference page, each `--sf-*` CSS variable and `FEED_*` seam
 * named in backticks must appear in the kits' source.
 *
 * The kits are read from STORYFEED_UI_PATH (the Vue kit, as the theme uses
 * it); the check steps aside when no ui checkout is there, as on the deploy
 * host.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { uiPath } from './ui-kit.mjs';

const repo = fileURLToPath(new URL('../', import.meta.url));

/** Table kinds, by their first header cell, and what each is checked against. */
const KINDS = {
    Attribute: 'props',
    Prop: 'props',
    'Render Prop': 'props',
    Slot: 'slots',
    Event: 'events',
    Renderer: 'renderers',
    Seam: 'seams',
};

export const camel = (name) => name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

/** A default as written in PHP or TypeScript, reduced to one spelling. */
export function literal(value) {
    if (value == null) return null;
    return value
        .trim()
        .replace(/^\(\)\s*=>\s*\(?(.*?)\)?$/s, '$1')
        .replace(/"/g, "'")
        .replace(/\s+/g, '');
}

/**
 * Where a comment or string starting at `i` ends, or `i` when none starts
 * there. Code text only: an apostrophe in a comment is not a string.
 */
function skip(text, i) {
    const c = text[i];
    const end = (found, length) => (found === -1 ? text.length - 1 : found + length - 1);
    if (c === '/' && text[i + 1] === '*') return end(text.indexOf('*/', i + 2), 2);
    if (c === '/' && text[i + 1] === '/') return end(text.indexOf('\n', i), 0);
    if (c === '{' && text.startsWith('{{--', i)) return end(text.indexOf('--}}', i + 4), 4);
    if (c === '"' || c === "'" || c === '`') {
        for (let j = i + 1; j < text.length; j++) {
            if (text[j] === '\\') j++;
            else if (text[j] === c) return j;
            else if (text[j] === '\n' && c !== '`') return i;
        }
    }
    return i;
}

/** The text between an opening bracket at `from` and its match. */
export function balanced(text, from) {
    const open = text[from];
    const close = { '{': '}', '(': ')', '[': ']', '<': '>' }[open];
    let depth = 0;
    for (let i = from; i < text.length; i++) {
        const skipped = skip(text, i);
        if (skipped !== i) {
            i = skipped;
            continue;
        }
        const c = text[i];
        // Arrow functions inside a type literal are not closing brackets.
        if (open === '<' && c === '=' && text[i + 1] === '>') i++;
        else if (c === open) depth++;
        else if (c === close && --depth === 0) return text.slice(from + 1, i);
    }
    return null;
}

/** Split at top-level separators, ignoring those nested in brackets or strings. */
export function topLevel(text, separators = ',;\n') {
    const parts = [];
    let depth = 0;
    let start = 0;
    for (let i = 0; i < text.length; i++) {
        const skipped = skip(text, i);
        if (skipped !== i) {
            i = skipped;
            continue;
        }
        const c = text[i];
        if (c === '=' && text[i + 1] === '>') i++;
        else if ('{([<'.includes(c)) depth++;
        else if ('})]>'.includes(c)) depth--;
        else if (depth === 0 && separators.includes(c)) {
            parts.push(text.slice(start, i));
            start = i + 1;
        }
    }
    parts.push(text.slice(start));
    return parts.map((part) => part.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').trim()).filter(Boolean);
}

/** Member names of a TypeScript object type literal's body. */
export function members(body) {
    return topLevel(body)
        .map((member) => member.match(/^(?:readonly\s+)?['"]?([A-Za-z_$][\w$-]*)['"]?\??\s*:/)?.[1])
        .filter(Boolean);
}

// ── Blade ────────────────────────────────────────────────────────────────

export function bladeComponent(source) {
    const start = source.indexOf('@props(');
    const props = new Map();
    if (start !== -1) {
        const list = balanced(source, start + '@props'.length);
        for (const entry of topLevel(balanced(list, list.indexOf('[')) ?? '', ',')) {
            const [, name, value] = entry.match(/^'([\w]+)'(?:\s*=>\s*([\s\S]+))?$/) ?? [];
            if (name) props.set(name, value ?? null);
        }
    }
    const slots = new Set();
    if (/\$slot\b/.test(source)) slots.add('default');
    for (const [, name] of source.matchAll(/\{\{\s*\$(\w+)\s*\?\?/g)) if (!props.has(name)) slots.add(name);
    for (const [, name] of source.matchAll(/isset\(\$(\w+)\)/g)) if (!props.has(name)) slots.add(name);
    return { props, slots, events: new Set() };
}

export function bladeKit(root) {
    const dir = join(root, 'resources/views/components');
    const components = new Map();
    const renderers = new Set();
    const walk = (path, prefix) => {
        for (const entry of readdirSync(path)) {
            const full = join(path, entry);
            if (statSync(full).isDirectory()) {
                walk(full, `${prefix}${entry}.`);
                continue;
            }
            if (!entry.endsWith('.blade.php')) continue;
            const source = readFileSync(full, 'utf8');
            components.set(`<x-storyfeed::${prefix}${entry.replace('.blade.php', '')}>`, bladeComponent(source));
            for (const [, key] of source.matchAll(/renderers\['(\w+)'\]/g)) renderers.add(key);
        }
    };
    walk(dir, '');
    return { components, renderers, seams: new Set(), name: camel };
}

// ── Vue ──────────────────────────────────────────────────────────────────

export function vueComponent(source) {
    const script = source.match(/<script setup[^>]*>([\s\S]*?)<\/script>/)?.[1] ?? '';
    const props = new Map();
    const declared = script.indexOf('defineProps<');
    if (declared !== -1) {
        const type = balanced(script, declared + 'defineProps'.length).trim();
        const body = type.startsWith('{') ? balanced(type, 0) : interfaceBody(script, type);
        for (const name of members(body ?? '')) props.set(name, null);
        const defaults = script.indexOf('withDefaults(');
        if (defaults !== -1) {
            const args = topLevel(balanced(script, defaults + 'withDefaults'.length), ',');
            const object = args[1] ?? '';
            for (const entry of topLevel(balanced(object, object.indexOf('{')) ?? '', ',')) {
                const [, name, value] = entry.match(/^([\w$]+)\s*:\s*([\s\S]+)$/) ?? [];
                if (name && props.has(name)) props.set(name, value);
            }
        }
    }
    const events = new Set();
    const emits = script.indexOf('defineEmits<');
    if (emits !== -1) {
        const type = balanced(script, emits + 'defineEmits'.length).trim();
        const body = balanced(type, 0) ?? '';
        for (const name of members(body)) events.add(name);
        for (const [, name] of body.matchAll(/\(e:\s*'([\w-]+)'/g)) events.add(camel(name));
    }
    const template = source.replace(/<script[\s\S]*?<\/script>/g, '');
    const slots = new Set();
    for (const [, attributes] of template.matchAll(/<slot\b([^>]*)>/g)) {
        slots.add(attributes.match(/\bname="([\w-]+)"/)?.[1] ?? 'default');
    }
    return { props, slots, events };
}

function interfaceBody(source, name) {
    const at = source.search(new RegExp(`interface\\s+${name}\\b[^{]*\\{`));
    return at === -1 ? null : balanced(source, source.indexOf('{', at));
}

export function vueKit(root) {
    const dir = join(root, 'resources/js/vue');
    const components = new Map();
    for (const sub of ['', 'body']) {
        for (const entry of readdirSync(join(dir, sub))) {
            if (!entry.endsWith('.vue')) continue;
            components.set(`${entry.replace('.vue', '')}`, vueComponent(readFileSync(join(dir, sub, entry), 'utf8')));
        }
    }
    const keys = readFileSync(join(dir, 'keys.ts'), 'utf8');
    const seams = new Set([...keys.matchAll(/export const (FEED_\w+)/g)].map(([, name]) => name));
    return { components, renderers: new Set(), seams, name: camel };
}

// ── React ────────────────────────────────────────────────────────────────

/** Every interface in the React kit and its shared core: own members and parents. */
function reactInterfaces(sources) {
    const interfaces = new Map();
    for (const source of sources) {
        for (const match of source.matchAll(/interface\s+(\w+)(?:\s+extends\s+([\w\s,<>]+?))?\s*\{/g)) {
            const body = balanced(source, match.index + match[0].length - 1);
            interfaces.set(match[1], {
                members: members(body ?? ''),
                parents: (match[2] ?? '').split(',').map((parent) => parent.replace(/<.*$/, '').trim()).filter(Boolean),
            });
        }
    }
    return interfaces;
}

function interfaceMembers(interfaces, name, seen = new Set()) {
    const found = interfaces.get(name);
    if (!found || seen.has(name)) return [];
    seen.add(name);
    return [...found.members, ...found.parents.flatMap((parent) => interfaceMembers(interfaces, parent, seen))];
}

export function reactComponents(source, interfaces) {
    const components = new Map();
    for (const match of source.matchAll(/export (?:default )?function (\w+)\s*\(/g)) {
        if (!/^[A-Z]/.test(match[1])) continue;
        const params = balanced(source, match.index + match[0].length - 1) ?? '';
        const props = new Map();
        const trimmed = params.trim();
        let type = trimmed;
        if (trimmed.startsWith('{')) {
            const pattern = balanced(trimmed, 0);
            for (const entry of topLevel(pattern, ',')) {
                const [, name, value] = entry.match(/^([\w$]+)(?:\s*:\s*[\w$]+)?(?:\s*=\s*([\s\S]+))?$/) ?? [];
                if (name) props.set(name, value ?? null);
            }
            type = trimmed.slice(pattern.length + 2).replace(/^\s*:\s*/, '');
        } else {
            type = trimmed.replace(/^[\w$]+\s*:\s*/, '');
        }
        const names = type.startsWith('{')
            ? members(balanced(type, 0) ?? '')
            : interfaceMembers(interfaces, type.match(/^[\w$]+/)?.[0]);
        for (const name of names) if (!props.has(name)) props.set(name, null);
        components.set(match[1], { props, slots: new Set(), events: new Set() });
    }
    return components;
}

export function reactKit(root) {
    const dir = join(root, 'resources/js/react');
    const files = [...readdirSync(dir).map((entry) => join(dir, entry)), ...readdirSync(join(dir, 'body')).map((entry) => join(dir, 'body', entry))]
        .filter((path) => /\.tsx?$/.test(path));
    const shared = readdirSync(join(root, 'resources/js/shared')).map((entry) => join(root, 'resources/js/shared', entry));
    const sources = files.map((path) => readFileSync(path, 'utf8'));
    const interfaces = reactInterfaces([...sources, ...shared.map((path) => readFileSync(path, 'utf8'))]);
    const components = new Map();
    for (const source of sources) for (const [name, component] of reactComponents(source, interfaces)) components.set(name, component);
    const seams = new Set(interfaceMembers(interfaces, 'FeedOptions').filter((name) => name.startsWith('FEED_')));
    return { components, renderers: new Set(), seams, name: (name) => name };
}

// ── The pages ────────────────────────────────────────────────────────────

const cells = (row) => row.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((cell) => cell.trim());
const ticked = (text) => [...text.matchAll(/`([^`]+)`/g)].map(([, name]) => name);

/** The checked tables of one page: [{ components, kind, rows: [{ names, default }] }]. */
export function tablesIn(markdown) {
    const tables = [];
    const lines = markdown.split('\n');
    let components = [];
    let fence = false;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/^```/.test(line)) fence = !fence;
        if (fence) continue;
        if (/^#{1,6}\s/.test(line)) {
            components = /^###\s/.test(line) ? ticked(line) : [];
            continue;
        }
        if (!line.startsWith('|') || !lines[i + 1]?.match(/^\|\s*:?-/)) continue;
        const header = cells(line);
        const kind = KINDS[header[0]];
        const defaultColumn = header.indexOf('Default');
        const rows = [];
        for (i += 2; i < lines.length && lines[i].startsWith('|'); i++) {
            const row = cells(lines[i]);
            rows.push({ line: i + 1, names: ticked(row[0]), default: defaultColumn === -1 ? undefined : ticked(row[defaultColumn] ?? '')[0] ?? null });
        }
        i--;
        if (kind) tables.push({ components, kind, rows, header: header[0] });
    }
    return tables;
}

export function check(markdown, kit, file = 'page') {
    const failures = [];
    const documented = new Map();
    for (const table of tablesIn(markdown)) {
        const global = table.kind === 'renderers' || table.kind === 'seams';
        if (!global && table.components.length === 0) {
            failures.push(`${file}: a ${table.header} table sits under no component heading`);
            continue;
        }
        for (const component of global ? [null] : table.components) {
            const found = global ? null : kit.components.get(component);
            if (!global && !found) {
                failures.push(`${file}: ${component} is not a component in the kit`);
                continue;
            }
            for (const row of table.rows) {
                for (const name of row.names) {
                    const key = table.kind === 'props' || table.kind === 'events' ? kit.name(name) : name;
                    if (global) {
                        if (!kit[table.kind].has(key)) failures.push(`${file}:${row.line}: ${table.header} ${name} is not in the kit`);
                        continue;
                    }
                    const set = found[table.kind];
                    if (!set.has(key)) {
                        failures.push(`${file}:${row.line}: ${component} has no ${table.header.toLowerCase()} ${name}`);
                        continue;
                    }
                    if (!documented.has(component)) documented.set(component, new Set());
                    documented.get(component).add(`${table.kind}:${key}`);
                    if (table.kind === 'props' && row.default != null) {
                        const actual = literal(set.get(key));
                        const written = literal(row.default);
                        if (actual !== null && written !== actual) {
                            failures.push(`${file}:${row.line}: ${component} ${name} defaults to ${set.get(key)}, not ${row.default}`);
                        }
                    }
                }
            }
        }
    }
    return { failures, documented };
}

/** Names the kits' source never mentions: CSS variables and seams. */
export function unknownNames(markdown, source, file = 'page') {
    const failures = [];
    for (const name of new Set(ticked(markdown).flatMap((text) => text.match(/--sf-[\w-]+|\bFEED_[A-Z_]+\b/g) ?? []))) {
        if (!source.includes(name)) failures.push(`${file}: ${name} is not in the kits`);
    }
    return failures;
}

function kitSource(root) {
    const read = (dir) => readdirSync(dir).flatMap((entry) => {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) return read(full);
        return /\.(php|vue|tsx?|css)$/.test(entry) && !entry.endsWith('.md') ? [readFileSync(full, 'utf8')] : [];
    });
    return [...read(join(root, 'resources/views')), ...read(join(root, 'resources/js'))].join('\n');
}

function main() {
    const root = resolve(uiPath, '../../..');
    if (!existsSync(join(root, 'resources/views/components'))) {
        console.log(`ui reference: no ui checkout at ${root} — skipped (set STORYFEED_UI_PATH to run it here)`);
        return 0;
    }
    const pages = join(repo, 'docs/ui/reference');
    const kits = { blade: bladeKit(root), vue: vueKit(root), react: reactKit(root) };
    const source = kitSource(root);
    const failures = [];
    const unlisted = [];
    for (const entry of existsSync(pages) ? readdirSync(pages).filter((name) => name.endsWith('.md')) : []) {
        const markdown = readFileSync(join(pages, entry), 'utf8');
        const file = `docs/ui/reference/${entry}`;
        failures.push(...unknownNames(markdown, source, file));
        const kitName = markdown.match(/^---\n[\s\S]*?^kit:\s*(\w+)\s*$[\s\S]*?^---/m)?.[1];
        if (!kitName) continue;
        const kit = kits[kitName];
        const result = check(markdown, kit, file);
        failures.push(...result.failures);
        for (const [component, names] of result.documented) {
            const found = kit.components.get(component);
            for (const kind of ['props', 'slots', 'events']) {
                for (const name of found[kind].keys()) {
                    if (!names.has(`${kind}:${name}`)) unlisted.push(`${basename(file)}: ${component} ${kind.slice(0, -1)} ${name}`);
                }
            }
        }
    }
    if (unlisted.length) console.log(`ui reference: in the kit, not on the page (informational):\n  ${unlisted.join('\n  ')}`);
    if (failures.length) {
        console.error(failures.join('\n'));
        console.error('ui reference: the pages document something the kits do not have.');
        return 1;
    }
    console.log('ui reference: every documented name is in the kits');
    return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exit(main());
