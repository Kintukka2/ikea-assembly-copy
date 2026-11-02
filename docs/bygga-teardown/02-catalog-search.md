# Bygga: the IKEA catalog, data pipeline and search

Repo: `Nutlope/bygga`, HEAD `a02629a` ("Add 59 missing IKEA products", 2026-10-29). All paths below are relative to the repo root.

**Method.** I read every file in scope in full. To get the counts I parsed the generated data files with my own Python scripts (`(analyst helper script)`, `kids.py`). For a few derived totals (`PRODUCTS.length`, `PRODUCT_COUNT`, counts per kind and per category) I imported the repo's pure data modules (`src/lib/catalog.ts`, `src/lib/search.ts`) with a resolver I wrote myself (`agent-scripts/hooks.mjs`), at HEAD and at four earlier commits taken from `git archive`. These modules make no network calls. When I tried a second run of that kind, to replay sample search queries, the sandbox's permission classifier blocked it. After that I worked only statically, so the search examples in section 3 are traced by hand from the code. I ran no npm script and fetched nothing from IKEA.

---

## 0. Key numbers at HEAD

| What | Count | Source |
|---|---|---|
| Guides ("sizes"), i.e. `PRODUCTS.length` | **2,225** | `src/lib/catalog.ts:480` |
| "Products", i.e. `PRODUCT_COUNT` (distinct folded name + category) | **1,223** | `src/lib/search.ts:246` |
| Hand-made entries: `CATALOG` (27) + `ROWS` (155), less 15 merged by `SAME` | 167 (`BASE`) | `catalog.ts:24`, `products.ts:169`, `catalog.ts:456` |
| Generated rows in `src/data/ikea-rows.ts` | 2,060 (2,058 become guides) | `catalog.ts:470-477` |
| US-only rows (`us=1`) | 359 | `ikea-rows.ts` |
| Kinds in the `Kind` union (all 74 in use) | 74 | `products.ts:7-86` |
| Archetypes | 7 (shelf, drawers, bed, table, cabinet, seat, sofa) | `products.ts:351` |
| Distinct `category` strings on guides | 115 | computed |
| Distinct family names on guides | 599 | computed |
| Article numbers in `ikea-items.ts` | 7,020 (all 8 digits, all unique), across 2,150 slugs | `src/data/ikea-items.ts` |
| Family names in `ikea-names.ts` | 2,808 (2,686 with a type, 155 with two) | `src/data/ikea-names.ts` |
| Guard words (real names that look like typos of drawable ones) | 234 | `src/data/ikea-guard.ts` |
| Single-product corrections (`FIXES`) / same-product redirects (`SAME`) | 98 / 18 | `src/data/fixes.ts` |
| `ADDED` products keyed by article number | 60 keys (59 new guides) | `scripts/ikea/classify.ts:673-734` |
| Classification rules (`RULES`) | about 200 regex rules | `classify.ts:245-655` |
| Slugs ever handed out (`slugs.json`) / hand-made slug lock | 2,069 / 182 | `scripts/ikea/*.json` |
| Plan family files (`src/lib/plan/families`) | 522 | `scripts/families.mjs` |

---

## 1. What is fetched from IKEA

### 1.1 Endpoints

There are four sources, all requested by `scripts/ikea/fetch.ts` and `scripts/ikea/measure.ts`:

1. **Category discovery (UK only).** This is IKEA's HTML "all products" page. The regex keeps only the category keys:
   ```ts
   const html = await get("https://www.ikea.com/gb/en/cat/products-products/", "gb-products.html", "text/html");
   const keys = [...(html ?? "").matchAll(/\/gb\/en\/cat\/[a-z0-9-]+-([a-z]{2}\d{3})\//g)].map((m) => m[1]);
   ```
   (`fetch.ts:66-67`). Keys look like `fu001` (furniture), `st001` (storage), `od001` (outdoor), `bc001` (baby and children), `ka001` (kitchen). The US run does not read this page: *"IKEA's category keys are the same in every market"*. It reuses the first category of every product in the UK `facts.json` instead (`fetch.ts:57-65`).

