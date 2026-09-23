# Security Checklist Review: "Vibe-Coded" Web Applications

Scope: Review a baseline 27-item security checklist, score its coverage, identify
gaps, and deliver an expanded, categorized checklist tuned for fast-moving
modern web apps where speed is prioritized over security.

Severity scale: **H** = high impact, **M** = medium, **L** = low.

---

## 1. Evaluation of the Original 27 Items

| # | Item | Sig | Rationale |
|---|------|-----|-----------|
| 1 | Exposed DB credentials | **H** | Direct breach vector; one leak = full DB exfiltration. |
| 2 | Public .env files | **H** | Common in early deploys (Vercel/Netlify/static hosts). |
| 3 | Weak authentication | **H** | Enables takeover via credential stuffing / brute force. |
| 4 | Hardcoded secrets | **H** | Persists in repo + image layers. |
| 5 | Missing authorization checks | **H** | Causes IDOR, privilege escalation, tenant bleed. |
| 6 | Cross-user access (IDOR / BOLA) | **H** | Direct user-to-user compromise. |
| 7 | Open DB permissions | **H** | Public DB = full compromise. |
| 8 | Cloud service misconfigurations | **H** | Public S3/GCS buckets, open security groups. |
| 9 | Exposed production debug tools | **H** | `/debug`, `/graphql` introspection, `/actuator`, Sentry replays. |
| 10 | Secrets leaked in logs | **M** | Aggregated risk; often indirect but persistent. |
| 11 | Verbose production error messages | **M** | Stack traces leak internals, paths, query fragments. |
| 12 | Secrets in Git history | **H** | Permanent; requires rotation + history rewrite. |
| 13 | Secrets in client-side JS | **H** | Bundle-leaked API keys. |
| 14 | Client-side only input validation | **H** | No real validation if server trusts it. |
| 15 | SQL injection | **H** | Still common when raw queries + string concat. |
| 16 | NoSQL injection | **H** | `$ne`, `$gt`, `$where` in Mongo. |
| 17 | Insecure file uploads | **H** | RCE via polyglot files, path traversal, content-type bypass. |
| 18 | Weak session management | **H** | No rotation, long-lived sessions, missing cookie flags. |
| 19 | Broken password reset flows | **H** | Account takeover via token reuse, weak tokens. |
| 20 | Path traversal vulnerabilities | **M** | Common in file-serving endpoints, archive extraction. |
| 21 | Missing rate limits | **M** | Enables brute force, scraping, DoS. |
| 22 | Payment / subscription enforced only on frontend | **H** | Anyone can bypass; trivially exploited. |
| 23 | SSRF | **H** | Especially when proxies, webhooks, link previews, AI tools fetch URLs. |
| 24 | XSS | **H** | Stored XSS in CMS/comments/AI output is catastrophic. |
| 25 | CSRF | **M** | Lower with SameSite=Lite + JSON APIs, but state-changing endpoints still need protection. |
| 26 | Exposed source maps | **M** | Reveals source paths, comments, sometimes secrets. |
| 27 | Unverified payment webhooks | **H** | Spoofed "payment succeeded" = free goods/services. |

**Verdict:** Strong baseline. Biased toward classic injection, authz, secrets
infrastructure, and payment business logic. Light on supply chain, cryptography,
API/GraphQL specifics, headers/CORS, AI/LLM risks, observability, DoS, race
conditions, and third-party integration hygiene.

---

## 2. Gaps

Missing categories, in approximate priority order:

