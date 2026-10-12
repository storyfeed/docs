import { readdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, relative, extname } from 'node:path';

export function violations(file, source, allowlist = {}) {
  source = source.replaceAll('\r\n', '\n');
  const entries = allowlist[file] ?? [];
  // Freeze legacy debt to this one existing theme override file. Burn down,
  // never add debt entries, including additions in already allowed files.
  for (const entry of entries) {
    if (!['genuine', 'debt'].includes(entry.kind)) return [`${file}: missing or invalid exception kind`];
    if (entry.kind === 'debt' && (file !== 'docs/.vitepress/theme/custom.css' || entries.length !== 1 || !entry.conversion?.trim())) {
      return [`${file}: debt must be burned down, never added; existing debt needs a conversion plan`];
    }
  }
  if (extname(file).toLowerCase() === '.css') {
    const entry = entries[0];
    return entry?.reason && entry.sha256 === createHash('sha256').update(source).digest('hex')
      ? [] : [`${file}: unreviewed or changed CSS exception`];
  }
  const errors = [];
  for (const entry of entries) {
    if (!entry.reason?.trim() || source.split(entry.pattern).length - 1 !== entry.count) {
      errors.push(`${file}: stale or unexplained exception`);
    } else source = source.split(entry.pattern).join('');
  }
  if (/<style\b/i.test(source)) errors.push(`${file}: unlisted style block`);
  if (/(?<![\w-])(?:v-bind:style|:style|style)\s*=|[,{]\s*(?:style|['"]style['"])\s*:/i.test(source)) {
    errors.push(`${file}: unlisted style binding`);
  }
  return errors;
}

export function scan(root = resolve('.')) {
  const allowlist = JSON.parse(readFileSync(resolve(root, 'scripts/tailwind-allowlist.json'), 'utf8'));
  const seen = new Set();
  const errors = [];
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = resolve(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (/\.(css|vue|tsx|jsx|ts|js|html)$/i.test(entry.name)) {
        const file = relative(root, path).replaceAll('\\', '/');
        seen.add(file);
        errors.push(...violations(file, readFileSync(path, 'utf8'), allowlist));
      }
    }
  }
  // Only authored theme/components and the Markdown renderer config. Exclude
  // generated dist/cache, dependencies, sample payloads and Markdown examples.
  walk(resolve(root, 'docs/.vitepress/theme'));
  const config = 'docs/.vitepress/config.ts';
  seen.add(config);
  errors.push(...violations(config, readFileSync(resolve(root, config), 'utf8'), allowlist));
  for (const file of Object.keys(allowlist)) if (!seen.has(file)) errors.push(`${file}: missing exception file`);
  return errors;
}
