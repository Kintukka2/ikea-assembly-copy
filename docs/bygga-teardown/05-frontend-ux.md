# Bygga: frontend, routes, UX flows and design system

Scope: what a visitor sees and touches in `Nutlope/bygga` (HEAD `a02629a`). The 3D engine, voice pipeline and AI routes are covered elsewhere and appear here only where the UI calls them. Paths are relative to the repo root; `file:N` is a line number.

Stack: Next.js 16.4.2, React 19.3, the Motion library `motion` ^14.4 (`motion/react`), `lucide-react` 1.54, three.js 0.186. No UI kit, no Tailwind: about 7,150 lines of plain CSS in four global files (`globals.css`, `home.css`, `guide.css`, `scan.css`).

---

## 1. Routes and rendering

### 1.1 Rendering mode

- `next.config.ts:36` sets `cacheComponents: true` (Cache Components, which makes Partial Prerendering the default). `next.config.ts:37` sets `partialPrefetching: true`, a Next 16 flag that appears to prefetch only the static shell of linked routes.
- No route exports `generateStaticParams`, `dynamic`, `revalidate` or `runtime`. The only segment configs are `maxDuration = 300` on `/api/scan` and `connection()` in `/api/voice`. Pages are prerendered as static shells with dynamic holes wherever a component awaits `params` or `searchParams` inside `<Suspense>`.
- The only `"use cache"` is `getStars()` (`src/lib/github.ts:6-8`, `cacheLife("hours")`), which the header renders inside Suspense. The GitHub star count is therefore baked into the shell and refreshed on the "hours" cache profile.
- `layout.tsx:53-56` wraps `<Offline />` in Suspense because "it reads the path, which the prerendered shell doesn't know yet".
- The CSP is self-only (`next.config.ts:8-23`). That is why Plausible is proxied under `/pl/*` (`next.config.ts:89-94`) and fonts come from `next/font`. Inline scripts stay allowed "because the pages are prerendered and can't carry a per-request nonce".
- The root layout imports all four CSS files (`layout.tsx:5-8`), so every page ships `guide.css` and the parked `scan.css`.

### 1.2 Route map

| Route | What the user sees and does | Rendering |
|---|---|---|
| `/` | Hero with search, an auto-building 3D sheet, How it works, Popular builds, "The paper manual, explained", footer | Static shell; the header stars come from a cached fetch; interactive parts are client components |
| `/browse` | "All guides": "{N} IKEA products in {M} sizes, drawn and ready to build." A filterable catalog | Static; filtering runs on the client |
| `/build/[slug]` | The guide app (section 4) | `Inner` awaits `params` and `searchParams` inside `<Suspense fallback={<div className="guide shell" />}>` (`build/[slug]/page.tsx:30-45`), so each guide renders per request. `GuideApp` is a client component but is server-rendered: for catalog products `catalogSpec(slug)` resolves on the server, so the cover HTML ships in the first response. |
| `/build/[slug]/print` | A4 print view | Same pattern; noindex; canonical back to the guide (`print/page.tsx:11`) |
| `/build/[slug]/opengraph-image`, `twitter-image` | 1200x630 card per guide | Dynamic; the CDN keeps each card for a year (`next.config.ts:61-67`) |
| `/builds` | "Your workshop" (section 5) | Static shell, localStorage read after mount; noindex and disallowed in `robots.ts:6` |
| `/privacy` | "Privacy and terms": "no accounts, no cookies, no ads, and nothing sold" | Static |
| `/scan` | Manual scanner, parked for v2 | Redirected to `/` unless `NEXT_PUBLIC_SCAN=1` (`next.config.ts:96-99`) |
| `/dev/og`, `/dev/og/list` | Playwright harness exposing `window.__draw` and `window.__steps` (`dev/og/Renderer.tsx:19-33`) | `notFound()` / 404 in production |
| not-found / error | "This page isn't in the box" with a search box; "A part didn't fit. Your progress is saved on this device." with Try again | Static / client error boundary. No `global-error.tsx` or `loading.tsx`. |
| manifest, sitemap, robots | The sitemap lists home, browse, privacy and every product, with priority 0.9 for featured, 0.7 for checked, 0.5 otherwise (`sitemap.ts:10`) | Static |
| `/opengraph-image` | Site card | Drawn once at build time (`src/lib/og/card.tsx:26`) |

