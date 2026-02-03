# fogr.ai — Product & Platform Rules (MVP)

## Core Positioning

Clean, local-first classifieds for Ireland.
Short ads. One image. One price. No spam.

---

## Account & Access

- **Email magic link required before publishing**
- No passwords, no profiles, no social login
- Disposable email domains blocked
- Rate-limit magic link requests
- One verified email = one free ad per day

---

## Ad Limits (Free Tier)

- **1 free ad per day**
- **Max text: 256 characters (headline + body)**
- **1 image only**
- **Mandatory price field**
- **Ad duration: 32 days (symbolic: 32 counties incl. NI)**
- Auto-expire with no bumping

---

## Moderation & Safety

- Client-side profanity filtering (pre-submit)
- Server-side rules + OpenAI moderation (text + image)
- Image reuse detection (hashing)
- Blocked content by category (pets, housing, vehicles, etc.)
- Silent rejection with clear reason shown to user
- Soft flags for suspicious patterns (repeat text, multi-county posting)

---

## Feed & Discovery

- Default feed = **user’s county + neighbouring counties**
- National feed is opt-in
- Sorting:
  - Newest
  - Ending soon
  - Closest
- No likes, no comments, no popularity ranking

---

## UX Principles

- Feed-first, not search-first
- Full-width cards
- Big image, price always visible
- Infinite scroll
- One-tap contact
- No chat at MVP (email relay only)

---

## Upsells (Opinionated, Non-Scummy)

### Recommended Upsells

- **Extra images** (strong yes)
  - +€2–€3 for up to 3 images
  - High perceived value, low abuse risk

- **Extended duration**
  - +€2 to extend by +14 days
  - Natural, non-intrusive

- **Local pin**
  - +€2 to pin in *local county feed only* for 48 hours
  - Avoids national spam

### Conditional / Advanced Upsells

- **QR code for ad**
  - Auto-generated
  - Useful for:
    - Shop windows
    - Noticeboards
    - Car windows
  - Charge only if:
    - Custom branding
    - Downloadable poster
    - Tracking scans

- **Smart social share**
  - Auto-generated square / story image
  - Price + county overlay
  - Paid if customizable

### Avoid (at MVP)

- ❌ More text
- ❌ Highlight colours
- ❌ “Featured everywhere”
- ❌ Boost abuse arms race

> Short text is part of the brand. Don’t dilute it.

---

## What Makes fogr.ai Different

- Hard constraints by design
- Local-first default
- Time-based relevance
- Clean feed, no engagement bait
- Strong anti-scam posture
- Irish context without cliché

---

## Initial Content Strategy (Critical)

### DO NOT scrape classifieds competitors

### Good “Seed Content” (High Trust)

- County GAA fixtures
- Club notices
- Local events (matches, bingo, meetings)
- Mass times
- Community fundraisers

### Rules for Seed Content

- Mark clearly as **“Community Notice”**
- Non-commercial
- No calls to action
- Auto-expire after event date

### Why this works

- Establishes legitimacy
- Trains users on format
- Makes the feed feel alive on day one
- Attracts local eyeballs organically

---

## Categories to Launch With (Max 5)

- Community
- For Sale
- Jobs
- Services
- Rentals (careful with rules)

---

## Non-Goals

- National dominance
- Infinite free ads
- Social features
- SEO-first strategy

---

## Guiding Rule

If a feature increases spam, noise, or inequality between users — don’t ship it.
