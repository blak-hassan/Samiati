// scripts/check-image-sizes.mjs
// Audits image usage across the app:
//  1. Every <Image /> from next/image must declare numeric width+height (or a
//     layout that Next can size statically). An image without dimensions can
//     trigger layout shift (CLS) and is flagged by Next at build time.
//  2. Raw <img> tags are reported. They bypass the Next Image Optimizer; each
//     one is either migrated to <Image> or explicitly accepted.
//
// Exit code 1 if any hard errors are found (missing dimensions on <Image>).
// Raw <img> usage is reported as warnings and does not fail the gate.
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');
const SRC = join(ROOT, 'src');

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      walk(p, acc);
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      acc.push(p);
    }
  }
  return acc;
}

const files = walk(SRC);
const imageErrors = [];
const rawImgWarnings = [];

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const rel = file.replace(ROOT + '\\', '').replace(ROOT + '/', '');

  // <Image ... /> without width= or height= (numeric or via layout prop).
  // We only flag the common omission: a bare <Image> with no width/height.
  const imageRe = /<Image\b[^>]*>/g;
  let m;
  while ((m = imageRe.exec(src)) !== null) {
    const tag = m[0];
    const hasWidth = /\bwidth\s*=/.test(tag);
    const hasHeight = /\bheight\s*=/.test(tag);
    const hasLayout = /\b(layout|fill)\s*=/.test(tag);
    if (!hasWidth && !hasHeight && !hasLayout) {
      imageErrors.push(`${rel}: <Image> without width/height: ${tag.slice(0, 80)}`);
    }
  }

  // Raw <img> tags (excluding the decorative favicon in SourceCard, which is
  // intentionally a plain <img> for a static asset).
  const imgRe = /<img\b[^>]*>/g;
  while ((m = imgRe.exec(src)) !== null) {
    const tag = m[0];
    if (tag.includes('aria-hidden="true"')) continue; // decorative
    rawImgWarnings.push(`${rel}: raw <img>: ${tag.slice(0, 80)}`);
  }
}

console.log('Image-size audit');
console.log('='.repeat(80));

if (imageErrors.length) {
  console.log(`\n${imageErrors.length} <Image> without dimensions:`);
  for (const e of imageErrors) console.log(`  - ${e}`);
} else {
  console.log('0 <Image> missing width/height');
}

console.log(`\n${rawImgWarnings.length} raw <img> tags (non-decorative):`);
for (const w of rawImgWarnings.slice(0, 20)) console.log(`  ~ ${w}`);
if (rawImgWarnings.length > 20)
  console.log(`  ... and ${rawImgWarnings.length - 20} more`);

if (imageErrors.length) {
  console.log('\nFix: add numeric width/height (or layout="fill") to each <Image>.');
  process.exit(1);
}