Guide metadata (`build/[slug]/page.tsx:8-28`) gives a title like "`MALM 3 drawers`: assembly step by step | Bygga" and a description like "about 45 minutes with two people". Unknown and AI-drafted slugs get `robots: { index: false }` ("drafts for names we don't know shouldn't fill search results").

---

## 2. Home page (`src/app/page.tsx`)

**Header** (`SiteHeader.tsx`, `NavLinks.tsx`, `Logo.tsx`):
- Sticky, 60px, on a translucent page colour with `backdrop-filter: saturate(1.4) blur(14px)` (`home.css:9-23`).
- Logo: "an Allen bolt head seen from above" (`Logo.tsx:5`), a yellow hexagon socket in an ink circle, plus a lowercase "bygga" wordmark in Display 800.
- Nav: Browse and Workshop. Workshop shows a count of builds past the cover (`NavLinks.tsx:17,25`).
- GitHub pill: "Star" plus a yellow star and a count formatted like `1.2k` (`SiteHeader.tsx:46-49`). It fetches `api.github.com/repos/Nutlope/bygga` with a 4 s timeout and shows no count when the fetch fails.

**Hero:**
- A "Powered by **Together AI**" pill above the H1 "Build IKEA furniture, step by step."
- **Search** (`Search.tsx`):
  - The placeholder types itself out: "Try KALLAX", "Try 802.758.87", "Try IDÅSEN desk" (`Search.tsx:12,27-57`).
  - The camera button looks a product up from a photo of the box label (`/api/identify`). Without a Together key it opens the KeyModal instead (`Search.tsx:150`).
  - Suggestions show each product's drawing, variant and minutes. When nothing matches exactly, a sparkle row offers *Find "q"*: "Together AI will work out the steps", or "Pick what it looks like, we'll do the rest" without a key.
  - Arrow keys move the selection; Escape blurs.
- "Try" chips: KALLAX, BISSA, MALM, POÄNG, BILLY (`page.tsx:20-26`).
- **Continue chip** (`Resume.tsx`): a progress ring with "**Continue MALM** / You were on step 7 of 17", linking back to the most recent build still in progress.
- **HeroStage** (`HeroStage.tsx`): a white "manual page that keeps building furniture by itself". It cycles KALLAX, MALM, BISSA, LACK, KIVIK and BILLY in the engine's `intro` mode with dimension lines, holds each for 3.2 s (`HeroStage.tsx:12-13`) and offers "Build this". Tabs (`role="tablist"`) pick a product, with a Motion `layoutId` pill sliding under the active one.

**How it works** (`page.tsx:72-134`): three numbered columns with hand-drawn SVGs.
1. "Type the name": a box with a yellow KALLAX label and the helper figure pointing. "It's the big word on the box label, like KALLAX, or the number under it, like 802.758.87. Or snap a photo of it."
2. "Check tools and parts": a screwdriver, hammer and Allen key, with a dowel marked "8×". "One tap if everything's there. Missing a piece? We'll tell you what to do." (`page.tsx:114`).
3. "Follow each step": a panel drops onto a board on a CSS loop (`home.css:749`). "Every step plays in 3D, with each screw shown up close. Drag to see any side."

**Popular builds** (`Sections.tsx`): `Catalog limit={9}` with tabs All, Shelves, Drawers, Wardrobes, Cabinets, Tables, Desks, Beds, Chairs, Sofas, Kids and Outdoor (`Sections.tsx:17-34`). Kids and Outdoor cut across furniture kinds by keyword. "All" shows a curated `POPULAR` list (`src/lib/search.ts:243`), and a header link reads "All {N} products". Cards use pre-rendered PNG line drawings from `public/og/` (2,258 files) with `mix-blend-mode: multiply` (`guide.css:350`), plus name, variant, time, difficulty dots and category.

**"The paper manual, explained"** (`Compare.tsx`): one real step (KALLAX 2x2, step 2) drawn twice from the same isometric geometry (`Compare.tsx:9-22`).
- "Booklet style": cream stock, thin grey lines, a boxed small "2", a part number nobody can find (101351).
- "On Bygga": white sheet, 2.4px ink lines, a divider that settles onto the dowels, a big "2", a hardware box with "2×", lettered circles, and a magnified close-up.
- Numbered pins pair the paper's open questions with answers (`Compare.tsx:63-67`): "Two of which piece?" / "Every part is lettered and counted."; "Which way round?" / "Drag the step to see any side."; "Tapped in how far?" / "A close-up shows how far it goes in." Hovering a pin lights the pair on both sides.
- A footer strip lists "{N} IKEA products", "Read out loud, hands free" and "Free, no account", with the CTA "Try it on KALLAX".