1. Supply chain & build pipeline — vulnerable deps, dependency confusion, malicious packages, unsafe CI, unsigned auto-updates.
2. Cryptography & token design — weak hashing, JWT misuse (alg:none, no exp/aud, weak secret), `Math.random()` for tokens, missing TLS hardening.
3. API / GraphQL specifics — over-fetching, mass assignment, missing depth/complexity limits, introspection in prod, BOLA at the API layer.
4. Security headers & browser hardening — CSP, `X-Frame-Options` / `frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP/COEP.
5. CORS misconfiguration — wildcard origins with credentials, dynamic origin reflection.
6. Authentication internals — OAuth/OIDC misuse, session fixation, account enumeration, MFA bypass, long-lived tokens, JWT-in-localStorage.
7. Authorization internals — vertical/horizontal privilege escalation, function-level checks, tenant isolation in multi-tenant SaaS.
8. Race conditions & business-logic concurrency — double-spend, double-redeem, TOCTOU.
9. Denial of service — ReDoS, large payloads, expensive queries, slowloris, resource exhaustion, payment-flood.
10. Observability & IR — insufficient security logging, no alerting, log injection, missing audit trails.
11. Data protection & privacy — PII over-collection, no masking in non-prod, GDPR/CCPA, exposed backups.
12. Third-party / integration hygiene — overly permissive OAuth scopes, embedded iframes, third-party SDKs that phone home, ad-network malvertising.
13. Webhooks & async jobs — replay attacks, missing idempotency keys, async job injection.
14. File/storage — symlink attacks, ZIP slip, XXE, prototype pollution, serving user uploads with permissive content-type.
15. Deployment hygiene — staging publicly reachable, test endpoints in prod, dev tooling shipped, secrets in Docker image layers.
16. AI / LLM specific — prompt injection, indirect prompt injection via fetched content, training data leakage, insecure output handling, expensive-prompt DoS.
17. Subdomain takeover / DNS rebinding — dangling CNAMEs, DNS rebinding against local/internal services.
18. Clickjacking, postMessage, WebSocket origin validation.
19. Compliance — PCI tokenization skipped, COPPA, missing privacy/ToS links.

---

## 3. Expanded, Categorized Checklist

### A. Secrets & Credentials
- **A1. Exposed DB credentials** (H) — pasted in Notion/README; rotate, use IAM/short-lived creds.
- **A2. Public .env files** (H) — Vercel/Netlify/Nginx serve project root. Blocklist `.env`, `.env.*`.
- **A3. Hardcoded secrets** (H) — search repo + image layers (`trufflehog`, `gitleaks`).
- **A4. Secrets in logs** (M) — scrub tokens/PII; structured logger with allow-list.
- **A5. Secrets in Git history** (H) — rotate + BFG/rebase + force-push awareness.
- **A6. Secrets in client-side JS** (H) — grep `process.env` and bundle; never ship server secrets.
- **A7. Secrets in Docker image layers** (H) — multi-stage builds; use build args, not `ENV`.
- **A8. Secrets in error reports / APM** (H) — Sentry/Bugsnag with allow-list + scrubbing.
- **A9. Secrets in backup / DB dumps** (H) — encrypt, separate account, expire.
- **A10. Long-lived API keys** (M) — rotate, scope minimally, prefer OAuth + short-lived tokens.

### B. Authentication
- **B1. Weak auth / no password policy** (H) — HIBP check, length-based rules.
- **B2. Plain-text or reversible password storage** (H) — argon2id / bcrypt cost ≥ 12 / scrypt.
- **B3. Credential stuffing / brute force** (H) — per-IP+per-account rate limit, lockout, captcha.
- **B4. Account enumeration** (H) — uniform responses / timing on signup, login, reset.
- **B5. Session fixation** (M) — rotate session ID on login.
- **B6. Missing / weak MFA** (H) — TOTP or WebAuthn; never SMS-only.
- **B7. MFA bypass (push fatigue, code reuse, backup codes)** (H) — number-matching, rate-limit attempts, single-use.
- **B8. OAuth/OIDC misuse** (H) — enforce `state`, PKCE, exact `redirect_uri` match, `iss`/`aud`/`exp`.
- **B9. Open redirect on auth flows** (H) — allow-list domains, no user-controlled final hop.
- **B10. JWT misuse** (H) — verify signature explicitly, reject `alg:none`, set exp/aud/iss/nbf, strong secret or asymmetric.
- **B11. JWT in localStorage** (M) — prefer httpOnly Secure SameSite cookies.
- **B12. Weak password reset flow** (H) — single-use, expiring (≤ 1h), hashed-at-rest tokens, constant-time compare.
- **B13. Email-link pre-activation / unsigned magic links** (H) — sign + expire; do not auto-login from emailed link without confirmation when sensitive.
- **B14. Social login email collision / unverified email claim** (M) — verify ownership before merge.

### C. Authorization
- **C1. Missing function-level access checks** (H) — middleware on every route, not just UI gating.
- **C2. IDOR / BOLA** (H) — every object access checks owner + tenant.
- **C3. Vertical privilege escalation** (H) — role checks on admin endpoints; not just hidden routes.
- **C4. Horizontal privilege escalation** (H) — separate per-tenant scopes.
- **C5. Tenant isolation failure in multi-tenant SaaS** (H) — schema / row-level security, shared nothing where possible.
- **C6. Mass assignment / parameter pollution** (H) — explicit allow-list DTOs, never `Object.assign(req.body)`.
- **C7. JWT/scope drift** (M) — re-validate scopes per request, not just per session.
- **C8. Server-side enforcement of paid features** (H) — never trust client flags.

### D. Input / Output Handling
- **D1. SQL injection** (H) — parameterized queries; ORM with raw escape; least-privilege DB user.
- **D2. NoSQL injection** (H) — type-check inputs; forbid `$where`/operators from user input.
- **D3. XSS (reflected, stored, DOM-based)** (H) — context-aware escaping; CSP; never `dangerouslySetInnerHTML` / `v-html` / `innerHTML` on user content.
- **D4. Stored XSS via AI output / rich text / markdown** (H) — sanitize HTML; sandbox `<iframe>` / `<script>`.
- **D5. Server-side validation missing** (H) — Zod/Joi/Valibot at trust boundary; never trust client.
- **D6. Path traversal** (M) — canonicalize paths; reject `..`, symlinks; allow-list prefixes.
- **D7. Unsafe deserialization** (H) — JSON.parse on trusted shapes; never `pickle`/`yaml.unsafeLoad`/Node `vm`/`eval`.
- **D8. Prototype pollution** (H) — `Object.freeze(Object.prototype)`; structured clone; `Object.create(null)` for maps.
- **D9. XXE / SSRF in XML / URL fetchers** (H) — disable external entities; URL allow-list for fetchers.
- **D10. CSV/Excel formula injection** (M) — prefix cells starting with `=,+,-,@,\t,\r`.
- **D11. ReDoS** (M) — safe regexes; test catastrophic backtracking.

### E. Injection via Files / Storage
- **E1. Insecure file uploads** (H) — content-type + magic-byte validation, store outside webroot, random names, AV/scan, size limits, image re-encode.
- **E2. Serving user uploads from same origin** (H) — separate domain / cookie scope (e.g., `cdn.example.com`) to defang XSS.
- **E3. Polyglot / SVG-as-HTML / HTML uploads** (H) — serve as `application/octet-stream` or re-encode.
- **E4. ZIP slip / tar symlink** (M) — strip `..`, resolve symlinks, validate member paths.
- **E5. Path traversal in static / download endpoints** (M) — see D6.
- **E6. Arbitrary file write** (H) — destination allow-list; never write to user-controlled path.
- **E7. Public bucket with object listing** (H) — bucket policies; random opaque names; signed URLs.

### F. Cryptography
- **F1. Weak hash (MD5/SHA1/plain SHA256)** (H) — argon2id for passwords; HMAC-SHA256 for tokens.
- **F2. Hardcoded encryption keys / IV reuse** (H) — KMS/HSM; random IV per record; AEAD (AES-GCM, ChaCha20-Poly1305).
- **F3. TLS misconfig** (H) — TLS 1.2+ only; strong ciphers; HSTS with preload; OCSP stapling.
- **F4. Mixed content** (M) — `Content-Security-Policy: upgrade-insecure-requests`.
- **F5. `Math.random()` for tokens / IDs** (H) — `crypto.randomUUID`, `crypto.randomBytes`.
- **F6. Insecure cookie flags** (H) — `Secure; HttpOnly; SameSite=Lax` (or `Strict`); `__Host-` prefix where applicable.
- **F7. Long-lived / non-rotating signing keys** (M) — KMS rotation; key versioning in JWT header.

### G. Session & Token Hygiene
- **G1. Weak session management** (H) — regenerate ID on login/privilege change; bind to UA/IP loosely only when feasible.
- **G2. Tokens in URLs** (M) — referrer/log leakage; use headers/body.
- **G3. Missing logout / server-side revocation** (H) — blacklist or rotate JWT secret; logout invalidates refresh tokens.
- **G4. Refresh token theft / replay** (H) — rotation + reuse detection; bind to client fingerprint (DPoP or similar).
- **G5. Concurrent sessions unrestricted** (L) — at least detect and notify.

### H. Web / Browser Hardening
- **H1. CSRF on state-changing requests** (M) — SameSite=Lite + double-submit token / origin check for non-GET.
- **H2. CORS misconfig** (H) — never wildcard with credentials; exact origin allow-list; reflect only vetted origins.
- **H3. Missing security headers** (H) — CSP (with nonce/hash), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `X-Frame-Options` / `frame-ancestors`.
- **H4. Clickjacking** (M) — `frame-ancestors 'none'` for non-embeddable pages.
- **H5. Insecure `postMessage`** (M) — exact origin check; never use `event.source` blindly.
- **H6. WebSocket origin not validated** (M) — check `Origin` on upgrade.
- **H7. Subresource Integrity not used** (M) — `integrity` + `crossorigin` for CDN scripts.
- **H8. DNS prefetch / preconnect leaks** (L) — `Referrer-Policy`.
- **H9. Subdomain takeover** (H) — audit CNAMEs to ephemeral SaaS; remove dangling records.
- **H10. DNS rebinding** (M) — bind servers to `127.0.0.1` only when dev tools are reachable from web.

### I. API / GraphQL
- **I1. Excessive data exposure** (H) — DTO projection; never return whole DB rows.
- **I2. Mass assignment** (H) — see C6.
- **I3. Missing query cost limits** (H) — GraphQL depth/complexity, persisted operations, rate limit per query cost.
- **I4. Introspection / playground in prod** (M) — disable in production.
- **I5. Batch / alias abuse** (M) — limit batching + alias count.
- **I6. REST pagination DoS** (M) — cap `page size`/`offset` server-side.
- **I7. Webhook signature verification** (H) — HMAC verify, constant-time, replay window, idempotency key, unique secret per provider.
- **I8. Webhook replay attacks** (H) — nonce + timestamp tolerance (≤ 5 min).
- **I9. Missing idempotency keys on mutating endpoints** (M) — prevents double-charge / double-create.
- **I10. Inconsistent auth across versions** (M) — deprecate explicitly; shadow-test new auth on old routes.

### J. Business Logic & Concurrency
- **J1. Frontend-only payment / subscription enforcement** (H) — server-side entitlement checks on every request.
- **J2. Race conditions (double-redeem, double-spend, double-vote)** (H) — DB unique constraints, optimistic locks, atomic ops, idempotent endpoints.
- **J3. Coupon / discount stacking** (M) — explicit composition rules; never trust client-computed totals.
- **J4. Logic in webhooks only (out-of-band events)** (M) — reconcile against authoritative state.
- **J5. TOCTOU between auth check and action** (H) — atomic transaction.
- **J6. Unverified email before privilege** (M) — gate sensitive flows on `email_verified`.

### K. Infrastructure & Cloud
- **K1. Open DB permissions** (H) — security groups / VPC peering / firewall; no `0.0.0.0/0`.
- **K2. Cloud service misconfig** (H) — S3/GCS/Azure blobs private by default; least-privilege IAM; org SCPs.
- **K3. Exposed admin / debug endpoints** (H) — `/actuator`, `/_debug`, `/graphiql`, `phpinfo`, `phpMyadmin`, `Kibana`, `Grafana`, `RabbitMQ`, `Redis`, `Elastic`, `Adminer`, `Swagger`, `/console`.
- **K4. Default credentials** (H) — rotate all defaults; secret scan infra-as-code.
- **K5. Public staging / pre-prod** (H) — auth gate; no real user data.
- **K6. Outdated base images / OS** (H) — minimal distroless images; CVE scan in CI.
- **K7. Privileged containers / host mounts** (H) — read-only FS, drop capabilities, no `:ro` violation.
- **K8. Public CI artifacts** (M) — short retention; signed releases.
- **K9. Exposed `.git` / `.svn` / `.hg` / `.DS_Store`** (H) — block in reverse proxy.
- **K10. Verbose production errors / stack traces** (M) — generic messages; structured internal logs.
- **K11. Source maps public** (M) — upload to Sentry only; `#sourceMappingURL` not served.
- **K12. Health/info disclosure** (L) — `/version` returns version → patch within hours of CVE.

