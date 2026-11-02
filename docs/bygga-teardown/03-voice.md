# Bygga voice system: narration (TTS) and "next" listening (STT)

Repo: `Nutlope/bygga`, read at `f9bc001` (2026-10-28); every voice file is identical at HEAD `a02629a`. Paths are relative to the repo root.

## 0. Architecture at a glance

Script and hashing (`src/lib/voice/script.ts`), the voice definition (`tts.ts`), name phonetics (`names.ts`), the player (`src/components/guide/voice.ts`), live TTS (`/api/voice`), mic capture (`src/components/guide/hooks.ts` + `public/listen-worklet.js`), VAD and segmentation (`src/lib/voice/talk.ts`), STT (`/api/listen` + `stt.ts`), intent parsing (`commands.ts`), wiring (`GuideApp.tsx`), the recorder (`scripts/voice/record.ts`) and the replay test (`scripts/voice/listen-check.ts`).

House rule, `AGENTS.md:8`: "One voice only: Kokoro `af_heart` on Together AI, for recorded clips and live lines alike ... Never fall back to the device's speech."

---

## 1. Narration text, phonetics, clip naming, clip vs live

### 1.1 How step narration is generated (`src/lib/voice/script.ts`)

The header says each line is one clip: "the recorder renders each unique line once, and the app plays them back to back. Keep lines short and self-contained so they can be reused across products" (`script.ts:5-9`).

Fixed lines live in `LINES` (`script.ts:14-32`), for example `on: "Voice is on. I'll read each step out loud."`, `sayNext: "When you're done, just say next."`, `tapNext: "Tap done when you're ready for the next one."`, `commands: "You can say next, back or again. Ask how many, or say stop to quiet me."`, `halfway`, `last: "Last step."`, `two: "This one's easier with two people."`, `tip: "Kids climb, so always fix it to the wall."`.

`stepLines(plan, i)` (`script.ts:111-132`) assembles one step in a fixed order:
1. `LINES.halfway` when `n >= 6 && i === Math.floor(n / 2)`
2. Opener `stepOpener()`: `"Step ${numWords(i + 1)}."` or `"Last step."` (`:87-89`). Numbers are always spelled out (`numWords`, `:37-41`) so clips are reusable and Whisper checks are stable.
3. `LINES.two` if `s.people === 2`
4. `sentence(s.title)`, which adds a period if missing (`:44-47`)
5. A repeat line: `"Do this for both of them. The counts are for one."` or `"Do this for all ${numWords(s.repeat)} ${drawers ? "drawers" : "of them"}..."` (`:119-122`)
6. `needsLine()`: `"You'll need fourteen wooden dowels and twelve cam bolts."`. Hardware is sorted by `HW_ORDER`, excludes `notIncluded`, and nails are never counted ("nobody counts out thirty-four nails", `:56-57`)
7. `toolsLine()`: tools that first appear on this step, `"Grab the Allen key and the hammer."` (`:103-108`, spoken names in `TOOL_SPOKEN` `:64-75`)
8. `sentence(s.detail)`, then the wall `tip`, then `tipFor(plan, i)`

Other generators: `whereLine` ("You're on step three of seven.", `:134-136`), `builtLine` ("And that's it. Your Kallax is built. Well done.", `:138-140`, with `spokenName()` title-casing the first name before a slash, `:78-85`), and `spokenAnswer()` (`:158-172`). `spokenAnswer` strips markdown, splits the help answer into sentences, caps each at 300 chars and stops after about 360 chars total, so the answer can be recorded live.

### 1.2 Phonetic product names

`scripts/voice/names.ts` asks `openai/gpt-oss-120b` on Together (`:56-75`) how each name sounds "in an American IKEA store" (`PROMPT`, `:31-33`: "MALM is "mahlm", POÄNG is "poh-ENG"..."). It maps the IPA it gets back onto Kokoro/misaki phonemes (`PLAIN`, `:36`), rejects any symbol Kokoro can't say (`OK` regex, `:29`), and strips a leading stress mark because "a stress mark in front makes Kokoro say a sound before the name" (`:42-43`). `--prune` renders `Your ${n} is built.` both plain and spelled, transcribes both with Whisper, and keeps a spelling only if Whisper hears the name clearly better with it: `if (sb >= sa + 0.15) kept++; else delete names[n]` (`:106-110`).