**Footer** (`SiteFooter.tsx`):
- Brand line: "Assembly guides you can turn around, hear out loud and follow with your hands full. Free and open source."
- Columns Build and Project. Outbound arrows slide out and back on hover (`globals.css:105-124`).
- `Crew`: two figures hold up a yellow board reading "Hassan & Youssef", "the way the manual draws a two-person job" (`Figure.tsx:139-166`). They hop on hover, and the name links fill with a yellow marker.
- The base line carries the IKEA disclaimer and a Together wordmark.

**Browse** (`/browse`, `Sections.tsx:81-185`):
- A filter field ("Name or article number") and a count on each tab.
- Sorting uses Swedish collation (`localeCompare(..., "sv")`). A type word or a typo ("kalax") goes through the ranked fuzzy search instead.
- "Show 24 more" (`PAGE = 24`, "a multiple of the 2 and 3 column grids").
- Empty state: *Nothing here matches "q"* with "Make a guide for q".

---

## 3. The guide experience (`src/components/guide/*`)

### 3.1 Resolving the product (`GuideApp.tsx:44-207`)

- **Catalog hit.** It renders at once.
- **Near miss.** A typed name that matches another catalog slug redirects with `router.replace(".../{slug}?step=N")` (`GuideApp.tsx:75-77`).
- **Unknown product.** The app POSTs `/api/guide`. The **Loader** shows a flat-pack box opening, panels rising and the figure reading a booklet, with rotating lines: "Looking up X", "Reading the measurements", "Sorting the hardware", "Counting the fittings", "Drawing the steps" (`Loader.tsx:10`). AI drafts are cached in localStorage. A "typical build" guess deliberately is not cached, "so the next visit (with a key, say) can ask for the real thing" (`GuideApp.tsx:114`).
- **Not found** (`GuideApp.tsx:225-343`). "What does X look like?" with a grid of furniture shapes linking to `?kind=` for a typical build, "Or did you mean" chips, and "Want X's own steps? Add your Together AI key and AI works them out, for about a cent." When IKEA's product type is known but can't be drawn: "X is a Y. We can't draw Ys step by step yet, so trust the paper manual for this one."

### 3.2 Layout

The guide is a full-viewport app: `.guide { height: 100dvh; grid-template-rows: 68px minmax(0,1fr) }` (`guide.css:394`). A white **sheet** holding the 3D drawing sits next to a **panel** `clamp(380px, 31vw, 450px)` wide (`guide.css:545`).

The top bar (`GuideApp.tsx:779-817`) holds:
- the logo;
- the product name and variant;
- the **Stepper**: Tools, Parts, "Build 7/17" with a spring progress line, and Done. Earlier phases can be revisited; Done never can (`GuideApp.tsx:1135-1169`);
- actions: All steps, Sound, a **Voice** pill ("Voice (V)"), a **Feedback** pill, and Help.

On the sheet:
- the corner step number at up to 104px, which slides up or down with the direction of travel;
- a "N×" repeat badge;
- a booklet-style hardware box with up to four fittings and their counts (`GuideApp.tsx:834-862`);
- controls: Replay (R), Pause, "Slow" (half-speed animation and slower voice), and "Reset view" once the model has been dragged;
- "Drag to turn it around" on step 1.

Each Done press stamps a yellow check. Toasts with a cheering figure say "Halfway there. Nice work." and "Last step coming up." (`GuideApp.tsx:486-488`).

The stage mode follows the phase (`GuideApp.tsx:761-766`): the cover plays an `intro` with dimensions and then a turntable; tools and done show the assembled piece turning; parts shows a flat `layout`; steps shows `step` N.

### 3.3 Cover (`CoverPanel.tsx`)

- Name, variant, and a "✓ Built 12 Oct, in 48 min" pill when this device has finished it before.
- Size chips for the variants.
- Stats: Time, People (One or Two), Level (Easy, Medium or Patient).
- **Before you start**: "Clear **{floor space}** of floor and lay the flattened box down as a mat", "**N panels** and **M fittings** in K steps", "You'll want a **screwdriver and a hammer**", "Ask someone to help with step 9".
- Callouts for "Drafted with Together AI" or "A typical build", and links "Find the manual on ikea.com" and "Print this guide".
- The footer button reads "Start building", "Continue at step 8" (with "Start again from the beginning"), or "Build another one" (`CoverPanel.tsx:198-229`).

