// scripts/check-cert-expiry.mjs
// TLS certificate expiry probe for the Samiati production surface.
// Complements docs/https-samiati-stack.md §9. Vendors (Vercel, Convex, Clerk)
// renew certificates automatically, but renewal failures are silent — this
// probes the live endpoints independently.
//
// Usage:
//   node scripts/check-cert-expiry.mjs              # probe DEFAULT_HOSTS
//   node scripts/check-cert-expiry.mjs extra.com …  # probe extra hostnames too
//   CERT_EXTRA_HOSTS="a.com b.com" node scripts/check-cert-expiry.mjs
//   CERT_WARN_DAYS=21 CERT_FAIL_DAYS=7              # thresholds (defaults)
//
// Exit codes (matches the repo's script-gate convention):
//   0 — every cert valid and above the fail threshold
//   1 — at least one cert expiring within FAIL_DAYS, invalid, or unreachable
//       (warn-level results are printed but do not fail)
import tls from 'node:tls';

// ── Samiati production surface ───────────────────────────────────────────────
// Update this list when the custom apex domain ships (see
// docs/https-samiati-stack.md §3) or when Convex/Clerk deployments change.
const DEFAULT_HOSTS = [
  'samiati-10.vercel.app', // app edge (Vercel-managed TLS)
  'gregarious-rat-550.convex.cloud', // Convex prod backend
  'nice-mullet-25.clerk.accounts.dev', // Clerk auth
];

const WARN_DAYS = Number(process.env.CERT_WARN_DAYS ?? 21);
const FAIL_DAYS = Number(process.env.CERT_FAIL_DAYS ?? 7);
const TIMEOUT_MS = 10_000;

const extraFromEnv = (process.env.CERT_EXTRA_HOSTS ?? '')
  .split(/\s+/)
  .filter(Boolean);
const hosts = [...new Set([...DEFAULT_HOSTS, ...extraFromEnv, ...process.argv.slice(2)])];

/**
 * Connects to host:443 and resolves with { days, validTo, issuer, subject }.
 * Rejects on connection failure, timeout, or handshake error.
 */
function probe(host) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(
      { host, port: 443, servername: host, timeout: TIMEOUT_MS },
      () => {
        const cert = socket.getPeerCertificate();
        if (!cert || !cert.valid_to) {
          socket.destroy();
          reject(new Error('no peer certificate presented'));
          return;
        }
        const validTo = new Date(cert.valid_to);
        resolve({
          days: Math.floor((validTo.getTime() - Date.now()) / 86_400_000),
          validTo: cert.valid_to,
          issuer: (cert.issuer?.O ?? cert.issuer?.CN ?? 'unknown').trim(),
          subject: cert.subject?.CN ?? host,
        });
        socket.end();
      },
    );
    socket.on('error', reject);
    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error(`connection timed out after ${TIMEOUT_MS / 1000}s`));
    });
  });
}

const results = await Promise.allSettled(
  hosts.map(async (host) => ({ host, ...(await probe(host)) })),
);

const rows = results.map((r, i) =>
  r.status === 'fulfilled'
    ? r.value
    : { host: hosts[i], days: null, validTo: null, issuer: '-', subject: '-', error: r.reason.message },
);

const pad = (s, n) => String(s).padEnd(n);
console.log('\nTLS certificate expiry report');
console.log(
  `${pad('HOST', 40)}${pad('DAYS LEFT', 10)}${pad('EXPIRES (UTC)', 26)}${pad('ISSUER', 28)}STATUS`,
);
console.log('-'.repeat(110));

let hasFailure = false;
for (const row of rows) {
  let status;
  if (row.error) {
    status = 'UNREACHABLE';
    hasFailure = true;
  } else if (row.days <= FAIL_DAYS) {
    status = 'FAIL (expiring/rotated)';
    hasFailure = true;
  } else if (row.days <= WARN_DAYS) {
    status = 'WARN';
  } else {
    status = 'OK';
  }
  const days = row.error ? 'n/a' : String(row.days);
  const expiry = row.error ? 'n/a' : new Date(row.validTo).toISOString().slice(0, 16).replace('T', ' ');
  console.log(
    `${pad(row.host, 40)}${pad(days, 10)}${pad(expiry, 26)}${pad(row.issuer, 28)}${status}`,
  );
  if (row.error) console.log(`    └─ ${row.error}`);
}

const warnCount = rows.filter((r) => !r.error && r.days <= WARN_DAYS && r.days > FAIL_DAYS).length;
console.log(
  `\n${rows.length} host(s) checked · thresholds: warn <= ${WARN_DAYS}d, fail <= ${FAIL_DAYS}d` +
    (hasFailure ? ' -> FAILURES present' : warnCount ? ` -> ${warnCount} warning(s)` : ' -> all healthy'),
);
process.exit(hasFailure ? 1 : 0);