The result is `src/lib/voice/names.ts`: **71 entries** at HEAD, for example `"Kallax": "kɑlɑks"` and `"Bestå": "bɛstɔ"`. The count grew from 57 at `fb0d446` to 71 at `dbdb0a9`. MALM is not in the list, presumably because pruning found the plain reading good enough.

These spellings apply **only at render time** (`tts.ts:19-23`):
```ts
for (const [name, ipa] of NAMES) if (t.includes(name)) t = t.replace(new RegExp(`(?<!\\p{L})${name}(?!\\p{L})`, "gu"), `[${name}](/${ipa}/)`);
```
That produces Kokoro's `[word](/ipa/)` markup. Clip IDs and on-screen text never contain the markup (`scripts/voice/names.ts:11-12`). The match is case-sensitive (`"Kallax"`), so a live help answer that writes "KALLAX" in capitals would not get the spelling. I inferred that from the code and did not test it.

### 1.3 Clip naming: a hash of the text

`clipId()` (`script.ts:143-155`) is cyrb53, a 53-bit non-cryptographic hash, written in base 36, applied to the trimmed, whitespace-collapsed line:
```ts
const t = text.trim().replace(/\s+/g, " ");
let h1 = 0xdeadbeef, h2 = 0x41c6ce57; ...
return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
```
Files live at `public/voice/heart/<id>.mp3`, with `VOICE_DIR = /voice/${TTS.name.toLowerCase()}` (`script.ts:12`), one folder per voice. Casing and punctuation are part of the key, so "Step one." and "Step one" are different clips. I checked the scheme by re-implementing it: `"This is the first step."` → `h1pxonhu18`, `"Step one."` → `2f0v82q3s77`, `"Last step."` → `rbc2ibh0ha`. All three exist in the manifest.

### 1.4 Clip vs live TTS (`src/components/guide/voice.ts`)

- `load()` fetches `/voice/heart/manifest.json` once. On failure it sets `clips = {}` and clears the promise so a later call retries ("a flaky first tap shouldn't cost the clips for the whole visit", `:58-68`).
- `clip(text)` (`:70-73`) returns `{src, ms}` when `clipId(text)` is in the manifest. The manifest maps id to duration in ms.
- `live` is set by `GuideApp.tsx:95-97`, `voice.live = !!key`. **Live TTS happens only when the visitor has saved a Together key.**
- `src()` (`:101-104`): clip first, else `liveSrc()` if `live`, else `null`.
- `liveSrc()` (`:79-99`) does ``fetch(`/api/voice?t=${encodeURIComponent(t)}`, { headers: keyHeaders(), signal: AbortSignal.timeout(10_000) })`` and keeps the result as a blob URL in an LRU of 120 entries.
- `say(lines)` (`:158-187`) starts every source loading at once ("live lines all start loading now, so the next one is ready when this one ends"), plays lines in order, and **skips** a line with no source (`if (!src) continue;`). Lines matching `OPTIONAL = /^(You'll need|Grab |Do this for all)/` are filtered out up front when unplayable. If a clip fails to load and there is a key, it gets one more try recorded live (`:175-181`). Pauses are 320 ms after "Step N." and 240 ms between other lines (`:183`).
- `play()` (`:189-215`) has a stall guard: `setTimeout(() => done(el.currentTime > 0), (ms ?? 8000) / this.rate + 5000)`.
- `prefetch()` (`:218-226`) warms the next step's clips with `priority: "low"`. The service worker serves `/voice/` cache-first, answers byte-range requests from cache for offline audio, and fetches the manifest network-first (`public/sw.js:4, 96-99, 118-145`).

**Server side of live TTS**, `src/app/api/voice/route.ts`: requires a user key (401 otherwise), `sec-fetch-site === "same-origin"` (`:16`), text ≤ 400 chars (`:18`), and 40 requests/min per IP (`:19`). It returns `audio/mpeg` with `Cache-Control` and `CDN-Cache-Control: public, max-age=31536000, immutable` (`:23`), "so each line is only paid for once". Because the CDN cache is keyed on the URL, a cached line is served to anyone without the key check running.