### 3.4 Tools check (`ToolsPanel.tsx`)

"Grab your tools / Missing one? Tap it for a workaround." The code calls this "an exception check: one tap says 'I have everything'".
- Each tool card flips in CSS 3D (`guide.css:1209`) to show "No Phillips screwdriver? A drill on its lowest setting works. Do the last turn by hand so the screw doesn't strip." (`Tools.tsx:115-126`).
- "In the box" badges mark tools that come with the furniture; optional tools sit under "Nice to have".
- "I have everything" ticks every card in an 85 ms cascade with sound and haptics, the button reads "Great, let's go" in yellow, and the guide moves on by itself (`ToolsPanel.tsx:24-39`).

### 3.5 Parts check (`PartsPanel.tsx`)

"Check the box / Lay everything out like the drawing. Tap anything that's missing." The stage shows the panels laid flat with the caption "Lay your panels out like this".
- Panel rows: an engine-drawn thumbnail, a letter, dimensions and a count. Hardware rows: parametric drawings.
- **Actual size** draws the fittings at true scale. "Calibrate" asks you to "Match a bank card" by sliding an 85.6 x 53.98 mm outline (`PartsPanel.tsx:225-248`).
- Hovering or focusing a row highlights that part in 3D.
- A tapped row turns red ("Missing") and a note appears: "You can still build the steps that don't need it. Spare fittings are usually free at IKEA." with "How to get spare parts", which opens the help sheet (`PartsPanel.tsx:178-190`).
- The button reads "Everything's here", or "Continue anyway" when something is missing.

### 3.6 Steps (`StepPanel.tsx`)

- Voice invite: "Hands full? Turn on voice. Each step is read out loud. Say 'next' to move on."
- "Step N of M", a "N min left" pill, the title and the detail.
- Repeat callout: "Do this for all 3 drawers. Counts below are for one."
- Big warnings: "Grab a second person", "This stops it tipping over: Kids climb. Always fix it to the wall.", "You'll need to drill". Small warning chips such as "Don't tighten fully yet".
- **You need**: parts, fittings and tools with counts.
- A tip, and a heads-up when a two-person step is coming.
- **Up next**: a thumbnail of the next step that is itself a next button.
- Footer: back, and "✓ Done, next step" (or "Done, finish up").
- KeysTip: shown once to desktop mouse users wider than 900px: "← → to move, R to replay" (`StepPanel.tsx:209-256`).
- With voice on, phones enlarge the step text because "voice on usually means the phone is propped up an arm's length away" (`guide.css:3080`). A listening pill shows the mic state, from "Say 'next' when you're ready" to "Mic is blocked. Tap done to move on".

### 3.7 Done (`DonePanel.tsx`)

- The figure cheers in a yellow check bubble: "You built KALLAX." Then "6 minutes under the typical time." or "Built at your own pace. That's the right pace."
- Timing is honest. Gaps over 20 min don't count (`store.ts:36`). A time is only earned if at least 80% of the steps were on screen (`GuideApp.tsx:495`) and the build took at least 20% of the typical time (`store.ts:39-43`).
- **Show it off**: a client-drawn PNG (section 5), shared through the Web Share API as a file, then as a URL, then copied to the clipboard ("Link copied"). There is also "Save image".
- "Saved to your workshop", "Finish the MALM set", and "Did the steps match your box?" (Yes / Not quite, then step chips and a note) (`DonePanel.tsx:197-251`).
- "Before you load it up" checklist, and confetti made of dowels, screws, cams and pins.

### 3.8 URL parameters, keys and device features

- `?step=12` opens at step 12, clamped to the step count, with the earlier phases marked reached (`page.tsx:42-44`, `GuideApp.tsx:349-351`). `?q=` carries the typed name and `?kind=` a chosen shape.
- Keyboard (steps phase only, ignored while typing or while an overlay is open, `GuideApp.tsx:512-534, 727-738`):
  - → / Space / Enter: next. Focused buttons keep their own Enter, and holding a key does not race through steps.
  - ←: back.
  - **R**: replay.
  - **?**: help.
  - **O**: overview.
  - **V**: voice.
  - Esc closes overlays, and ⌘/Ctrl+Enter sends feedback.
