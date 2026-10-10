// Rule 20 (.agents/rules/frontend-rules.md): every Angular component has its own .ts, .html,
// .css and .spec.ts, with no inline `template:` / `styles:`. Exits 1 when any component breaks it.
// Usage: node scripts/check-components.mjs [app ...]   (default: every app under apps/)
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', 'apps');
const apps = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync(root).filter((a) => existsSync(join(root, a, 'angular.json')));

function* tsFiles(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* tsFiles(path);
    else if (name.endsWith('.ts') && !name.endsWith('.spec.ts')) yield path;
  }
}

let failures = 0;
for (const app of apps) {
  const src = join(root, app, 'src');
  let count = 0;
  const problems = [];
  for (const file of tsFiles(src)) {
    const text = readFileSync(file, 'utf8');
    if (!/@Component\s*\(/.test(text)) continue;
    count++;
    const base = file.slice(0, -3);
    const missing = ['.html', '.css', '.spec.ts'].filter((ext) => !existsSync(base + ext));
    const inline = /\btemplate\s*:/.test(text) || /\bstyles\s*:/.test(text);
    if (missing.length || inline) problems.push(`  ${file.slice(root.length + 1)}${missing.length ? `  missing ${missing.join(' ')}` : ''}${inline ? '  inline template/styles' : ''}`);
  }
  console.log(`${problems.length ? '✗' : '✓'} ${app}: ${count} components, ${problems.length} breaking Rule 20`);
  problems.forEach((p) => console.log(p));
  failures += problems.length;
}
process.exit(failures ? 1 : 0);
