/**
 * Builds every Kmart guide and prints what it says, so a recipe can be checked against the paper manual.
 *
 *   npm run kmart:check                 every Kmart product: steps, parts, fittings, problems
 *   npm run kmart:check -- --only <slug> one product, in full (each step's parts and fittings)
 *   npm run kmart:check -- --quiet       problems only
 *
 * Fails when a Kmart product doesn't build, has no steps, isn't built by a recipe read from its own manual (a kind
 * builder makes its parts and fittings up), puts a part outside the product, has a keycode that doesn't open it, or
 * when the search checks below stop finding what they should.
 */
import { KEYCODES, PRODUCTS, toSpec } from "@/lib/catalog";
import { buildPlan } from "@/lib/plan";
import { familyOf } from "@/lib/plan/families/family";
import { FAMILIES } from "@/lib/plan/families";
import { matchCatalog, searchCatalog } from "@/lib/search";
import { brandOf } from "@/lib/brands";
import type { Plan } from "@/lib/types";

const args = process.argv.slice(2);
const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;
const quiet = args.includes("--quiet");
const problems: string[] = [];
const fail = (s: string) => problems.push(s);

function finite(v: unknown): boolean {
  if (typeof v === "number") return Number.isFinite(v);
  if (Array.isArray(v)) return v.every(finite);
  if (v && typeof v === "object") return Object.values(v).every(finite);
  return true;
}

/** Every part's final position stays inside the product's outer size, give or take a little. */
function outside(plan: Plan) {
  const { w, h, d } = plan.spec.size;
  const sizeOf = new Map(plan.parts.map((p) => [p.id, p]));
  for (const it of plan.items) {
    if (it.kind !== "part") continue;
    const p = sizeOf.get(it.ref);
    if (!p || p.extra) continue;
    const [x, y, z] = it.final.pos;
    if (Math.abs(x) > w * 5 + 60 || y < -60 || y > h * 10 + 60 || Math.abs(z) > d * 5 + 60) return `part ${p.label} (${p.name}) sits outside the product at ${it.final.pos.map((v) => Math.round(v)).join(", ")}`;
  }
  return null;
}

/** A guide comes from its manual when a family recipe for its line answers for it (an empty one keeps the kind builder). */
const fromManual = (spec: ReturnType<typeof toSpec>) => FAMILIES.some((f) => f?.names?.includes(familyOf(spec)) && (!!f.recipe?.(spec) || !!f.build));
const KM = PRODUCTS.filter((e) => brandOf(e) === "kmart");
let recipes = 0;
for (const e of KM) {
  if (only && e.slug !== only) continue;
  const spec = toSpec(e);
  let plan: Plan;
  try {
    plan = buildPlan(spec);
  } catch (err) {
    fail(`${e.slug}: buildPlan threw ${(err as Error).message}`);
    continue;
  }
  if (!plan.steps.length) fail(`${e.slug}: no steps`);
  if (!finite(plan.items)) fail(`${e.slug}: a number in the plan is not finite`);
  const off = outside(plan);
  if (off) fail(`${e.slug}: ${off}`);
  for (const n of e.numbers ?? []) if (KEYCODES.get(n) !== e.slug) fail(`${e.slug}: keycode ${n} opens ${KEYCODES.get(n)}`);
  const family = familyOf(spec);
  const fromRecipe = plan.steps.length > 0 && fromManual(spec);
  if (fromRecipe) recipes++;
  else fail(`${e.slug}: not built from its manual (no recipe in src/lib/plan/families/kmart-*.ts answers for it)`);
  if (quiet) continue;
  const panels = plan.parts.filter((p) => !p.extra).reduce((a, p) => a + p.qty, 0);
  const fittings = plan.hardware.filter((h) => !h.notIncluded).reduce((a, h) => a + h.qty, 0);
  console.log(`\n${e.slug}  ${e.name}, ${e.variant}  [${family}${fromRecipe ? ", from its manual" : ", kind builder"}]`);
  console.log(`  ${e.size.w} x ${e.size.h} x ${e.size.d} cm, ${spec.minutes} min, ${spec.people} ${spec.people === 1 ? "person" : "people"}, ${plan.steps.length} steps, ${panels} panels, ${fittings} fittings`);
  if (only) {
    console.log("  parts: " + plan.parts.map((p) => `${p.label} ${p.name} x${p.qty} [${p.size.map((v) => Math.round(v)).join("x")}]`).join("; "));
    console.log("  fittings: " + plan.hardware.map((h) => `${h.name}${h.spec ? " " + h.spec : ""} x${h.qty}${h.notIncluded ? " (not in the box)" : ""}`).join("; "));
  }
  plan.steps.forEach((s, i) => {
    console.log(`  ${String(i + 1).padStart(2)}. ${s.title}${s.repeat && s.repeat > 1 ? ` (x${s.repeat})` : ""}${s.pose && s.pose !== "+y" ? ` [${s.pose}]` : ""}${s.people === 2 ? " [2 people]" : ""}`);
    if (only && s.detail) console.log(`      ${s.detail}`);
  });
}

// search: names, keycodes and the brand words people type
const expect = (q: string, slug: string | null, opts?: Parameters<typeof matchCatalog>[1]) => {
  const got = matchCatalog(q, opts)?.slug ?? null;
  if (got !== slug) fail(`search "${q}" opens ${got ?? "nothing"}, expected ${slug ?? "nothing"}`);
};
for (const e of KM) for (const n of (e.numbers ?? []).slice(0, 1)) expect(n, e.slug);
for (const e of KM.filter((x) => x.featured)) {
  const hits = searchCatalog(`kmart ${e.name}`, 8).map((h) => h.entry.slug);
  if (!hits.includes(e.slug)) fail(`search "kmart ${e.name}" doesn't list ${e.slug}`);
  if (searchCatalog(`kmart ${e.name}`, 8).some((h) => brandOf(h.entry) !== "kmart")) fail(`search "kmart ${e.name}" lists a product that isn't Kmart's`);
}
expect("IKEA KALLAX", "kallax-2x2");
expect("ikea billy", "billy-80x202");
expect("my billy", "billy-80x202");
expect("the kallax", "kallax-2x2");
expect("kallax", "kallax-2x2", { brand: "ikea" });
if (searchCatalog("kallax", 5, { brand: "kmart" }).length) fail(`search "kallax" in Kmart's range lists something`);

console.log(`\n${KM.length} Kmart products, ${KM.reduce((a, e) => a + (e.numbers?.length ?? 0), 0)} keycodes, ${recipes} built from their manual`);
if (problems.length) {
  console.log(`\n${problems.length} problems:\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log("no problems");