**A coverage gap, found statically.** The 28 Oct "manual sweep" (`f9bc001`) rebuilt 2,198 of 2,225 guides from per-family recipe files, and `docs/manual-sweep.md:23` lists as a to-do: "Record voice clips for the new step lines ...; until then, new lines are spoken live only for visitors with their own key." I read `src/lib/plan/families/*.ts` as text without executing it, pulled out the literal `title:`/`detail:` strings (they reach `stepLines` verbatim via `custom.ts:354`), and hashed them:

- 10,456 unique literal titles: **57 have a clip (0.5%)**
- 13,345 unique literal details: **9 have a clip (0.1%)**

For a visitor without a key, a typical manual-based step therefore plays "Step four." plus any generic counts, tools and tip lines, and **the action sentence is silently skipped**. It is still on screen. The README claim (`README.md:13`) of "1,476 pre-recorded Kokoro clips that play with no key" is true but now covers mostly the generic lines. Template-string titles were not counted, so treat these numbers as an estimate.

---

## 2. TTS model, API shape, formats, caching, recording pipeline, cost

### 2.1 Model and call

`tts.ts:8-14`:
```ts
export const TTS = { model: "hexgrad/Kokoro-82M", voice: "af_heart", name: "Heart", label: "Kokoro on Together AI", usdPer1K: 0.004 };
```
`speak()` (`tts.ts:26-34`) sends `POST https://api.together.ai/v1/audio/speech` with JSON `{ model, voice, input: text, language: "en", response_format: "mp3", stream: false }` and returns the mp3 bytes. Live lines and pre-recorded clips use the same function, so a step never mixes two voices.

### 2.2 Recording pipeline (`scripts/voice/record.ts`)

- **Collect** (`:41-60`): builds a plan for every catalog product, every generic "kind", and the sample scan. It gathers `LINES`, every `stepLines`, every `whereLine` and every `builtLine`, then dedupes into `{id: clipId(text), text}`.
- **To do** (`:152`): lines whose `<id>.mp3` is not on disk, so only new or changed lines get recorded.
- **Cost / `--dry`** (`:153-159`): `usd = (chars / 1000) * TTS.usdPer1K` (i.e. $4 per million characters). It prints ``${all.length} lines, ${todo.length} to record, ${chars} characters, about $${usd} (plus retakes)`` and lists `id text`. A budget guard stops the run at `--max-usd`, default 6 (`:36, 160`). The estimate leaves out retakes and the Whisper verification calls.
- **Render, 6 workers, up to 3 takes** (`:167-204`): `speak(DIRECTION + forTTS(text))`, with `DIRECTION = ""` because "delivery tags on short lines push a voice into a whisper" (`:31-32`, left over from the ElevenLabs era).
- **Finish with ffmpeg** (`:75-82`): trims silence at −50 dB on both ends, adds 20 ms / 10 ms fades, runs two-pass `loudnorm=I=-16:TP=-1.5:LRA=11`, resamples to 44.1 kHz, and encodes **mono libmp3lame 64 kbps**. Duration comes from ffprobe.
- **Verify** (`:117-136`): transcribes each take with `openai/whisper-large-v3` and compares words after expanding contractions and digits. Product names are excluded because they "come back spelled many ways". Short lines (≤3 words) must contain every word. Longer lines need word error ≤ 0.15 and the same first word. The best take is kept.
- **Outputs**: `scripts/voice/clips.json` holds `{id: {text, ms, heard, ok, takes}}` and is checkpointed every 25 clips. `public/voice/heart/manifest.json` holds `{"voice":"Heart (Kokoro on Together AI)","clips":{id: ms}}` (`:206-209`). `--recheck` re-scores the log offline (`:146-151`).

### 2.3 What is on disk (measured)

