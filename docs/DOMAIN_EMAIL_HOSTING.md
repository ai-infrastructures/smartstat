# SmartStat AI — Domain, email & temporary hosting setup

What to do **today** with the domain you just bought, while waiting for
Vercel access. Tutto gratis (o quasi).

---

## Layout finale che otterrai

```
yourdomain.app                    → marketing landing (later)
app.smartstat.app                 → admin dashboard (Next.js)
matt@smartstat.app                → Matt's mailbox (forward to Gmail)
stefano@smartstat.app             → your mailbox
support@smartstat.app             → forward to both
*@smartstat.app                   → catch-all → your Gmail
```

All routed via Cloudflare (DNS + Email Routing).
Web app served by Netlify (temporary) → Vercel (when access arrives).

---

## Step 1 — Move DNS to Cloudflare (15 min)

Why: Cloudflare gives free DNS, free email routing, free SSL, free CDN. It's
the foundation everything else stacks on.

1. Sign up at https://dash.cloudflare.com (free)
2. Top right → **Add a site** → enter `smartstat.app` (or the domain you bought)
3. Choose **Free plan**
4. Cloudflare scans your current DNS records — accept the imports
5. Cloudflare shows you 2 nameservers (e.g. `aria.ns.cloudflare.com` +
   `dan.ns.cloudflare.com`)
6. Go to the registrar where you bought the domain (Namecheap, GoDaddy,
   Google Domains, etc.) → find "Nameservers" / "DNS settings" → **replace**
   them with the two Cloudflare ones
7. Save. Propagation takes 10 min – 24 h (usually under 1 h)

You'll get an email from Cloudflare when the move is complete.

---

## Step 2 — Email routing (10 min, free, unlimited)

Once DNS is on Cloudflare:

1. Cloudflare dashboard → your domain → **Email** → **Email Routing**
2. Click **Enable Email Routing**
3. Cloudflare offers to add the required MX + SPF DNS records — click
   **Add records**. (Don't skip this — without these, you won't receive mail.)

### 2a. Add your personal email as the destination

