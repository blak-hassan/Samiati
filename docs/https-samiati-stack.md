# HTTPS Implementation Guide — Samiati Stack

Companion to [`https-production-guide.md`](./https-production-guide.md) (the
generic, vendor-neutral runbook). This document applies that runbook to
Samiati's actual production topology and lists exactly what we own vs. what
our vendors manage.

> **Audience:** DevOps / whoever owns the Vercel project and DNS zone.
> **Last reviewed:** 2026-09-14

---

## Table of Contents

1. [Topology & TLS responsibility matrix](#1-topology--tls-responsibility-matrix)
2. [Current state](#2-current-state)
3. [Custom domain on Vercel (TLS termination)](#3-custom-domain-on-vercel-tls-termination)
4. [DNS records](#4-dns-records)
5. [Clerk production domain](#5-clerk-production-domain)
6. [Convex production deployment](#6-convex-production-deployment)
7. [Webhook callbacks (Paystack, M-Pesa, SMS)](#7-webhook-callbacks-paystack-m-pesa-sms)
8. [HSTS & preload status](#8-hsts--preload-status)
9. [Certificate & expiry monitoring](#9-certificate--expiry-monitoring)
10. [Validation sequence](#10-validation-sequence)
11. [What we deliberately do NOT do](#11-what-we-deliberately-do-not-do)

---

## 1. Topology & TLS responsibility matrix

```
Browser ──HTTPS──▶ Vercel edge (TLS termination, managed certs)
                      │
                      ├──▶ Next.js app (src/app/*)          HTTP intra-Vercel
                      └──HTTPS──▶ Convex (gregarious-rat-550.convex.cloud)
                                     └──HTTPS──▶ Clerk, Paystack, Daraja, HuggingFace, Sentry (outbound)
Paystack / M-Pesa ──HTTPS──▶ https://<domain>/api/webhooks/*  (inbound webhooks)
```

| Surface | Who terminates TLS | Certificate owner | Renewal |
|---|---|---|---|
| App (`<domain>`, `www`, `*.vercel.app`) | Vercel edge | Vercel (ACME-managed) | Automatic — no action needed |
| Convex API (`*.convex.cloud`) | Convex | Convex | Automatic |
| Clerk auth (`clerk.<domain>` / `*.clerk.accounts.dev`) | Clerk edge | Clerk | Automatic once domain is registered |
| Webhook receivers (`/api/webhooks/*`) | Vercel edge (same as app) | Vercel | Automatic |
| Outbound APIs (Paystack, Safaricom Daraja, HuggingFace, Sentry ingest) | Vendor | Vendor | Nothing to do — but expiry is monitored (see §9) |

**Implication:** the generic guide's §2.3 (certbot) and §3 (Nginx/Apache config)
do **not** apply unless Samiati is later self-hosted behind a reverse proxy.
What we still own is DNS correctness, Clerk's production domain, HSTS/preload
semantics, and independent expiry monitoring.

---

## 2. Current state

- **Vercel project:** `blak-hassans-projects/samiati-1.0`, GitHub auto-deploy.
- **Live URL:** `https://samiati-10.vercel.app` (TLS served by Vercel already —
  `*.vercel.app` is on the Public Suffix List, so browsers treat each project
  subdomain like a registrable domain and Vercel issues valid certs for it).
- **Convex prod:** `https://gregarious-rat-550.convex.cloud`.
- **Clerk issuer (dev):** `https://nice-mullet-25.clerk.accounts.dev`.
- **Security headers:** `next.config.ts` sends, on every route:
  `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  plus `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`. CSP is per-request with a nonce in `src/proxy.ts`.

**Gap to close for production-grade HTTPS:** the app is still served from a
Vercel-branded subdomain. Clerk production instances, Paystack/Daraja
webhook allow-listing, and brand trust all require a **custom apex domain**.
Everything below assumes that move.

---

## 3. Custom domain on Vercel (TLS termination)

Add the domain through the dashboard or CLI:

```bash
npx vercel domains add example.com
npx vercel alias set samiati-10.vercel.app example.com
# or, in the dashboard: Project → Settings → Domains → Add
```

Certificate handling — **nothing to install**:

1. Once DNS resolves to Vercel (§4), Vercel requests a managed certificate via
   ACME automatically (HTTP-01/TLS-ALPN against Vercel's edge; for wildcard
   domains they use DNS-01 against nameservers delegated to Vercel).
2. Renewal is automatic and happens without downtime; Vercel rotates well
   before expiry.
3. If issuance silently fails, first suspect CAA records (§4.3) or stale DNS
   pointing elsewhere — `npx vercel domains inspect example.com` shows the
   issuance state.

---

## 4. DNS records

> Record values below are the long-documented Vercel defaults; always confirm
> against the exact values the Vercel dashboard prints for this project —
> Vercel has updated its anycast IPs before.

### 4.1 Core records

| Type | Name | Value | Notes |
|---|---|---|---|
| `A` | `@` (apex) | Vercel anycast IPv4 shown by the dashboard (e.g. `76.76.21.21`) | Apex cannot be a CNAME |
| `CNAME` | `www` | `cname.vercel-dns.com` | Or use Vercel's redirect: `www` → apex |
| `CNAME` | `clerk` | *(Clerk-provided target — see §5)* | Only when adding Clerk prod domain |

**Before issuance/verification:** drop TTLs on these names to `300`s, restore
to `3600`+ once stable.

### 4.2 Propagation check before aliasing

```bash
dig +short A example.com @1.1.1.1
dig +short CNAME www.example.com @1.1.1.1
```

Alias the domain in Vercel only *after* these return Vercel's addresses —
premature aliasing is the most common cause of "Invalid Configuration" in the
Vercel domains page.

### 4.3 CAA records

Do **not** guess the CA here. Vercel issues through its own pipeline; the
robust procedure:

1. Add the domain with **no CAA record present** and let Vercel issue.
2. Read the issuer off the served cert:

   ```bash
   echo | openssl s_client -connect example.com:443 -servername example.com 2>/dev/null \
     | openssl x509 -noout -issuer
   ```

3. *Then* pin CAA to that CA only, e.g. if it is Let's Encrypt:

   ```dns
   example.com.   IN CAA 0 issue "letsencrypt.org"
   example.com.   IN CAA 0 issuewild "letsencrypt.org"
   example.com.   IN CAA 0 iodef "mailto:security@samiati.example"
   ```

4. Re-request a replacement cert (remove/re-add the domain in Vercel) to prove
   CAA does not break issuance.

> **Observed issuer (2026-09-14):** all three Samiati surfaces (Vercel edge,
> Convex, Clerk) currently serve certificates issued by **Google Trust
> Services**, whose CAA name is `pki.goog`. Once verified on your own domain,
> the pin would be:
>
> ```dns
> example.com.   IN CAA 0 issue "pki.goog"
> example.com.   IN CAA 0 issuewild "pki.goog"
> ```
>
> Re-check the issuer after any vendor CA rotation before trusting a pin.

> Adding CAA *before* step 2 risks silently breaking Vercel issuance — and the
> same applies to Clerk's `clerk.<domain>` CNAME cert: CAA on the parent zone
> is consulted for subdomain issuance, so add the Clerk CA there too if you
> enable CAA.

### 4.4 Locking traffic to the edge

Samiati uses Cloudflare only for Turnstile, not as a CDN in front of the app.
Since the apex A record points straight at Vercel, there is no "origin bypass"
to lock down. If a CDN is ever placed in front, revisit this section and the
generic guide's §4.

---

## 5. Clerk production domain

Clerk's `accounts.dev` issuer is for development only. For production:

1. In the Clerk dashboard, create/verify the **production instance** and add
   the production domain (e.g. `example.com` plus `www`).
2. Create the DNS record Clerk requests — typically a `CNAME` like
   `clerk.example.com → <clerk-provided-target>`. Clerk provisions and renews
   the TLS certificate on that hostname automatically (it terminates auth
   traffic on its own edge).
3. Update the app's environment on Vercel:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` → the **production** publishable key
     (dev `pk_test_…` keys hard-fail on production domains).
   - `CLERK_SECRET_KEY` → the production secret key.
   - `CLERK_ISSUER_URL` → the production issuer URL printed by the dashboard.
   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `SIGN_UP_URL` / `AFTER_*_URL` remain
     app-relative (`/sign-in`, `/sign-up`, `/dashboard`) — no change.
4. If production Clerk keys are already set (see `SECURITY_FIXES.md`), the
   remaining step is the domain CNAME — auth components keep working through
   the redirect because Clerk bakes the allowed domains into the instance.

**Failure mode to know:** a missing/stale `clerk` CNAME produces
`Clerk: clerk.<domain> DNS verification pending` errors in the browser console
and broken sign-in on the custom domain while `*.vercel.app` still works.

---

## 6. Convex production deployment

- `NEXT_PUBLIC_CONVEX_URL=https://gregarious-rat-550.convex.cloud` is already
  set in Vercel prod env vars; Convex manages TLS for `*.convex.cloud` fully.
- `npx convex deploy` must be run together with frontend pushes so the Convex
  prod schema/functions match (see `SECURITY_FIXES.md` deployment notes).
- CORS/origins: if Convex functions check origins, ensure the custom domain is
  allow-listed after the move (browser → Convex is a cross-origin HTTPS call).

---

## 7. Webhook callbacks (Paystack, M-Pesa, SMS)

Both payment providers **require publicly reachable HTTPS endpoints** —
`https://samiati-10.vercel.app` URLs work for testing, but register the custom
domain in production:

| Provider | Where to register | Endpoint | Notes |
|---|---|---|---|
| Paystack | Dashboard → Settings → API Keys & Webhooks | `https://<domain>/api/webhooks/paystack` | Signature verified with `PAYSTACK_SECRET_KEY` |
| M-Pesa Daraja | Safaricom developer portal (C2B / Express URLs) | `https://<domain>/api/webhooks/mpesa` (per integration) | Daraja requires a public HTTPS host; validation URL must return 200 quickly |
| SMS internal webhook | Server-side only | `/api/sms/send` + `SMS_WEBHOOK_SECRET` | Shared-secret auth, HTTPS enforced in prod |

Checklist after the domain move:

- [ ] Re-register/point every webhook URL at the custom domain.
- [ ] Verify signatures still validate (timestamp + HTTPS in prod).
- [ ] Confirm `NEXT_PUBLIC_APP_URL` on Vercel is `https://<domain>` —
      sitemap/robots/canonical URLs and M-Pesa callback URL construction
      derive from it (`src/app/sitemap.ts` etc.).
- [ ] Turnstile stays on `challenges.cloudflare.com` (HTTPS, already allowed
      by the CSP in `src/proxy.ts`) — no change needed.

---

## 8. HSTS & preload status

`next.config.ts` already ships:

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

What that means right now vs. after the custom domain move:

- **On `samiati-10.vercel.app`:** `vercel.app` is on the Public Suffix List, so
  `preload` for this subdomain is effectively inert (a PSL entry cannot be
  submitted; browsers scope HSTS per-registrable-domain anyway). Harmless.
- **After adding `example.com`:** this header becomes *live and strong*:
  - 2-year max-age + `includeSubDomains` — **every** subdomain of the apex
    must serve valid HTTPS, including future ones (`staging.`, `api.`, `dev.`).
    A single HTTP-only subdomain becomes unreachable for modern browsers.
  - `preload` — commit to submitting the apex at
    <https://hstspreload.org> **only when every subdomain is HTTPS-only
    permanently**. Removal from the preload list takes months. If unsure,
    drop `preload` (keep `includeSubDomains`) until certain.
- Note Vercel's edge may also emit its own HSTS header on some responses;
  browsers take the strongest received value, so there is no conflict.

**Action:** decide preload vs. not at the moment the custom domain goes live;
do not "decide later" while the header is already being sent with `preload`.

---

## 9. Certificate & expiry monitoring

Vendors renew automatically, but renewal automation fails silently — that is
why we probe independently. Use the zero-dependency script:

```bash
npm run certs:check
# or check specific extra hostnames:
npm run certs:check -- api.paystack.co api.safaricom.co.ke
```

- Default hostnames live in `scripts/check-cert-expiry.mjs` (app, Convex,
  Clerk) — update the `DEFAULT_HOSTS` list when the custom domain ships.
- Thresholds: warn at 21 days, fail at 7 (env-tunable: `CERT_WARN_DAYS`,
  `CERT_FAIL_DAYS`). Exit code `1` on failure → wire into CI or a cron:

  ```cron
  # Daily probe, alerts via your normal channel on non-zero exit
  0 6 * * * cd /srv/samiati && npm run certs:check --silent || notify-oncall
  ```

- Also keep an external probe (UptimeRobot/Pingdom free tier) on the custom
  domain for independence from our own network path, and watch
  <https://crt.sh/?q=example.com> occasionally for unexpected issuance.

---

## 10. Validation sequence

After the custom domain is live, run in order:

```bash
# 1. Chain + expiry + issuer
echo | openssl s_client -connect example.com:443 -servername example.com 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates

# 2. Redirect + HSTS + HTTP/2
curl -sI https://example.com | grep -iE 'strict-transport|HTTP/'
curl -sI http://example.com          # expect 301/308 → https
curl -sI https://www.example.com     # expect 301/308 → apex (or 200)

# 3. Renewal automation proof (script green, Vercel domain page "Valid")
npm run certs:check

# 4. Webhooks
curl -sI -X POST https://example.com/api/webhooks/paystack   # expect 4xx (auth), NOT 5xx/TLS error

# 5. Auth end-to-end on the custom domain (Clerk production keys + CNAME)
#    → sign-in flow in a browser, console clean of Clerk DNS/CSP errors
```

Then run the external scans once:

- <https://www.ssllabs.com/ssltest/> → target **A** or **A+** (Vercel-managed
  TLS typically grades A; we cannot change its cipher policy — that is the
  trade-off of managed termination).
- <https://observatory.mozilla.org> and <https://securityheaders.com> for
  header posture (CSP, HSTS, etc. — ours are set in `next.config.ts`/`proxy.ts`).

---

## 11. What we deliberately do NOT do

| Activity | Why not |
|---|---|
| Run certbot / ACME clients | No TLS-terminating server we own; Vercel/Convex/Clerk handle it |
| Manage cipher suites / TLS versions | Not exposed by Vercel's edge; generic guide's §3.4 applies only if self-hosted |
| Store private keys | Vendors hold them; nothing to leak on our side |
| Self-host a reverse proxy for TLS | Adds an expiry/patching burden with no benefit at current scale |
| Email/FTP-based domain validation | Not applicable to ACME-managed vendor certs |

*Revisit this document when: the custom domain ships, a CDN is added in front
of Vercel, any service is self-hosted, or after any certificate-related
incident. Reviewed quarterly alongside
[`https-production-guide.md`](./https-production-guide.md).*







