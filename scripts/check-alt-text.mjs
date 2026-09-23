// scripts/check-alt-text.mjs
// Scans src/**/*.tsx for <img> / next <Image> tags and reports any that
// are missing an `alt` prop, or use alt="" on a non-decorative image.
// Exit code 1 if any violations are found.
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');
const SRC = join(ROOT, 'src');

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      walk(p, out);
    } else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      out.push(p);
    }
  }
  return out;
}

const files = walk(SRC);
const violations = [];

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const rel = file.replace(ROOT + '\\', '').replace(ROOT + '/', '');

  // Match <img ... /> and <Image ... /> opening tags.
  const tagRe = /<(img|Image)\b[^>]*\/?>/g;
  let m;
  while ((m = tagRe.exec(src)) !== null) {
    const tag = m[0];
    // Skip comments.
    if (tag.trim().startsWith('<!--')) continue;

    // Skip <img> inside a comment block (cheap heuristic).
    const before = src.slice(0, m.index);
    const lastOpen = before.lastIndexOf('<!--');
    const lastClose = before.lastIndexOf('-->');
    if (lastOpen > lastClose) continue;

    // Skip data-uri placeholders and decorative aria-hidden wrappers.
    const isDecorative = /aria-hidden\s*=\s*["']true["']/.test(tag);

    // Check for an alt attribute.
    const altMatch = tag.match(/\balt\s*=\s*(\{[^}]*\}|["'][^"']*["'])/);
    if (!altMatch) {
      violations.push({ file: rel, tag: tag.slice(0, 80), issue: 'missing alt' });
      continue;
    }
    const altValue = altMatch[1];
    // alt="" is only acceptable on decorative images.
    if (altValue === '""' || altValue === "''") {
      if (!isDecorative) {
        violations.push({ file: rel, tag: tag.slice(0, 80), issue: 'alt="" on non-decorative image' });
      }
    }
  }
}

if (violations.length === 0) {
  console.log(`alt-text audit: 0 violations across ${files.length} files`);
  process.exit(0);
}

console.log(`alt-text audit: ${violations.length} violation(s) across ${files.length} files`);
for (const v of violations) {
  console.log(`  ${v.file}: ${v.issue} — ${v.tag}`);
}
process.exit(1);