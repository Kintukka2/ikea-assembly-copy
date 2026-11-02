# Bygga: AI features, server API and security/privacy review

Repo: `Nutlope/bygga` at `a02629a` (2026-10-29, 166 commits). All paths are relative to the repo root. Line numbers refer to that commit. Nothing was installed or executed from the repo; one helper script (`(analyst helper script)`) re-ran three of the repo's regexes on their own to confirm their behaviour.

## 1. Key findings

- **The site has no AI key of its own.** Every call to Together runs on the visitor's key. The key is kept in `localStorage["bygga:together-key"]`, sent in an `x-together-key` header, and forwarded as `Authorization: Bearer` to `api.together.xyz` or `api.together.ai`. It is never written to storage or logs on the server. Commit `23e57bd` (2026-10-27) removed the server key fallback that `e732ca5` had added the day before.
- **Seven chat models, one TTS model and two STT models.** They are grouped into four role lists (`plan`, `text`, `vision`, `read`), each with a fallback order. A 400 is retried once without the extra parameters. 401, 402, 403 and 429 fail at once. An empty answer moves on to the next model.
- **Help-chat "drawings"** are inline tags such as `[part B]`, `[fitting 3]` and `[step 5]`. The model is told to emit them, and the client resolves them against the guide it already has. The server never sends images.
- **There is no SSRF surface.** Every server-side fetch goes to a fixed host, and images must be `data:image/` URLs, so Together is never asked to fetch a URL a user supplied.
- **Main weaknesses:**
  - (a) `/api/voice` responses are cached publicly on the CDN for a year. That puts arbitrary TTS audio (up to 400 chars of text) under the site's domain, and cached copies skip the key and origin checks.
  - (b) Shared scan links (`#g=`) still import data with the scanner parked. Attacker-written step text appears as guide steps, is read aloud, and is placed in the help model's system prompt (indirect prompt injection and content spoofing).
  - (c) The key sits in `localStorage` under `script-src 'unsafe-inline'`, and a third-party script is proxied as first-party (`/pl/script.js`).
  - (d) The rate limiter is in memory per instance and keyed on `X-Forwarded-For`. `fromApp` only stops browsers.
  - (e) Feedback notes can carry terminal escape sequences into `npm run feedback`, and full feedback entries, including any email, are written to the production logs.

## 2. The Together layer (`src/lib/together.ts`)

### 2.1 Models

| Role (`MODELS.*`) | Env override | Default order | Used by |
|---|---|---|---|
| `plan` (together.ts:7) | `TOGETHER_PLAN_MODEL` | `openai/gpt-oss-120b`, `zai-org/GLM-5.3-Flash`, `Qwen/Qwen3.7-Plus` | `/api/scan` plan + repair |
| `text` (:9) | `TOGETHER_TEXT_MODEL` | `openai/gpt-oss-120b`, `zai-org/GLM-5.3-Flash`, `Qwen/Qwen3.8-Flash` | `/api/guide` draft, `/api/help` (no photo) |
| `vision` (:11) | `TOGETHER_VISION_MODEL` | `nvidia/NVIDIA-Nemotron-3.5-Super-VL`, `MiniMaxAI/MiniMax-M3`, `Qwen/Qwen3.5-9B` | `/api/identify`, `/api/help` with photo |
| `read` (:13) | `TOGETHER_READ_MODEL` | `MiniMaxAI/MiniMax-M3`, `nvidia/NVIDIA-Nemotron-3.5-Super-VL`, `Qwen/Qwen3.5-9B` | `/api/scan` per-page reading |
| TTS (`src/lib/voice/tts.ts:8-14`) | none | `hexgrad/Kokoro-82M`, voice `af_heart`, `usdPer1K: 0.004` | `/api/voice`, `scripts/voice/record.ts` |
| STT (`src/lib/voice/stt.ts:9`) | none | `openai/whisper-large-v3`, then `nvidia/parakeet-tdt-0.6b-v3` | `/api/listen` |

Env lists are split on commas, trimmed and emptied of blanks (`list()`, :16-18). Chat goes to `https://api.together.xyz/v1/chat/completions` (:3, :67). The key check uses `api.together.xyz/v1/models`. TTS and STT go to `api.together.ai/v1/audio/speech` and `/v1/audio/transcriptions`. The model lists have not changed since `ac8752f` (2026-10-21).

### 2.2 Fallback algorithm

`chat()` (:49-86):