- **Destination addresses** section → **Add destination address**
- Enter `you@gmail.com` (the inbox where you want incoming mail to land)
- Cloudflare sends a verification email — open it on Gmail, click confirm
- Repeat for any other destination (e.g. Matt's Gmail)

### 2b. Create the addresses you want

- **Routes** section → **Create address**
- Add as many as needed:

| Custom address | Forward to |
|---|---|
| `matt@smartstat.app` | `matt-personal@gmail.com` |
| `stefano@smartstat.app` | `your-personal@gmail.com` |
| `support@smartstat.app` | both (you can list multiple destinations) |
| `hello@smartstat.app` | one of the above |

### 2c. Catch-all (recommended)

- Same section → switch on **Catch-all address**
- Forward to your Gmail
- Now if anyone writes to `whatever@smartstat.app`, it lands in your inbox

### 2d. Reply from your @smartstat.app address

Mail arrives in your Gmail. To **send out** as `matt@smartstat.app`:

1. Gmail → **Settings** → **Accounts and Import** → **Send mail as** →
   **Add another email address**
2. Enter `matt@smartstat.app`
3. SMTP server: `smtp.gmail.com`, port 587, TLS,
   username = your Gmail, password = an **App Password** you generate
   at https://myaccount.google.com/apppasswords (requires 2FA on the Gmail)
4. Send the verification code, paste it back into Gmail
5. Done — when composing, you can pick `matt@smartstat.app` from the
   "From" dropdown

Same flow for every alias.

### What this does NOT cover

Cloudflare Email Routing only handles **incoming forwarding** and **reply
via Gmail**. It does **not** let your apps send transactional email from
`noreply@smartstat.app`. For that we'll later add **Resend** or **Postmark**
(both have free tiers and support custom domain senders). Not blocking V1.

---

## Step 3 — Temporary hosting on Netlify (20 min)

Vercel access is pending. Netlify is the closest drop-in alternative for
Next.js 16 and is free for our scale. The `netlify.toml` is already in the
repo — Netlify reads it automatically.

### 3a. Connect the repo

1. Sign up at https://app.netlify.com (login with GitHub for one-click)
2. **Add new site** → **Import an existing project** → **Deploy with GitHub**
3. Select the GitHub org `ai-infrastructures`, then the `smartstat` repo
4. Netlify reads `netlify.toml` and pre-fills:
   - Base directory: empty (correct — repo root)
   - Build command: `corepack enable && pnpm install --frozen-lockfile && pnpm --filter @smartstat/admin build`
   - Publish directory: `apps/admin/.next`
5. Open **Add environment variables**:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://zrmqcfyebglgitfybcdk.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_kWf1Sc7yV43ygLc_OoG5Qg_rnwlPsst`
6. Click **Deploy site**

First build takes 3–5 minutes. Netlify gives you a URL like
`some-random-words-12345.netlify.app`.

### 3b. Point your domain at it

1. Netlify → Site → **Domain management** → **Add custom domain** →
   `app.smartstat.app`
2. Netlify asks you to add a CNAME on your DNS
3. Go to Cloudflare → **DNS** → **Records** → **Add record**:
   - Type: `CNAME`
   - Name: `app`
   - Target: `<your-site-name>.netlify.app` (exact value Netlify gave you)
   - Proxy status: **DNS only** (gray cloud) — important! Netlify already
     does its own CDN and HTTPS, so we disable Cloudflare proxy for this
     subdomain to avoid double-proxy issues
4. Save. Within 2 minutes `https://app.smartstat.app` resolves to Netlify
5. Netlify auto-provisions an SSL certificate via Let's Encrypt — no action
   needed

### 3c. Update Supabase auth redirect

Right now Supabase only knows about `localhost:3000`. To make magic-link
login work on `app.smartstat.app`:

1. Supabase dashboard → **Authentication** → **URL Configuration**
2. **Site URL** → set to `https://app.smartstat.app`
3. **Additional Redirect URLs** → add `https://app.smartstat.app/auth/callback`
4. Save

Now magic links sent from production deploy work correctly.

### 3d. Free tier limits

- 100 GB bandwidth / month — fine until ~10k MAU
- 300 build minutes / month — fine for our commit rate
- Unlimited sites, custom domains, HTTPS

---

## Step 4 — When Vercel access arrives

Migration plan:

1. Vercel → New project → import the same repo
2. Same env vars as Netlify
3. Vercel deploys automatically
4. Once verified, in Cloudflare DNS swap the `app` CNAME from Netlify to
   the Vercel target (or use `vercel.app` for now)
5. Delete the Netlify site (or keep it as a staging environment)
6. Delete `netlify.toml` from the repo
7. Update Supabase redirect URL to the Vercel domain

Zero code changes between Netlify and Vercel — both run Next.js 16
identically.

---

## Step 5 — Optional, when you launch marketing

For the root `smartstat.app` (no subdomain) you can either:
- **Now**: redirect to `app.smartstat.app` (Cloudflare rule or empty Netlify
  static site)
- **Later**: a proper marketing landing page (Framer, Webflow, or a
  hand-coded Next.js page in `apps/landing/`)

For now keep it simple: a Cloudflare Page Rule that 301-redirects
`smartstat.app` → `https://app.smartstat.app`.

---

## Recap — what to do today (in order)

| # | Where | Action | Time |
|---|---|---|---|
| 1 | Cloudflare | Add domain, get nameservers | 5 min |
| 2 | Registrar | Replace nameservers with Cloudflare's | 5 min |
| 3 | Wait | DNS propagation | 10 min – 1 h |
| 4 | Cloudflare → Email | Enable Email Routing + add destinations + routes | 10 min |
| 5 | Gmail | Add "Send as" for each `*@smartstat.app` address | 10 min |
| 6 | Netlify | Connect repo, set env vars, deploy | 10 min |
| 7 | Cloudflare DNS | CNAME `app` → netlify URL | 2 min |
| 8 | Supabase | Add `https://app.smartstat.app/auth/callback` to allowed redirects | 2 min |

Total active time: ~45 min, mostly waiting.
