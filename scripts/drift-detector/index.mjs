import { readFileSync, readdirSync } from 'node:fs';
import { resolve, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
export const defaultCore = '/Users/jasper/Dev/projects/storyfeed';
const git = (root, ...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const excluded = /(^|\/)(node_modules|cache|dist|\.git)(\/|$)/;
function walk(root, dir = root) {
  return readdirSync(dir, { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name, 'en')).flatMap(e => {
    const p = resolve(dir, e.name);
    return excluded.test(relative(root, p)) || e.isSymbolicLink() ? [] : e.isDirectory() ? walk(root, p) : [p];
  });
}
export function surface(core) {
  const files = Object.fromEntries(walk(resolve(core, 'src')).filter(p => p.endsWith('.php')).map(p => [relative(core, p), readFileSync(p, 'utf8')]));
  files['config/storyfeed.php'] = readFileSync(resolve(core, 'config/storyfeed.php'), 'utf8');
  const api = JSON.parse(execFileSync(process.env.PHP_BINARY || 'php', [resolve(here, 'surface.php')], { input: JSON.stringify(files), encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }));
  // HEAD ancestry only; no other lane's branch and no network. Disable rename detection
  // so moved classes such as Support\\Noun retain their old qualified identity.
  const deleted = git(core, 'log', '--no-renames', '--diff-filter=D', '--format=', '--name-only', 'HEAD', '--', 'src').split('\n').filter(p => /^src\/.*\.php$/.test(p));
  api.removed = [...new Set(deleted.map(p => 'Storyfeed\\' + p.slice(4, -4).replaceAll('/', '\\')))].filter(n => !api.classes[n]);
  api.historyMethods = new Set([...git(core, 'log', '-p', '--format=', 'HEAD', '--', 'src').matchAll(/^-\s*(?:public\s+)?(?:static\s+)?function\s+(\w+)\s*\(/gm)].map(m => m[1]));
  api.changelog = readFileSync(resolve(core, 'CHANGELOG.md'), 'utf8').match(/^## \[?Unreleased\]?[^\n]*\n([\s\S]*?)(?=^## |$(?![\s\S]))/m)?.[1] ?? '';
  api.revision = git(core, 'rev-parse', 'HEAD').trim();
  return api;
}
export function documents(root, ref) {
  if (ref) return git(root, 'ls-tree', '-r', '--name-only', ref, '--', 'docs').split('\n').filter(p => p.endsWith('.md') && !excluded.test(p)).map(file => ({ file, text: git(root, 'show', `${ref}:${file}`) }));
  return walk(resolve(root, 'docs')).filter(p => p.endsWith('.md')).map(p => ({ file: relative(root, p), text: readFileSync(p, 'utf8') }));
}
const hints = { toFeedLink: 'feedMedia', FeedLink: 'FeedMedia', Noun: 'FeedNoun', 'Noun::phrase': 'FeedNoun::of / FeedNoun::trans' };
const short = n => n.split('\\').at(-1);
function regions(text) {
  let fence = null, blockComment = false;
  function mask(source) {
    let code = '', literalCode = '';
    for (let i = 0; i < source.length;) {
      if (blockComment) {
        const end = source.indexOf('*/', i);
        if (end < 0) { code += ' '.repeat(source.length-i); literalCode += ' '.repeat(source.length-i); break; }
        code += ' '.repeat(end+2-i); literalCode += ' '.repeat(end+2-i); i = end+2; blockComment = false;
      } else if (source.startsWith('/*', i)) { blockComment = true; }
      else if (source.startsWith('//', i) || source[i] === '#') { code += ' '.repeat(source.length-i); literalCode += ' '.repeat(source.length-i); break; }
      else if (source[i] === '"' || source[i] === "'") {
        const start = i, quote = source[i++];
        while (i < source.length) { if (source[i] === '\\') i += 2; else if (source[i++] === quote) break; }
        const value = source.slice(start, i); code += ' '.repeat(value.length); literalCode += value;
      } else { code += source[i]; literalCode += source[i++]; }
    }
    return {code, literalCode};
  }
  return text.split('\n').map((line, i) => {
    const match = line.match(/^\s*(`{3,}|~{3,})(\w*)/);
    if (match) { if (!fence) fence = { marker: match[1][0], lang: match[2] }; else if (match[1][0] === fence.marker) fence = null; blockComment = false; return { line: i+1, code: '', literalCode: '' }; }
    const source = fence ? (['php', 'blade', ''].includes(fence.lang) ? line : '') : [...line.matchAll(/(`+)(.*?)\1/g)].map(m => m[2]).join(' ');
    return { line: i+1, ...mask(source) };
  });
}
export function analyze(api, docs) {
  const stale = [], unresolved = [], mentions = new Set();
  const names = [...Object.keys(api.classes), ...api.removed];
  const methods = new Set(Object.values(api.classes).flatMap(c => c.methods));
  const properties = new Set(Object.values(api.classes).flatMap(c => c.properties));
  function resolveName(name, aliases, locals) {
    name = name.replace(/^\\/, '');
    if (locals.has(name)) return null;
    if (aliases.has(name)) return aliases.get(name);
    if (name.startsWith('Storyfeed\\')) return name;
    if (name.includes('\\')) return names.includes('Storyfeed\\' + name) ? 'Storyfeed\\' + name : null;
    const found = names.filter(n => short(n) === name);
    return found.length === 1 ? found[0] : null;
  }
  for (const doc of docs) {
    const rs = regions(doc.text), aliases = new Map(), locals = new Set();
    // Page-local bindings deliberately beat historical short-name guesses.
    for (const {code} of rs) {
      for (const m of code.matchAll(/\buse\s+([\\\w]+)(?:\s+as\s+(\w+))?\s*;/g)) {
        const alias = m[2] ?? short(m[1]), target = m[1].replace(/^\\/, '');
        aliases.set(alias, aliases.has(alias) && aliases.get(alias) !== target ? null : target);
      }
      for (const m of code.matchAll(/\b(?:class|interface|trait|enum)\s+(\w+)/g)) locals.add(m[1]);
    }
    for (const group of rs.map(r => r.code).join('\n').matchAll(/\buse\s+[\\\w]+\{([^}]+)\}/g)) {
      for (const entry of group[1].split(',')) { const parts = entry.trim().split(/\s+as\s+/); locals.add(parts[1] ?? short(parts[0])); }
    }
    const seen = new Set();
    function add(bucket, line, identifier, reason) {
      const key = `${line}:${identifier}`; if (seen.has(key)) return; seen.add(key);
      bucket.push({ file: doc.file, line, identifier, reason, ...(bucket === stale && (hints[identifier.split('\\').at(-1)] ?? hints[identifier.split('::')[0].split('\\').at(-1)]) ? { suggestion: (hints[identifier.split('\\').at(-1)] ?? hints[identifier.split('::')[0].split('\\').at(-1)]) } : {}) });
    }
    function classRef(name, line, member) {
      const id = member ? `${name}::${member}` : name;
      const resolved = resolveName(name, aliases, locals);
      if (!resolved || !resolved.startsWith('Storyfeed\\')) { add(unresolved, line, id, 'No unambiguous core class binding (application, framework, or ambiguous name)'); return; }
      if (names.some(n => n.startsWith(resolved + '\\'))) { add(unresolved, line, id, 'Namespace prefix rather than a proven class reference'); return; }
      mentions.add(resolved);
      const cls = api.classes[resolved];
      if (!cls) { add(stale, line, id, `Core class absent: ${resolved}`); return; }
      if (!member || member === 'class') return;
      if (cls.methods.includes(member) || cls.properties.includes(member.replace(/^\$/, ''))) { mentions.add(`${resolved}::${member}`); return; }
      if (cls.open || member.toUpperCase() === member) add(unresolved, line, id, 'Inherited, trait, dynamic member, or constant requires receiver resolution');
      else add(stale, line, id, `No public member on ${resolved}`);
    }
    for (const {line, code, literalCode} of rs) {
      if (/\buse\s+[^;]*\{/.test(code)) { add(unresolved, line, code.trim(), 'Grouped imports require binding expansion'); continue; }
      for (const m of literalCode.matchAll(/\bstoryfeed\.([a-z_]+(?:\.[a-z_]+)*)/g)) {
        if (api.config.includes(m[1])) mentions.add(`storyfeed.${m[1]}`);
        else if (/\bconfig\s*\(\s*['"]$/.test(literalCode.slice(0, m.index)) ) add(stale, line, m[0], 'Literal config key absent from config/storyfeed.php');
        else add(unresolved, line, m[0], 'Could be a route, view, or translation name rather than config');
      }
      for (const m of code.matchAll(/(?<![\w\\])\\?[A-Z][\w\\]*(?:::(?:\$?\w+))?/g)) {
        const [name, member] = m[0].split('::'); classRef(name, line, member);
      }
      for (const m of code.matchAll(/(?:->\s*|\b)([a-zA-Z_]\w*)\s*\(/g)) {
        const name = m[1];
        if (/::\s*$/.test(code.slice(0, m.index))) continue;
        if (methods.has(name)) { for (const [n,c] of Object.entries(api.classes)) if (c.methods.includes(name)) mentions.add(`${n}::${name}`); continue; }
        if (['if','match','isset','empty','array','function','fn','foreach','switch','catch','while'].includes(name)) continue;
        // Bare historic method names are ambiguous too, except explicit migration
        // evidence in Unreleased. Local functions and unknown receivers stay unresolved.
        if (name === 'toFeedLink' && api.historyMethods.has(name) && /toFeedLink/.test(api.changelog) && !/->/.test(m[0]) && (!new RegExp(`function\\s+${name}\\s*\\(`).test(rs.map(r => r.code).join('\n')) || /implements\s+Feedable\b/.test(rs.map(r => r.code).join('\n')) && resolveName('Feedable', aliases, locals) === 'Storyfeed\\Contracts\\Feedable')) add(stale, line, name, 'Removed Feedable method; confirmed by core history and Unreleased');
        else add(unresolved, line, name, 'Receiver/function ownership not proven');
      }
      for (const m of code.matchAll(/->\s*([a-zA-Z_]\w*)(?!\w)(?!\s*\()/g)) if (!properties.has(m[1])) add(unresolved, line, `->${m[1]}`, 'Property receiver or dynamic model attribute not proven');
    }
  }
  const fullText = docs.map(d => d.text).join('\n');
  const missing = [];
  for (const name of Object.keys(api.classes).sort()) if (!mentions.has(name) && !new RegExp(`\\b${short(name)}\\b`).test(fullText)) missing.push({ identifier: name, source: api.changelog.includes(short(name)) ? 'Unreleased' : 'public class backstop' });
  for (const [name,c] of Object.entries(api.classes)) for (const member of c.methods) if (api.changelog.includes(`${member}(`) && !mentions.has(`${name}::${member}`) && !fullText.includes(member)) missing.push({identifier: `${name}::${member}`, source: 'Unreleased'});
  for (const key of api.config) if (api.changelog.includes(`storyfeed.${key}`) && !fullText.includes(`storyfeed.${key}`)) missing.push({identifier: `storyfeed.${key}`, source: 'Unreleased'});
  missing.sort((a,b) => (a.source === b.source ? a.identifier.localeCompare(b.identifier, 'en') : a.source === 'Unreleased' ? -1 : 1));
  return { stale, missing, unresolved };
}
export function main(args = process.argv.slice(2)) {
  let core = defaultCore, root = resolve(here, '../..'), ref, json = false;
  for (let i=0; i<args.length; i++) {
    if (args[i] === '--json') json = true;
    else if (['--core','--docs-root','--docs-ref'].includes(args[i])) { const flag = args[i], val = args[++i]; if (!val || val.startsWith('--')) throw new Error(`Missing value for ${flag}`); if (flag === '--core') core = resolve(val); else if (flag === '--docs-root') root = resolve(val); else ref = val; }
    else if (args[i] === '--help') { console.log('node scripts/drift-detector/index.mjs [--core PATH] [--docs-root PATH] [--docs-ref REF] [--json]\nExit: 0 no stale (missing/unresolved informational), 1 stale, 2 input/tool failure. Requires Node and PHP CLI; no dependencies or network.'); return 0; }
    else throw new Error(`Unknown argument: ${args[i]}`);
  }
  const api = surface(core), report = { coreRevision: api.revision, docsRef: ref ?? 'working tree', ...analyze(api, documents(root, ref)) };
  if (json) console.log(JSON.stringify(report, null, 2));
  else {
    console.log(`Core ${report.coreRevision}; docs ${report.docsRef}`);
    for (const bucket of ['stale','missing','unresolved']) {
      console.log(`\n${bucket.toUpperCase()} (${report[bucket].length})`);
      for (const r of report[bucket]) console.log(`${r.file ? `${r.file}:${r.line}: ` : ''}${r.identifier}${r.suggestion ? ` → ${r.suggestion}` : ''} — ${r.reason ?? r.source}`);
    }
  }
  return report.stale.length ? 1 : 0;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) { try { process.exitCode = main(); } catch (e) { console.error(`Drift detector: ${e.message}`); process.exitCode = 2; } }
