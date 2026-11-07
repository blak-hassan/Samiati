/**
 * One-off repair tool for the mojibake introduced by Windows PowerShell
 * reading UTF-8 files as CP1252.
 *
 * The corruption chain was:
 *   original UTF-8 bytes -> read as CP1252 -> written back as UTF-8
 *
 * This reverses it byte-exactly: a byte that CP1252 renders as a special
 * character is mapped back to its original byte, then the reconstructed byte
 * sequence is decoded as UTF-8. Text that was never corrupted is left alone.
 *
 * Usage: node scripts/repair-encoding.mjs <file> [...]
 */
import { readFile, writeFile } from "node:fs/promises";

// CP1252 code points that stand in for bytes 0x80-0x9F.
const CP1252_SPECIAL = new Map([
  [0x20ac, 0x80], [0x201a, 0x82], [0x0192, 0x83], [0x201e, 0x84],
  [0x2026, 0x85], [0x2020, 0x86], [0x2021, 0x87], [0x02c6, 0x88],
  [0x2030, 0x89], [0x0160, 0x8a], [0x2039, 0x8b], [0x0152, 0x8c],
  [0x017d, 0x8e], [0x2018, 0x91], [0x2019, 0x92], [0x201c, 0x93],
  [0x201d, 0x94], [0x2022, 0x95], [0x2013, 0x96], [0x2014, 0x97],
  [0x02dc, 0x98], [0x2122, 0x99], [0x0161, 0x9a], [0x203a, 0x9b],
  [0x0153, 0x9c], [0x017e, 0x9e], [0x0178, 0x9f],
]);

/** The byte a CP1252-rendered character stands for. */
function byteOf(codePoint) {
  const special = CP1252_SPECIAL.get(codePoint);
  if (special !== undefined) return special;
  if (codePoint >= 0x00 && codePoint <= 0xff) return codePoint;
  return null;
}

/** The number of bytes a UTF-8 sequence starting with this lead byte needs. */
function sequenceLength(lead) {
  if (lead >= 0xf0) return 4;
  if (lead >= 0xe0) return 3;
  if (lead >= 0xc0) return 2;
  return 1;
}

export function repair(text) {
  let output = "";
  let index = 0;

  while (index < text.length) {
    const code = text.codePointAt(index);
    const lead = byteOf(code);

    if (lead === null || lead < 0xc2) {
      output += String.fromCodePoint(code);
      index += String.fromCodePoint(code).length;
      continue;
    }

    const needed = sequenceLength(lead);
    const bytes = [lead];
    let cursor = index + String.fromCodePoint(code).length;
    let valid = needed > 1;

    for (let position = 1; position < needed; position += 1) {
      if (cursor >= text.length) {
        valid = false;
        break;
      }
      const nextCode = text.codePointAt(cursor);
      const nextByte = byteOf(nextCode);
      if (nextByte === null || nextByte < 0x80 || nextByte > 0xbf) {
        valid = false;
        break;
      }
      bytes.push(nextByte);
      cursor += String.fromCodePoint(nextCode).length;
    }

    if (!valid) {
      output += String.fromCodePoint(code);
      index += String.fromCodePoint(code).length;
      continue;
    }

    const buffer = Uint8Array.from(bytes);
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    output += decoded;
    index = cursor;
  }

  return output;
}

let changed = 0;
for (const file of process.argv.slice(2)) {
  const original = await readFile(file, "utf8");
  const fixed = repair(original);
  if (fixed !== original) {
    await writeFile(file, fixed, "utf8");
    changed += 1;
    console.log(`repaired ${file}`);
  } else {
    console.log(`clean    ${file}`);
  }
}
console.log(`${changed} file(s) repaired`);