- The phone's back gesture steps back through the guide (a `pushState` guard, `GuideApp.tsx:536-558`).
- Headphone next and previous buttons move between steps through the Media Session API (`GuideApp.tsx:740-752`).
- A screen Wake Lock is held during parts and steps (`hooks.ts:7-32`).
- Vibration haptics and WebAudio blips play on taps.
- `document.title` follows progress: "Step 7 of 17, KALLAX | Bygga".
- The **Overview** ("Like flipping through the manual. Tap any page to jump there.") is a grid of step thumbnails.

### 3.9 "Stuck?" help (`HelpSheet.tsx`)

The Help button, the `?` key or the spoken word "help" opens a side sheet, or an 88dvh bottom sheet below 900px.
- "Stuck on step 7?" with an FAQ matched to the step kind (`src/lib/faq.ts`): "The dowel won't go in", "Which way do I turn it?", "I rent and can't drill".
- **Ask about this step**: a streaming chat (`/api/help`) with suggestion chips and a photo option, "Which part is this?". Answers tagged `[part A]`, `[fitting 3]` or `[step 4]` become thumbnails that light the part on the stage or jump to the step (`HelpSheet.tsx:51-90, 383-430`).
- Without a key, asking opens the KeyModal and the question is sent once a key is saved.

### 3.10 Feedback and flagging a wrong step

Three paths lead to `/api/feedback`:
1. **Feedback** pill (`Feedback.tsx`). A card, or a bottom sheet at 640px and below. Topics are radio chips: "Model looks off", "Wrong size", "Steps unclear", "Something broke", "Idea". It has a note field, an optional email, and context such as "KALLAX 2x2 · Step 7". On send: "Thanks, it's with us. We read every note, and fix the guides people flag first."
2. **"This step doesn't match my box"** (a flag icon) in the help sheet sends `{match:false, step}` and answers "Thanks. We'll check step 7 against the real box. Trust the paper manual for now." (`HelpSheet.tsx:432-450`).
3. **Match** on the done screen, asked once per slug.

### 3.11 Local persistence (`src/lib/store.ts`)

Everything lives in localStorage behind try/catch:
- `bygga:builds` maps slug to `Progress`: phase, step, tools, missing, startedAt, doneAt, `activeMs`, `seen[]`, `builtAt`, `builtMs`, `builtFull`, and the spec for non-catalog builds (`store.ts:5-30`). It is saved on every change past the cover (`GuideApp.tsx:418-444`).
- `bygga:spec:*` caches drafts, `bygga:pref:*` holds voice, sound, `ppm`, `keysTip` and match answers, and `bygga:together-key` holds the user's key.
- Every read waits for `useMounted()` (a `useSyncExternalStore`), which avoids hydration mismatches.
- This one store feeds the Continue chip, the nav count, the cover's "Continue at step N", the Built pill and the Workshop.

### 3.12 Print (`PrintGuide.tsx`)

"The whole guide on A4: what's in the box first, then six steps to a page, like the paper manual." The cover sheet lists tools, panels and fittings and ends with "Follow it in 3D, read out loud: usebygga.com/build/...". Step sheets use a 2x3 grid. A sticky bar reads "Drawing step X of Y" until every thumbnail is ready, and only then enables Print (`PrintGuide.tsx:52-78`).

---

## 4. The Workshop (`/builds`, `Workshop.tsx`)

The Workshop is not a room with a character in it. It is a **to-scale showroom**: "Your workshop / Everything you've built, side by side and to scale."
- Totals: Built, Time, Panels, Fittings.
- **Showroom** (`Workshop.tsx:172-258`). `lineup()` merges every finished plan into one scene, 420 mm apart (`src/lib/plan/lineup.ts:11`), rendered with one camera. The helper character's body (`ScaleFigure`) stands beside them at 1750 mm, labelled "You, about 175 cm". A floor line runs underneath, and each piece has a tag ("KALLAX / 77 × 77 cm") that links to its guide.
- **Still building** rows with progress bars and Continue; **Built** cards with the date and time; a remove (×) on each.
- **Badges** (`Workshop.tsx:380-389`): First build, Drawer whisperer, Safe and sound, Team player, Quick hands, Sweet dreams, Bookworm, Regular.
- Empty state: the waving figure beside dashed ghost furniture ("Your first finished build will stand here"), plus starters: "LACK, 15 min, a good first build", KALLAX, MALM.