- Manifest: **1,497 clips**, 56.2 min of audio. Median 2.37 s, range 0.69 to 9.0 s. Total size about 28 MB.
- ffprobe of three samples: `mp3, 44100 Hz, 1 ch, ~64-66 kb/s` (e.g. `h1pxonhu18.mp3` is 1.25 s, `9u3hsmr3bj.mp3` is 9.06 s).
- IDs are 9 to 11 base-36 characters (15 / 607 / 875).
- `clips.json`: 1,497 entries. 1,474 passed on the first take, 3 needed 2, 20 needed 3, and **20 are still flagged `ok:false`**. Most of those are mis-heard Swedish names ("Your Ängsjön is built" heard as "angstern") or spelling variants ("castors" vs "casters", "day-bed" vs "daybed").
- Rendering all 65,304 characters costs about **$0.26** at the configured rate. The first voice was ElevenLabs at `USD_PER_1K = 0.08` (`f6b6e77`), 20× more.
- **Housekeeping issues:** there are 1,506 mp3 files on disk but 1,497 in the manifest. Nine files added in `f9bc001` (e.g. `10b3d30hnqk.mp3`, `8zmc7l475m.mp3`) are orphans, because `record.ts` prunes the log and manifest (`:206-208`) but never deletes stale mp3s. The README still says 1,476, which was the count at `dbdb0a9`.
- **Cost to close the gap from §1.4:** about 23.7k missing literal lines, 1.39 M characters, roughly **$5.5** of TTS (just under the $6 default cap, before retakes). At the measured 19.4 chars/s that is about **20 h of audio, or ~0.6 GB** at 64 kbps, a lot for a `public/` folder in git.

---

## 3. Listening

Listening needs a key: `canListen = mounted && ai && micSupported()` (`GuideApp.tsx:383`). It runs only during the `steps` phase (`:705`).

### 3.1 Mic capture and the audio graph (`src/components/guide/hooks.ts`)

- Constraints (`:167`): `getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false, channelCount: 1 } })`. AGC is off because it "buried the person under her" (commit `8262380`).
- One shared `AudioContext` (`shared`, `:44`) is primed inside the user's tap with `primeListening()` (`:47-57`).
- `AudioWorkletNode(ctx, "bygga-listen")` loads `/listen-worklet.js` once per context (`:198-206`). The worklet (`public/listen-worklet.js`) box-averages input samples down to 16 kHz and posts 800-sample Float32 frames (50 ms) with a transferred buffer (`:7, 33, 43`). Fallback (`hooks.ts:207-213`): `createScriptProcessor(4096,1,1)` feeding `downsampler()` from `talk.ts:31-57`, which runs the same algorithm on the main thread.
- The graph ends in a zero-gain sink to `destination` because "nodes only run when something downstream pulls" (`:193-196`).

### 3.2 VAD / energy gating and segmentation (`src/lib/voice/talk.ts`)

`level()` is frame RMS in dBFS (`:24-28`). `bars()` (`:60-87`) tracks three quantities:
- `floor`, the room noise. It follows quiet immediately and rises slowly (0.25 dB/frame cap, 0.05 while someone talks).
- `peak`, how loud *her* echo has been in this mic lately. It learns only from frames 4 behind (so a person's first syllables don't count as her), fades about 1 dB/s, and must be learned for ≥8 frames before it is trusted.
- Bars: `start = her && learned < 8 ? Infinity : Math.max(floor + 10, -58, her ? peak + 4 : -Infinity)`, `keep = Math.max(floor + 6, -64, her ? peak + 2 : -Infinity)`, and `loudHer = learned >= 8 && peak > floor + 25`. The last one means "echo cancelling isn't doing its job here".

`segmenter()` (`:106-175`), with constants at `:89-94`: `PRE = 8` (400 ms pre-roll), `TAIL = 4` (200 ms quiet ends a piece), `LONG = 60` (3 s cap, continuing with a 400 ms overlap), `MIN = 3` (≥150 ms loud, "or it was a knock"). Two frames above `start` open a piece. When `loudHer` is true, it also cuts **overlapping windows while she talks**, `WIN = 30` (1.5 s) every `STEP = 20` (1 s), marked `over: true`, and sends one only if `heard()` finds a frame above `max(floor+10, -62)`.

`toWav()` (`:178-200`) produces 16-bit mono 16 kHz WAV, peak-normalised to 0.7 with gain capped at 16×, "so a quiet voice across the room reads as clearly as a close one".

### 3.3 Sending pieces and the STT model

`send()` (`hooks.ts:99-129`): `POST /api/listen` with `Content-Type: audio/wav`, `x-together-key`, a WAV body and a 9 s timeout. At most 3 requests run at once; extra pieces are dropped ("a noisy room: drop a piece rather than queue it"). A 401/402 response sets `dead`, **releases the mic** "so no recording light stays on for nothing", and shows "refused"/"credits". Three consecutive failures set "offline". A piece that starts before the end of the last piece that acted is ignored (`seg.start < acted`), so overlapping windows can't act twice.

