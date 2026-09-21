# BOOPbase / VIBEtree — Baseline 1.0

**Tag / branch:** `v1.0.0-baseline`  
**Code freeze commit:** `475fc9cc252ba85186c44300cfb5e82fe134031b` (official logos)  
**Date:** 2026-09-20  
**Status:** Technical product checkpoint (working core loop). Not commercial launch-complete.

---

## Purpose

Freeze a known-good state of the NFC → digital profile platform so future work (claim polish, Woo webhook, shop, homepage) cannot silently regress the proven core.

**Core loop defended by this baseline:**  
Physical Boop device → tap URL (`/p/[code]`) → public profile (`/{username}`).

---

## In scope (shipped and live)

### Brand & public surface
- Official Boop wordmark SVGs (`public/brand/boop-logo-black.svg`, `boop-logo-white.svg`, `boop-logo-grey.svg`)
- Public profile footer order: tagline → logo → "by EasyDidIt"
- Tagline: *Building Opportunities One Profile at a time*
- Skin system: Classic, Jazz Night, Night City, and additional packs
- Public profiles with hero, socials, links, Add to Contacts (vCard)

### NFC / devices
- Device model: many device codes can share one `ownerUsername`
- Tap route `/p/[code]` with ready / claimed behavior
- Field-proven units: PEASY1 (band), PEASY2 (card) → `/peasy1`
- Owner mint / custom codes via owner tools

### Owner ops
- `/owner/clients` — purchase email + username linked to device codes
- Assign device codes to customers
- Mongo `Customer` collection

### Auth & accounts
- Custom auth (bcrypt, HTTP-only cookies)
- Register and login (optional `?code=` for device attach path)
- Shop/owner logins: pez / easydidit reserved

### Stack
- Next.js App Router, TypeScript, Tailwind
- MongoDB + Mongoose
- Vercel hosting
- Domain: boopbase.com (www preferred while apex SSL stabilizes)

### Product SKUs (business, not necessarily all listed on shop yet)
- Card $25 (black / white / clear; +$5 custom logo)
- Band $35
- Bundles: Starter $55, Two Cards $45, Desk+Wrist $80

---

## Out of scope (post-baseline)

| Item | Notes |
|------|--------|
| WooCommerce → Vercel webhook | Purchases do not auto-create client rows yet |
| Full easydidit.com Boop catalog live | Sales path still partly manual / owner-driven |
| Fully polished stranger claim UX | Register/login work; still ops-assisted for first customers |
| Marketing homepage | App homepage may still need product-facing copy |
| Deep analytics / engagement CDP | Views/clicks partial; not full CDP |
| Enterprise multi-tenant orgs/teams | Architecture-aware; not productized |
| Durable media storage at scale | `public/uploads` is a known limit |

---

## Rollback

```bash
git fetch origin
git checkout v1.0.0-baseline
# or create a recovery branch from the freeze point
git checkout -B recovery 475fc9cc252ba85186c44300cfb5e82fe134031b
```

Live app: redeploy the freeze commit from Vercel if needed.

---

## Post-baseline priority order

1. Claim flow friction (register/login + device attach for strangers)
2. WooCommerce webhook when shop SKUs are live
3. Product homepage on boopbase.com
4. Pre-program inventory of remaining blank cards
5. Analytics and scale hardening as volume grows

---

## Rule for future changes

Do not break:
- Public profile render
- Tap `/p/[code]` → owner profile when claimed
- Auth session
- Owner client list / assign
- Official footer branding

Prefer incremental commits on `main` after this baseline. Tag `v1.1.0` (or a true public-launch `v1.0.0` if you reserve that name) when claim + shop automation + homepage are solid.