---

## 5. Share cards

- **Client** (`shareCard.ts`): a 1080x1350 canvas. The engine's drawing is composited with `multiply`, with a yellow check stamp, "I BUILT", the name shrunk to fit, a stat line ("48 min · 17 steps · 64 fittings"), the logo mark drawn on the canvas, and "Step by step in 3D, usebygga.com".
- **Server** (`src/lib/og/card.tsx`, `guide.tsx`): `next/og` at 1200x630 with bundled WOFF fonts (`card.tsx:28-32`). The site card stacks the booklet-style KALLAX page behind the Bygga version. Guide cards size the name from a table of capital-letter widths, put a yellow highlighter behind "N steps, in 3D", and lay the product on a white sheet that runs off the edge. Every card says "Powered by" (the real Together wordmark vectors, "Never rebuild it out of type") and "Unofficial guide. Not affiliated with IKEA."
- **`scripts/og/render.mjs`**: Playwright with SwiftShader opens `/dev/og` and calls `window.__draw` for every kind and product. ffmpeg then flattens each picture onto white, scales it to 720 wide and quantises it to 48 colours: "line art stays crisp at a sixth of the size". The same PNGs make the catalog thumbnails instant and WebGL-free (`Drawing.tsx`).

---

## 6. Design system

### 6.1 Tokens (`globals.css:1-29`)

| Token | Value | Use |
|---|---|---|
| `--page` | `#f5f4f0` | warm page; `themeColor` and manifest colours |
| `--paper` | `#fff` | sheets, cards, panels |
| `--ink` / `--ink-2` / `--ink-3` | `#121212` / `#4a4945` / `#8a877f` | text tiers, outlines, primary buttons |
| `--line` / `--line-2` / `--sunk` | `#e8e6e0` / `#d9d6ce` / `#f2f0eb` | hairlines (as inset shadows), recessed fills |
| `--accent` / `--accent-soft` | `#ffd21f` / `#fff4c7` | the one highlight colour: stamps, ticks, active pins, `::selection` |
| `--ok` / `--miss` / `--miss-soft` / `--blue` | `#157f45` / `#c8371d` / `#fdecea` / `#0a5bd3` | status |
| `--r-xl` / `--r-lg` / `--r` / `--r-sm` | 28 / 20 / 14 / 10 px | radii; 999px pills everywhere; 32px for the hero and footer cards |
| `--shadow-1` | `0 0 0 1px var(--line), 0 1px 2px rgba(18,18,18,.03)` | a card on paper |
| `--shadow-2` | ring + `0 12px 28px -18px rgba(18,18,18,.12)` | floating surfaces |
| `--ease` / `--spring` | `cubic-bezier(.22,1,.36,1)` / `cubic-bezier(.34,1.56,.64,1)` | easing |

Material colours live in the art: wood `#f1e2c3`, metal `#e3e5e7`, plastic `#f4f4f1` (`Hardware.tsx:3-5`), and the booklet cream `#f1ece0` with grey ink `#5d5a53`.

### 6.2 Typography

- `next/font/google` self-hosts **Noto Sans** 400 to 800 (`--font-noto`) and **Noto Sans Display** 600 to 800 (`--font-display`), both with `latin` and `latin-ext` (for Å, Ä, Ö) and `display: swap` (`layout.tsx:13-25`).
- Body: 16/1.5, `-0.011em` tracking.
- Headings: Display 800 with tight tracking from `-0.02em` to `-0.05em` and `text-wrap: balance`.
- Scale:
  - hero `clamp(46px, 4.9vw, 74px)`;
  - section titles `clamp(30px, 3.1vw, 44px)`;
  - product name `clamp(46px, 4.4vw, 64px)`;
  - step title `clamp(26px, 2.2vw, 31px)`;
  - corner step number `clamp(60px, 6.6vw, 104px)` with tabular figures.

### 6.3 Components (`guide.css:1-390`)

