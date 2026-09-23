// scripts/check-broken-links.mjs
// Builds the app, starts it, and crawls every internal link found in
// src/**/*.tsx. Reports any URL that returns 4xx/5xx (excluding auth-gated
// routes that redirect to /sign-in). Exit code 1 if any are broken.
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');
const BASE = process.env.BASE_URL || 'http://localhost:3000';
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

// Collect every href from <a>, <Link>, and next/link usage.
function collectHrefs(src) {
  const hrefs = new Set();
  // <a href="...">, <a href={'...'}>, <a href={...}>
  const re = /<a\b[^>]*\bhref\s*=\s*(?:\{?["']([^"']+)["']\}?|{([^}]+)})/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const v = m[1] || m[2];
    if (v && (v.startsWith('/') || v.startsWith('http'))) hrefs.add(v);
  }
  // href="..." inside <Link> / next/link.
  const re2 = /href\s*=\s*(?:\{?["']([^"']+)["']\}?|{([^}]+)})/g;
  while ((m = re2.exec(src)) !== null) {
    const v = m[1] || m[2];
    if (v && (v.startsWith('/') || v.startsWith('http'))) hrefs.add(v);
  }
  return hrefs;
}

const files = walk(SRC);
const hrefs = new Set();
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  for (const h of collectHrefs(src)) hrefs.add(h);
}

// Filter to same-origin internal paths.
const origin = new URL(BASE).origin;
const internal = [...hrefs].filter((h) => {
  try {
    const u = new URL(h, BASE);
    return u.origin === origin;
  } catch {
    return h.startsWith('/');
  }
});

console.log(`Found ${internal.length} internal link target(s) to check`);

// Build the app so the dev server serves real routes.
console.log('Building app (this takes a moment)...');
const build = spawnSync('npx', ['next', 'build'], { cwd: ROOT, stdio: 'inherit' });
if (build.status !== 0) {
  console.error('Build failed — aborting link check');
  process.exit(1);
}

// Start the production server.
const { spawn } = await import('node:child_process');
const server = spawn('npm', ['run', 'start', '--', '--port', '3000'], {
  cwd: ROOT,
  stdio: ['ignore', 'pipe', 'pipe'],
});
let stderr = '';
server.stderr.on('data', (d) => (stderr += d.toString()));
server.stdout.on('data', (d) => process.stdout.write(d));

// Wait for the server to accept connections.
async function waitForServer(url, timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: 'manual' });
      return res;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error('Server did not start in time');
}

try {
  await waitForServer(BASE);
  console.log('Server ready');

  const broken = [];
  const authOk = new Set(['/sign-in', '/sign-up']);
  for (const path of internal) {
    try {
      const res = await fetch(new URL(path, BASE), { redirect: 'manual' });
      // 2xx/3xx = OK. 401/302-to-sign-in = auth-gated (acceptable).
      if (res.status >= 400) {
        broken.push({ path, status: res.status });
      } else if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get('location') || '';
        // Auth-gated routes redirect to /sign-in — acceptable.
        if (authOk.has(new URL(loc, BASE).pathname)) {
          continue;
        }
        // Other redirects are fine as long as they land on a 2xx.
        try {
          const final = await fetch(new URL(loc, BASE), { redirect: 'follow' });
          if (final.status >= 400) broken.push({ path, status: final.status, via: loc });
        } catch {
          broken.push({ path, status: 0, error: 'redirect target unreachable', via: loc });
        }
      }
    } catch (e) {
      broken.push({ path, status: 0, error: e.message });
    }
  }

  if (broken.length === 0) {
    console.log(`link audit: 0 broken links across ${internal.length} targets`);
    process.exit(0);
  }

  console.log(`link audit: ${broken.length} broken link(s)`);
  for (const b of broken) {
    console.log(`  ${b.path} -> ${b.status}${b.error ? ` (${b.error})` : ''}`);
  }
  process.exit(1);
} finally {
  server.kill();
}