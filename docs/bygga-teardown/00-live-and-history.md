# Live site, deployment and git history (first-hand findings)

## Live deployment (probed 2 Nov 2026)

- Host: Vercel (`server: Vercel`, edge `iad1`), Next.js (`x-powered-by: Next.js`), built with Turbopack (`turbopack-*.js` chunk, `/_next/static/immutable/` paths), deployment id `dpl_DrDZ5V6sqvmNmjzhwtcF2bK6Zs5g`.
- Pages are prerendered and CDN cached (`x-nextjs-prerender: 1`, `x-vercel-cache: HIT`, `x-nextjs-stale-time: 300`).
- Security headers match `next.config.ts` exactly: CSP `default-src 'self'` with `script-src 'self' 'unsafe-inline'`, `connect-src 'self'` (the browser can only talk to usebygga.com), `Permissions-Policy: camera=(self), microphone=(self), geolocation=(), payment=(), usb=()`, HSTS 2 years, `X-Frame-Options: SAMEORIGIN`, nosniff.
- `robots.txt`: allow all, disallow `/api/`, `/dev/`, `/builds`.
- `sitemap.xml`: 2,228 URLs = home, /browse, /privacy + 2,225 `/build/<slug>` guide pages.
- `manifest.webmanifest`: standalone PWA, `#f5f4f0` background and theme, SVG + 192/512 + maskable icons.
- `/sw.js` (5,033 bytes) is byte-identical to `public/sw.js` in the repo; `/voice/heart/manifest.json` (27,801 bytes) is byte-identical to the repo copy. The live site runs the public `main`.
- Voice clips: `/voice/heart/<id>.mp3`, `audio/mpeg`, `Cache-Control: public, max-age=604800, stale-while-revalidate=2592000`.
- Analytics seen on every page: `/pl/script.js` (Plausible, proxied through the site's own domain) and `/_vercel/insights/script.js` (Vercel Analytics). No third-party request leaves the page.
- Share cards: `/opengraph-image` (home, 1200x630 PNG) and `/build/<slug>/opengraph-image` per guide, rendered server side.
- Per-guide meta: title `KALLAX shelving unit, 2 × 2: assembly step by step | Bygga`, description `How to assemble the IKEA KALLAX shelving unit, 2 × 2, one step at a time in 3D: every panel, screw and tool, about 40 minutes.`, `og:type article`.

### API surface as seen from outside

| Route | GET | Behaviour without a key |
| --- | --- | --- |
| /api/key | 405 | POST with a bogus key returns `{"ok":false,"reason":"format"}` (format check before any network call) |
| /api/voice | 401 `{"error":"key"}` | GET endpoint (CDN cacheable), needs a key |
| /api/help | 405 | POST `{}` returns 401 `{"error":"key"}` |
| /api/identify, /api/listen, /api/feedback, /api/scan, /api/guide | 405 | POST only |

### Page weight

Homepage loads 16 JS/CSS chunks: 7.23 MB raw, 2.15 MB brotli. One chunk (`3o0ujhafhfr-c.js`) alone is 6.07 MB raw / 1.80 MB brotli and holds the plan generator's family recipes (the string "cam lock" appears 1,089 times in it, "Tap dowels" 256 times). The team's own `docs/manual-sweep.md` lists this as a to-do: "the family files are in the client bundle that every page loads". three.js is not in the homepage's initial chunks.

### What a guide page shows (KALLAX 2x2, live)

Cover: dimension drawing (77 × 77 × 39 cm), 25 size chips for every KALLAX variant, Time 40 min, People One, Level Easy, "Before you start: Clear 2 × 2 m of floor and lay the flattened box down as a mat. 7 panels and 30 fittings in 11 steps. You'll want a screwdriver and a hammer.", "Other KALLAX products: Desk, TV bench", "Find the manual on ikea.com", "Print this guide", the unofficial line, "Start building".

Step 5 of 11 ("24 min left"): "Push in the next divider. Plain end first against the row before, onto the dowels." You need: C Divider 1×. Up next: 6 Tap dowels into the open ends. Controls: replay, pause, Slow. Keys: ← → to move, R to replay. Big "Done, next step" button. Top bar: Tools, Parts, Build 5/11, Done; overview grid, sound, Voice, Feedback, help.

Workshop (/builds): "Your workshop. Everything you've built, side by side and to scale." Still building list with progress ("Step 5 of 11", Continue), and 8 badges: First build, Drawer whisperer, Safe and sound (fix to the wall), Team player (two-person build), Quick hands (beat the typical time), Sweet dreams (a bed), Bookworm (bookcase or shelf), Regular (five builds).

## GitHub (via search API, 2 Nov 2026)

- `Nutlope/bygga`: created 21 Oct 2026, 506 stars, 63 forks, MIT, TypeScript, last push 29 Oct. Description still reads "Scan any paper manual with Together AI" (the scanner was parked on 26 Oct).
- Issues (4, all open): #1 Missing product (IDANÄS sideboard), #2 "most nontrivial builds contain impossible instructions" (dowels passing through wood, a seat screwed to thin air), #3 KYRRE stool drawn with 3 legs, #5 "Thank you, and a heads-up about Hackea" (hansipie/Hackea: a fork that designs IKEA hacks with a 3D editor).
- PRs (2, open): #4 search skips leading "IKEA", "the", "my" (today "IKEA KALLAX" opens IKEA PS cabinet and "my billy" opens MYDAL), also reports `npm ci` failing on a missing `@emnapi/runtime@1.11.3` lock entry; #6 ELVARLI wardrobe combination guides (28 and 56 steps). The repo runs Cursor Bugbot on PRs.
- Youssef's GitHub handle is `Luffixos`.

## Git history

166 commits, 20 to 29 October 2026. Authors: Youssef (163 commits) and Hassan El Mghari (3). **163 commits carry `Co-Authored-By: Claude Opus 5.5`**: the app was written with Claude Code, in parallel agent worktrees (".claude/ is ignored", "lint skips agent worktrees", batches merged as "Merge third batch ...").

Commits per day: 20 Oct 1, 21 Oct 3, 22 Oct 1, 23 Oct 1, **26 Oct 108**, 27 Oct 49, 28 Oct 1, 29 Oct 2.

### Timeline

- **20 Oct**: "Initial commit from Create Next App".
- **21 Oct**: "Build Bygga: animated, manual-style assembly guides", one commit of 89 files and 17,459 lines: parametric generator for shelves, drawers, tables, beds, cabinets, seats and sofas with **152 products**, the three.js line-art stage, tools/parts/steps/done flow, voice, wake lock, and a **/scan** feature where Together AI reads photos of any paper manual. Same day: "Stuck?" chat costs "about $0.001 a question on gpt-oss-120b".
- **22 Oct**: "Make hands-free voice work": **527 clips recorded with ElevenLabs Eleven v4 (voice Matilda)**, checked with Whisper on Together; voice commands (stop, how many, where am I, slower, go to step N), headphone and lock-screen buttons, V key.
- **23 Oct**: "Move the hands-free voice to Together AI (Kokoro)": all clips re-recorded in Kokoro's Heart voice, FAL_KEY removed.
- **26 Oct (108 commits)**: scanner parked for v2; API hardened (per-route rate limits); IKEA's public search API scraped (9,609 UK products into facts.json); catalog rows generated; article-number search; share cards, SEO, PWA; print view; offline; then a run of "Draw X" commits, one new furniture kind every 2 to 5 minutes (office chairs, corner sofas, cots, bunk beds, drop-leaf tables, wash-stands, kitchen cabinets, PAX corners, U-shaped sofas, loungers...). README counts climb through the day: 778 products / 937 clips, 829 / 1,084, 924 / 1,177, 973 / 1,283. Evening: "Security: keep the paid endpoints to the app's own pages", design pass, footer credit "Built by Hassan and Youssef", new share cards.
- **27 Oct (49 commits)**: MIT license and trademark NOTICE, IKEA raw listings taken out of git, privacy page, "Launch copy: no over-claims"; offline voice; on-device Chrome speech tried and dropped ("asking Chrome about it crashed the tab"); "Hear next in every browser ... with Whisper on Together" (483 generated test runs, 283 replayed by `voice:check`); "Every AI feature runs on the visitor's own Together key" (about a cent a build); US range added; final batch to **1,171 products, 2,180 sizes, 1,476 clips**; site moves to usebygga.com. Hassan's three commits that evening: Plausible via own domain, repo at Nutlope/bygga, Together links through togetherai.link.
- **28 Oct**: "Build guides from IKEA's assembly manuals, add a feedback button": 1,635 files, +148,686 lines. 461 family builders that follow each product's real IKEA manual; 1,974 of 2,180 guides from manuals. Pilot audit (docs/manual-check-pilot.md) had found **19 of 20 core guides differed from the real manual**.
- **29 Oct**: "Fix build accuracy and animations" (parts arrive along their dowels, screws end in wood: the exact complaint of issue #2, filed 28 Oct), 2,139 of 2,166 from manuals; "Add 59 missing IKEA products" (now 1,223 products on the home page).