- `.btn.primary`: an ink pill, 52px tall; `.big` is 58px with a light sweep on hover.
- `.btn.round`: a sunk circle. Also `.btn.ghost` and `.btn.link`.
- `.icon-btn` (40px), `.pill-btn` (yellow when `.on`), `.chip`.
- `.letter`: a part label, a white circle with an ink ring.
- `.dots` shows difficulty; `.thumb` shows a shimmer skeleton until its drawing loads.
- Tooltips are pure CSS: `[data-tip]::after`, shown after 0.35 s on hover or focus, hidden on touch (`guide.css:160-198`).
- Icons are Lucide with `absoluteStrokeWidth`, "one line weight at every size: 1.75px" (`Icons.tsx:60-68`).

### 6.4 The paper booklet look

The interface imitates an IKEA booklet without copying one (AGENTS.md: "Draw and word everything ourselves").
- White sheets with a 28px radius on a warm page.
- A huge black step number in the corner, with an outlined hardware box of fittings and "N×" counts under it.
- Lettered part circles, uniform ink outlines with `vector-effect: non-scaling-stroke`.
- Stage overlays styled in `globals.css:136-331`: arrows, leader lines, dashed diagonals, dimension lines with haloed labels, and a round close-up callout.
- Yellow is the only colour that marks anything.

### 6.5 Art and the helper character (`src/components/art/`)

- `Figure.tsx:94` is "The helper character: an original little builder".
  - Drawing: a white body with tube limbs outlined twice, dark hair, dot eyes, a **yellow pocket**, black shoes.
  - Poses: stand, cheer, think, point, wave, read (with a yellow booklet), lift and hold. Its bubble can hold "?", "!" or a check.
  - Where it appears: how-it-works (point), not-found and help (think), error, the loader (read), toasts and done (cheer, bouncing), the KeyModal (wave, saying things like "Next!" or "Which one?"), and the Workshop empty state.
  - Variants: `TwoPeople` for two-person warnings, `Crew` for the footer credit, and `ScaleFigure` for the Workshop.
- `Tools.tsx` draws ten tools. `Hardware.tsx` draws fittings parametrically from `len` and `dia`: dowel, cam screw, cam, screw, nail, pin, leg screw, bolt, plate, bracket, runner, knob, handle, hinge, glide, plug, castor, gas lift, connector and roller. They can be fitted to a box or drawn at `pxPerMm`.

### 6.6 Motion

- The Motion library handles the rest of the movement:
  - phase panels swap with `AnimatePresence mode="wait"`, 0.28 s on `[.22,1,.36,1]` (`GuideApp.tsx:964-972`);
  - the hero and category tabs slide their active pill with a `layoutId` spring (500/38);
  - the step number moves with the direction of travel;
  - other uses: the check stamp, toasts, staggered cards, `popLayout` filtering, sheets (spring 380/36), ticks drawn with `pathLength`, and confetti.
- CSS keyframes: `shimmer`, `drop`, `settle`, `crew-hop`, `hop`, `eq`, the loader's `rise` and `flap`, `keyPop` and `keyShake`, and the 3D tool-card flip.

### 6.7 Responsive behaviour and 320px

home.css:
- 1080px: hero stacks, two-column grid, tabs scroll instead of widening the page.
- 900px, 820px, 760px, 700px: compare, how-it-works and footer stack.
- 640px: 16px gutters, wordmark hidden.
- 420px: Try chips on one row.
- 350px: "the smallest phones (320 px) can't fit five: let them wrap" (`home.css:2296`).

guide.css:
- **900px**: stacked rows, 58px top bar / `minmax(230px, 44dvh)` drawing / panel, with a `grid-template-rows` transition. In the tools phase the drawing shrinks to 22dvh. Top-bar icons except Help are hidden. Help and feedback become bottom sheets.
- Landscape phones (900px wide, 520px tall or less): drawing and panel side by side.
- 640px: title hidden.
- 420px: icon-only voice button.
- 360px: "Done is never tappable, so it gives up its room" (`guide.css:3198`).
- Throughout: `env(safe-area-inset-bottom)`, 16px inputs to prevent iOS zoom, `dvh` units, and a search-input `width: 0` fix for text boxes "which pushed phones sideways" (`home.css:331`).

### 6.8 Print CSS (`guide.css:3228-3488`)

`@page { size: A4; margin: 0 }`. Each `.print-page` is fixed at 210 x 297mm with `break-after: page` (`auto` on the last page), step cards use `break-inside: avoid`, and the print bar and Next's dev overlay are hidden.

### 6.9 Dark mode

There is none. `color-scheme: light` (`globals.css:28`), no `prefers-color-scheme` query, and many hex colours hard-coded in SVG and canvas code.