`/api/listen` (`src/app/api/listen/route.ts`) requires `fromApp(req, false)` (same-origin `sec-fetch-site` or matching `Origin`) and `audio/wav` (`:13`), a user key (`:16`), at most 150/min per IP (`:18`), a size between 44+3200 B and 128 KB (`:5, 20`; 3 s is 96 KB), and a RIFF/WAVE header. It then calls `transcribe(wav, key, AbortSignal.timeout(8000))` and returns `{text}` with `no-store`.

`src/lib/voice/stt.ts:8-35` uses `models: ["openai/whisper-large-v3", "nvidia/parakeet-tdt-0.6b-v3"]` and posts multipart form data to `POST https://api.together.ai/v1/audio/transcriptions` with `file=talk.wav`, `language=en`, `temperature=0`, `response_format=json`. It falls through to Parakeet unless the status is 401/402/403 ("a bad key or no credit fails the same way on every model").

### 3.4 Telling her words from the person's (`voice.ts` + `commands.ts`)

The player keeps a timeline of what she said. `set(text, ms)` (`voice.ts:117-126`) records `{words: canon(text), start, end, due}`, where `due = start + ms/rate` uses the clip length from the manifest, "so where each word falls can be told while she's still saying it". `busy` stays true until 1.5 s after she stops (`:133-135`). `linesBetween()` and `spokeBetween()` use 800 ms slack (`:26-27, 137-148`). `canon()` spells digits and maps sound-alikes (`won→one`, `to/too→two`, `for/fore→four`, `ate→eight`, `commands.ts:81-86`).

