# HTTPS Implementation & Configuration Guide for Production

A field-tested runbook for DevOps and Systems Administrators to deploy
HTTPS end-to-end — from certificate acquisition through ongoing maintenance.

> **Stack-specific companion:** [`https-samiati-stack.md`](./https-samiati-stack.md)
> applies this runbook to Samiati's actual topology (Vercel edge + Convex +
> Clerk + payment webhooks), including what is vendor-managed vs. what we
> must own. Start there if you are operating Samiati itself.

> **Audience:** DevOps engineers, SREs, platform engineers.
> **Assumptions:** A production domain (`example.com`) hosted on a server or
> cloud load balancer (Nginx/Apache/ALB/Cloudflare). Root or sudo access.

---

## Table of Contents

1. [Preparation](#1-preparation)
2. [Certificate Acquisition](#2-certificate-acquisition)
3. [Server Configuration](#3-server-configuration)
4. [Domain and DNS Management](#4-domain-and-dns-management)
5. [Security Best Practices and Maintenance](#5-security-best-practices-and-maintenance)
6. [Validation and Testing](#6-validation-and-testing)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Preparation

### 1.1 Inventory

| Item | Action |
|------|--------|
| Domain(s) | List apex + every subdomain to serve over HTTPS |
| Server roles | Identify web servers, load balancers, reverse proxies |
| Port exposure | Confirm `443` is open; plan `80` redirect handling |
| Client traffic | Browsers only, or also API / non-browser clients |

### 1.2 DNS readiness

- Each hostname you plan to secure must already resolve (A/AAAA/CNAME) to the
  server or load balancer that terminates TLS.
- ACME HTTP-01 challenges additionally require a reachable `80` to each name.
  ACME DNS-01 (for wildcard certs) does **not** require port 80.

### 1.3 Tooling

```bash
# Cert acquisition + renewal
certbot --version      # Let's Encrypt client
acme.sh --version       # Lightweight alternative

# Inspection / scanning
openssl version
curl -V
testssl.sh            # TLS hardening scanner (optional)
```

---

## 2. Certificate Acquisition

### 2.1 Validation levels

| Type | Validation depth | Issuance time | Use case | Trade-offs |
|------|-----------------|---------------|----------|------------|
| **DV** (Domain Validation) | Proves control of the domain (HTTP, DNS, or email challenge) | Minutes – hours | Standard websites, APIs | Fastest; shows a green padlock only |
| **OV** (Organization Validation) | DV + vetted organizational identity | 1 – 3 days | B2B SaaS, internal portals | Adds org name to cert; slower issuance |
| **EV** (Extended Validation) | Full company vetting | ~1 week | High-trust / financial pages | Historically showed green bar (now de-emphasized by browsers) |

> **Modern note:** Chrome and Firefox have removed the EV "green bar" UI. EV still
> appears in the certificate viewer, so use it only when you need the legal
> assurance, not for a UI cue.

### 2.2 CAs vs. Let's Encrypt

| Aspect | Commercial CA | Let's Encrypt |
|--------|--------------|---------------|
| Cost | $50–$500+ per year | Free |
| Lifespan | Typically 1–2 years (DV) | 90 days |
| Automation | Varies; manual by default | Built-in ACME protocol |
| Wildcard | Supported (paid add-on) | Free via DNS-01 |
| Revocation | CRL + OCSP | OCSP |
| Support | Vendor SLA / ticket | Community forums |

**Recommendation for most production use:** Let's Encrypt with automated
renewal. Use a commercial CA only when you need:

- Longer-lived certs with manual override workflows,
- OV/EV identity in the certificate object,
- Warranty / liability coverage,
- A private CA for internal device fleets.

### 2.3 Obtaining a certificate with Let's Encrypt (Certbot)

#### 2.3.1 DV certificate (HTTP-01)

```bash
sudo certbot certonly --nginx \
  -d example.com \
  -d www.example.com \
  --email ops@example.com \
  --agree-tos \
  --no-eff-email
```

- `--nginx` lets Certbot automatically edit your Nginx config and reload.
- Certificates land in `/etc/letsencrypt/live/<domain>/` :
  - `fullchain.pem` — server certificate + intermediates
  - `privkey.pem`  — private key (chmod 600, never share)
- Equivalent Apache flag: `--apache`.

#### 2.3.2 Wildcard certificate (DNS-01)

Required for `*.example.com` and recommended when you have many subdomains.

```bash
sudo certbot certonly \
  --manual \
  --preferred-challenges dns \
  -d example.com \
  -d "*.example.com" \
  --email ops@example.com \
  --agree-tos \
  --no-eff-email
```

This prints a DNS `_acme-challenge` TXT record to add. For full automation,
use a plugin for your DNS provider (e.g. `certbot-dns-cloudflare`).

#### 2.3.3 Commercial certificate

1. Generate a CSR (with SANs):

   ```bash
   openssl req -new -newkey rsa:2048 -nodes \
     -keyout example.com.key \
     -out example.com.csr \
     -subj "/C=US/ST=CA/O=Example Corp/CN=example.com" \
     -addext "subjectAltName=DNS:example.com,DNS:www.example.com"
   ```

2. Submit the CSR to your CA's portal. After domain/org validation, you receive:
   - `domain.crt` (or `example_com.crt`)
   - One or more intermediate certificate files
3. Install all three: cert + intermediates + key (concatenated in Nginx/Apache).

---

## 3. Server Configuration

### 3.1 Nginx — TLS hardening

Create or edit `/etc/nginx/sites-available/example.com`:

```nginx
# Redirect all HTTP to HTTPS (port 80 listener)
server {
    listen 80;
    listen [::]:80;
    server_name example.com www.example.com;
    return 301 https://$host$request_uri;
}

# HTTPS listener
server {
    listen 443 ssl http2;            # http2 optional in 1.25.1+; see §3.3
    listen [::]:443 ssl http2;
    server_name example.com www.example.com;

    # --- TLS certificates ---
    ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # --- TLS protocol & cipher policy ---
    ssl_protocol TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ecdh_curve secp384r1;
    ssl_ciphers
        'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384'
        'ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305'
        'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256'
        'ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA384'
        'ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA256';

    # --- Session resumption (performance) ---
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # --- OCSP stapling (revocation) ---
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # --- HSTS ---
    add_header Strict-Transport-Security
        "max-age=63072000; includeSubDomains; preload" always;

    # --- Additional security headers (see §5.1) ---
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header Referrer-Policy strict-origin-when-cross-origin;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()";

    # --- Your application ---
    root /var/www/example.com/html;
    index index.html;
    location / {
        try_files $uri $uri/ =404;
    }
}
```

Validate and reload:

```bash
sudo nginx -t && sudo nginx -s reload
```

### 3.2 Apache — TLS hardening

In `/etc/apache2/sites-available/example.com.conf`:

```apache
<VirtualHost *:80>
    ServerName example.com
    ServerAlias www.example.com
    Redirect permanent / https://example.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName example.com
    ServerAlias www.example.com

    SSLEngine on
    SSLCertificateFile      /etc/letsencrypt/live/example.com/fullchain.pem
    SSLCertificateKeyFile   /etc/letsencrypt/live/example.com/privkey.pem

    # TLS 1.2+ only
    SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1
    SSLCipherSuite HIGH:!aNULL:!MD5:!3DES:!CAMELLIA
    SSLHonorCipherOrder on

    # OCSP stapling
    SSLUseStapling on
    SSLStaplingResponderTimeout 5
    SSLStaplingReturnResponderErrors off
    SSLStaplingCache "shmcb:logs/ssl_stapling(128000)"

    # HSTS
    Header always set Strict-Transport-Security \
        "max-age=63072000; includeSubDomains; preload"

    DocumentRoot /var/www/example.com/html
</VirtualHost>
```

Enable modules and the site:

```bash
sudo a2enmod ssl headers socache_shmcb
sudo a2ensite example.com
sudo systemctl reload apache2
```

### 3.3 HTTP/2

| Version | Nginx | Apache |
|---------|-------|--------|
| 1.25.1+ | `listen 443 ssl;` (`http2 on;`) | `Protocols h2 http/1.1` |
| < 1.25.1 | `listen 443 ssl http2;` | `Protocols h2 http/1.1` |

Always keep `http/1.1` enabled for compatibility with older clients.

### 3.4 Cipher selection

**Default stance (2024):** TLS 1.3 ciphers are negotiated automatically. For TLS 1.2, the
order above matches Mozilla's **Intermediate** profile, which all modern browsers
satisfy while excluding legacy crypto (RC4, 3DES, EXPORT, MD5).

For stricter environments adopt Mozilla's **Modern** profile (TLS 1.3 only,
dropping most mobile / corporate proxies), but test client compatibility first.

---

## 4. Domain and DNS Management

### 4.1 A and CNAME records

- **A record**: Point the apex (or `www`) directly to your server IP.
  Example: `example.com → 203.0.113.10`.
- **CNAME**: Use for subdomains that delegate to another host
  (e.g. `blog.example.com → my-blog.hostingprovider.net`). A CNAME cannot
  sit at the apex (RFC restriction); use the provider's ALIAS / ANAME /
  flattening record if you need the apex to point elsewhere.

### 4.2 DNS CAA records (mandatory before issuance)

Restrict *which* CAs may issue for your domain:

```dns
example.com.      IN CAA 0 issue "letsencrypt.org"
example.com.      IN CAA 0 issuewild "letsencrypt.org"
example.com.      IN CAA 0 issue ";"            ; block others
```

- `issue` governs normal FQDNs; `issuewild` governs `*.domain` wildcards.
- `0` is the flag (0 = non-critical); `1` = critical (hard-fail on unknown tag).
- Every CA checks CAA at issuance time; failure = the CA refuses to issue.

### 4.3 Subdomains

| Scenario | Recommendation |
|----------|----------------|
| Few static subdomains | Combine into one SAN cert |
| Many dynamic subdomains | One wildcard (`*.example.com`) via DNS-01 |
| External SaaS subdomains (`status.example.com` → Statuspage) | Either wildcard the CNAME, or exclude via CAA `issue "statuspage.io"` on that specific hostname, or terminate TLS at the SaaS and accept its shared cert |
| Internal-only subdomains | Exclude from public certs; use a private CA |

### 4.4 Handling certificates for custom domains (SaaS pattern)

For platforms where customers bring their own domains, automate with a
wildcard cert + SNI routing, or issue per-customer Let's Encrypt certs on-demand
(via DNS-01 with per-customer DNS-01 credentials scoped via CAA). Never
share one cert's private key across customer boundaries.

---

## 5. Security Best Practices and Maintenance

### 5.1 Certificate lifecycle

**Let's Encrypt default — 90-day rotation via cron (installed by Certbot):**

```cron
# /etc/cron.d/certbot
0 3 * * * root certbot renew --quiet --post-hook "nginx -s reload"
# Or on systemd:
0 3 * * * root systemctl -q reload nginx
```

For systems using systemd timers (Certbot package):

```bash
sudo systemctl list-timers | grep certbot   # confirm timer is active
sudo systemctl status certbot.timer
```

> **Key rule:** The post-hook reload must happen only if a cert actually
> changed. `--quiet` keeps logs clean; use `--dry-run` monthly to validate
> renewal without touching live certs.

### 5.2 Monitoring expiration

- **Proactive:** Set internal alerts 14, 7, and 1 days before expiry for any
  cert not on automated renewal.
- **Reactive:** Use a monitoring probe:

  ```bash
  # Nagios / check_ssl_certificate — fails if < 30 days remain
  check_ssl_certificate -H example.com -w 14 -c 7
  ```
- **External:** Services like [SSLMate CertSpotter](https://sslmate.com/certspotter),
  [Censys](https://censys.io/), or [crt.sh](https://crt.sh/) can alert when new
  certs are issued or existing ones near expiry.

### 5.3 Intermediate certificate chain management

- Always serve the **fullchain** (leaf + intermediates), never just the leaf.
  Browsers will fail with `NET::ERR_CERT_AUTHORITY_INVALID` if an intermediate
  is missing.
- For **commercial CA** certs, manually concatenate intermediates:

  ```bash
  cat domain.crt intermediate.crt root-bundle.crt > chain.crt
  ```

  Then point `ssl_certificate` at `chain.crt`.
- Let's Encrypt's `fullchain.pem` already contains the correct intermediate
  (ISRG Root X1 / X3), so no manual concatenation is needed.

### 5.4 HSTS (HTTP Strict-Transport-Security)

HSTS forces browsers to always use HTTPS for your domain, preventing SSL
stripping and cookie downgrade attacks.

```nginx
add_header Strict-Transport-Security \
    "max-age=63072000; includeSubDomains; preload" always;
```

**Staged rollout:**

1. **Week 0:** `max-age=300` (5 min) — easy to recover from misconfiguration.
2. **Week 2:** `max-age=31536000` (1 year).
3. **Month 2:** Add `includeSubDomains`.
4. **Month 3:** Submit to the [HSTS preload list](https://hstspreload.org/).

> **Critical:** Do **not** enable HSTS or submit to the preload list until
> every subdomain you serve can respond correctly over HTTPS with a valid cert.
> A single broken subdomain under `includeSubDomains` can lock users out.

### 5.5 Security headers reference

| Header | Value | Purpose |
|--------|-------|---------|
| `Strict-Transport-Security` | see §5.4 | Enforce HTTPS |
| `X-Content-Type-Options` | `nosniff` | Stop MIME sniffing |
| `X-Frame-Options` | `DENY` or `SAMEORIGIN` | Clickjacking (superseded by CSP `frame-ancestors`) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limit referrer leakage |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=()` | Disable unused browser features |
| `Content-Security-Policy` | see §A | XSS mitigation via script allow-lists |

### 5.6 TLS 1.3 vs. TLS 1.2

- **TLS 1.3** should always be enabled (`ssl_protocol TLSv1.2 TLSv1.3`). It
  removes outdated ciphers and cuts handshake latency to 1 RTT.
- Keep **TLS 1.2** for older clients (some corporate proxies, older Android 5,
  Java 7). Once those are gone from your analytics, you can drop to
  `TLSv1.3` only (Mozilla "Modern").

### 5.7 Private key security

- Permissions: `chmod 600 key.pem`, `chown root:root`.
- Store on the server, never in version control.
- For load balancers that import keys (AWS ALB, GCP HTTPS LB), prefer
  **ACM / Google-managed certificates** so keys are stored encrypted by the
  cloud KMS — you never handle the private key directly.

### 5.8 Let's Encrypt rate limits (avoid being blocked)

| Limit | Value | Mitigation |
|-------|-------|------------|
| Certificates per registered account | 50 / week | One cert per actual hostname set |
| **Failed validations** / hostname | 5 / hour | Fix DNS before requesting |
| **Pending authorizations** | 300 / account | Clean up old authorizations: `certbot delete` |
| **Duplicate certificates** | 5 / week | Don't re-issue identical sets; use `--force-renewal` sparingly |
| **New orders** | 300 / 3 hours | Batch hostname changes; stagger renewal |

> If you hit a limit, you cannot bypass it. Wait for the window to roll over,
> or contact Let's Encrypt support for a temporary reset (they only do this
> for documented incidents).

---

## 6. Validation and Testing

### 6.1 Automated TLS scan

```bash
# Clone once
git clone --depth 1 https://github.com/drwetter/testssl.sh.git
cd testssl.sh

# Scan
./testssl.sh --openssl example.com
./testssl.sh --hsts example.com
./testssl.sh --pfs example.com
./testssl.sh --cert-comp example.com
```

Checklist of pass criteria:
- TLS 1.2 and TLS 1.3 **enabled**
- TLS 1.0 / 1.1 / SSLv3 **disabled**
- No RC4, 3DES, EXPORT, MD5 ciphers
- PFS (perfect forward secrecy) **available**
- OCSP stapling **working**
- HSTS header present with `preload` (once deployed)

### 6.2 Quick manual checks

```bash
# Confirm redirect
curl -sI http://example.com | grep -i location
# Expected: 301 https://example.com/

# Inspect headers
curl -sI https://example.com | grep -iE \
  'HTTP|strict-transport|x-content-type|referrer|permissions'

# Verify the certificate chain
openssl s_client -connect example.com:443 -servername example.com \
  -showcerts </dev/null 2>/dev/null | \
  openssl x509 -noout -text | head

# Check certificate expiry
echo | openssl s_client -connect example.com:443 2>/dev/null | \
  openssl x509 -noout -dates
```

### 6.3 Browser test

- Visit `https://www.ssllabs.com/ssltest/` and enter your domain.
- Aim for **A+** (or A if HSTS preload isn't yet submitted).
- Common downgrades: missing chain, no OCSP stapling, weak DH params.

---

## 7. Troubleshooting

### 7.1 `ERR_CERT_AUTHORITY_INVALID`

| Cause | Fix |
|-------|-----|
| Missing intermediate cert | Serve `fullchain.pem` (Let's Encrypt) or concatenate intermediates (commercial CA) |
| Self-signed cert in prod | Obtain a real cert or install your private CA root on client machines |

### 7.2 `ERR_CERT_COMMON_NAME_INVALID`

| Cause | Fix |
|-------|-----|
| Hostname not in cert SANs | Re-issue with the correct `-d` flags or SANs in the CSR |
| Using `example.com` cert on `www.example.com` | Add all intended names as SANs / use a wildcard |

### 7.3 HTTP→HTTPS redirect loop

| Cause | Fix |
|-------|-----|
| Load balancer terminates TLS but forwards plain HTTP; app sends redirect back to HTTP | Set `X-Forwarded-Proto` header on LB and configure app to trust it |
| Nginx `return 301` sits behind another redirector | Trace the chain with `curl -sIL` and collapse to a single hop |

### 7.4 Certificate not renewing

```bash
# Dry-run to surface errors
sudo certbot renew --dry-run --debug-challenges
# Common causes:
#   - Port 80 blocked by firewall / already in use (HTTP-01 challenge fails)
#   - DNS API token missing or incorrect (DNS-01 challenge fails)
#   - File permission issues on /etc/letsencrypt/
#   - Expired account key / IP rate-limited by LE
```

### 7.5 OCSP stapling shows "no response sent"

| Cause | Fix |
|-------|-----|
| DNS resolver not configured or unreachable | Set `resolver 8.8.8.8 1.1.1.1 valid=300s;` in Nginx |
| Firewall blocks outbound OCSP | Allow outbound to the CA's OCSP responder (port 80) |
| Let's Encrypt endpoint temporarily down | Retest after a few minutes; stapling is opportunistic |

---

## Appendix A — Minimal Content-Security-Policy

```nginx
# Example permissive-enough CSP for a server-rendered Next.js app
add_header Content-Security-Policy \
  "default-src 'self'; \
   script-src 'self' 'unsafe-eval' 'unsafe-inline'; \
   style-src 'self' 'unsafe-inline'; \
   img-src 'self' data: https:; \
   font-src 'self' https:; \
   connect-src 'self'; \
   frame-ancestors 'none'; \
   base-uri 'self'; \
   form-action 'self'" always;
```

> For production, replace `'unsafe-inline'` / `'unsafe-eval'` with nonces or
> hashes and tighten `connect-src` to your actual API origins.

---

## Appendix B — Let's Encrypt ACME v2 endpoints

| Staging (for testing) | Production |
|------------------------|------------|
| `https://acme-staging-v02.api.letsencrypt.org/directory` | `https://acme-v02.api.letsencrypt.org/directory` |
| Unlimited; identical responses | Subject to rate limits above |

Always develop and test against **staging** first:

```bash
certbot certonly --test-cert --nginx \
  -d example.com -d www.example.com \
  --email ops@example.com --agree-tos --no-eff-email
```

---

*This guide is maintained as living documentation in `docs/https-production-guide.md`.
Review and update quarterly or after any certificate-related incident.*