---

## 7. PWA and offline

- **Manifest** (`manifest.ts`): "Bygga", `start_url: "/"`, `display: "standalone"`, colours `#f5f4f0`. Icons: SVG, 192px and 512px PNGs, and a maskable 512px. `apple-icon.png` and `appleWebApp.capable` (`layout.tsx:34`) cover iOS.
- **Registration** (`Offline.tsx`, production only): registers `/sw.js` after `load`. On each path change it posts `{type:"keep", page, files}` with every resource the Performance API recorded, so the first page and pages reached by client-side navigation are cached too (`Offline.tsx:17-29`). `/sw.js` is served `no-cache`.
- **Worker** (`public/sw.js`):
  - Pages: network first, falling back to the same URL, then to `ignoreSearch` (so `?step=N` still works), then to `/`. Pages are capped at 40 entries.
  - `/_next/static`, voice clips, fonts and images: cache first, capped at 600 entries.
  - Byte-range requests for audio are cut from a cached whole clip "so the voice works offline too" (`sw.js:25-53`).
  - `/api/` is never cached.
- Because plans are generated on the client from the bundled catalog, an opened guide works in "garages, basements, new flats" (`sw.js:2`). AI help and listening still need a connection.

---

## 8. Accessibility

Strengths:
- `lang="en"`, and a global `:focus-visible` 2px ink outline (`globals.css:63-66`).
- A polite live region announces "Step N of M. {title}. {detail}." on every step (`GuideApp.tsx:1038-1040`). The loader and the listening pill are live too.
- `aria-current` on the nav and Stepper, `aria-pressed` on toggles, `aria-label` on icon buttons, decorative SVGs `aria-hidden`, and difficulty dots labelled "Difficulty 2 of 3".
- The KeyModal traps focus, restores it on close and handles Escape for itself only (`KeyModal.tsx:86-120`). HelpSheet moves focus inside, so that "keyboard and screen reader users land inside the sheet". Feedback returns focus to its button and keeps guide shortcuts from leaking out of the card.

Gaps:
- **Reduced motion only covers CSS.** The single `prefers-reduced-motion` block zeroes CSS animations (`guide.css:3188-3196`). Nothing uses `MotionConfig reducedMotion` or `useReducedMotion`, so springs, confetti, the cycling HeroStage and the typewriter placeholder keep moving.
- **Missing-part rows lose their name.** `aria-label={miss ? "Marked missing" : "Mark missing"}` overrides the row text (`PartsPanel.tsx:81`), so a screen reader never hears which part.
- **Contrast.** `--ink-3` `#8a877f` measures 3.26:1 on the page and 3.59:1 on white, below AA's 4.5:1 for the small text it is used for (eyebrows, metadata, fine print).
- The suggestion listbox has no `combobox` or `aria-activedescendant`. The tabs lack `tabpanel` and arrow-key focus movement. Compare pins react to pointer hover only. The Overview and HelpSheet don't trap focus.

---

## 9. House style

`AGENTS.md`: "No em dashes or en dashes anywhere: copy, code, comments, commit messages. Use a comma, colon or parentheses." It also requires one voice (Kokoro `af_heart`, "Never fall back to the device's speech") and forbids copying IKEA's drawings and text.

The dash rule holds. A scan of every text file in the tree, JSON included, and of the whole git log finds **zero** U+2014 or U+2013 characters. The AI prompt repeats the rule (`src/lib/spec.ts:175`). Separators are `·`, commas and colons. Sizes are joined with non-breaking spaces around `×` so they never wrap (`CoverPanel.tsx:261-267`). `agentRules: false` in `next.config.ts` keeps Next from writing its managed AGENTS.md block, which contains dashes.

The copy is short, plain and warm: "This page isn't in the box", "A part didn't fit", "Built at your own pace. That's the right pace."

---

## 10. Other observations

- Bring your own key: AI features run on a Together key stored in localStorage and sent as `x-together-key` (`userKey.ts`). The KeyModal opens with the feature that sent you there ("Go hands-free", "Search with a photo") and the cost, "about a cent a build".
- Two thumbnail paths: static PNGs (`Drawing`) for the catalog, and lazy offscreen engine renders (`Thumb`) for parts, steps and drafts.
- Guides render per request with no `generateStaticParams`. Prerendering the roughly 2,180 catalog slugs would be an option if server cost or time to first byte ever matters.
