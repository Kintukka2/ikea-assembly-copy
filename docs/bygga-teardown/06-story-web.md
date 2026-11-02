# Bygga: the public story (web research as of 2 November 2026)

## How this was researched, and its limits

- **Tools.** I used WebSearch and WebFetch. x.com returns HTTP 402 to fetches, so I read tweet text and engagement through the public fxtwitter JSON mirror (`api.fxtwitter.com/<user>/status/<id>`). Engagement counts are as of 2 November 2026.
- **Blocked sources.** Reddit was unreachable: the search tool refuses reddit.com and WebFetch is blocked. I could not confirm or rule out Reddit threads.
- **GitHub.** The session proxy blocks the GitHub REST API (`api.github.com/repos/Nutlope/bygga` returns 403). I took repository stats from the github.com pages instead. I also made an anonymous shallow clone (`a public shallow clone`, HEAD `a02629a`, 29 Oct 2026) to check authorship, model IDs and commit messages.
- **Labels.** **Verified** means I saw it at the cited URL or in the repository. **Reported** means a single secondary source says it. **Not found** means I searched and found nothing.

---

## 1. The launch

### Timeline (verified unless marked)

| Date (2026) | Event | Source |
|---|---|---|
| 20 Oct | First commit, "Initial commit from Create Next App", by Youssef. The package is named `ikea-masta`. | repo history; [package.json](https://raw.githubusercontent.com/Nutlope/bygga/main/package.json) |
| 21 Oct | Commit "Build Bygga: animated, manual-style assembly guides". The repo is at **Luffixos/bygga** (Youssef's account) and the preview runs on `bygga-eta.vercel.app`. | repo history (an Oct 27 diff changes `Luffixos/bygga` to `Nutlope/bygga`) |
| 22 Oct | Hassan launches **Hallmark v2** (a different project, co-built with Youssef): 154,931 views, 2,052 likes. | [x.com/nutlope/status/2113316017510191578](https://x.com/nutlope/status/2113316017510191578) |
| **23 Oct, 19:34 UTC** | **Teaser tweet by @nutlope:** "I'm never reading IKEA instructions again", with a 23-second video. **955,393 views, 11,045 likes, 507 reposts, 190 replies, 111 quotes, 7,507 bookmarks.** The same day there is a commit "Move the hands-free voice to Together AI (Kokoro)". | [x.com/nutlope/status/2113715630386077804](https://x.com/nutlope/status/2113715630386077804) (via fxtwitter) |
| 23 Oct | Hassan replies in the thread that the full release will come the following week (reported). Search snippets also show a Youssef post saying it was "Designed & built by @nutlope and I" (snippet only; I could not open the status). | [creatorstoolbox.com/tools/bygga](https://creatorstoolbox.com/tools/bygga) |
| 24 Oct | First press, written from the teaser alone: ITHardware.pl, Marcin Manowski, "Papierowa instrukcja to przeżytek" ("the paper manual is obsolete"). | [ithardware.pl](https://ithardware.pl/aktualnosci/ikea_bygga_instrukcje_montaz_3d-55395.html) |
| 26 Oct | 108 commits in one day: full catalog merge, share cards, voice batches, footer credit "Built by Hassan and Youssef". | repo history |
| 27 Oct | 49 commits, including "the site lives at usebygga.com". Hassan's only 3 commits land in a ten-minute window (16:54 to 17:04 EDT): Plausible analytics, the repo move to `Nutlope/bygga`, and Together links routed through `togetherai.link` "to count clicks". | repo history |
| **27 Oct, 19:11:48 UTC** | **Launch tweet by @nutlope:** "Introducing Bygga! It walks you through assembling IKEA furniture step by step, with interactive 3D & voice instructions. 100% free & open source.", with a 31-second video. **279,339 views, 3,497 likes, 200 reposts, 154 replies, 57 quotes, 3,041 bookmarks.** | [x.com/nutlope/status/2115159545307619695](https://x.com/nutlope/status/2115159545307619695) |
| 27 Oct | Self-reply: "Try Bygga yourself! Includes every buildable IKEA product." plus the link. 17,245 views, 174 likes. | [x.com/nutlope/status/2115159547614744646](https://x.com/nutlope/status/2115159547614744646) |
| 27 Oct | @YoussefUiUx replies in the launch thread, "This one's fun! 🚀". This is from search snippets; I have no status URL. | search result on the launch thread |
| 27 Oct, 21:53 UTC | Hacker News submission "Build IKEA Step by Step" by **plurby** (not the authors): **3 points, 0 comments**. It was not a Show HN and never reached the front page. | [news.ycombinator.com/item?id=50266369](https://news.ycombinator.com/item?id=50266369) |
| 28 Oct | Caschys Blog (DE), GeekLife.cz (CZ), FastToolHub. GitHub issues #1 to #3 opened. | see Press below |
| 28 to 29 Oct | Post-launch accuracy commits (see Reception). | repo history |
| 29 Oct | Web Reactiva (ES). | [webreactiva.com](https://www.webreactiva.com/blog/bygga-ikea) |
| 30 Oct | The Menon Lab (EN), LangweileDich.net (DE), tchgdns.de (DE). Issue #5, the "Hackea" derivative. | see below |
| 2 Nov | wihel.de (DE). | [wihel.de](https://www.wihel.de/bygga-ikea-aufbau-anleitung-als-3d-show/) |

**Takeaway.** The 23 Oct teaser got about 3.4 times the views of the 27 Oct launch post (955K vs 279K) and about 2.5 times the bookmarks. Most of the attention came before the product was available. Both posts are far ahead of everything else measured here.

### Other social posts

- **Threads.** @firerock31 posted "Last week I shared Bygga… Free & open source, pretty neat!": 76.6K views, 1.6K likes, 27 comments, 121 reposts. The post is dated only "6d" on the page. [threads.com](https://www.threads.com/@firerock31/post/DfAt_u9kmUs/last-week-i-shared-bygga-which-guides-you-assemble-ikea-furniture-with/)
- **YouTube (FR).** Benjamin Code Plus, "L'app de cet homme a résolu IKEA." ("This man's app solved IKEA."). The title and channel are verified through YouTube oEmbed. The date and view count are not. [youtube.com/watch?v=Wt9_p_m8kGM](https://www.youtube.com/watch?v=Wt9_p_m8kGM)
- **Together AI's own channels.** **Not found:** no Together AI blog post, newsletter item or @togethercompute post about Bygga. The only Together branding is the site's "Powered by Together AI" link, which goes to `togetherai.link`, a click-counting redirect Hassan added on 27 Oct.
- **Product Hunt.** **Not found:** a search restricted to producthunt.com returned nothing.
- **Reddit** (r/IKEA, r/webdev, r/InternetIsBeautiful). **Could not check** (blocked, see above).

### Press coverage (all verified at the URLs)

None of the major English-language outlets covered it (The Verge, TechCrunch, Fast Company, Engadget, Gizmodo US: **not found**). **No Swedish coverage was found** in searches for Swedish terms and outlets (Feber, Breakit, M3, Swedroid, Ny Teknik). Coverage was mostly from European tech blogs:

| Outlet | Date | Author | Angle |
|---|---|---|---|
| [ITHardware.pl](https://ithardware.pl/aktualnosci/ikea_bygga_instrukcje_montaz_3d-55395.html) (PL) | 24 Oct | Marcin Manowski | Based on the teaser; product count and terms not yet known |
| [Caschys Blog / stadt-bremerhaven.de](https://stadt-bremerhaven.de/bygga-macht-aus-ikea-anleitungen-eine-3d-show-im-browser/) (DE) | 28 Oct | Oliver Posselt | "Unklar ist, ob die 3D-Modelle mit den echten Maßen übereinstimmen" ("It is unclear whether the 3D models match the real dimensions"). Critical reader comments. |
| [GeekLife.cz](https://www.geeklife.cz/bygga-navody-montaz-ikea-3d/) (CZ) | 28 Oct | Zdeněk Dvořák | Hands-on with KALLAX (9 steps, about 40 min). English only. Argues IKEA should have built this. |
| [Web Reactiva](https://www.webreactiva.com/blog/bygga-ikea) (ES) | 29 Oct | Dani Primo | Technical deep-dive into the README and code (three.js `LineSegments2`, zod, BYOK) |
| [The Menon Lab](https://themenonlab.blog/blog/bygga-3d-ikea-assembly-guide-open-source/) (EN) | 30 Oct | Dr. Prahlad G. Menon | Calls it "vibe-coded" and quotes the viral caption "someone vibe-coded an immersive 3D IKEA furniture assembler and open-sourced it" |
| [LangweileDich.net](https://www.langweiledich.net/bygga-animierte-ki-anleitungen-fuer-ikea-moebel/) (DE) | 30 Oct | Maik | "eine tolle Idee und Umsetzung" ("a great idea and execution"). Names the creators as Hassan and "Youssef El Mghari (Morocco)". |
| [tchgdns.de](https://tchgdns.de/bygga-ikea-moebel-mit-3d-anleitungen-im-browser-aufbauen/) (DE) | 30 Oct | Marcel | Credits both creators as Together AI staff and calls it a "private project". "Blind vertrauen sollte man den KI-Anleitungen auch nicht" ("You shouldn't blindly trust the AI instructions either"). |
| [wihel.de](https://www.wihel.de/bygga-ikea-aufbau-anleitung-als-3d-show/) (DE) | 2 Nov | Martin | "extrem nützlich" ("extremely useful"). Notes 1,171 products against about 20,000 in the IKEA Complexity Index. |

Directory and aggregator pages: [FastToolHub](https://fasttoolhub.com/en/terms/bygga/) (launch 27 Oct; "hundreds of likes within hours") and [CreatorsToolbox](https://creatorstoolbox.com/tools/bygga) (a stale "coming soon" page from 23 Oct).

### Reception and criticism

**Accuracy is the main criticism (verified):**
- [Issue #2](https://github.com/Nutlope/bygga/issues/2) (reinismx, 28 Oct): "most nontrivial builds contain impossible instructions". It says "dowels cannot teleport through wood" and that a seat is screwed to thin air.
- [Issue #3](https://github.com/Nutlope/bygga/issues/3) (BTWS2, 28 Oct): "Kyrre stool only has 3 legs".
- [Issue #1](https://github.com/Nutlope/bygga/issues/1) (knahaboo, 28 Oct): the IDANÄS sideboard was missing or wrong. **Luffixos (Youssef) replied as collaborator** on 29 Oct and said it was fixed. The reporter still saw the wrong product.
- Reader comments under the Caschy article (unverified individuals): BILLY step 2 inserts shelves the wrong way and step 3 blocks step 5; MALM screws are shown driven from outside; a hallucinated screw; one commenter calls it "Slop".
- Several outlets warn against trusting it blindly (Caschy, tchgdns, FastToolHub).

**The team's response shows in the commits (verified, repository):**
- 28 Oct, "Build guides from IKEA's assembly manuals": "1,974 of 2,180 guides now come from their manuals". The same commit adds a Give Feedback button.
- 29 Oct, "Fix build accuracy and animations": "Parts now arrive along their dowels and screws end in wood… 2,139 of 2,166". This answers issue #2 directly.

**Other limits the press noted:**
- Voice and UI are English only (GeekLife, tchgdns).
- Coverage is the US and UK range only.
- Photo lookup, the help chat and drafting unlisted products need the user's own Together AI key (GeekLife, tchgdns).
- Caschy says read-aloud costs "a small fee". This conflicts with the README, where 1,476 pre-recorded Kokoro clips play without a key. Voice commands, which use Whisper on Together, do go through Together; the [privacy page](https://www.usebygga.com/privacy) says mic snippets are sent to Together AI.

**"Vibe-coded" (verified, repository):** 163 of 166 commits carry a `Co-Authored-By: Claude Opus 5.5` trailer. That supports the Menon Lab's "vibe-coded" label.

**IKEA trademark and IKEA's response:**
- **Not found:** no IKEA statement, takedown or comment in any outlet. No article reports contacting IKEA.
- The project protects itself in three places:
  - The site footer: "independent, unofficial project… not affiliated with, sponsored or endorsed by Inter IKEA Systems B.V."
  - The repo's `NOTICE` file: the MIT license "grants no rights" in IKEA trademarks, and names are "used here only to say which product a guide is for".
  - The README: "We don't mirror IKEA's PDF manuals, on purpose". Each guide links to the official manual on ikea.com.
- The domain is `usebygga.com`, with no "ikea" in it.

**Derivatives (verified):**
- [Hackea](https://github.com/hansipie/Hackea) ([issue #5](https://github.com/Nutlope/bygga/issues/5)): an MIT fork for designing IKEA hacks, which credits "Nutlope and Luffixos".
- [Mnemosyne-OS/bygga](https://github.com/Mnemosyne-OS/bygga): integrates Bygga into another desktop environment.
- Open PRs from outsiders: #4 (yaka0007, search parsing) and #6 (rachelslurs, ELVARLI wardrobes).

---

## 2. The people

### Hassan El Mghari (@nutlope)
- **Role (verified):** "Director of Developer Experience at Together AI", New York, **104,651 X followers** (fxtwitter profile data). His site says he "leads Developer Experience at Together AI", managing a team that does demos, docs and content ([nutlope.com](https://www.nutlope.com)). GitHub: 8.9K followers ([github.com/Nutlope](https://github.com/Nutlope)).
- **Background (reported):**
  - Former senior developer advocate at Vercel; one source says he joined in September 2021.
  - Joined Together AI around January 2024 (single source).
  - Earlier ran a game-marketing company, UltraShock Gaming.
  - Sources: [ai.engineer speaker page](https://www.ai.engineer/speakers/hassan-el-mghari), [PodRocket](https://podrocket.logrocket.com/guests/hassan-el-mghari), [latent.space wiki](https://latent.space/wiki/hassan-el-mghari/).
- **Prior apps, self-reported on [nutlope.com](https://www.nutlope.com):**
  - RoomGPT: 10K stars, 12M visitors
  - RestorePhotos: 4K stars, 5M visitors
  - LlamaCoder: 6K stars, 2M visitors
  - BlinkShot: 1K stars, 1.5M visitors
  - Self.so: 2K stars, 80K visitors
  - AI Commits: 8K stars, 40K npm installs
- **Current GitHub pinned repos:** roomGPT 10.7K, logocreator 8.9K, llamacoder 7.2K, self.so 3.1K, **hallmark 45.9K**, ai-subtitles 474. Also [llama-ocr](https://www.sourcepulse.org/projects/1842593), about 2.4K stars.
- **LlamaCoder:** Meta's blog reports 200K+ apps generated in its first month ([ai.meta.com](https://ai.meta.com/blog/together-ai-llamacoder/)).
- **Typical stack (verified from READMEs):**
  - Next.js (app router) with Tailwind, deployed on Vercel.
  - Model inference: Replicate in the early apps (roomGPT: ControlNet, Replicate, Bytescale, Upstash, Vercel), then **Together AI** since 2024 (llamacoder: Llama 3.1 405B on Together, Next.js, Tailwind, Neon and Prisma, Plausible, Braintrust).
  - Sources: [roomGPT README](https://raw.githubusercontent.com/Nutlope/roomGPT/main/README.md), [llamacoder README](https://raw.githubusercontent.com/Nutlope/llamacoder/main/README.md).
- **How Bygga departs from that pattern:**
  - No Tailwind or UI kit: plain CSS with Motion.
  - A three.js engine.
  - A mostly offline, deterministic catalog rather than an LLM-first app.
  - BYOK keys instead of a house key.
  - The code was mostly written by Youssef, with Hassan's commits limited to launch plumbing.

### Youssef (@YoussefUiUx)
- **Identity (verified):** His own site, [youssefel.com](https://youssefel.com), names him **Youssef El Mghari**, "design engineer", "a designer who writes the code", currently **product designer at Together AI**, based in **Casablanca, Morocco**. It lists LinkedIn `youssef-el-mghari`, GitHub **Luffixos**, X @YoussefUiUx, and a contact email that matches the one on his Bygga commits.
- **X profile (verified via fxtwitter):** "Product Designer @ Together AI | DM's open", Morocco, 1,899 followers, joined August 2023.
- **GitHub [Luffixos](https://github.com/Luffixos) (verified):** "Product Designer @ Together AI", 159 followers. His pinned repos are all under Nutlope: hallmark, logocreator, ai-subtitles, pdftochat and others.
- **Other work listed on his site (verified):**
  - Hallmark, the anti-"AI slop" design skill. Hassan's LinkedIn post credits "Youssef E." ([LinkedIn](https://www.linkedin.com/posts/nutlope_announcing-hallmark-an-open-source-design-activity-7462523734868795392-oWjC)), and a 17 Jul 2026 tweet says "Started working on Hallmark v2 with @YoussefUiUx" ([x.com](https://x.com/nutlope/status/2078158874952028577)).
  - The Together Link landing page.
  - A MiniMax M3.1 Flash explainer.
  - NYC AI Atlas, Open Pictionary, AI Cup 2026, Variate, Hurdle, Qwest, CodeArena, GeoGuessBench, LogoCreator and Banana Studio.
- **His role in Bygga (verified, repository):** He wrote **163 of 166 commits**, and the repo started under his account.
- **Reported, not verified:**
  - A Genesys Growth partner profile (search snippet; the page returned 404) lists Youssef El Mghari as a freelance designer whose case studies include RoomGPT's gallery and dashboard. His booking link is `calendly.com/roomgpt/…`.
  - Whether he and Hassan are related, given the shared surname, is **not established** by any source.

---

## 3. The name

- **"Bygga" (verified):** a Swedish weak verb meaning "to build; to construct" (bygger / byggde / byggt, imperative *bygg*). It comes from Old Swedish *byggia* and Old Norse *byggja*, and is pronounced /ˈbʏˌɡːa/ ([Wiktionary](https://en.wiktionary.org/wiki/bygga)). In Norwegian, "bygga" is the definite plural of *bygg*, "the buildings". The name follows IKEA's habit of Swedish product names without using IKEA's mark.
- **A coincidence, not a confirmed inspiration:** IKEA and LEGO's 2020 collaboration was called **BYGGLEK** ("building play"). It drew 253 points on Hacker News ([HN 24281637](https://news.ycombinator.com/item?id=24281637)).
- **"ikea-masta" / "måsta":**
  - **No public explanation found.**
  - "Måsta" is not a Swedish word. The closest standard word is *måste*, "must". *Masta* has no entry in SAOL search results or in English Wiktionary's Swedish section.
  - Wiktionary lists English **"masta"** as a colloquial pronunciation spelling of "master" ([Wiktionary](https://en.wiktionary.org/wiki/masta)), and in Norwegian *masta* means "the mast".
  - The most plausible reading is "IKEA master", but that is **inference only**.
  - The package name never appears in the public launch materials.

---

## 4. Context: IKEA's own efforts and competitors

**IKEA's official channels (verified):**
- **PDF manuals:** downloadable from each product page under "Assembly & other documents". IKEA also offers a paid assembly service ([ikea.com/gb/en/assembly_instructions](https://www.ikea.com/gb/en/assembly_instructions/)).
- **TaskRabbit:** IKEA signed a deal to acquire TaskRabbit on 25 Sept 2017, after a London pilot in 2016, to offer human assembly ([TechCrunch](https://techcrunch.com/2017/09/28/ikea-buys-taskrabbit/), [Retail Gazette](https://www.retailgazette.co.uk/blog/2017/09/ikea-buys-services-firm-taskrabbit-to-help-customers-assemble-furniture)).
- **YouTube assembly videos:** since February 2012, starting with MALM ([Home Accents Today](https://www.homeaccentstoday.com/industry-news/ikea-us-launches-first-furniture-assembly-videos-on-youtube)).
- **IKEA Place (AR, 2017) and IKEA Kreativ (AI room design, 2022):** these help with planning and design, not assembly ([TechCrunch 2022](https://techcrunch.com/2022/06/22/ikea-rolls-out-an-ai-powered-interactive-design-experience-for-shoppers/)).
- **IKEA 3D Assembly Dataset (2021):** only 5 products (LACK, EKET ×2, BEKVÄM, DALFRED), licensed CC BY-NC-SA 4.0 for research only ([github.com/IKEA/IKEA3DAssemblyDataset](https://github.com/IKEA/IKEA3DAssemblyDataset)).
- **Not found:** any official IKEA interactive 3D or voice assembly product as of November 2026.

**Third-party precedents and competitors (verified):**

| Project | When | What | How it compares with Bygga |
|---|---|---|---|
| AssembleAR (Adam Pickard, Toronto) | Mar 2018 | AR concept: scan a barcode, life-size animated steps ([Dezeen](https://www.dezeen.com/2018/03/23/ikea-assembly-made-easier-through-augmented-reality-app/)) | Concept only, never shipped |
| Cadasio | 2021 post | Commercial CAD-to-3D instruction tool, with a MICKE demo ([cadasio.com](https://www.cadasio.com/post/what-if-ikea-instructions-were-3d)) | B2B and paid; needs CAD |
| Hackathon BRIMNES/LACK demo | Aug 2026 | Agents rebuilt parts from IKEA PDFs with three.js primitives in 3 hours ([x.com/neil_xbt](https://x.com/neil_xbt/status/2084944250446512491)) | 2 products |
| IKEA Complexity Index (ikea.greg.technology) | Aug 2026 | Ranks 21,290 products by assembly difficulty ([Gizmodo](https://gizmodo.com/this-website-ranks-ikea-products-by-how-difficult-they-are-to-assemble-2000801569)) | Difficulty rankings, not guides |
| **Flat Pack, Step by Step (Ryan Sael, sael.net/flatpack)** | **19 to 21 Oct 2026**, days before Bygga's teaser | Interactive 3D IKEA manuals, BILLY first, then about 26 products. It reproduces IKEA manuals "unaltered" side by side, and dimensions are "eyeballed from the drawings" ([sael.net](https://sael.net/flatpack/), [Gigazine](https://gigazine.net/gsc_news/en/20261022-flat-pack-step-by/), [Gizmodo Japan, 29 Oct](https://www.gizmodo.jp/article/2610-ikea-furniture-assembly-guide/)) | The closest rival: hand-built, few products, no voice |
| ikea-lab-web (Poznań University of Economics, research) | 2026 | Browser player for 3D IKEA guides ([GitHub](https://github.com/Hybrisen777/ikea-lab-web)) | Research demo |
| TaskRabbit, Airtasker and similar | ongoing | Paid human assembly | A different job: someone else builds it |

**Positioning in one line:** Bygga is the largest free, open-source attempt at this. It claims 1,171 products and 2,180 sizes in the README (1,223 on the live site), against about 26 for Sael's project. It adds narration, hands-free voice, offline guides and A4 print, and draws its own line art instead of copying IKEA's. Its weak points are accuracy on complex builds (now being patched by following the manuals more closely), English only, and US and UK coverage only.

---

## 5. GitHub repository stats

The GitHub API was blocked, so these come from [github.com/Nutlope/bygga](https://github.com/Nutlope/bygga) on 2 Nov 2026:
- **506 stars, 63 forks**, 4 open issues (#1, #2, #3, #5), 2 open PRs (#4, #6), 0 closed PRs, **166 commits** on `main`. The live site's nav badge read 503 stars at the time of fetch.
- Description: "IKEA assembly, step by step: animated, manual-style 3D guides. Scan any paper manual with Together AI." MIT license. Homepage usebygga.com.

**Commits (repository):**
- 163 by Youssef and 3 by Hassan El Mghari.
- Dates run 20 to 29 Oct. Commits per day: 20 Oct 1, 21 Oct 3, 22 Oct 1, 23 Oct 1, **26 Oct 108**, **27 Oct 49**, 28 Oct 1, 29 Oct 2.

**Product counts differ by source:**
- README: 1,171 products and 2,180 sizes.
- Live site: 1,223 products.
- LangweileDich: 1,176.
- A 29 Oct commit, "Add 59 missing IKEA products", probably explains the higher site figure.

**For comparison:** Hallmark (Hassan and Youssef) has 45.9K stars. Bygga's 506 stars are small next to its 955K-view teaser.

---

## 6. Together AI models and pricing

**Models referenced in the code (verified, `src/lib/together.ts`, `src/lib/voice/*.ts` at `a02629a`).** Each role tries a list of models in order and falls back to the next, and each list can be overridden by environment variable.

| Role | Models (in fallback order) |
|---|---|
| `plan` (laying out a scanned manual) | `openai/gpt-oss-120b`, `zai-org/GLM-5.3-Flash`, `Qwen/Qwen3.7-Plus` |
| `text` (product lookups, "Stuck?" chat) | `openai/gpt-oss-120b`, `zai-org/GLM-5.3-Flash`, `Qwen/Qwen3.8-Flash` |
| `vision` (box labels, loose parts) | `nvidia/NVIDIA-Nemotron-3.5-Super-VL`, `MiniMaxAI/MiniMax-M3`, `Qwen/Qwen3.5-9B` |
| `read` (manual pages) | `MiniMaxAI/MiniMax-M3`, `nvidia/NVIDIA-Nemotron-3.5-Super-VL`, `Qwen/Qwen3.5-9B` |
| Speech-to-text ("next", "back", "again") | `openai/whisper-large-v3`, `nvidia/parakeet-tdt-0.6b-v3` |
| Text-to-speech | `hexgrad/Kokoro-82M`, voice `af_heart` |

- gpt-oss calls default to `reasoning_effort: "low"`.
- Every call runs on the **visitor's own key**: "there is no other" (code comment). The site itself pays nothing per user, and feedback storage uses Upstash.
- The 1,476 narration clips were recorded once with Kokoro and ship as static files.

**Together serverless prices** ([together.ai/pricing](https://www.together.ai/pricing), fetched 2 Nov 2026; the page is undated):

| Model | Price |
|---|---|
| gpt-oss-120B | $0.15 in / $0.60 out per 1M tokens |
| GLM-5.3-Flash | $0.15 / $0.50 |
| Qwen3.8 Flash | $0.15 / $0.47 |
| Qwen3.7-Plus | $0.32 / $1.28 |
| Qwen3.5 9B | $0.17 / $0.25 |
| MiniMax M3 | $0.30 / $1.20 |
| Nemotron 3.5 Super VL | $0.15 / $0.50 |
| Whisper Large v3 | $0.0015 per audio minute (listed under a "Batch API price" heading, so the real-time rate may differ; Whisper streaming is $0.0035/min) |
| Parakeet TDT 0.6B v3 | $0.0015/min |
| **Kokoro-82M** | **$4.00 per 1M characters** |

- The Kokoro price was cut from $10 to $4 per 1M characters between 14 and 21 Jul 2026, per [UsagePricing](https://www.usagepricing.com/blueprint/activity/together-ai-2026-07-21-kokoro-tts-price-cut).
- For comparison, Cartesia Sonic-3 on the same page costs $65 per 1M characters.
- **What this means:** a hands-free session costs a user fractions of a cent in Whisper minutes. Re-recording all the narration clips (very likely under 100K characters, which is my estimate) would cost well under $1 at Kokoro rates.

---

## What I could not find

- Any Reddit thread (blocked from this session).
- Any Product Hunt listing.
- Any Together AI blog post, newsletter item or official @togethercompute post.
- Coverage by The Verge, TechCrunch, Fast Company or other major English outlets, or by Swedish press.
- Any IKEA statement.
- The text of Youssef's own launch posts beyond search snippets.
- The date and views of the Benjamin Code Plus video.
- A public explanation of the name "ikea-masta".
