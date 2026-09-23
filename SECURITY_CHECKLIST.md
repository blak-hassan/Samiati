# Security Checklist — "Vibe-Coded" Web Applications

A practical, prioritized security checklist for the most common mistakes made
when shipping speed-first web apps. Use it as a pre-deploy gate and a recurring
self-audit. Each section lists the typical gap, why vibe-coders miss it, and
the minimum control.

For the full register including rationale, see
[`docs/security-checklist-vibe-coding.md`](./docs/security-checklist-vibe-coding.md).

## Severity legend

- **H** = high impact, ship-blocker
- **M** = medium impact, address in the same release
- **L** = low impact, backlog

## Day 0 — ship blockers

- [ ] **A1** No exposed DB credentials (H) — DB bound to private network, IAM auth
- [ ] **A2** No public `.env` / `.env.*` (H) — `.env*` in `.gitignore`; reverse proxy deny-rules
- [ ] **A3** No hardcoded secrets in source (H) — `gitleaks` / `trufflehog` in CI
- [ ] **A6** No secrets in client-side JS (H) — `grep process.env` in build artifacts
- [ ] **K1** DB not publicly reachable (H) — no `0.0.0.0/0` ingress
- [ ] **K2** Cloud storage private by default (H) — S3/GCS/Azure blobs block public ACL
- [ ] **K3** Admin / debug endpoints not exposed (H) — `/actuator`, `/_debug`, `/graphiql`, `/console`, `phpMyadmin`, `Adminer` either disabled or IP-allowlisted
- [ ] **K4** No default credentials (H) — rotate every service account, secret-scan infra-as-code
- [ ] **K9** `.git` / `.svn` / `.DS_Store` not served (H) — `location ~ /\.(git|svn) { deny all; }`
- [ ] **B2** Passwords stored with argon2id (or bcrypt cost ≥ 12) (H) — never MD5 / SHA1 / unsalted SHA256
- [ ] **B10** JWTs verified correctly (H) — explicit algorithm, `exp`/`aud`/`iss` checked, `alg:none` rejected
- [ ] **C1** Every mutating action checks authorization server-side (H) — middleware on every route
- [ ] **C2** No IDOR / BOLA (H) — every object access checks owner + tenant
- [ ] **C8** Paid features enforced server-side (H) — never trust client flags
- [ ] **J1** Subscription / quota / pricing enforced on the server (H) — totals computed server-side, not from client
- [ ] **I7** Incoming webhooks verify signatures (H) — HMAC + replay window + idempotency key
- [ ] **D1** No SQL injection (H) — parameterized queries; least-privilege DB user
- [ ] **D2** No NoSQL injection (H) — type-check inputs; reject `$where` and operator keys from user input
- [ ] **D3** No XSS (H) — context-aware escaping; CSP; no `dangerouslySetInnerHTML` on user content
- [ ] **D5** Server-side input validation (H) — Zod / Joi / Valibot at the trust boundary, never trust the client
- [ ] **F6** Cookies are `Secure; HttpOnly; SameSite=Lax` (H) — `__Host-` prefix for session cookies
- [ ] **H1** CSRF protection on state-changing requests (H) — SameSite + double-submit token / origin check
- [ ] **H2** No wildcard CORS with credentials (H) — exact origin allow-list, no reflection

## Week 1 — same release

