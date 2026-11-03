/**
 * Records the voice's missing lines on this machine, with the same Kokoro model and Heart voice the clips were made
 * with (run locally through kokoro-onnx instead of on Together), so new guides speak without anyone's key.
 *
 *   npm run voice:local -- --list todo.json [--brand kmart] [--popular]   write the lines that have no clip yet
 *   python3 scripts/voice/kokoro.py todo.json wavs/                       render each line to wavs/<id>.wav
 *   npm run voice:local -- --finish wavs/                                 trim, loudness-match, encode, add to the manifest
 *
 * --brand picks one shop's guides (default: every Kmart guide); --popular adds the home page's most built guides.
 * Lines with a phonetic name spelling (src/lib/voice/names.ts) are left to scripts/voice/record.ts on Together:
 * that markup is Kokoro-on-Together syntax the local runner doesn't read.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PRODUCTS, toSpec } from "@/lib/catalog";
import { buildPlan } from "@/lib/plan";
import { POPULAR } from "@/lib/search";
import { brandOf } from "@/lib/brands";
import { VOICE_DIR, builtLine, clipId, stepLines, whereLine } from "@/lib/voice/script";
import { TTS, forTTS } from "@/lib/voice/tts";

const ROOT = path.resolve(import.meta.dirname, "../..");
const OUT = path.join(ROOT, "public", VOICE_DIR);
const MANIFEST = path.join(OUT, "manifest.json");
const LOG = path.join(import.meta.dirname, "clips.json");
const args = process.argv.slice(2);
const arg = (k: string) => (args.includes(k) ? args[args.indexOf(k) + 1] : undefined);

type Manifest = { voice: string; clips: Record<string, number> };
const manifest: Manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const log: Record<string, { text: string; ms: number; heard?: string | null; ok: boolean; takes: number; local?: boolean }> = JSON.parse(readFileSync(LOG, "utf8"));

function list(file: string) {
  const brand = arg("--brand") ?? "kmart";
  const picked = PRODUCTS.filter((e) => brandOf(e) === brand || (args.includes("--popular") && POPULAR.includes(e)));
  const lines = new Set<string>();
  for (const e of picked) {
    const p = buildPlan(toSpec(e));
    for (let i = 0; i < p.steps.length; i++) {
      for (const l of stepLines(p, i)) lines.add(l);
      lines.add(whereLine(i, p.steps.length));
    }
    lines.add(builtLine(p));
  }
  const todo = [...lines].filter((t) => !manifest.clips[clipId(t)] && forTTS(t) === t).map((text) => ({ id: clipId(text), text }));
  writeFileSync(file, JSON.stringify(todo, null, 1));
  const chars = todo.reduce((a, c) => a + c.text.length, 0);
  console.log(`${picked.length} guides, ${lines.size} lines, ${todo.length} without a clip (${chars} characters) -> ${file}`);
}

/** The same finish as scripts/voice/record.ts: trim silence, fade the edges, two-pass loudness to -16 LUFS, mono 64 kbps. */
function finish(raw: string, out: string) {
  const trim = "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.03,areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.03,afade=t=in:d=0.02,areverse,afade=t=in:d=0.01";
  const probe = execFileSync("sh", ["-c", `ffmpeg -hide_banner -i "${raw}" -af "${trim},loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json" -f null - 2>&1`], { encoding: "utf8" });
  const m = JSON.parse(probe.slice(probe.lastIndexOf("{"), probe.lastIndexOf("}") + 1));
  const ln = `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", raw, "-af", `${trim},${ln},aresample=44100`, "-ac", "1", "-c:a", "libmp3lame", "-b:a", "64k", out]);
  return Math.round(Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out], { encoding: "utf8" })) * 1000);
}

function done(dir: string) {
  const texts: Record<string, string> = {};
  const todoFile = path.join(dir, "todo.json");
  if (existsSync(todoFile)) for (const c of JSON.parse(readFileSync(todoFile, "utf8")) as { id: string; text: string }[]) texts[c.id] = c.text;
  let n = 0;
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".wav"))) {
    const id = f.replace(/\.wav$/, "");
    if (manifest.clips[id]) continue;
    const ms = finish(path.join(dir, f), path.join(OUT, `${id}.mp3`));
    manifest.clips[id] = ms;
    log[id] = { text: texts[id] ?? "", ms, heard: null, ok: true, takes: 1, local: true };
    if (++n % 50 === 0) console.log(`${n} clips`);
  }
  writeFileSync(MANIFEST, JSON.stringify({ voice: `${TTS.name} (${TTS.label})`, clips: manifest.clips }));
  writeFileSync(LOG, JSON.stringify(log, null, 1));
  console.log(`added ${n} clips; the manifest has ${Object.keys(manifest.clips).length}`);
}

const l = arg("--list");
const f = arg("--finish");
if (l) list(l);
else if (f) done(f);
else console.log("use --list <file> or --finish <dir>");