### L. Supply Chain & Build
- **L1. Vulnerable dependencies** (H) — `npm audit`, `pip-audit`, Dependabot/Renovate; SCA in CI.
- **L2. Lockfile not committed or out-of-sync** (M) — commit lockfile; CI uses lockfile install.
- **L3. Dependency confusion / typosquatting** (H) — scoped packages, private registry, integrity hashes.
- **L4. Post-install scripts (`postinstall`) executed** (H) — `--ignore-scripts`; review.
- **L5. Malicious or compromised transitive dep** (H) — pin versions; reproducible builds; SBOM.
- **L6. Insecure CI/CD pipeline** (H) — least-privilege tokens; signed commits; isolated runners.
- **L7. Auto-update without signature verification** (H) — sigstore / The Update Framework.
- **L8. Generated code / scaffolds with default flaws** (M) — review `create-*` starters.
- **L9. Test data / fixtures shipped** (M) — never commit real customer data.

### M. Logging, Monitoring & IR
- **M1. Insufficient logging of security events** (H) — login, privilege change, admin actions, payouts.
- **M2. PII in logs** (H) — scrub; sample/redact in non-prod.
- **M3. Log injection (CRLF)** (M) — structured JSON logging; encode control chars.
- **M4. No alerting on suspicious activity** (H) — impossible-travel, sudden admin grants, mass export.
- **M5. Missing audit trail** (H) — append-only, tamper-evident for sensitive ops.
- **M6. Secrets in APM / error tracking** (H) — see A8.
- **M7. Logs accessible to low-trust users** (M) — segregate; redact at ingest.