- [ ] **B1** Password policy (HIBP check, length-based, no churn)
- [ ] **B3** Brute force / credential stuffing rate limit
- [ ] **B4** No account enumeration (uniform responses + timing on signup/login/reset)
- [ ] **B6** MFA available (TOTP or WebAuthn; never SMS-only)
- [ ] **B12** Password reset tokens: single-use, expiring (≤ 1h), hashed at rest, constant-time compare
- [ ] **B8** OAuth/OIDC: `state`, PKCE, exact `redirect_uri`, `iss`/`aud`/`exp` checks
- [ ] **C5** Tenant isolation in multi-tenant SaaS (row-level security or shared-nothing)
- [ ] **C6** Mass assignment / parameter pollution (explicit DTOs, never `Object.assign(req.body)`)
- [ ] **D6** No path traversal (canonicalize paths, reject `..`/symlinks, allow-list prefixes)
- [ ] **D8** No prototype pollution (`Object.freeze(Object.prototype)`, `Object.create(null)` for maps)
- [ ] **E1** File uploads validate content-type + magic bytes, store outside webroot, random names, AV scan, size limit, image re-encode
- [ ] **E2** User uploads served from a different origin (defangs XSS)
- [ ] **F5** Tokens / IDs use `crypto.randomUUID` or `crypto.randomBytes` (never `Math.random`)
- [ ] **G1** Sessions rotate ID on login / privilege change
- [ ] **H3** Security headers: CSP (nonce-based), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options` / `frame-ancestors`
- [ ] **I1** No excessive data exposure (DTO projection, never return full DB rows)
- [ ] **I3** GraphQL depth / complexity limits; disable introspection in prod
- [ ] **I9** Idempotency keys on mutating endpoints
- [ ] **J2** No race conditions (DB unique constraints, optimistic locks, atomic ops, idempotent endpoints)
- [ ] **L1** No vulnerable dependencies (`npm audit` / `pip-audit` / `osv-scanner` in CI)
- [ ] **L4** `--ignore-scripts` for `npm install` (review post-install hooks)
- [ ] **M1** Security events logged (login, privilege change, admin actions, payouts)
- [ ] **M4** Alerting on suspicious activity (impossible-travel, mass export, sudden admin grants)
- [ ] **N1** Rate limits per IP / account / endpoint / cost
- [ ] **Q1** No prompt injection (separate system / tool channels; never trust retrieved content as instructions)
- [ ] **Q2** No sensitive data sent to model providers
- [ ] **Q3** LLM output rendered as text / markdown, never raw HTML
- [ ] **Q5** Tool / function calls use strict allow-list and require user confirmation for destructive ops

## Ongoing — backlog

- [ ] **A4** No secrets in logs (structured logger with allow-list)
- [ ] **A8** Secrets scrubbed from APM / error tracking
- [ ] **A10** Short-lived, scoped API keys (rotate, OAuth > static keys)
- [ ] **B5** Session fixation prevented (rotate ID on login)
- [ ] **B7** MFA bypass closed (number-matching, rate limit, single-use codes)
- [ ] **D11** No ReDoS (safe regexes; test catastrophic backtracking)
- [ ] **K6** Minimal distroless images, CVE scan in CI
- [ ] **K7** Containers: read-only FS, drop capabilities, no host mounts
- [ ] **L2** Lockfile committed and used in CI
- [ ] **L3** Dependency confusion / typosquatting (scoped packages, private registry, integrity hashes)
- [ ] **L5** Pin versions, reproducible builds, SBOM
- [ ] **L6** CI/CD least-privilege tokens; signed commits
- [ ] **M2** No PII in logs
- [ ] **M5** Append-only audit trail for sensitive ops
- [ ] **O6** CDN origin only accepts CDN IPs; auth headers don't bypass origin security
- [ ] **P5** GDPR / CCPA data export and delete flows
- [ ] **Q6** RAG provenance + content-safety filters
- [ ] **Q8** Per-user token + cost budget for LLM calls
- [ ] **S1** Correct cookie consent (no pre-consent analytics)
- [ ] **S4** `.well-known/security.txt`

## Verification

- [ ] `npm run lint` clean
- [ ] `npx tsc --noEmit` clean
- [ ] `npm test` passes
- [ ] `npm audit` reports 0 vulnerabilities
- [ ] Secret scan (`gitleaks` / `trufflehog`) on repo and image layers
- [ ] Dynamic scan: Strix (`.github/workflows/strix.yml`) on PRs
- [ ] Dynamic scan (OWASP ZAP baseline) on staging
- [ ] `securityheaders.com` A+
- [ ] `testssl.sh` clean (TLS 1.2+ only, strong ciphers, HSTS preload)
- [ ] Cloud posture (CSPM): `prowler` / `scoutsuite` clean
- [ ] Authz test matrix: every object × role × tenant

## Out of scope

- Implementation code (this is an advisory checklist, not a code change plan).
- Threat model for a specific application.
- Vendor selection / pricing for security tooling.