2. **The product-list search API** (the same JSON backend IKEA's listing pages call):
   ```ts
   const LIST = `https://sik.search.blue.cdtapps.com/${market}/en/product-list-page/more-products`;
   ...
   await get(`${LIST}?category=${cat}&start=${start}&end=${start + WINDOW}`, `${PREFIX}plp-${cat}-${start}.json`);
   ```
   (`fetch.ts:28, 91`). `market` is `gb` by default, or `us` with `--market us` (`fetch.ts:26-27`). Results come back in windows of 1,000 (`const WINDOW = 1000; // the API refuses windows larger than 1000`, `fetch.ts:20`), and the loop pages until a window comes back short (`fetch.ts:98`). A category that already appeared deeper in some product's `categoryPath` is skipped as covered (`fetch.ts:89, 95`).

3. **US product sitemaps**, with `--us`. These are read only to add family names to the names index:
   `https://www.ikea.com/sitemaps/prod-en-US_${n}.xml` for n = 1..8. Only the slugs of `/us/en/p/<slug>/` locations are kept, because the sitemaps "are mostly image links" (`fetch.ts:121-132`).

4. **Product pages** (`measure.ts`), one per shipped guide. Each guide uses the first of its first three article numbers that has a page, trying the UK site first and then the US one (`measure.ts:111-113`):
   ```ts
   fetch(`https://www.ikea.com/${market}/en/p/-${item}/`, { headers: { "User-Agent": UA, Accept: "text/html", "Accept-Language": ... } })
   ```
   (`measure.ts:82`). A page that turns out to be a listing (its canonical link has no `/p/`) or has no `pipf-measurements` block counts as no page (`measure.ts:52-54`).

### 1.2 Rate limiting, retries, caching, identity

- **One request at a time**, at least 600 ms apart in `fetch.ts` and 500 ms in `measure.ts` (*"at most about two a second"*, `fetch.ts:10, 21, 39-41`; `measure.ts:23`).
- **Retries:** three attempts, waiting `3000 * attempt` ms; a 404 counts as no data (`fetch.ts:42-54`).
- **Cache:** every raw response is saved under `scripts/ikea/cache/`, so *"a re-run never refetches"* (`fetch.ts:8, 36-38`). US responses get a `us-` prefix so the two markets never mix.
- **User agent:** a desktop Chrome string ending in `bygga-catalog/1.0` (`fetch.ts:19`).

### 1.3 Fields kept

`facts.json` holds one `Fact` per product (all its colours together). The interface is at `classify.ts:9-19`:
```ts
const fact: Fact = { name: p.name, type: p.typeName ?? "", size: p.itemMeasureReferenceText ?? "", items: [...new Set([...art, ...spr])], spr: p.itemType === "SPR", cats: [...cats] };
```
(`fetch.ts:117`). The header states the policy: *"Only facts are kept in facts.json: name, type, size text, article numbers and category keys. No images, prices, descriptions or PDFs."* (`fetch.ts:10-11`). Colours come from `gprDescription.variants` that share the product's `name` and `typeName`. Single articles are listed before SPR (system/combination) articles (`fetch.ts:114-116`).

`measures.json` keeps a little more per page (`measure.ts:25-37`): the title, the measurement table (in cm), the package count, a few short description lines, the main photo's address *"for side by side checks on this machine only"*, and the assembly-manual PDF links. No prices or reviews.

### 1.4 What stays out of git, and why

`.gitignore:26-31`:
```
/scripts/ikea/cache/
/scripts/ikea/facts*.json
/scripts/ikea/measures.json
```
The reason is copyright and trademark. `NOTICE:9-11` says *"IKEA's product listings are not part of this repository... only the catalog rows derived from them (names, product types and sizes in src/data) ship with the app."* The trademark section of `NOTICE` covers IKEA, its logo and product names "used here only to say which product a guide is for". `AGENTS.md:9-10` repeats the rule and adds *"IKEA's drawings, photos and text are copyrighted, so never copy them into the app."* `README.md:34`: *"We don't mirror IKEA's PDF manuals, on purpose."*

**Caveat:** the raw UK listing was committed once and never purged. `5e1a434` ("Fetch IKEA product facts from the public search API") added `scripts/ikea/facts.json`, and `7702b2e` deleted it (9,609 lines). It can still be recovered with `git show 7702b2e^:scripts/ikea/facts.json`. That snapshot (`fetched: 2026-10-26`, `ikea.com/gb/en`) holds **9,609 UK products** with 17,568 article numbers, 2,686 of them SPR. Their top-level category prefixes run `st` 2,019, `de` 1,019, `kt` 916, `ka` 916, `fu` 907, `bc` 619, `bm` 559, `od` 546, and so on.

---

## 2. From raw listing to catalog row

### 2.1 Pipeline

```
fetch.ts ──► facts.json (+ facts-us.json) ─┐
measure.ts ─► measures.json ───────────────┼─► build.ts ──► src/data/ikea-rows.ts   (drawable rows)
hand-made CATALOG + ROWS (hints, wins) ────┘              ├► src/data/ikea-items.ts  (article numbers per slug)
                                                           ├► src/data/ikea-names.ts  (every family name + its types)
                                                           ├► src/data/ikea-guard.ts  (typo guard)
                                                           └► scripts/ikea/slugs.json (slug lock)
runtime: src/lib/catalog.ts = CATALOG + ROWS + decodeRows(IKEA_ROWS) with FIXES / SAME applied
```

### 2.2 `classify()`: the order of decisions (`classify.ts:736-1174`)

1. **ADDED first.** If any article number of the fact is in `ADDED`, it returns that kind and size directly, overridden by page measurements, and flags it `own: true` so it is never merged into a hand-made entry (`classify.ts:737-745`, `build.ts:95`).
2. **Not furniture.** `const NOT_FURNITURE = /^(fb|tl|kt|li|pp|de|wt|he|hs|lc|pt|sp)\d/;` is tested on the first category key (`classify.ts:666, 746`). These are food, textiles, kitchenware, lighting, plants, decoration and similar ranges.
3. **Normalise the type.** The type is lower-cased. A trailing `", outdoor"` / `in/outdoor` is stripped and remembered (as is category `od001`). The fact is marked `kids` when the type starts `children's `/`junior ` or the category is `bc001`. `multi` means the name holds `/` ("BILLY / OXBERG") (`classify.ts:747-753`).
4. **First matching RULE wins** (*"Most specific first. A string result is the reason to skip"*, `classify.ts:244`). Two examples:
   - `[/^cot( with drawer)?$/, (m) => ({ kind: "cot", x: m[1] ? { drawer: true } : {} })]` (`:411`)
   - `[/\b(and|set of \d|sets?)\b|\+|combination|\bcomb\b|\bchairs\b|armchairs|benches/, () => "set or combination"]` (`:338`)

   Kitchen fronts are encoded as zone strings such as `"r3@80+d1s1"` (drawers, doors, gaps, with heights in cm), parsed by `parseZones` (`products.ts:370-385`).
5. **No rule** gives `"not something we draw yet"`. **No readable size** gives `"size we can't read"`. Office chairs sized "Small/Medium/Large" are let through (`classify.ts:762-766`).
6. **Size to w/h/d by kind group** (section 2.4). Then parameters from hints, chest layout, combinations, bounds and keywords in `finish()`.

**Hints.** Hand-made rows act as per-family defaults. `hints(family, kind)` returns the same family and kind if one exists. Otherwise it returns any row of the family in the same archetype, but only for its knob style (`build.ts:39-59`). For example, a generated HEMNES chest inherits `knobs: "knob"` and `plinth` from the hand-made HEMNES chests.

### 2.3 Kinds and archetypes

`Kind` has 74 members (`products.ts:7-86`). The comments in the union show it grew in stages: 20 original kinds (cube, bookcase, chest, bed, sofa...), then ones *"added with the IKEA product data"*, *"added later"*, *"the last hard shapes: corners"*, *"the last chairs"* and *"the long tail of single pieces"* (lidbox ... riser). `KIND_ARCH` maps each kind to one of 7 archetypes (`products.ts:351-357`). `CATEGORY` gives the display name, which `x.cat` can override with IKEA's own wording, such as "Storage table" (`products.ts:342-349, 440`).

The largest kinds at HEAD are chest 139, bed 138, cabinet 131, sofa 118, dining 100, desk 97 and chair 90. The smallest are workbench and gateleg, with 2 each.

### 2.4 Size parsing (cm, inches, named beds)

`measure()` (`classify.ts:75-89`) reads IKEA's `itemMeasureReferenceText`:
```ts
const g = "(\\d+(?:\\.\\d+)?(?:/\\d+(?:\\.\\d+)?)*)";
const m = t.match(new RegExp(`^${g}(?:x${g})?(?:x${g})? cm$`));
```
- `"80x28x202 cm"` is **w × d × h** for upright pieces, so `set(v[0], v[2], v[1])` (`:798`). Two numbers mean w × h for uprights but w × d for tables (`:805, 839`). One number on a table means a round top, unless it is over 160 cm (`:840-847`).
- `/` marks closed/open or extendable sizes (`"150/200x80 cm"`). It sets `ext`, and the first value is used, except for drop-leaf and gateleg tables, which are drawn open (`:852-856`).
- **UK named beds** (`classify.ts:53-62`): Single 90×190, Small Double 120×190, Double 135×190, King 150×200, Super King 180×200. A bed frame is drawn as mattress +16 cm wide and +9 cm long (`:794`).
- **US inches** (`scripts/ikea/us.ts`). `metric()` turns `"30 3/8x15 3/8 \""` into `"77x39 cm"`, rounding to the nearest half cm (`Math.round(v * INCH * 2) / 2`, `us.ts:29`). It handles Unicode fractions (`½ ¼ ¾ ⅛ ...`, `us.ts:22, 40`) and closed/open pairs like `29 1/8/52 3/4`. When a measure gives inches and cm together, the cm are taken as exact (`us.ts:44-46`). **US bed names** become cm: Twin 97×191, Twin XL 97×203, Full 137×191, Queen 152×203, King 193×203, California King 183×213 (`us.ts:8-19`). *"A US King is wider than a UK one."*
- **US type words** are rewritten into UK words before the UK rules run, with about 45 regexes such as `dresser` → `chest of drawers`, `crib` → `cot`, `armoire` → `wardrobe` (`us.ts:62-121`).

### 2.5 Defaults, "guessed" and "paged"

Every dimension starts from `KIND_DEFAULT_SIZE` (`products.ts:792-799`) and is flagged `guessed` until a real measure replaces it (`classify.ts:772-780`). Some kinds have their own fallbacks:
- Chests without a drawer count get `Math.round(h / 14)` drawers, clamped to 2..6. `chestShape` uses two columns when the count is even and w ≥ 100 (`:657-663, 1037-1053`).
- Sofas with a corner, chaise or U shape take their seat width from the family's straight sofa (`:880-909`).
- Pieces IKEA gives no size for get typical sizes from tables in the code (`:182-206`).
- PAX corner wardrobes are split into frames (`cornerLayout`, `:159-177`). Rows of BILLY, BESTÅ, IVAR or PAX frames become `bookrow`/`cabrow` with `x.n` or `x.u = "80+40"` (`:107-144, 1056-1104`).

`finish()` (`:1117-1173`) then:
- merges the **product-page measurements** from `fromPage()` (`:1225-1297`) into dimensions still guessed, plus sofa detail (`seatH`, `sdp`, `ah`, `aw`, `bk`, `lg`);
- records which dimensions the page filled (`paged`) *"so a product keeps the guide (and the link) it had before its page was read"*;
- reclassifies a few cases: a "4-seat sofa" more than 130 cm deep becomes a `chaise`;
- enforces bounds (`w` 20..320, or 400 for sofas; `h` 15..260; `d` 12..240), otherwise `"size out of range"`;
- adds the `outdoor garden` and `kids children` keywords and builds the label (`parts.join(" × ") + " cm"`).

### 2.6 The ADDED list

`ADDED` (`classify.ts:668-734`) holds *"Products no rule above draws (fold-out tables, loft beds, stands, sliding doors...) that have a guide written from their manual in src/lib/plan/families"*. They are keyed by one article number. Each entry looks like this:
```ts
"00579755": { kind: "bookcase", w: 80, h: 106, d: 33 }, // BILLY bookcase with foldable table
"29437483": { kind: "loft", w: 207, h: 182, d: 99, x: { m: 90 } }, // SMÅSTAD loft bed
```
There are 60 keys, 11 of them marked US. Commit `a02629a` added 60 rows (2,000 to 2,060). One of them, the EKET wall-mounted unit, was pointed via `SAME` at the existing EKET wall cabinet, which leaves the **59 new guides** in the commit title (2,166 to 2,225 sizes).

### 2.7 Skip reasons and `skips.ts`

There are about 85 distinct skip strings, for example "set or combination", "not furniture", "part sold alone", "several units side by side", "piece with a table that folds out" and "cube grid larger than 5 x 5". `scripts/ikea/skips.ts` prints counts per reason. With a reason regex it prints the IKEA types behind that reason, digits folded to `#`:
```ts
const t = f.type.toLowerCase().replace(/,?\s*(in\/)?outdoor$/, "").replace(/\d+/g, "#");
```
(`skips.ts:20`). The README roadmap names the remaining hard skips: three-cornered shelves, corner combinations, and PAX widths that don't split into frames.

### 2.8 `build.ts`: from verdicts to rows (`scripts/ikea/build.ts:312-410`)

1. **Merge colours.** Verdicts are grouped by `name + "|" + variant`, where `variant = "${label}, ${size}"` (IKEA's own type name plus the cm size). Colours of the same product therefore become one row carrying all their article numbers (`:317-329`). Each group is then classified again with the page measurements of the first of its articles that has a page (`:330-336`).
2. **US-only range** (`usOnly`, `:146-190`). A US fact is dropped if any of its article numbers is a UK one, or if its drawing matches a UK or hand-made guide (`sameDrawing`: same family and kind, sizes within 3/4/5 cm, beds by mattress, unsized seats by seat count). Twins (the same product under another spelling or colour) are merged. Survivors carry `x.us = true`, keep their US type as the label, and prefix US bed names: `"Queen, 152 × 203 cm"`. Without `facts-us.json`, the previous build's US rows are kept as they were (`previousUs`, `:193-207`). There are 359 such rows.
3. **Hand-made entries win.** `baseMatch` (`:87-121`) looks for a `BASE` entry with the same folded family and archetype or category, within ±3 cm wide, ±4 high and ±5 deep, or the same mattress for beds. A match only adds its article numbers to the hand-made slug (`attach(hit.slug, g.items)`, `:347-352`). This is how `kallax-2x2` gets `60324520`.
4. **Sort** by folded name, kind, w, h, d, variant (`:357`).
5. **Slugs are locked forever.** `slugs.json` maps `"NAME|variant"` to a slug that is never reused; collisions get `-2`, `-3` (`:363-381`). `baseSlug` folds the text, drops `cm|with|of` and cuts at 48 characters (`catalog.ts:420-427`), so `"ALEX|Drawer unit with 9 drawers, 36 × 116 cm"` becomes `alex-drawer-unit-9-drawers-36-x-116`. `base-slugs.json` freezes the 182 hand-made slugs. Nine slugs in `slugs.json` belong to products IKEA dropped or merged and stay reserved.
6. **Names index** (`namesIndex`, `:216-273`). Each family name gets its IKEA types weighted by frequency. Sets weigh 0.25; names from the US sitemaps weigh 0.5, with `ae/oe/ue` mapped back to `a/o/u`. A second type is kept when *"the family is about as often something else"*.
7. **Guard set** (`guardSet`, `:288-308`): real names we can't draw that lie within Levenshtein 1 or 2 of a drawable name, or are a prefix of a drawable word (*"MARKUS next to MARIUS"*).
8. **Encoding.** Each row is one pipe-delimited line, `name|kind|variant|w|h|d|params|keywords|slug`, with params as `k=v` pairs (`src/lib/ikea.ts:26-65`). For example: `ALEX|chest|Drawer unit on castors, 36 × 50 cm|36|50|45|rows=4,knobs=none`.

### 2.9 Article numbers

There are 7,020 eight-digit numbers across 2,150 slugs: all 2,060 IKEA rows plus 90 hand-made slugs reached through `baseMatch`. The most on one guide is 46 (all its colours); the mean is 3.27. `articleNo()` accepts `802.758.87`, `80275887`, `802 758 87`, the SPR form `S292.975.72`, and any IKEA product URL ending in its number:
```ts
const m = q.trim().match(/^s?\s*(\d{3})[\s.\-]*(\d{3})[\s.\-]*(\d{2})$/i);
...
const link = q.match(/ikea\.[a-z.]+\/.*\/p\/[^?#\s]*?-s?(\d{8})\b/i);
```
(`src/lib/ikea.ts:116-123`). The index is a separate chunk loaded with `import("@/data/ikea-items")`, and the first slug wins for a number (`ikea.ts:126-136`). The home page's example `802.758.87` resolves to **`kallax-2x4`** (the 77 × 147 unit). `60324520` resolves to `kallax-2x2`.

### 2.10 At runtime: `catalog.ts` and `fixes.ts`

- `CATALOG` holds 27 hand-checked entries with explicit params, minutes, people, difficulty, keywords and tips, for example `kallax-2x2`, `malm-3-drawers` and `pax-frame` (`catalog.ts:24-417`). Five are `featured`: KALLAX 2×2, BILLY 80×202, MALM 3 drawers, LACK side table and LINNMON/ADILS desk.
- `ROWS` holds 155 hand-made rows, turned into specs by `specFor` (`products.ts:169-333`, `catalog.ts:439-445`).
- `IKEA` entries come from `decodeRows(IKEA_ROWS)`. A row whose slug is already in use is skipped (*"Hand made entries always win"*), as is a `SAME` key. `FIXES` is applied, `us` or `late` (for rows with `x.cat`) is set, and `listed` keeps the listing's variant when a fix renames it (`catalog.ts:459-477`).
- **`FIXES`** (`fixes.ts:21-135`, 98 entries) are corrections *"found by reading each product's assembly manual beside its IKEA page... the ones no rule explains"*. Each can set a size, kind, params or variant. Examples: `"soderhamn-2-seat-sofa": { kind: "chaise", size: [186, 83, 151], ... }` and `"mellgrund-bed-frame-queen-152-x-203": { variant: "Bed frame, Full/Double, 137 × 191 cm", ... } // its article is the Full`. Most of them are sofas.
- **`SAME`** (`fixes.ts:141-160`, 18 entries) points a slug at another guide's slug. The old link still opens, but the duplicate is not listed. An example is `"malm-bedside-table-1-drawer": "malm-2-drawers"`. Fifteen are hand-made rows, two are IKEA rows, and one is a retired slug.
- `toSpec` builds the per-family size chips (`variants`, smallest first, labelled as columns × rows for cube grids or w × h with depth only when two collide) and `siblings` (other categories in the family) (`catalog.ts:501-538`).

### 2.11 Families

`scripts/families.mjs` lists `src/lib/plan/families/*.ts` (skipping `index.ts`, `family.ts` and `_*`) and writes the `FAMILIES` array. There are 522 family files now; `docs/manual-sweep.md` says 461. A family is matched by the first word of the product name: `familyOf = s.name.trim().split(/[\s/]+/)[0].toUpperCase()` (`src/lib/plan/families/family.ts`). It returns `null` for products it doesn't cover, and the kind's generic builder takes over.

### 2.12 Reconciling 1,171 / 2,180 against 1,223 / 2,225

The two pairs come from different commits and measure different things.

- **"Sizes"** is `PRODUCTS.length`: every guide, hand-made plus generated, UK plus US-only.
- **"Products"** is `PRODUCT_COUNT = new Set(PRODUCTS.map((p) => fold(p.name) + "|" + p.category)).size` (`search.ts:246`). It counts distinct *family × category* pairs. All KALLAX "Shelving unit" sizes count as one product, while MALM "Chest of drawers", "Nightstand" and "Bed frame" count as three. A fix that changes a kind, and therefore the category, can change the product count without changing the number of sizes.
- `/browse` computes the numbers live: `{PRODUCT_COUNT} IKEA products in {PRODUCTS.length} sizes` (`src/app/browse/page.tsx:18`). The README hard-codes the 27 October figure (`README.md:12`).

I recomputed both at several commits:

| Commit | Date | Products | Sizes | Hand-made `BASE` | US-only | What changed |
|---|---|---|---|---|---|---|
| `2ed99fe` "README: 1,171 products, 2,180 sizes" | 10-27 | **1,171** | **2,180** | 182 | 346 | README written |
| `f9bc001` | 10-28 | 1,176 | 2,180 | 180 | 347 | `fixes.ts` arrives (82 fixes, 3 SAME); kind changes create new name+category pairs |
| `0e6cc7e` | 10-29 | 1,175 | 2,166 | 167 | 347 | `SAME` grows to 17; duplicate hand-made guides fold into IKEA rows |
| `a02629a` (HEAD) | 10-29 | **1,223** | **2,225** | 167 | 359 | 59 `ADDED` products, 98 fixes, 18 SAME |

At HEAD, 2,225 = 167 hand-made + 2,058 IKEA entries. Those come from 2,060 rows, minus 2 that `SAME` folds away. `docs/manual-sweep.md` already uses 2,225 ("2,198 of 2,225 guides (99%) are built from their manuals"). The README is simply stale.

---

## 3. Search

### 3.1 Normalisation (`src/lib/fold.ts:1-9`)

```ts
s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/×/g, "x").replace(/[^a-z0-9x]+/g, " ").trim();
```
Decomposition strips Å/Ä/Ö/É, so `POÄNG` becomes `poang`, `IDÅSEN` becomes `idasen` and `BESTÅ` becomes `besta`. The × sign becomes `x`, so `"2 × 2"` matches `"2x2"`. Every other character becomes a space, so `wash-stand` matches `wash stand`. One quirk: Ø, Æ and ß don't decompose and would turn into spaces. No current name uses them; I checked both data files.

### 3.2 Article number first (`search.ts:157-162`)

If `articleNo(q)` parses, search returns only `{ entry, score: 200, exact: true }` for that number's slug (following `SAME`), or nothing. Both the home box and `/browse` load the index lazily: the home box once the query contains three digits in a row (`Search.tsx:59-64`), `/browse` once the query parses as an article number (`Sections.tsx:86-90`).

### 3.3 Scoring (`searchCatalog`, `search.ts:154-213`)

The **name score** uses only the first token of the query:

| Score | Condition |
|---|---|
| 100 | the whole query equals the name, or the de-spaced query equals the de-spaced name (`linnmonadils`) |
| 80 | the first token is one of the name's words, or equals the de-spaced name |
| 60 | the first token (2+ characters) starts one of the name's words (`kal` → KALLAX) |
| 52 | typo: first token of 4+ characters at Levenshtein 1 from the name (`kalax`, `marcus`) |
| 42 | typo: 6+ characters at Levenshtein 2 |

Typos count only if the first word is **not** a guarded real IKEA name (`const typos = !isGuardedName(first)`, `:172`).

Then the adjustments:
- If the name didn't match and the first token (3+ characters) starts a word of the product text, or the first token is a type word the product has: **+20**, or 20.5 when both are true (`:194`).
- **+12** for each later token that starts a product word, or occurs inside one when it is longer than 2 characters (`:195`).
- **Type word in the query** (`kindOf`): **+14** if the product's text has one of that kind's words, **−30** if it doesn't (`:196`).
- Tie-breaking penalties: kids pieces −1 unless the query asks for kids; "lesser" kinds (rows, sections, appliance cabinets and other later kinds) −1 unless the query names that kind; rows of mixed frames −0.5; `late` −0.5 or −1; **US-only −13** (*"as much as a word of the query is worth"*). Bonuses: `checked` +3, `featured` +2 (`:197-208`).
- A hit needs a score over 15. `exact` means name score ≥ 80.

### 3.4 Type words such as "crib"

`CATEGORY_WORDS` (`search.ts:17-90`) maps each kind to UK and US words, most specific first, for example `cot: ["cot", "crib", "baby bed"]` and `corner: ["corner sofa", "corner couch", "sectional", "l shaped sofa"]`. `kindOf` returns the first kind whose word appears in the query (`:95-99`).

When the query *starts* with a type word, `firstIsKind` makes that word count like a word in the product's own text (*"'crib' or 'sectional' alone names the type"*, `:167-168`). So **"crib"** gives every cot about 34 points (20 + 14). Everything else falls under the −30 penalty, and cots are listed even though no product text says "crib". **"hemnes vanity"** finds the HEMNES wash-stand (a `check.ts` expectation).

### 3.5 Confident match (`matchCatalog`, `search.ts:216-224`)

Used for Enter on the home box, for `/build/<slug>` resolution and for `/api/guide`. It returns a product only when:
- the best score is at least 50;
- the hit is exact, or the first word is not a guarded real name (so `froson` or `froson chair` never lands on FRÖSET);
- a typo-level hit (under 60) beats the runner-up by more than 4 points, unless both share a name.

Tracing `kalax` by hand: the KALLAX rows score 52 plus bonuses, every top hit is a KALLAX, so the match is `kallax-2x2` (checked +3, featured +2).

When nothing matches, `/api/guide` looks the name up in the 2,808-name index. A real IKEA product it can't draw, such as a lamp, gets "X is a ..." and a link to ikea.com. Otherwise the visitor's own key drafts a guide, or a typical build of that type is used (`src/app/api/guide/route.ts:26-61`).

### 3.6 Home search box (`src/components/home/Search.tsx`)

- The placeholder types out examples in turn: KALLAX, MALM 3 drawers, 802.758.87, IDÅSEN desk and others (`:12, 27-57`).
- Search runs on every keystroke, with no debounce, and shows up to 6 suggestions with a line drawing, name, variant and minutes (`:65-66, 208-218`).
- A `Find "q"` row appears when there is no confident match. With a key it hands the query to Together AI; without one, the visitor picks a shape (`:67, 189-200`).
- Enter routes to `/build/<slug>` on a confident match, otherwise to `/build/<slugify(text)>?q=...` (`:70-85`).

### 3.7 Photo search (box label)

The camera button needs the visitor's own Together key; without one it opens the key dialog (`Search.tsx:150`). The photo is shrunk to at most 1280 px and sent to **`/api/identify`** (`src/app/api/identify/route.ts`), which allows 8 calls per IP per minute. A vision model is asked:

> *"This photo shows an IKEA product, its box, its label or its assembly manual cover. Read the product name. Reply with JSON only: {"name": "KALLAX", "variant": "2x4 shelving unit", ...}. The name is the word in capitals (it may contain Å, Ä or Ö)..."* (`route.ts:3-5`)

The models are tried in order: Nemotron 3.5 Super VL, then MiniMax M3, then Qwen3.5-9B (`together.ts:11`). The client puts the returned name and variant in the box, shows "Found KALLAX, 2x4 shelving unit", and searches after 650 ms (`Search.tsx:99-103`). **The photo simply becomes typed text.** The article number printed on the label is never read.

### 3.8 `/browse` categories (`src/app/browse/page.tsx`, `src/components/home/Sections.tsx:17-184`)

There are 12 tabs, defined by kind lists (`CATS`, `Sections.tsx:17-34`): All, **Shelves** (cube, bookcase, open, wallshelf, bookrow, divider), **Drawers** (chest, nightstand, changing), **Wardrobes** (wardrobe, sliding, cornerrobe, clothesrack), **Cabinets** (cabinet, sideboard, tv, shoe, shoerack, wallcab, kitchen, cabrow, slidecab, mixed, cornercab, sinkcab, appliance, washstand), **Tables**, **Desks**, **Beds**, **Chairs**, **Sofas**, **Kids** (kids kinds or a `kids` keyword) and **Outdoor** (the `outdoor` keyword only). A kind no tab lists falls into its archetype's tab (`BY_ARCH`, `:36-44`): hatrack, coatstand and airer go to Shelves; lidbox and extension to Cabinets; riser and the desk-like benches to Tables; pouffe and chairbed to Sofas.

Tab sizes at HEAD, computed from the per-kind counts: All 2,225, Shelves 202, Drawers 190, Wardrobes 84, Cabinets 643, Tables 258, Desks 101, Beds 187, Chairs 213, Sofas 337, Outdoor 143, Kids about 99. `kidstable` and `kidschair` appear only under Kids and All.

The filter box matches literally first: every query word must start a word of the product's text. A type word or a typo goes through `searchCatalog` instead, and those hits are ranked first (`:101-116`). Otherwise lists sort by name with Swedish collation (`:117`), 24 cards at a time.

---

## 4. Time estimates ("40 min", "1.5 h")

1. **Hand-made `CATALOG` entries** set `minutes` by hand: KALLAX 2×2 40, 2×4 70, 4×4 120; BILLY 80×202 60; MALM 3 drawers 90, 6 drawers 180; LACK side table 10; PAX frame 90 (`catalog.ts`).
2. **Everything else** gets `MIN[kind]` (`products.ts:335-340`; for example cube 40, bookcase 50, wardrobe 120, bed 100, sofa 40, stool 12, side 15), or `x.min` when a row sets it (`HEMNES chest of 8 drawers ... min: 240`). Many kinds use a formula in `specOf` instead:
   - chests: `30 + 20 * rows * cols` (+5 on castors); nightstands: `30 + 15 * rows` (`products.ts:525`). A generated chest of 3 drawers is therefore 90 min.
   - KALLAX with inserts: `10 + 7 * cols * rows + 15 * ins`; with an underframe: `30 + 7 * cols * rows` (`:460-464`).
   - fitted kitchen and bath cabinets: `MIN[kind] + 20 * drawers + 8 * doors + (tall ? 30 : 0) + (basin ? 10 : 0)` (`:417`).
   - rows of units: `one.minutes * n + 15` (+40 with sliding doors) (`:766`).
   - A plain cube grid of any size stays at 40, so a generated 5×5 KALLAX shows "40 min" while the hand-made 4×4 shows 120.
3. **Display.**
   - Browse cards: `e.minutes < 60 ? "${e.minutes} min" : "${Math.round(e.minutes / 6) / 10} h"`, so 90 gives "1.5 h" and 70 gives "1.2 h" (`Sections.tsx:66`).
   - Search suggestions always show raw minutes, for example "180 min" (`Search.tsx:216`).
   - The cover, print view and done panel use `fmtMin`, which gives "1 h 30 min" (`CoverPanel.tsx:269-273`).
4. **Per-step minutes.** The builder spreads `spec.minutes` over the steps by weight: `(0.8 + parts * 0.6 + hws * 0.12) * (s.repeat ?? 1)`, with quiet steps at 1.6, then `Math.max(1, Math.round((weights[i] / total) * this.spec.minutes))` (`src/lib/plan/builder.ts:425-437`). "Time left" on a step is the sum of the remaining steps (`StepPanel.tsx:14-16`).
5. **Your own time.** A finished build records how long it actually took. It is shown only for a full run of at least 20% of the typical time (`buildMinutes`, `src/lib/store.ts:39-43`). The done panel says "N minutes under the typical time" when you were at least 5% faster.

---

## 5. `scripts/ikea/check.ts`: what is tested over every row

`npm run ikea:check` fails, exiting 1 and printing up to 80 problems, if any of the following breaks:

1. **Size bounds for every `PRODUCTS` entry:** `w` 15..320 (480 for sofas), `h` 8..260, `d` 8..240 (400 for sofas) (`check.ts:55`).
2. **Every product builds a plan:** `buildPlan(toSpec(e))` must not throw and must have at least one step and one part. Every number in `plan.items` and `plan.parts` must be finite (`:57-60`).
3. **Parts stay near the product:** each non-`extra` part needs a positive size, and its final position must satisfy `|x| ≤ 5w+300`, `-300 ≤ y ≤ 10h+600` and `|z| ≤ 5d+600`. Parts the product "hangs on or holds" are exempt (`:33-46`).
4. **Unique slugs**, unique `fold(name)|fold(variant)`, and slugs matching `^[a-z0-9]+(-[a-z0-9]+)*$` (`:70-80`).
5. **Link stability:**
   - every hand-made slug in `base-slugs.json` still opens the same `name|variant`, unless `SAME` redirects it to a live guide (`:86`);
   - every slug in `slugs.json` still opens the same key; a missing one must be a valid `SAME` redirect or is counted as "kept reserved" (`:88-95`).
6. **Search regression:** 47 `expect(query, slug)` assertions, such as `kallax` → `kallax-2x2`, `froson` → null, `hauga sliding wardrobe` vs `hauga wardrobe`, and `hemnes vanity` → wash-stand. Further checks cover the `S292.975.72` article form, five inch-to-cm conversions (`'29 ½ "'` → `75 cm`), `60324520` in three formats, and `ikeaType("MARKUS") === "Office chair"` (`:97-175`).
7. **Report only** (never fails): timings, and, when `facts.json` exists, skip counts by reason and by IKEA type (`:176-218`).

---

## 6. `ikea.ts`, official manual links, and `faq.ts`

**`src/lib/ikea.ts`** does not link to manuals. It reads and writes the compact row format, and looks up family names and article numbers.

**Links to ikea.com.** The README says *"each cover links to the official manual on ikea.com"* (`README.md:34`). The code links to a *search* instead:
```ts
const official = `https://www.ikea.com/search/?q=${encodeURIComponent(s.name)}`;
```
(`src/components/guide/CoverPanel.tsx:37`, shown as "Find the manual on ikea.com" at `:187-191`, except on scanned guides). The not-found page has a similar "Find it on ikea.com" link (`GuideApp.tsx:272`). The exact `assembly_instructions/*.pdf` URLs are collected in `measures.json` (`measure.ts:66`), but they are git-ignored and never shipped. The cover notes *"Not affiliated with IKEA. Check each step against the paper manual in the box."*

**`src/lib/faq.ts`** holds canned help for the "Stuck?" sheet (`HelpSheet.tsx:143`), chosen by the kind of step you are on. There are 32 questions over 17 step kinds, for example dowels ("Do I need glue?" "No. The fit is tight on purpose..."), cam locks ("Clockwise, about half a turn...") and wall anchors ("I rent and can't drill"). Every list ends with two common items: "A part is missing or broken" and "I think I did an earlier step wrong".

---

## 7. Other notable findings

- **`ikea-names.ts` maps names to IKEA product types, not meanings or pronunciations.** Each line is `NAME|type;type`, for example `POÄNG|Armchair;Rocking-chair`, `KALLAX|Shelving unit;Shelving unit with underframe`, `BESTÅ|TV bench;TV bench with doors`, `FRÖSÖN|Cover for seat cushion;Cover for chair cushion`. It covers the whole IKEA range, so the most common first types are "Potted plant", "Cushion cover", "Plant pot", "Mirror" and "Table lamp". That is how the app can say "FRÖSÖN is a cover for seat cushion". The 70 KB file loads on demand.
- **Pronunciation lives elsewhere.** `src/lib/voice/names.ts` holds 71 Kokoro IPA spellings, such as `"Bestå": "bɛstɔ"`, `"Ekedalen": "iːkədɑlɛn"`. `scripts/voice/names.ts` generates them with an LLM prompt ("MALM is 'mahlm', POÄNG is 'poh-ENG', IDÅSEN is 'ee-DOH-sen'...") and keeps (`--prune`) only those Whisper hears better. `tts.ts` applies them only at render time, so the on-screen text never changes.
- **Bundle weight.** `ikea-rows.ts` (157 KB) and `ikea-guard.ts` (2 KB) load on every page; `ikea-names.ts` (71 KB) and `ikea-items.ts` (136 KB) load on demand.
- **IKEA's shorthand is spelled out for display** (`src/lib/shorthand.ts`): "Base cab f hob/2 frnts" becomes "Base cabinet for hob/2 fronts". Slugs keep the raw abbreviations.
- **Known approximations are written down.** `docs/model-audit.md` compared all 2,073 guides with a product page against IKEA's photo. 839 of the 2,000 generated guides changed and no link changed; the doc lists what is still drawn approximately, such as open steel frames drawn with solid sides (about 70). Some article groups mix two products (POÄNG's armchair articles include the rocker) because *"The fetcher would have to keep IKEA's variant text to split them."*
- **Manual sweep.** A pilot found 19 of 20 core guides differed from the real manual (KALLAX 4×4: 68 dowels against 42). `docs/manual-sweep.md` now reports 2,198 of 2,225 guides built from their manuals.
- **Small inconsistencies:**
  - the README counts (1,171 / 2,180) and its "links to the official manual" wording are stale or overstated;
  - the photo prompt never asks for the article number printed on labels;
  - suggestion rows show "180 min" where cards show "3 h";
  - `fold()` would split names containing Ø or Æ, though none exist today.