### N. Denial of Service & Abuse
- **N1. Missing rate limits** (M→H depending on endpoint) — per-IP, per-account, per-endpoint, per-cost.
- **N2. Expensive query abuse** (H) — query budgets; depth/complexity limits.
- **N3. Large payload abuse** (H) — body size limits; streaming for uploads.
- **N4. Crypto/encryption abuse** (M) — cost-based rate limit on password hashing, key derivation.
- **N5. Email / SMS bombing** (H) — per-address quotas + captcha.
- **N6. AI / LLM cost amplification** (H) — token-per-minute caps, prompt caching rules.
- **N7. Slowloris / connection exhaustion** (M) — timeouts, reverse-proxy limits.
- **N8. Cache poisoning / response splitting** (M) — header validation; RFC compliance.

### O. Third-Party / Integration
- **O1. Overly permissive OAuth scopes** (M) — request minimum; review third-party tokens.
- **O2. Third-party SDKs that phone home / leak data** (M) — review telemetry; opt out.
- **O3. Embedded iframes / widgets from untrusted vendors** (M) — sandbox attributes.
- **O4. Open redirect** (M) — see B9.
- **O5. Malvertising** (L) — sandbox ad iframes; CSP.
- **O6. CDN origin exposure** (H) — only CDN IPs reach origin; auth headers don't bypass origin security.

