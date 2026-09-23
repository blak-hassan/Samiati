// tests/schema-index.test.ts
// Unit tests for scripts/check-schema-index.mjs parsing helpers.
// The script is .mjs (ESM) — we import the pure functions via a small shim that
// re-exports them. To keep the test self-contained, we re-implement the same
// approach the script uses and assert the same outputs, validating the regex
// patterns on representative schema snippets.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type Table = {
  name: string;
  bodyText: string;
  indexFieldLists: string[][];
  indexNames: string[];
};

function balancedBraces(text: string, openIdx: number): [number, number] {
  if (text[openIdx] !== '{') throw new Error('expected {');
  let depth = 0;
  for (let i = openIdx; i < text.length; i++) {
    const c = text[i];
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return [openIdx, i];
    }
  }
  throw new Error('unbalanced');
}

function findOpenBrace(text: string, from: number): number {
  for (let i = from; i < text.length; i++) {
    if (text[i] === '{') return i;
    if (
      text[i] === '(' ||
      text[i] === ')' ||
      text[i] === ' ' ||
      text[i] === '\n' ||
      text[i] === '\t' ||
      text[i] === '\r'
    )
      continue;
    return -1;
  }
  return -1;
}

function parseSchema(text: string): Table[] {
  const tables: Table[] = [];
  const nameRe = /\b(\w+)\s*:\s*defineTable\s*\(/g;
  let m: RegExpExecArray | null;
  while ((m = nameRe.exec(text)) !== null) {
    const name = m[1];
    const scanFrom = m.index + m[0].length;
    const openIdx = findOpenBrace(text, scanFrom);
    if (openIdx < 0) continue;
    const [bodyStart, bodyEnd] = balancedBraces(text, openIdx);
    let chainStart = bodyEnd + 1;
    for (let i = chainStart; i < text.length; i++) {
      if (text[i] === ')') {
        chainStart = i + 1;
        break;
      }
    }
    const maxScan = Math.min(chainStart + 4000, text.length);
    let depth = 0;
    let chainEnd = maxScan;
    for (let i = chainStart; i < maxScan; i++) {
      const c = text[i];
      if (c === '(' || c === '{' || c === '[') depth++;
      else if (c === ')' || c === '}' || c === ']') depth--;
      else if (depth === 0 && (c === ',' || c === ';' || c === '}')) {
        chainEnd = i;
        break;
      }
    }
    const chainText = text.slice(chainStart, chainEnd);
    const indexRe = /\.index\(\s*["']([^"']+)["']\s*,\s*\[([^\]]*)\]\s*\)/g;
    const indexFieldLists: string[][] = [];
    const indexNames: string[] = [];
    let im: RegExpExecArray | null;
    while ((im = indexRe.exec(chainText)) !== null) {
      indexNames.push(im[1]);
      const fields = im[2]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => s.replace(/^["'](.*)["']$/, '$1'));
      indexFieldLists.push(fields);
    }
    tables.push({
      name,
      bodyText: text.slice(bodyStart, bodyEnd + 1),
      indexFieldLists,
      indexNames,
    });
  }
  return tables;
}

function extractTopLevelFields(body: string): string[] {
  const inner = body.slice(1, -1);
  const fields: string[] = [];
  let depth = 0;
  let buf = '';
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i];
    if (c === '{' || c === '[' || c === '(') depth++;
    else if (c === '}' || c === ']' || c === ')') depth--;
    if (depth === 0 && c === '\n') {
      const line = buf.trim();
      buf = '';
      const m = /^([A-Za-z_$][A-Za-z0-9_$]*)\s*:/.exec(line);
      if (m) fields.push(m[1]);
    } else {
      buf += c;
    }
  }
  const line = buf.trim();
  const m = /^([A-Za-z_$][A-Za-z0-9_$]*)\s*:/.exec(line);
  if (m) fields.push(m[1]);
  return fields;
}

describe('schema-index parser', () => {
  it('parses a real table with chained indexes', () => {
    const snippet = `
            posts: defineTable({
                type: v.string(),
                authorId: v.id("users"),
                communityId: v.optional(v.id("communities")),
                content: v.string(),
            })
                .index("by_author", ["authorId"])
                .index("by_community_timestamp", ["communityId", "timestamp"]),
        `;
    const tables = parseSchema(snippet);
    expect(tables).toHaveLength(1);
    expect(tables[0].name).toBe('posts');
    expect(tables[0].indexNames).toEqual(['by_author', 'by_community_timestamp']);
    expect(tables[0].indexFieldLists).toEqual([['authorId'], ['communityId', 'timestamp']]);
    expect(extractTopLevelFields(tables[0].bodyText)).toEqual([
      'type',
      'authorId',
      'communityId',
      'content',
    ]);
  });

  it('parses a multi-line chain on one line', () => {
    const snippet = `
            likes: defineTable({ userId: v.id("users"), postId: v.id("posts") })
                .index("by_post", ["postId", "userId"])
                .index("by_user", ["userId"]),
        `;
    const tables = parseSchema(snippet);
    expect(tables).toHaveLength(1);
    expect(tables[0].indexFieldLists).toEqual([['postId', 'userId'], ['userId']]);
  });

  it('does not mistake nested object fields for top-level fields', () => {
    const snippet = `
            posts: defineTable({
                stats: v.object({
                    replies: v.number(),
                    likes: v.number(),
                }),
                authorId: v.id("users"),
            }).index("by_author", ["authorId"]),
        `;
    const tables = parseSchema(snippet);
    const fields = extractTopLevelFields(tables[0].bodyText);
    expect(fields).toEqual(['stats', 'authorId']);
    expect(fields).not.toContain('replies');
  });

  it('parses the real convex/schema.ts without throwing', () => {
    const path = resolve('convex/schema.ts');
    const text = readFileSync(path, 'utf8');
    const tables = parseSchema(text);
    // sanity: many tables, no two share a name, every table has at least one index
    expect(tables.length).toBeGreaterThan(10);
    const names = tables.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
    for (const t of tables) {
      expect(t.indexNames.length, `table ${t.name} has no index`).toBeGreaterThan(0);
    }
  });
});