- For each model it builds `max_tokens: o.maxTokens ?? 1400`, `temperature: o.temperature ?? 0.3` and `stream`.
- When `json` is set it adds `response_format: { type: "json_object" }`. Only for gpt-oss models it adds `reasoning_effort` (default `"low"`, :54).
- It first tries with these extras and then without them, but only after a 400 (":81 // 400 may be an unsupported extra parameter: retry once without extras, otherwise move on").
- A network error (mapped to 502) or any non-400 failure moves on to the next model.
- 401, 402, 403 and 429 throw straight away (:80). There is no point trying other models on the same key.

`chatText()` (:88-98) reads `choices[0].message.content`. If that is blank it retries with the models after the one that answered: "a model can spend its whole budget thinking and answer nothing". This was added in `6f19c74` after the vision model used its 200-token budget on reasoning and came back empty.

### 2.3 Parameters per call site

| Call | Models | json mode | max_tokens | temp | other |
|---|---|---|---|---|---|
| `/api/guide` draft (guide/route.ts:73-83) | text | yes | 1800 | 0.2 | gpt-oss `reasoning_effort: low` |
| `/api/identify` (identify/route.ts:15-22) | vision | no | 1500 | 0 | comment: "vision models think before they answer" |
| `/api/help` (help/route.ts:36-43) | vision if photo, else text | no | 1200 / 500 | 0.4 | `stream: true` |
| `/api/scan` page read (scan/route.ts:61-68) | read | no | 2000 | 0 | 4 parallel workers, `req.signal` |
| `/api/scan` plan + repair (:89) | plan | yes | 16000 | 0.2 | `reasoning: "medium"` |
| TTS `speak()` (tts.ts:26-34) | Kokoro | n/a | n/a | n/a | `language: "en"`, `response_format: "mp3"`, `stream: false` |
| STT `transcribe()` (stt.ts:14-34) | Whisper, Parakeet | `response_format: json` | n/a | 0 | `language: "en"`; stops early on 401/402/403 |

### 2.4 JSON handling

`extractJson()` (:100-112) strips `<think>…</think>`, takes the contents of the first fenced code block if there is one, and parses from the first `{` to the last `}`. It returns `null` on failure. A reply holding two separate objects (`{"a":1} and {"b":2}`) therefore fails to parse (confirmed with the helper script).

Parsed output then goes through lenient Zod schemas that coerce, clamp and `.catch()` bad fields instead of rejecting them:

- `parseSpec` in `src/lib/spec.ts:12-137`: name 1-40 chars, size clamped to `w 20-320, h 20-260, d 15-240`, archetype enum, an allow-list of tip keys, em and en dashes replaced.
- `parseScan` in `src/lib/scan/parse.ts:254-329`: at most 80 parts and 40 steps, size clamped to 2-3200 mm, hardware and tool synonyms mapped to enums, `clean()` strips `<` and `>` (:60-67).

`spec.ts:5` sets `z.config({ jitless: true })` because "the site's CSP allows no eval".

### 2.5 The prompts (verbatim)

**Draft guide for an unknown product**: `SPEC_PROMPT`, `src/lib/spec.ts:143-175`, the system message. The user message is the query in capitals plus IKEA's own type, e.g. `MARKUS (IKEA sells this as: Office chair)` (guide/route.ts:29-30):