### P. Data Protection & Privacy
- **P1. PII over-collection / no retention policy** (H) — minimum data, scheduled deletion.
- **P2. Non-prod environments with real PII** (H) — synthetic data or tokenized.
- **P3. Backup files publicly accessible** (H) — encrypted, separate account.
- **P4. DB snapshot in public bucket** (H) — see K2.
- **P5. Missing data export / delete for GDPR/CCPA** (H) — implement and rate-limit.
- **P6. Cross-border transfer / residency** (M) — region pinning per user.
- **P7. PCI scope expansion** (H) — use Stripe/PSP tokenization; never store PAN/CVV.

### Q. AI / LLM Specific
- **Q1. Prompt injection (direct + indirect)** (H) — separate system/tool channels; never trust retrieved content as instructions.
- **Q2. Sensitive data sent to model providers** (H) — scrub PII/secrets before prompt.
- **Q3. Insecure output handling** (H) — render LLM output as text/markdown with sanitization; never as raw HTML.
- **Q4. Model extraction / abuse** (M) — rate limit, CAPTCHA, account gating.
- **Q5. Tool/function-call abuse** (H) — strict allow-list, user-confirm destructive ops.
- **Q6. Retrieval / RAG poisoning** (H) — provenance, signing, content-safety filters.
- **Q7. Vector store access control** (H) — per-tenant namespaces, ACL filters on queries.
- **Q8. Expensive-prompt DoS** (H) — token + cost budget per request.
- **Q9. Model / feature version pinning** (M) — avoid silent behavior changes.

