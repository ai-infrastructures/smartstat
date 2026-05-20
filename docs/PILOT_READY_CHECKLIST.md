# SmartStat AI — Pilot-ready checklist (for Matt)

**Status:** technical V1 is ~90% built. What remains to launch a paying pilot
hospital is mostly operational/legal/contractual.

This document is the punch list of everything **outside the codebase** that
must be in place before the first hospital can sign and be onboarded.

---

## 1. Legal entity & accounts

These are infrastructure investments that pay off across every customer.

### 1.1 Smartstat AI LLC
- ✅ Recommended state of formation: **Delaware** (standard for SaaS, friendly
  to investors)
- Cost: ~$300 setup + $300/year franchise tax
- Required for: Apple/Google account, BAA signature, hospital contracts

### 1.2 Apple Developer Program
- 🔗 https://developer.apple.com/programs/enroll/
- Enroll as **Organization** (not individual)
- Requires DUNS number (free, takes 1–2 weeks if you don't have one)
- Cost: **$99/year**
- This is the account that owns all TestFlight + App Store builds of all
  tenant white-label apps. Do NOT use a personal Apple ID.

### 1.3 Google Play Console
- 🔗 https://play.google.com/console/signup
- Organization account
- Cost: **$25 one-time**
- Same logic: this account owns all Play Store listings.

### 1.4 Stripe (or chosen payment processor)
- For hospital subscription billing (setup fee + recurring)
- Stripe Atlas if you don't yet have a US bank account

### 1.5 1Password Teams (or similar secrets vault)
- Cost: $19/month
- All API keys, signing certificates, account passwords live here.
- Anti-G policy: every credential has at least 2 humans who can access it.

---

## 2. Infrastructure — HIPAA-eligible

The current Supabase project is on the free/Pro plan with no BAA. Before any
hospital with real users connects, we must upgrade.

### 2.1 Decision: Supabase Team vs AWS

| | Supabase Team | AWS RDS + S3 |
|---|---|---|
| Monthly cost | $599 | $50–300 at our scale |
| Signed BAA | Yes, included | Yes, free |
| Setup time | 1 day | 2–3 weeks |
| Migration effort from current | Zero (just upgrade plan) | 2 days dev |
| Vendor lock-in | Higher | Lower |
| **Recommended for V1 pilot** | ✅ | Later, when revenue justifies |

**Decision needed from Matt:** upgrade Supabase to Team for V1 pilot.

### 2.2 Steps after upgrade
1. Email Supabase to request BAA at compliance@supabase.com
2. They send a docusign-style BAA → you sign as officer of Smartstat AI LLC
3. They flip your project to HIPAA mode
4. We migrate the same migrations 001–010 to a new Team-tier project
5. Update mobile/admin .env to new project URL

### 2.3 Other paid services that need BAAs before production
- Sentry: Business plan + BAA addon (~$80–100/mo)
- AWS S3 (if used for PHI assets): free, signed via AWS Artifact
- Postmark or Resend: HIPAA add-on plan
- Cloudflare R2: not HIPAA-eligible currently → keep for non-PHI assets only
  (logos, mesh files, QR PDFs)

---

## 3. Legal documents

### 3.1 Privacy Policy + Terms of Service
- US healthcare attorney, expect $2k–$4k
- Mandatory because:
  - App Store rejects apps without privacy policy
  - GDPR and CCPA require it
  - HIPAA requires Notice of Privacy Practices in the app

### 3.2 Business Associate Agreement (BAA) template
- Each hospital that uses SmartStat AI on real patients is a "Covered Entity"
  under HIPAA. SmartStat AI is the "Business Associate".
- The BAA template is what they sign with us before deployment.
- Same attorney can draft. Should cover: PHI handling rules, breach
  notification (within 72h), subcontractor flow-down, audit rights.

### 3.3 Master Services Agreement (MSA)
- For B2B SaaS with hospitals: per-client SaaS subscription terms
- Usually structured as: setup fee + monthly subscription + SLA

### 3.4 Data Processing Agreement (DPA)
- For future EU expansion. Optional for USA-only V1.

---

## 4. Pilot hospital — go-to-market

### 4.1 Target profile (per Matt's pitch)
- Medium private hospital, 50–500 beds
- Decision-maker reachable in 1–2 weeks (not a 6-month committee)
- Pain point articulated by them: patients/visitors lost in the facility
- Ideally a hospital Matt or his network already has a warm intro to

### 4.2 Pricing proposal (for first 3 pilots)
- **Setup fee:** $2,000 one-time
  - Includes LiDAR scan of one floor by SmartStat AI operator
  - Branded TestFlight + Google Play Internal build
  - POI placement workshop (half-day on-site or remote)
  - BAA signed and exchanged
- **Monthly subscription:** $400/month
  - Unlimited end users
  - Live admin dashboard
  - Realtime updates
  - One floor included; +$100/month per additional floor
- **Rescan service:** $500 per floor when layout changes
- **Pilot discount:** first 3 hospitals get 50% off setup and 3 months free
  subscription in exchange for case study + reference

### 4.3 Demo flow (45 min meeting)
1. **5 min** — opening: "hospitals lose $X per year on patients missing
   appointments because they can't find the room."
2. **15 min** — live demo:
   - You scan a QR on your phone right in front of them
   - You type "cardiology" — see fuzzy results
   - You tap → see route on the map
   - Voice guidance kicks in
   - Show wheelchair toggle
   - Show offline mode (airplane mode demo)
3. **10 min** — admin walkthrough:
   - Show how their staff places POIs on the map
   - Show analytics: top searches per day
   - Show audit log (HIPAA-relevant)
4. **5 min** — pricing + timeline
5. **10 min** — Q&A

### 4.4 Materials needed for the pitch
- ✅ Working demo (we have it — Demo Hospital with 6 POIs)
- ❌ One-pager PDF with pricing and timeline → I can draft if you want
- ❌ Case study template (filled in after first pilot)
- ❌ Sales deck (10 slides) → I can draft if you want

---

## 5. Pre-launch dev checklist (still on Stefano)

### 5.1 Code complete
- ✅ Backend + DB + RLS + auth + analytics + audit
- ✅ Admin dashboard end-to-end CRUD
- ✅ Mobile app — search, navigate, scan QR, voice, offline, realtime
- ✅ Brand + white-label build system
- ⏳ Scanner role workflow (mobile login → upload Polycam .glb)
- ⏳ Push notifications end-to-end (token registration + send)

### 5.2 Production setup
- ⏳ Supabase Team plan upgrade + BAA signed
- ⏳ Migrate database to Team-tier project
- ⏳ Sentry production setup + BAA
- ⏳ Apple Developer + Google Play accounts
- ⏳ First EAS production build (TestFlight + Play Internal)
- ⏳ Privacy policy + ToS deployed in app
- ⏳ Smartstat AI LLC formed
- ⏳ Domain smartstat.app purchased + production deploy on Vercel

### 5.3 Operational
- ⏳ Pilot hospital signed
- ⏳ On-site LiDAR scan day scheduled
- ⏳ POI placement workshop scheduled
- ⏳ TestFlight invitation list (3–5 hospital staff to test)
- ⏳ First-week support plan (Stefano + Matt on Slack for hospital staff
  questions)

---

## 6. Next-7-days punch list for Matt

If we want a pilot signed within ~30 days, here is the week-1 sprint
for Matt (the work I cannot do because it requires his network or
signature):

| # | Task | Time | Outcome |
|---|---|---|---|
| 1 | Form Smartstat AI LLC (Delaware via Stripe Atlas or similar) | ~3h paperwork | LLC exists |
| 2 | Apply for DUNS number if not already had | 1h | Required for Apple |
| 3 | Open Apple Developer Program enrollment | 1h | Account created |
| 4 | Open Google Play Console | 30 min | Account created |
| 5 | Email 3 lawyer candidates for HIPAA legal package | 1h | Quotes in inbox |
| 6 | Call/email 5 medium private hospitals from network | ~5h | At least 1 demo booked |
| 7 | Approve Supabase Team upgrade for our project | 15 min | Production tier ready |
| 8 | Sign Stripe Atlas / set up billing | 2h | Can invoice clients |

Total: roughly one Matt-week.

In parallel I (Stefano) finish scanner workflow + push notifications +
production deploy setup. We meet at the end of week 1 to sync.

---

**Bottom line:** the product is ready. The pilot launches the moment we
have (a) Apple/Google accounts, (b) HIPAA infra, (c) a hospital that
signs. The first two are paperwork. The third is sales — and that's the
one only Matt can drive.