`hearIntent(transcript, piece, lines, talking)` (`commands.ts:159-180`):
1. `herMask()` (`:133-147`) marks a word as hers if it matches a word of her lines, allowing one edit for words of 5+ letters (`close()`, `:112-119`; "step" vs "stop" is too close to allow). Glue words never match. Outside a window, a match counts only next to another match within 2 words, so "back" alone stays the person's even while she reads "the back panel". Her "next" must fall inside `[piece.start-900, piece.end+400]` by the even-pace `wordAt()` estimate. Inside a window, a "next" right next to her words is treated as a mishearing of her ("last step" heard as "next step").
2. If at least half of the long content words are hers, the piece is downgraded to window rules (`:163-168`), because "Whisper can finish a line of hers cut off mid-word with words of its own".
3. If the person's remaining words contain "next": outside a window it is `next` **anywhere in the sentence**. Inside a window it counts only when every other word is glue/filler/plain (`PLAIN = next, whats, lets, go, yep, yup, ok, okay`).
4. Windows can never trigger anything else. Otherwise `parse(own.join(" "))` (`:53-78`) strips `FILLER` at the edges (`um, okay, please, hey, bygga, thanks, thank, you, yeah, yes...`, which also absorbs Whisper's silence hallucinations "Thank you." / "you"). It then needs an **exact whole-phrase** hit in `PHRASES` (`:15-28`).

Intents: `next, back, repeat, replay, stop, needs, where, slower, faster, help, commands, off`, plus `goto` (`/^(?:go to |jump to |skip to )?(?:step|number) (\w+)$/`, where "last" means −1) and `ask`. An `ask` needs ≥4 words, a question opener and a build word (`BUILD_WORDS`, `:41-42`), and is dropped while she is talking.

I ran copies of `commands.ts` against some inputs:

| Transcript | Result |
|---|---|
| "Okay, next please." | `next` |
| "Hold the back panel." | `null` |
| "Go to step five." / "Step twelve" | `goto 5` / `goto 12` |
| "What did you say?" | `repeat` |
| "How many screws?" | `needs` |
| "Which way round does the back panel go?" (she is quiet / she is talking) | `ask` / `null` |
| "Thank you." | `null` |
| **"Can you pass me the next panel"** (her line not involved) | **`next`** |

The last row is intended since `67e5a1c` ("'next' anywhere in what you said moves on"). The file header at `commands.ts:1-4` still says "Only short, whole phrases count as commands, so talking to a friend ... never moves a step". That is now true for every command except "next", so the comment is stale.

### 3.5 What the guide does with an intent (`GuideApp.tsx:630-702, 704-718`)

`useListener` → `hearIntent(text, seg, voice.linesBetween(...), voice.busy || voice.spokeBetween(...))` → `run()`. Nothing acts while the key modal is open (`:709`). Every intent gets `haptic(10)` and a `playTick()` unless it is `next`. Actions:
- **next**: `voice.stop()` "quiet at once, so it's plain she heard", close help and overview, advance
- **back**: `LINES.first` on step 0
- **repeat**: replay the animation and re-read the step
- **replay**: animation only
- **stop**
- **needs**: counts plus tools, or "Nothing extra for this one."
- **where**
- **slower / faster**: `voice.rate = 0.9` or 1, applied as `playbackRate`
- **help**: opens the sheet
- **commands**
- **off**: "Okay, voice is off."
- **goto**
- **ask**: "One moment." then the HelpSheet answers, read aloud via `spokenAnswer` on live TTS; without a key she says `LINES.noAnswer`

The status pill shows `Heard "…"` for 2.4 s.

### 3.6 Barge-in while she is talking

There is no ducking. The volume dip from `8262380` was removed in `67e5a1c` because it "fired on any noise". Barge-in relies on four things:
1. Browser AEC.
2. The `peak + 4 dB` start bar: a nearby person is much louder than her residual echo.
3. Window mode where AEC fails, in which only a near-bare "next" can act.
4. Echo subtraction by timeline in `hearIntent`.

On `next` she stops immediately. One limitation: until her echo level has been learned (8 frames), `start` is `Infinity` while she speaks, so the first ~0.6 s of her first line can't be interrupted.

### 3.7 Safari / iOS quirks and fallbacks

- One reused `HTMLAudioElement`, unlocked inside the tap with a 0.1 s silent MP3 data URI: "iOS only lets a page play sound without a tap on an element that was started by a tap" (`voice.ts:14-19, 47-56`).
- `primeListening()` is called in the same tap, and also from the KeyModal `onGesture` (`GuideApp.tsx:1077-1080`) so that saving a key counts as the gesture.
- After the screen locks, Safari keeps the AudioContext suspended. The hook sets `paused` and adds a one-shot `pointerdown` listener that resumes it; the pill says "Tap anywhere to keep listening" (`hooks.ts:137-142, 220-229`; `GuideApp.tsx:927-928`; commit `d1b378a`).
- `webkitAudioContext` and ScriptProcessor fallbacks. The mic is released when the page is hidden and reopened when visible (`hooks.ts:242-246`), and reopened if the track ends (`:231-235`). A busy mic is retried 3 times with growing delays (`:176-179`).
- Error states mapped to copy (`GuideApp.tsx:916-941`): denied, busy, nomic, offline and unsupported all fall back to "… Tap done to move on". Without a key the pill reads "Reading aloud" and offers a "Turn on "next"" button.
- Screen wake lock (`hooks.ts:8-32`). Headphone and lock-screen media keys via `mediaSession` (`voice.ts:236-259`; `GuideApp.tsx:741-752`): nexttrack → next, previoustrack → back, play → re-read, pause → stop.

### 3.8 How the design evolved (git)

| Date | Commit | Change |
|---|---|---|
| 10-21 | `82c3650` | Web Speech API: `SpeechRecognition` (continuous, `en-US`) with regex commands such as `/\b(next|done|continue|forward|okay next)\b/`, and `speechSynthesis` choosing a "natural/premium/samantha/daniel" voice |
| 10-22 | `f6b6e77` | 527 pre-recorded **ElevenLabs Eleven v4 "Matilda"** clips via fal.ai, checked by Whisper; whole-phrase commands; live `/api/voice` on `FAL_KEY`, "otherwise the device voice reads" |
| 10-23 | `460f80c` | Moved to **Kokoro Heart on Together**: re-recorded the 527 clips; `tts.ts` became the single source |
| 10-26 | `8f1f3a6`, `7335de3`/`fb0d446`, `c23dc8e`, `c4cdbad` | Reliability fixes; phonetic names (57); **dropped the device speech fallback** ("One voice only"); same-origin checks |
| 10-26/27 | batches → `dbdb0a9` | 937 → 1,084 → 1,177 → 1,283 → 1,476 clips |
| 10-27 | `696af5d` → `f1613e9` | Tried on-device recognition (`processLocally`), then **dropped it: "SpeechRecognition.available() took the whole renderer down in Chromium"**. This was on-device *STT*, separate from the TTS change in `c23dc8e` |
| 10-27 | `8262380` | Echo-cancelled mic track fed to Chrome's recognizer, a talk detector, the first `voice:check` (33 runs) |
| 10-27 | `67e5a1c` | **Whisper on Together via `/api/listen`** for every browser. Arc and other Chromium browsers have no speech service, and "feeding Chrome's recognizer a mic track ... crashed the page in a real Chrome profile". Added the worklet, segmenter and windows; 483 generated runs, 283 replayed offline |
| 10-27 | `d1b378a` | Safari "tap anywhere" |
| 10-27 | `23e57bd` | Every AI feature on the visitor's own key. Before this, `/api/listen` and `/api/voice` fell back to the site's `TOGETHER_API_KEY` |
| 10-28 | `f9bc001` | Manual-based guides; 21 clips added to the manifest, 9 orphan mp3s; most new step text left unrecorded |

---

## 4. Test harness: `npm run voice:check`

`package.json`: `node --experimental-transform-types --no-warnings --import ./scripts/voice/register.mjs scripts/voice/listen-check.ts`. `register.mjs` / `resolve.mjs` resolve `@/` and extensionless imports so plain Node can run app TypeScript.

**Data format** (`listen-check.ts:8-14, 22-23`): `{ lines: string[181], runs: Run[283] }`, where
```ts
type Run = { name; expect: string|null; timeline: [lineIdx, start, end][]; userAt: number[]; levels: string; pieces: [start, end, window, whisperText][]; acted: string|null };
```
`levels` uses one character per 50 ms frame with `charCode - 40` = dB below full scale ('x' is −80 dB). The runs are synthetic: "desktop Chrome's echo cancelling stand-in", her lines mixed at echo levels from 0 dB (no cancelling) down to −60/−90 dB, macOS voices (Daniel, Fred, Samantha) and Kokoro saying "next", chatting, sound-alikes ("text", "neck"), hammer, drill, music, TV, pink noise. The Whisper transcripts were recorded once.

Composition I counted:
- By type: `her` 100, `pos` 75, `people` 25, `after` 25, `noise` 25, plus 33 named runs (`next_<Voice>_<dB>`, `nextstep2`, `okaynext`, `stop`, `again`, `back`...)
- By echo level: 0 dB ×35, −25 ×46, −30 ×42, −35 ×44, −45 ×34, −60 ×49
- Expected command: null 153, next 124, repeat 2, back 2, stop 2
- 1,747 pieces, 1,553 of them windows. The most common transcripts are "you" (66), "Thank you." (61) and "Next." (60)

**What it replays** (`:30-63`): `Date.now` is mocked. The real `voice` singleton is driven along each run's timeline with `v.set(lines[i])`. Each recorded piece is then fed through the real `hearIntent` with `voice.linesBetween()` and `spokeBetween()`, and the first piece that acts is the decision. Separately, the real `segmenter()` runs on the level trace, synthesised as steady tones.

**Pass criteria** (`:65-89`). A run fails if:
- (a) the decision differs from the recorded `acted`
- (b) a run with no expected command was moved
- (c) it acted more than 200 ms before the user spoke
- (d) for echo ≤ −25 dB, some `userAt` moment is not covered by a segmenter piece ("nobody listened at … ms")

Any failure exits with code 1.

**Result.** I replayed it with copies of `commands.ts`, `talk.ts` and the `Voice` timeline methods, without the repo's loader:
```
283 runs: 112 commands caught, 18 missed (mostly with no echo cancelling at all), 151 rightly left alone, 2 moved by a sound-alike (064_people_e-30, 124_people_e-25_music)
all decisions match the recording
```
14 of the 18 misses are 0 dB runs (no AEC at all). The two known false moves are people chatting ("Connect it… Next.") and "A bird's nest." followed by a window transcribed as "next".

**Limits of the test.** It is a *regression* check against recorded decisions, so the 2 false positives and 18 misses count as "pass". It never re-runs Whisper. Decisions use the recorded pieces rather than the segmenter's own output, so segmenter changes are only checked through criterion (d) on synthetic tone levels.

---

## 5. Sound effects and keyboard equivalents

`src/components/guide/sound.ts` synthesises every sound with its own lazily created `AudioContext` (`:17-25`). There are no files. `blip()` (`:28-42`) is an oscillator with an 8 ms attack, an exponential decay, and an 8% pitch drop.
- `playTick()` (`:46-50`): "A soft wooden click, like a dowel seating", 880 Hz triangle plus 1320 Hz sine, about 60 ms. Plays on every non-next voice intent.
- `playStep()` (`:53-57`): two rising notes, 660 → 990 Hz. Plays when advancing a step (`GuideApp.tsx:484`).
- `playDone()` (`:60-63`): a C-major arpeggio `[523, 659, 784, 1047]`. Plays on finish (`GuideApp.tsx:491`).
- The toggle is persisted with `getPref/setPref("sound")` and exposed as a top-bar button (`GuideApp.tsx:797-804`). Haptics: `haptic(12)` on next and `haptic(10)` on voice intents.

**Keyboard** (`GuideApp.tsx:512-534`, steps phase only, ignored in inputs, with modifiers held, or while a modal is open):

| Key | Action |
|---|---|
| → / Space / Enter | next (Space and Enter are left to a focused button or link; auto-repeat ignored) |
| ← | back |
| R | replay animation (does not re-read) |
| ? | help |
| O | overview |
| V | toggle voice (`:727-738`) |

Media keys: next/previous track, play (re-read the step), pause (stop the voice). There is no key for "repeat aloud", "where am I" or "slower".

---

## 6. Privacy

- **No key:** the mic is never opened. Narration is static same-origin mp3s, cached by the service worker. No audio leaves the device.
- **With a key and voice on:** the browser sends **short WAV pieces (≤3 s, 16 kHz, gain-boosted) to Bygga's server** (`/api/listen`, hosted on Vercel), which forwards them **to Together AI (US)** on the visitor's key. A piece is sent **every time the energy gate thinks someone is talking**, including conversation not meant for the app, TV, or noise ("Noise that clears the bar costs one look", `talk.ts:9`). Where AEC is weak (`loudHer`), the mic is also sent as **continuous 1.5 s windows every second while she reads**. The route stores nothing and returns `no-store`. On error it logs only Together's error text (`[listen]`), not transcripts. The privacy page says so: "short bits of sound from your mic each time someone talks ... turned into text, and Bygga keeps neither" (`src/app/privacy/page.tsx:33, 41`). Retention at Together is governed by Together's policy.
- **The key itself** lives in `localStorage` (`src/lib/userKey.ts:6-29`) and travels as `x-together-key` on every listen and live-voice request. The server says it is "Never stored or logged" (`together.ts:140`).
- **Live TTS text** goes in the URL query (`/api/voice?t=...`), including spoken help answers, and the response is cached publicly on the CDN for a year. The text can therefore appear in request logs and caches.
- **Spoken questions** (`ask`) become text sent to `/api/help` (an LLM on Together).
- **Other:** the IP is held in memory for rate limiting. A Vercel Analytics event `track("voice_on", { product, listen })` fires when voice starts (`GuideApp.tsx:580`).
- **Historically**, the Web Speech API versions sent audio to the browser maker (Google in Chrome, Apple in Safari, per the old privacy copy in `f1613e9`). The brief on-device attempt was removed after the crash. Today the audio goes to Together via Bygga in every browser.

---

## 7. Other observations

Issues not already covered above:
- Rate limits are in-memory per serverless instance (`together.ts:118-131`), so they are soft.
- The `OPTIONAL` filter in `say()` is now effectively redundant, since every unplayable line is skipped anyway. It dates from when a missing line triggered the device voice.

## 8. How I verified

Everything ran offline. The repo was not modified, nothing was installed, and no external APIs were called. Scripts are in `(analyst helper scripts, not included)`:
- `voice_stats.py`: clip counts, durations, takes, flags.
- `clipid.mjs`: hash check against manifest IDs.
- `fixtures.py`: fixture composition.
- `replay/`: copies of the pure `commands.ts` and `talk.ts`, read in full first, plus `listen-check.ts`. `try.ts` produced the intent table.
- `litcov.mjs`: reads family files as text only.

I also ran ffprobe on sample clips. An attempt to run the repo's plan generator for exact coverage was refused by the sandbox, so the coverage figure in §1.4 is a static estimate.
