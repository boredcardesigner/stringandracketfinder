# Deploying stringandracketfinder.com — the click-path

Variant 3: static site + serverless API on **Vercel**, database on **Neon**,
login emails via **Resend**, photos on **Vercel Blob**. Everything below is
dashboards and copy-paste — the code in this folder is complete.

## 1 · GitHub (10 min)
1. Create a GitHub account → **New repository** → name `srf-site`, private is fine.
2. Upload THIS folder's contents (drag & drop works: "uploading an existing file").
   `index.html` must sit at the top level, next to the `api/` folder.

## 2 · Neon — the database (10 min)
1. neon.tech → sign up (free) → **New project**, region Frankfurt (eu-central-1).
2. Open the **SQL Editor** → paste the whole of `db/schema.sql` → Run. Seven tables appear.
3. Copy the **pooled connection string** (Dashboard → Connect → "Pooled"). That is `DATABASE_URL`.

## 3 · Resend — the login emails (15 min)
1. resend.com → sign up (free) → **Domains → Add domain** → `stringandracketfinder.com`.
2. Resend shows 3 DNS records (SPF, DKIM…). Add them at **Squarespace → Domains →
   stringandracketfinder.com → DNS settings**. Wait for "Verified" (minutes to an hour).
3. **API Keys → Create** → that is `RESEND_API_KEY`. `MAIL_FROM` = `login@stringandracketfinder.com`.

## 4 · Vercel — the site itself (15 min)
1. vercel.com → sign up **with your GitHub account** → **Add New → Project** → import `srf-site` → Deploy.
   (No framework, no build step — it detects the static file + api folder alone.)
2. **Storage → Create → Blob** → attach to the project (this injects `BLOB_READ_WRITE_TOKEN`).
3. **Settings → Environment Variables** — add, for Production + Preview:
   - `DATABASE_URL` — from step 2
   - `RESEND_API_KEY` — from step 3
   - `MAIL_FROM` — `login@stringandracketfinder.com`
   - `SESSION_SECRET` — run locally: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
   - `SITE_ORIGIN` — `https://stringandracketfinder.com`
4. **Deployments → Redeploy** so the variables take effect.

## 5 · The domains (10 min + DNS patience)
1. Vercel → Project → **Settings → Domains** → add `stringandracketfinder.com` and `www.stringandracketfinder.com`.
2. Vercel shows the records: an **A record** (`76.76.21.21`) for the bare domain and a
   **CNAME** (`cname.vercel-dns.com`) for `www` — enter exactly what Vercel displays
   at Squarespace → DNS settings. HTTPS certificate appears automatically.
3. Add `stringsandracketsfinder.com` as a third domain in the same panel → Vercel asks
   "Redirect to stringandracketfinder.com?" → **yes, 308 permanent**. Set its two DNS
   records at Squarespace the same way. The plural now forwards forever.

## 6 · Seed the gear catalogue (5 min, one time)
On your computer, in this folder:
```
npm install
DATABASE_URL="postgres://…your neon string…" npm run seed
```
→ `seeded 26 rackets, 31 string beds`. From then on you edit gear in Neon's
table editor — no redeploys.

## 7 · Prove it works (5 min)
1. Open https://stringandracketfinder.com — the Finder loads, and a slim
   **cloud** bar appears under the member bar (the sleeper module woke up).
2. Type your email → *send sign-in link* → click the link in your inbox →
   you're back on the site, signed in.
3. Move a slider, switch the theme → open the site on your PHONE → sign in
   with the same email → your setup is there. That is the backend, working.

## What runs where — the map
| Piece | Where it lives | You edit it via |
|---|---|---|
| The Finder (front-end) | `index.html` on Vercel | this project + git push |
| Accounts & sessions | `api/auth/*` functions | code |
| Preferences | `profiles` table in Neon | automatic |
| Gear catalogue | `rackets` / `strings` tables | Neon table editor |
| Chatroom posts + photos | `posts` table + Vercel Blob | `api/posts`, `api/upload` (UI wiring = next phase) |
| Login emails | Resend | — |

## Costs
Everything above runs on free tiers at your scale. First real cost appears if
the site becomes genuinely popular (Neon ~19 $/mo, Vercel ~20 $/mo) — a nice
problem to have.

## The one security rule
Secrets live ONLY in Vercel's Environment Variables. Nothing in `index.html`
is secret, and the session cookie is HttpOnly — scripts can never read it.