### R. Mobile / WebView / Client Hygiene
- **R1. Deep link / URL scheme hijack** (M) — allow-list hosts; verify signing on App Links / Universal Links.
- **R2. WebView JavaScript bridges** (H) — `@JavascriptInterface` allow-list; disable file access.
- **R3. Local storage of secrets in client** (H) — use platform keystore / Keychain.
- **R4. Certificate pinning bypass** (L) — only where required; design for rotation.

### S. Compliance & Legal
- **S1. Cookie consent / GDPR banner correctness** (M) — no pre-consent analytics.
- **S2. Children's data (COPPA / GDPR-K)** (H) — age gate; minimal data.
- **S3. DMCA / content moderation hooks** (M) — abuse reporting pipeline.
- **S4. Vulnerability disclosure / security.txt** (L) — `.well-known/security.txt`.
- **S5. Account deletion cascade** (M) — actually delete personal data.

---

## 4. Prioritization for "Vibe-Coded" Apps

**Day 0 (ship-blockers):**
A1, A2, A3, A6, K1, K2, K3, K4, K9, B2, B10, C1, C2, C8, J1, I7, D1, D2, D3, D5, F6, H1, H2.

**Week 1:**
B1, B3, B4, B6, B12, C5, C6, D6, D8, E1, E2, F5, G1, H3, I1, I3, I9, J2, L1, L4, M1, M4, N1, Q1, Q2, Q3, Q5, Q7.

**Ongoing:**
A4, A8, A10, B5, B7, B8, D11, K6, K7, L2, L3, L5, L6, M2, M5, O6, P5, Q6, Q8, S1, S4.

---

## 5. Validation

- Run secret scanner (`gitleaks`, `trufflehog`, `detect-secrets`) on repo + image layers.
- Run dependency SCA (`npm audit`, `pip-audit`, `osv-scanner`).
- Dynamic: OWASP ZAP or Burp baseline against staging; Semgrep/CodeQL in CI.
- Authz test matrix per object × role × tenant.
- Penetration test of payment flow including race conditions.
- LLM-specific: prompt-injection test corpus; verify no tool executes without scope + user-confirm.
- CSP / header scan (`securityheaders.com`, `observatory.mozilla.org`).
- TLS scan (`testssl.sh`).
- Cloud posture (CSPM): `prowler`, `scoutsuite`.