> You help people assemble IKEA flat pack furniture. Given what a person typed (usually a product name, sometimes with a size), identify the product and describe it so our generator can draw an assembly guide.
>
> Reply with JSON only, no prose. Shape:
> { "found": true, "name": "KALLAX", // product name in capitals as printed on the box … "archetype": "shelf" | "drawers" | "table" | "bed" | "cabinet" | "seat" | "sofa", "size": { "w": 77, "h": 147, "d": 39 }, // outer size in centimetres (for beds: d = length) … // exactly ONE of these objects, matching the archetype: "shelf": { "style": "grid" | "bookcase", "cols": 2, … } … "tips": {…}, "watchOut": ["..."] }
>
> Rules:
> - grid = cube shelving like KALLAX or EKET walls. bookcase = sides with shelves like BILLY or HEMNES bookcase.
> - Wardrobes, sideboards, TV units with doors and cabinets are "cabinet". Shoe cabinets with fronts that tip open (BISSA, HEMNES, STÄLL, TRONES) are "cabinet" with "fronts": "tilt" and one compartment per front.
> - Desks and TV benches without doors are "table". Nightstands with drawers are "drawers". Sofas and upholstered armchairs are "sofa".
> - Use the most common size if the person didn't give one.
> - If it is not an IKEA product that needs assembly (lamps, textiles, plants, food, or unknown), reply {"found": false, "suggestions": ["NAME", "NAME"]} with up to 3 real product names they might mean.
> - Never use em dashes or en dashes. Keep every sentence short and plain.

**Photo lookup**: `/api/identify` `PROMPT`, identify/route.ts:3-5. It is sent as the text part of a single user message together with the image:

> This photo shows an IKEA product, its box, its label or its assembly manual cover. Read the product name.
> Reply with JSON only: {"name": "KALLAX", "variant": "2x4 shelving unit", "confidence": 0.0-1.0}.
> The name is the word in capitals (it may contain Å, Ä or Ö). If you can't read a name, guess the kind of furniture in "variant" and set name to "".

**Help chat**: `SYSTEM`, help/route.ts:10-16. The route appends `"\n\nWhere they are:\n" + context` (:42):

> You are the helper inside Bygga, an app that walks people through assembling flat pack furniture step by step, mostly from IKEA. The person is mid-build, often on the floor with tools in hand.
> Answer in plain, warm English. At most 3 short sentences, or a short numbered list when giving steps. No headings, no markdown tables.
> Be practical and specific to the step they are on. If something could hurt them or damage the furniture, say so first.
> If a part is missing or broken: tell them to note the number printed on the bag or panel, and that IKEA stores and customer service usually replace small fittings for free.
> If they send a photo of a part, say which part from the list it most likely is and why (size, shape, head).
> They see pictures from their own guide when you add tags: [part B] shows panel B, [fitting 3] shows fitting 3, [step 5] shows the drawing of step 5, using the letters and numbers in the lists below. Add the tags for what your answer is about: the panel or fitting you matched in a photo, the ones you name, the step you point them to, or this step when they ask what to do. At most 3, together on the last line. Never mention the tags or the pictures in words. In your words, call a panel by its letter and name ("panel B, the divider") and a fitting by its name ("the wooden dowels"), never by its number.
> Never use em dashes or en dashes.

**Manual scanner (parked)**: `PAGE_PROMPT`, `src/lib/scan/prompts.ts:1-18`, sent per page together with the image:

> You are reading one photo of a page from a product assembly manual. It can be furniture or anything else that gets assembled, from any brand. Report what is on this page as JSON only, no prose.
> { "kind": "cover" | "parts" | "hardware" | "tools" | "steps" | "warnings" | "other", "product": {…}, "parts": [{ "label": "1", "name": "side panel", "qty": 2, "size": "60 x 30 x 1.8 cm", … }], "hardware": […], "tools": […], "steps": [{ "n": 3, "shows": "what happens in the drawing, in one or two plain sentences", … "orientation": "upright | upside down | lying on its back | face down | on its side" }], "warnings": ["two people needed"] }
> Rules:
> - Only include what you can actually see on this page. Leave out empty fields.
> - Hardware kinds: dowel, cam bolt, cam lock, screw, nail, shelf pin, bolt, leg bolt, hinge, knob, handle, wall bracket, felt pad, plate, other. …
> - If the photo shows the box or the finished product rather than a page, use kind "cover", and describe its shape in product.type, like "low media stand with two shelves and a vertical divider, about 70 cm wide".

`PLAN_PROMPT` (:20-74) is the system message for the planner. It begins "You turn an assembly manual into data for an animated 3D step by step guide. You get notes read from photos of the manual's pages, in order, and maybe a name the person typed." It then sets out a geometry contract in millimetres:

> - size is [width, height, depth] of the piece as it sits in the FINISHED product. … pos is the centre of the piece … y is the height above the floor, x runs left to right seen from the front, z runs from the back (negative) to the front (positive)…
> - Pieces that are joined touch face to face exactly, with no gap and no overlap. Do the arithmetic for every piece: if sides 18 thick stand at x = -341 and x = 341, their inner faces are at -332 and 332, so a top that fits between them is 664 wide.

The prompt also lists the allowed values for hardware `kind`, `pose`, `tools` and `warnings`, and has the rules "Usually 6 to 20 steps", "If you only have the cover … design the most typical assembly … and set "fromCover": true". It ends with a full worked example ("KUBO", a bedside table). `planInput()` (:76-80) builds the user message:

```
The person says it is: <hint>
Pages read, in order (N):
Page 1: <JSON notes>
```

`repairInput()` (:82-84) asks for one round of fixes: "Some parts don't fit together yet:\n- … Fix the sizes and positions so joined pieces touch face to face, then reply with the full corrected JSON only."

## 3. API routes

| Route | Method | Guard | Rate limit (per IP bucket) | Input | Output |
|---|---|---|---|---|---|
| `/api/key` | POST | `fromApp(req,false)` | 12 / 10 min, only after the format check | header `x-together-key`, no body | always `{ok:true}` or `{ok:false, reason: format\|busy\|rejected\|unavailable\|forbidden}` |
| `/api/identify` | POST | `fromApp` (JSON) + key | 8 / min | `{image}`: `data:image/…`, ≤3,000,000 chars | `{name, variant, query, confidence}` |
| `/api/guide` | POST | `fromApp` | 12 / min, only on the key path | `{q}` ≤80 chars | `{spec, via: catalog\|ai\|guess, model?, trouble?}` or `{found:false, ikea?, suggestions, via: ikea\|ai\|offline}` |
| `/api/help` | POST | `fromApp` + key | 20 / min | `{context ≤7000, question ≤600, history ≤6×800, image? ≤3 MB}` | `text/plain` stream, `no-store` |
| `/api/voice` | GET | key + `sec-fetch-site === "same-origin"` | 40 / min | `?t=` ≤400 chars after whitespace collapse | `audio/mpeg`, `public, max-age=31536000, immutable` + same `CDN-Cache-Control` |
| `/api/listen` | POST | `fromApp(req,false)` + `Content-Type: audio/wav` + key | 150 / min | WAV 3,244 B to 128 KB with RIFF/WAVE header | `{text}`, `no-store` |
| `/api/scan` | POST | `SCAN_ENABLED`, `fromApp`, key or dev mock | 6 / 10 min | `{pages: ≤12 data URLs <4,000,000 chars, hint}` | NDJSON stream, `no-store`, `maxDuration = 300` |
| `/api/feedback` | POST | `fromApp` | 12 / 10 min | see section 8 | `{ok:true}`, `400 bad`, `502 not saved` |

**Errors.** Each route maps Together's status to its own reply with `keyTrouble()` (together.ts:148): 401 or 403 becomes `"key"` and 401, 402 becomes `"credits"` and 402, and anything else is a 502 `"failed"`. A 429 from Together on the visitor's own key therefore reaches the browser as a 502 from `/api/help` and `/api/identify`. `/api/listen` and `/api/voice` find the status with a regex over the error text (`/ 40[13]:/`, `/ 402:/`), because `transcribe()` and `speak()` throw plain `Error("model 401: …")`.

**Caching.**
- `/api/guide` keeps a module-level `Map` of AI drafts keyed by `fold(q)`, cleared completely once it passes 1000 entries (guide/route.ts:8, :48). It is checked *before* the key check (:19-21). A draft paid for by one visitor is therefore served free to anyone who later types the same folded query. Commit `c4cdbad` had promised "a visitor's own key is never cached under someone else's name"; `23e57bd` reversed that.
- `/api/voice` is cached publicly by URL (see section 10, weakness 1).
- Everything else is `no-store` or uncached.

**Timeouts.**
- Fixed timeouts: `/api/key` 8 s, `/api/listen` 8 s (`AbortSignal.timeout`), Upstash 5 s.
- `/api/scan` passes `req.signal`.
- `chat()` calls from `/api/help`, `/api/identify` and `/api/guide`, and `speak()`, have no timeout and no client signal.

## 4. Bring-your-own-key flow

1. **Entry.** `KeyModal` (`src/components/KeyModal.tsx`) opens for one of five reasons: voice, ask, photo, draft or key. The input is `type="password"` with `autoComplete="off"`. A paste of 20 or more chars saves at once (:265-271). The modal shows "Stays in this browser. Bygga never stores it." (:307) and, once saved, only "Ending in {key.slice(-4)}" (:231). The parked scanner has its own `KeyBox` (`Scanner.tsx:403-422`) that works the same way.
2. **Check.** `fetch("/api/key", { method: "POST", headers: { "x-together-key": k } })` (KeyModal.tsx:129). The server:
   - returns `ok` straight away for the dev key (`isDevKey`);
   - runs `userKey()`, which accepts only 20 to 200 chars matching `/^[\w.-]+$/` (together.ts:141-145), and otherwise returns `format`;
   - applies the rate limit (`busy`);
   - calls `GET api.together.xyz/v1/models` with the key and an 8 s timeout, and cancels the body (key/route.ts:14-15).

   A 401 or 403 gives `rejected`; any other failure gives `unavailable`. The client saves the key when the answer is `ok` *or* `unavailable` ("a check that couldn't run doesn't block the key", :132). It also saves when the fetch itself throws.
3. **Storage.** `setUserKey()` writes `localStorage["bygga:together-key"]` (`src/lib/userKey.ts:6, :16-24`) and fires a `bygga:key` event. `useSyncExternalStore` listens for that event and for `storage`, which keeps tabs in step (:31-43). No cookie is set. Remove calls `setUserKey("")`.
4. **Transmission.** `keyHeaders()` (userKey.ts:26-29) attaches `x-together-key` to `/api/identify` (Search.tsx:92), `/api/guide` (GuideApp.tsx:103), `/api/help` (HelpSheet.tsx:215), `/api/voice` (voice.ts:83) and `/api/listen` (hooks.ts:104). The key is never put in a URL. The server forwards it only as `Authorization: Bearer …`.
5. **Server handling.** No route writes the key anywhere. Log lines carry only status codes and the first 160 to 300 chars of Together's error body (together.ts:79, stt.ts:26, tts.ts:32), so whatever Together echoes back is what would be logged. The service worker skips `/api/*` (sw.js:95), so keyed responses are never cached in the browser. `together.ts` and `stt.ts` import `server-only`.
6. **Mock key.** `DEV_KEY = "bygga-dev-mock-key-000000"` (together.ts:134).
   - `isDevKey()` is true only when `NODE_ENV !== "production"`. `userKey()` then returns `process.env.TOGETHER_API_KEY` (:142), and `/api/scan` runs `fake()`, a canned NDJSON replay of `SAMPLE_SCAN` that spends no credit (scan/route.ts:17-18, :146-160).
   - In production the string passes the format check (verified), goes to Together and is rejected, so it unlocks nothing.

## 5. Photo lookup and the parked scanner

**Box-label photo search** (`src/components/home/Search.tsx:87-109`, :221-240):
1. The camera button opens `<input type=file accept=image/* capture=environment>`. With no key it opens the KeyModal (`why="photo"`) instead.
2. `shrink()` redraws the photo on a canvas at most 1280 px on the long side, as JPEG q0.85. Re-encoding drops EXIF.
3. The browser POSTs `/api/identify`. The vision models return JSON, and the route returns `{name, variant, query: "name variant", confidence}`.
4. When `name` is non-empty, the search box is filled with the result, shows "Found KALLAX, 2x4 shelving unit", and after 650 ms calls `go()`. That runs `matchCatalog()` and opens `/build/<slug>`, or `/build/<slugify(text)>?q=…` for an unknown name, which then reaches `/api/guide`.

`confidence` is returned but never used. With no name, the message is "Couldn't read a name. Try a closer photo of the label."

**Parked manual scanner** (`NEXT_PUBLIC_SCAN=1`):
- `SCAN_ENABLED` (src/lib/site.ts:8) gates `/scan` (`notFound()`), the API (`404 {error:"off"}`), the footer and home links, and a redirect from `/scan` to `/` in next.config.ts:92-95. This was parked in `4d411dc`.
- When enabled, the page accepts up to 12 photos (canvas at 1400 px, JPEG q0.82, on a white background) and an optional name hint. `/api/scan` then streams:
  1. `stage: reading` and one `page` event per page, each read by the `read` models with `PAGE_PROMPT`, four at a time. A page that fails is marked `{kind:"other"}`, but key, credit and 429 errors abort the scan.
  2. `stage: planning`. `PLAN_PROMPT` plus `planInput()` go to the `plan` models in json mode with 16k tokens. A `drafted` event follows.
  3. `stage: checking`. `parseScan()` snaps, grounds and rescales the geometry, then `checkScan()` finds floating or overlapping parts, and `buildPlan()` must yield both parts and steps.
  4. If the check fails, `stage: fixing` replays the conversation (assistant text capped at 24k) with `repairInput(issues)` for one retry.
  5. If that still fails, `fallbackSpec()` maps the raw output to a parametric archetype. If even that cannot be built, the stream ends with `error: unbuildable` (reported as "failed").
- The client saves the result as `localStorage["bygga:spec:scan-<name>-<rand>"]`.
- Sharing packs the spec into the URL fragment: `/build/<slug>#g=<base64url(deflate-raw(JSON))>` (`src/lib/scan/share.ts`, DonePanel.tsx:128). No server copy is kept, and the fragment never reaches the server.

## 6. The help chat and its "drawings"

**Grounding.** The *client* builds the context. `helpContext(plan, index)` (HelpSheet.tsx:29-49) writes product, size, the current step (`[step N] of M: title. detail`), any repeat count, the panels and fittings in this step, tools, the previous and next steps, and then full lists of "All panels" (`[part A] Side panel x2`), "All fittings" (`[fitting 3] Wooden dowel 8x30 x16 (not included)`) and "All steps". The result is capped at 7000 chars. The server pastes it into the system prompt after `"Where they are:"`. Fittings are numbered by their position in `plan.hardware`, and the same numbering is used to resolve tags.

**Request.** The last 6 turns go as history (failed answers dropped, images not resent). An optional photo is shrunk to 1024 px. Questions asked by voice arrive through the `ask` prop: `hearIntent` turns a transcript into `{kind:"ask"}` when it has 4 or more words, starts with a question word and contains a build word (`src/lib/voice/commands.ts:41-42, :76`).

**Streaming.** The server re-parses Together's SSE and forwards only `delta.content`, with em and en dashes replaced (help/route.ts:44-76).

**Drawings.** These are references, not images. `readAnswer()` (HelpSheet.tsx:51-90):
- takes out every `[(part|panel|fitting|step) X]` tag and resolves it against the local plan: a part by label, a fitting by its 1-based index, a step by number in range. It keeps at most 3 and drops duplicates;
- hides a tag that has only half arrived while streaming;
- when the model added no tags, falls back to matching `part B` / `step 5` written in the prose.

`<Pictures>` (:383-430) then draws each one with the guide's own engine:
- a `Thumb` in `{kind:"part"}` or `{kind:"step"}` mode. A step thumbnail is a button that jumps to that step (`onGoto`). Hovering a part lights it in the main 3D view (`onShow`);
- a fitting drawn with `HwArt`.

Tags can only point into the current plan, so the model cannot make the client load anything from outside. Answers are plain React text, never parsed as markdown or HTML. With voice on, `spokenAnswer()` cuts the answer into sentences of at most 300 chars (360 in total), which go to `/api/voice` (script.ts:158-172, GuideApp.tsx:723-725).

## 7. `/api/guide`: from typed name to plan

Flow (guide/route.ts:10-62):
1. `q` is truncated to 80 chars.
2. `matchCatalog(q)` hits return the checked catalog spec (`via: "catalog"`).
3. The in-memory cache is checked.
4. `ikeaType(q)` looks the name up in bundled IKEA family data (`src/data/ikea-names`, local, with no network fetch). A known type the generator cannot draw (lamp, mattress, mirror, rug, plant, hook and so on, :65-68) returns `found:false` with `ikea: type`.
5. With a key: the draft runs on `SPEC_PROMPT`, then `extractJson`, then `parseSpec`.
   - `{"found": false}` returns up to 3 model suggestions merged with fuzzy catalog hits scoring 40 or more.
   - A draft whose name, archetype and size (within 6 cm) match a catalog product is swapped for that product (`via: "catalog"`).
   - Otherwise the draft gets `slug = fold(q)` with dashes, is cached, and returns `via: "ai"` plus the model name.
6. Without a key, or when the call fails: `guessSpec()` gives a "typical build" for the category (`via: "guess"`, plus `trouble` when the key was refused or out of credit). Failing that, `found:false`.

The client (GuideApp.tsx:100-123) keeps AI specs, but not guesses, in `localStorage["bygga:spec:<slug>"]`, and runs `buildPlan(spec)`, the parametric generator in `src/lib/plan`. The LLM therefore only picks an archetype and its parameters. All geometry and steps come from deterministic code.

## 8. Feedback and analytics

**Feedback sources**: the top-bar Feedback card (`Feedback.tsx:99-119`, `kind: "general"`), "Did the steps match your box?" (DonePanel.tsx:196-210), and "This step doesn't match my box" (HelpSheet.tsx:433-441).

**Server validation** (feedback/route.ts:18-46):
- topic and phase come from allow-lists;
- `step` must be in 1-199;
- a general note is capped at 2000 chars with newlines kept, a match note at 400 chars flattened;
- email is checked with a regex and capped at 120 chars;
- page is capped at 160 chars and `via` at 12;
- `device` is a coarse label taken from the UA, e.g. "Safari on iPhone";
- each entry gets a `crypto.randomUUID()` id and an ISO timestamp.

**Storage** (`src/lib/feedback.ts:45-67`):
- Every entry is written with `console.info("[feedback]", JSON.stringify(entry))`.
- With `KV_REST_API_URL`/`TOKEN` (or the `UPSTASH_*` pair), a single REST `/pipeline` call runs `LPUSH feedback`, `LTRIM feedback 0 19999` and `HINCRBY feedback:slugs <slug> 1`, with a 5 s timeout.
- In development without Redis, entries go to `.feedback/feedback.jsonl`. In production without Redis they are only logged, yet the route still returns `ok`.
- `scripts/feedback.ts` reads the newest N entries back with `LRANGE` and `HGETALL` and prints them.

**Analytics:**
- `<Analytics />` from `@vercel/analytics/next` (layout.tsx:50), plus custom events `track("built", {product, slug, full, minutes})` (GuideApp.tsx:497), `track("voice_on", {product, listen})` (:580) and `track("share", {product, image})` (DonePanel.tsx:131).
- Plausible: `<Script src="/pl/script.js" data-domain="usebygga.com" data-api="/pl/event">` (layout.tsx:52). Next rewrites `/pl/script.js` to `https://plausible.io/js/script.js` and `/pl/event` to `https://plausible.io/api/event` (next.config.ts:85-91), so the CSP can stay `'self'`. Added in `492ce0d`.
- `togetherai.link`: the three "Powered by Together AI" links (page.tsx:35, SiteFooter.tsx:35, :59) point to `https://togetherai.link/` with `rel="noreferrer"` (commit `c3b6df2`, "to count clicks"). Clicks are counted on that redirector; the repo adds no tracking of its own. The key and billing links still go straight to `api.together.ai`.

## 9. Service worker and offline

`public/sw.js` (cache names `bygga-pages-v3`, `bygga-files-v3`). It is registered only in production (`Offline.tsx:11-15`) and served with `Cache-Control: no-cache`.

- **Install** caches `/` and calls `skipWaiting()`. **Activate** deletes old caches and calls `clients.claim()`.
- **Navigations** are network-first, with a copy stored and the cache trimmed to 40 pages. Offline, the fallback order is the exact URL, then the same path ignoring the query (the same guide at another step), then `/`.
- **`/_next/static/*`, `/voice/*.mp3`, `*.woff2|png|svg`** are cache-first, stored only when `res.ok && res.type === "basic"`, and trimmed to 600.
- **`manifest.json`** is network-first, falling back to the cache.
- **Range requests for `/voice/`** are answered by slicing the whole cached clip into a synthetic 206 (`ranged()`, :26-53), so `<audio>` works offline.
- **`/api/*`, `/dev/*`, other origins and non-GET requests** pass straight through.
- **`keep` messages**: after each in-app navigation the page posts `{type:"keep", page, files}` with every resource URL from `performance.getEntriesByType("resource")` (Offline.tsx:18-29). The worker fetches and stores them, but only same-origin pages and static file types.

## 10. Security review

### Strengths (shown by the code)

- **No server-side secret is spent on visitors.** Model choice is fixed on the server. Every AI route needs a well-formed key, and keys never go in URLs or logs.
- **No SSRF.** Server fetches go to constant hosts only: `api.together.xyz`, `api.together.ai`, the Upstash URL from env, and the Plausible rewrites. Images are accepted only as `data:image/` strings (identify:13, help:31, scan:22), so the server never makes Together fetch a URL the user supplied. `ikeaType` is a local table lookup. The service worker's `keep` handler checks for same-origin.
- **Output is validated before it is used.** Zod clamps model output; `clean()` strips `<` and `>`; the engine's three `innerHTML` sinks escape with `esc()` (`src/engine/stage.ts:8, :1182, :1450`), a change from `c4cdbad`. The repo has no `dangerouslySetInnerHTML`. Help tags resolve only to local plan objects.
- **Headers.** CSP with `default-src 'self'`, `connect-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` and `frame-ancestors 'self'`, plus `X-Frame-Options`, `nosniff`, `Referrer-Policy`, and a `Permissions-Policy` that allows only camera and microphone for self (next.config.ts:8-31).
- **Cross-site spending is blocked.** `fromApp()` (together.ts:157-168) rejects any browser request whose `Sec-Fetch-Site` isn't `same-origin`, and JSON or audio content types force a CORS preflight that is never answered. The key is in `localStorage` anyway, so another origin cannot read it.
- **Photos lose EXIF** in all three upload paths because they are re-encoded on a canvas.
- **The mock key** is limited to `NODE_ENV !== "production"`.

### Weaknesses (concrete, roughly by impact)

1. **`/api/voice` is a public, long-lived cache of attacker-chosen audio.** The route synthesises any text up to 400 chars (voice/route.ts:17-18). It returns `Cache-Control` and `CDN-Cache-Control: public, max-age=31536000, immutable` (:23), with the stated aim to be "cached for good on the CDN … so each line is only paid for once" (:8-9). The key and `sec-fetch-site` checks (:13-16) run only on a cache miss, and a non-browser client can send `Sec-Fetch-Site: same-origin` itself. Anyone with a key can therefore place arbitrary speech at a `www.usebygga.com/api/voice?t=…` URL that, if the CDN keeps it as asked, is then served to anyone for up to a year: an abuse vector for content hosting and brand impersonation. There is a privacy side too. Spoken help answers and live step lines travel as query strings, so they land in URLs, request logs and a cache shared by all visitors. Fixes: `Cache-Control: private`, or a server-side allow-list or HMAC of the line text.
2. **Shared scan links import attacker data, even with the scanner parked.** `GuideApp` decodes `#g=` for any `scan-*` slug with no `SCAN_ENABLED` check (GuideApp.tsx:48, :59-74). The data is re-validated by `parseScan`, so it cannot run script. But it can say anything within the length caps: step titles (80), details (240), part names (40), `watchOut`. For example: "Step 4: call +1-… for missing screws" or false safety advice. That text then:
   - is drawn as the guide;
   - is read aloud as live TTS on the victim's own key;
   - is placed in the help model's system prompt through `helpContext()` (indirect prompt injection; the model has no tools, so the result is limited to misleading answers).

   In addition, `decodeSpec` passes `raw.variant` through unvalidated (`share.ts:24`). A link whose variant is not a string would throw at `s.variant.toLowerCase()` (GuideApp.tsx:758). The decompressed size is not capped either. Both of these affect only the person who opens the link.
3. **The key is exposed to every script on the origin.** `localStorage` plus `script-src 'self' 'unsafe-inline'` (needed for prerendering, :6, :11) means any future injection bug or compromised first-party script can read the key. The `/pl/script.js` rewrite runs Plausible's live script, with no version pin, *as first-party*, inside that origin. Vercel Analytics does the same. No injection sink exists today, so this is a hardening gap rather than a bug.
4. **`fromApp` keeps out browsers only.** When neither `Sec-Fetch-Site` nor `Origin` is present, it returns `true` (:162). Scripts can therefore use every route as a proxy to Together with their own key, which costs the operator function time: `/api/scan` allows up to 300 s and 12 × 4 MB pages. `/api/key` works as a key-validity checker behind Bygga's IP (12 per 10 min per IP).
5. **The rate limiter is soft.**
   - It is an in-memory `Map` per serverless instance, so limits reset on cold start and multiply across instances.
   - The bucket is keyed on the first `X-Forwarded-For` entry (:170-172), which a client can forge wherever the platform doesn't overwrite it.
   - The entire map is cleared once it holds more than 5000 buckets (:129), so many source IPs flush everyone's counters.
   - Because of BYOK, the main costs of evading it are compute and spend on the attacker's *own* key.
6. **Body size is checked only after the whole body is read.** `req.json()` and `req.arrayBuffer()` run before any length check, and there is no total cap on scan pages. The platform's request limit is the real bound.
7. **Upstream calls can hang.** `/api/help`, `/api/identify`, `/api/guide` and `speak()` have no timeout. `/api/help` ignores `req.signal`, and its `ReadableStream` has no `cancel()`, so an answer the user abandons is not aborted upstream by the code.
8. **Feedback pipeline:**
   - `str()` collapses whitespace but keeps control characters. Confirmed: ESC survives. `scripts/feedback.ts:79` prints `e.note` raw, so a submitted note can inject terminal escape sequences into the maintainer's terminal.
   - `HINCRBY feedback:slugs` takes any slug up to 80 chars and is never trimmed.
   - Every entry, email included, is also written to the production logs (feedback.ts:46).
9. **Logged upstream error bodies.** The code logs up to 300 chars of whatever Together sends back on an error, so anything echoed there ends up in the logs.

### Privacy page versus code

The privacy page is `src/app/privacy/page.tsx`.

- "Your IP address, held in memory for a few minutes … then dropped" (:35): a bucket is pruned only when that bucket is touched again, or when the whole map is cleared past 5000 entries. In practice an IP stays as long as the instance lives.
- "kept in our feedback database until we've dealt with it" (:34): the code keeps the newest 20,000 entries and also logs every one. The page does not mention the logs.
- "The text of a voice line … to record it" (:32): accurate, but it does not say this text goes into a cacheable public URL.
- The key claims (:23) and the EXIF claim (:31) match the code.

## 11. Git history of this surface

- `ac8752f` (10-21) set the current model lists. `460f80c` (10-23) moved the voice to Kokoro. `4d411dc` (10-26) parked the scanner.
- `e732ca5` (10-26) **"Harden the API: own rate limit per route, key fallback"**: per-route buckets, and a server-key fallback for expired visitor keys.
- `c4cdbad` (10-26) **"Security: keep the paid endpoints to the app's own pages"**: `fromApp`, voice same-origin only, `esc()` in the engine, smaller image limits, CSP and the other security headers.
- `67e5a1c` (10-27) brought in Whisper through `/api/listen`. `6f19c74` raised the vision budget from 200 to 1500 tokens.
- `23e57bd` (10-27) **"Every AI feature runs on the visitor's own Together key"**: removed `hasKey()`, the fallback and `/api/status`; added KeyModal, `DEV_KEY` and the help tags.
- `492ce0d` and `c3b6df2` added Plausible and `togetherai.link`. `f2b321e` dropped the README "Security" section. `f9bc001` (10-28) added Feedback and Upstash.
