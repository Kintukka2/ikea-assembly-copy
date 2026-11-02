# Bygga, report 01: the 3D line-art engine and the parametric plan generator

Scope: `src/engine/*`, `src/lib/types.ts`, `src/lib/spec.ts`, `src/lib/plan/*.ts`, `src/lib/plan/families/*`, `src/components/StageView.tsx`, `Thumb.tsx`, `home/HeroStage.tsx`. I only read the code. Nothing was built or run. All paths below are relative to the repo root (`the Bygga repo`).

## 0. Summary

- **No meshes, no AI at view time.** Each guide is a deterministic `Plan` that TypeScript (`src/lib/plan`) computes from a small `ProductSpec`: a few numbers in cm plus archetype parameters. The plan lists part boxes and cylinders in mm, fittings with an insertion vector, and a timeline of steps. A custom three.js "Stage" plays it back as animated line art.
- **Two layers of generator.** There are 7 generic *kind builders* (shelf, drawers, table, bed, cabinet, seat, sofa) with about 35 sub-builders. Above them sit 522 *family* modules (one per IKEA name, about 171k lines in total) that copy each product's real IKEA manual. A family either draws the guide itself with the `PlanBuilder` API, or returns a declarative *recipe* (part boxes plus steps). `custom.ts` turns a recipe into a guide and works out joints, fitting positions and arrival directions geometrically.
- **The look is hand-rolled, not three.js lighting.** Faces use a flat 4-band toon `ShaderMaterial` with a hard-coded light direction. Creases come from `EdgesGeometry` drawn as fat screen-space `LineSegments2`. Silhouettes of curved shapes come from a screen-space *inverted hull*. The camera is orthographic. Earlier parts drop to grey ink and new ones are black ink with a pale-yellow tint. SVG overlays draw the arrows, part letters, dimension lines, the "square" diagonals and a circular close-up callout. The callout comes from a second WebGL renderer that slices with its near plane.
- **KALLAX 2x2** goes to `families/kallax.ts`, which builds it as the manual does: lying on its back with Allen bolts and dowels, then felt pads, standing it up, and a wall step. That makes 11 steps, 7 panels (4 part letters), 8 bolts, 10 dowels, 4 felt pads and a 12-item wall fixing.

---

## 1. Data model (`src/lib/types.ts`)

### Units and coordinates
- `ProductSpec.size` is in **cm** (`types.ts:239`). Everything in a `Plan` is in **mm**. Builders multiply by 10 straight away, for example `const W = s.size.w * 10` (`shelf.ts:178`).
- The frame is right-handed and y-up. x runs left to right, **y up from the floor**, z back to front (`types.ts:174`: "y up from the floor, x left to right, z back to front"). The product is centred on x and z, with its bottom at y = 0.
- Rotations are XYZ Euler angles in radians, the same convention as three.js (`plan/math.ts:21-24`, `rotate = rx(ry(rz(v)))`).
- `Vec3 = [number, number, number]` (`types.ts:1`).

### ProductSpec (input) (`types.ts:234-260`)
`name`, `variant`, `category`, `archetype` (`shelf|drawers|table|bed|cabinet|seat|sofa|custom`), `size {w,h,d}`, `minutes`, `people 1|2`, `difficulty`, optional `material`, `tips`, `watchOut`, `slug`, `variants`, `siblings`, and `source: "catalog"|"ai"|"guess"|"scan"`. It holds exactly one parameter block for its archetype: `ShelfParams`, `DrawersParams`, `TableParams`, `BedParams`, `CabinetParams` (which can carry `FitParams` with `FitZone` bands from the bottom up, or a `CornerCab`), `SeatParams`, `SofaParams` or `CustomParams`. `row` describes several frames side by side, optionally with `RowUnit`s of different widths or corner placement (`types.ts:259-271`).

The AI path validates the same shape with zod in `spec.ts:12-109`. Every number is clamped (`size: { w: num(20, 320), h: num(20, 260), d: num(15, 240) }`), en and em dashes are stripped (`spec.ts:115`), and `z.config({ jitless: true })` (`spec.ts:5`) keeps the site's no-eval CSP happy. The LLM prompt that fills it is `SPEC_PROMPT` (`spec.ts:143-175`).

### Plan (output) (`types.ts:460-467`)
```ts
interface Plan { spec; parts: PartType[]; hardware: HwType[]; items: Item[]; steps: Step[]; tools: ToolNeed[] }
```
There is no separate "Guide" type. The Plan is the guide, and `GuideApp` adds per-step UI around it.

- **PartType** (`types.ts:288-298`) is a kind of panel: `id`, `label` (its letter), `name`, `size` (box extents, or `[dia, length, dia]` for a cylinder along Y), `shape box|cyl`, `material board|fiber|wood|metal|soft|glass`, `qty`, `extra` (not in the box, such as a mattress) and optional `pieces: PartPiece[]` for compound parts. A piece is a box, cyl, halfcyl or slab, where a slab is an extruded `outline` with rounded corners (`types.ts:278-286`).
- **PartItem** (`types.ts:362-369`) is one physical instance: `final {pos, rot}`, `holes: Hole[]` in part-local coordinates (`Hole {p, n, r}`, where n is the outward normal), and `states: PartState[]`.
- **PartState** (`types.ts:352-360`) means "from step `step` on, it sits at `pos/rot` inside scene `scene`". It also carries `from` (the approach offset), `spin` (turns about local Y while approaching) and `delay` (seconds into the step). The last state is the assembled one. Several states let a part be shown laid flat in a sub-assembly scene first and then move into place.
- **HwType** (`types.ts:334-343`) is a fitting kind for the list: `kind`, one of 32 `HwKind`s (dowel, camScrew, cam, screw, nail, pin, legScrew, bolt, plate, bracket, runner, knob, handle, hinge, glide, plug, castor, gasLift, connector, roller, flatHinge, hook, clip, strap, nut, washer, stud, clamp, angle, foot, cap, spacer; see `types.ts:300-332`). It also has `name`, `spec` text such as "8 × 30 mm", `len`, `dia`, `qty` and `notIncluded`.
- **HwItem** (`types.ts:371-387`) is one placed fitting. `parent` names the part key (and then `pos/dir` are local to that part) or, with no parent, a `scene`. `dir` is the "insertion direction, pointing into the material". The item also has `travel` (mm it slides in), `spin` (revolutions), `turn` (the cam lock's twist, in radians), `twist` (roll about dir), `delay`, `scale` and `preset` (already fitted, so not animated).
- **Step** (`types.ts:436-451`): `n`, `title`, `detail`, `tools: ToolId[]`, `people`, `repeat` ("do this N×"), `scene`, `pose`, `warnings: WarnId[]` (`two|loose|hand|wall|square|floor|face|tip`), `kind: StepKind` (19 kinds that drive tips and icons), `check?: "square"`, `wall?`, `quiet?` and `minutes`.
- **Pose** (`types.ts:413`) is `"+y"|"-y"|"+z"|"-z"|"+x"|"-x"`. It names *which local axis points up* while the step is done. `POSE_EULER` (`math.ts:36-43`) maps `"+z"` to `[-π/2,0,0]`, so the front faces up and the piece lies on its back. `"-y"` maps to `[π,0,0]`, upside down.
- **ToolNeed** (`types.ts:453-458`): `{id, included?, optional?, why?}` for 10 `ToolId`s.
- **Scenes** are plain strings. `"main"` is the build. Others such as `"prep"`, `"top"`, `"drawer"`, `"doors"` or `"insert"` hold sub-assemblies built away from the carcass.

---

## 2. From spec to ordered steps

### 2.1 Dispatch and the fallback chain (`plan/index.ts`)
```ts
export function buildPlan(spec) {                      // index.ts:18
  const key = JSON.stringify(spec); ... cache.get(key)  // memoised per spec
  const b = new PlanBuilder(spec);
  if (spec.row && familyRow(b, spec)) {}                // 1. family draws its own set of frames
  else if (spec.row?.units) buildUnits(b, spec, buildOne); // 2. mixed-width row / corner set
  else if (spec.row) buildRow(b, spec, buildOne);        // 3. N identical frames
  else buildOne(b, spec);                               // 4. single product
```
`buildOne` (`index.ts:56-76`) calls `buildFamily` first. Families are looked up by `familyOf(spec)`, the first word of the name in capitals (`families/family.ts:19`). The `byName` map lets several families share a name (`index.ts:33-35`). For each family it tries `f.build(b, spec)` and then `f.recipe(spec)` (passed to `buildCustom`). Either one returns false or null for products it doesn't cover, and the `switch (spec.archetype)` kind builder runs instead. `archetype === "custom"` (a scanned manual) skips families and goes straight to `buildCustom`. A spec from the AI whose name matches a family also goes through that family, but only if its parameters satisfy the family's own checks (for KALLAX, `gridOf` needs `style: "grid"` with cols and rows).

### 2.2 The PlanBuilder API (`plan/builder.ts`)
This is the imperative core that every builder uses.

| Method | Purpose |
|---|---|
| `part(name, size, {shape, material, extra, label})` (185) | Registers a PartType and returns its id. |
| `compound(name, pieces)` (205-224) | Bounding-box-centres a multi-piece part and returns `{type, mid}`. |
| `place(ref, pos, rot)` (226) | Creates a PartItem with its final pose. |
| `hole(key, at, n, r)` (240) | Records a hole in part-local coordinates. |
| `step(def, body)` (264-288) | Opens a step and resets the timeline (`t = 0.15, gap = 0.22`). The `body()` emits its contents. |
| `add(key, from?, {spin})` (313) | The part reaches its final pose in this step, flying in from `from`. |
| `stage(key, pos, rot, from?)` (335) | The part is shown elsewhere (laid flat, upside down, in a sub-scene) from this step on. |
| `fit(def, FitOpts)` (341-376) | Places one fitting. With `on`, `at` and `dir` are turned into the part's local frame and a hole of radius `holeR(def)` goes on the host. `mate` gets a hole where the fitting actually enters it (`entry()`, which marches along `dir` until it is inside the mate's box, 321-333). Defaults come from `defaultTravel` (495-529) and `defaultSpin` (531-547: screws 4 turns, cam bolts 3, bolts 3, leg screws 2). A cam gets `turn = 0.75π`. |
| `fits(def, list, gap)` | A batch with a small stagger. |
| `preset(def, o)` (387) | The fitting is already in place (for example on copies of a drawer), with no animation. |
| `stagger(gap)`, `then(pause)`, `wait(sec)` (295-303) | Timeline control. `slot(dur)` hands out `delay = t` and then `t += gap`. `then()` moves `t` to the end of everything so far, which gives sequential groups. |
| `hwType(def)` (245) | Dedupe key `${kind}-${len}-${dia}[-x][-name]`, so each size gets its own row in the parts list. |

`build()` (397-470) finishes the plan:
- It throws if a placed part was never added (`part ${it.key} never added`).
- It assigns **letters by first appearance** from `LETTERS = "ABCDEFGHJKLMNPRSTUVWXYZ"`, which skips I, O and Q. Past Z it uses double letters (AA, AB, and so on).
- It shares `spec.minutes` across steps by weight: `0.8 + parts*0.6 + fittings*0.12`, times `repeat` (427-437).
- It builds the tool list. The Allen key and spanner count as included. The drill is "Only for fixing it to the wall". The tape is "To check it is square". The knife is always added.
- It sorts not-included fittings last.

### 2.3 Kind builders
Each kind builder dispatches by parameter flags first, then draws a generic carcass.
- **shelf** (`shelf.ts:28-40`) routes to changing table, rack, screen, hat rack, coat stand, airer, then grid (`grid`, `onUnderframe`, `withInserts`), `withRail`, `withBox` or `bookcase`. `grid()` (177-349) builds a cube shelf upright from the bottom with cam bolts and dowels. The top is prepared upside down in a `"top"` scene. `onUnderframe` builds the shelf at y = 0 and then shifts every main-scene state up by U (518-524). `liftOntoCastors` (`castors.ts:31-40`) does the same trick.
- **FrameKit** (`frame.ts`) is the shared carcass for bookcases, chests and wardrobes. Its steps run `prepSides`, `join`, `otherSide`, `cams`, `plinthStep`, `backSteps` (flip face down, check square, nail the back), `standUp`, `shelves` and `anchor`. Shelf-pin rows sit on a 64 mm pitch (`frame.ts:112-124`). `gapsForShelves` hands shelves to the tallest compartments first (350-362). Nails are sorted corners first (290). `anchorStep` (374-405) places brackets, screws, plugs and wall screws, with "not included" detail text.
- **drawers** (`drawers.ts`) puts runners on the sides while they lie flat, builds the carcass, then builds the first drawer in a `"drawer"` scene, face down, with `repeat: n`. In the "Slide in all N drawers" step, the other drawers bring `preset` dowels and screws (`drawers.ts:243-250`), and that step is `quiet` (255).
- **cabinet** (`cabinet.ts:28-36`) dispatches lid box, shelf-cabinet, corner cabinet (`cornercab.ts`: an L or a blind corner), fitted (`fitted.ts`: front bands for basin, sink or appliances, shelves snapped to the 32 mm grid with `Math.round(.../32)*32`), mixed doors and drawers, sliding, tilt (shoe cabinets), then the plain cabinet with `doorSteps` (106-193).
- **table** (`table.ts:25-31`) routes to desk with drawers, box desk, riser, corner desk, gateleg, drop-leaf, then 4 legs fixed by `screw|plate|apron`, with the top upside down (`pose: "-y"`) and legs that spin in (`{ spin: 2 }`).
- **bed / seat / sofa** route to cot, bunk or loft, daybed; office chair, highchair, lounger, swivel; corner and chaise sofas (`corner.ts`, sections pushed together upside down with connectors) and pouffes. `sofaDims.ts` uses IKEA's measured seat, arm and back heights.

### 2.4 Rows of frames (`row.ts`, `units.ts`)
`buildRow` (`row.ts:50-195`) builds frame 1 step by step with the normal builder. It **removes the last anchor step** and keeps its fittings for later (64-72), then shifts frame 1 to the left end. Next comes one "Build the second … the same way" step. In that step every copy is `place`d, its holes are cloned, it is `stage`d 160 mm off to the side, and its fittings come back as `preset`s. Then all copies are `add`ed and screwed together through the sides at 2 to 4 heights, or with a family `RowJoint` such as PAX's connecting screw and barrel nut (`pax.ts:497-506`). Last, the anchor step is replayed once per frame. `buildUnits` generalises this to frames of different widths, a turned frame or a corner unit. It builds the most common frame first and the other sizes in throwaway `PlanBuilder`s to copy from, and merges part types by `[name,size,shape,...]`. `turnY` (`units.ts:35-41`) composes a world-Y turn with an XYZ Euler and extracts the Euler back out.

### 2.5 The recipe interpreter (`plan/custom.ts`)
A recipe is `CustomParams = { parts: CustomPart[], steps: CustomStep[] }`. Each part is a box (or cylinder, or a part made of pieces) placed **where it sits in the finished product**. Each step can `add` parts, `fix` fittings (`CustomFix` with `kind`, `count`, and optionally exact `at` points, `dir`, `on`, `mate`, `to`), set the `pose`, `people`, `tools`, `wait` and `from`. The file's header states the design: *"The AI only describes boxes ... and which parts each step adds. Everything fiddly is worked out here: where parts touch, where each dowel, bolt or screw goes, which way parts arrive from, and which tools a step needs."* (`custom.ts:5-10`). The same interpreter serves scanned manuals and 300+ hand-written family recipes.

How it works:
1. **Part types** are shared by name, rounded size, shape, material and pieces (`custom.ts:269-289`). Explicit labels are kept only if they are short and consistent (`labelsOk`, 270). Horizontal rods are detected and turned.
2. **Contacts.** `contactOf` (59-86) finds two boxes that touch on one axis (gap ≤ 4 mm) and overlap by more than 2 mm on the other two. It returns the contact plane, the shared rectangle and its axes.
3. **Fittings without coordinates** are spread over contacts with `share()`, longest contacts first, in proportion to their length (122-137), and placed with `along()`, evenly along the long side with an inset (103-119). The rules differ by kind (`planFits`, 504-653):
   - Dowels go into the part already standing and cam bolts into the thinner face.
   - A cam goes into the face panel, 30 mm in from the joint, entering from the inside.
   - Shelf pins sit under the shelf, in the side.
   - Knobs go on front faces, 55% of the way up tall doors.
   - Felt pads go to the corners of the footprint.
   - Brackets go on the topmost part.
   - Screws, bolts and nails go through the thinner part into the other one.
   - A screw's length defaults to the panel thickness + 16 mm (`defFor`, 208).
4. **Fittings with coordinates** (`f.at`) go exactly there, on `on` or else the nearest part (505-515).
5. **Pre fittings go first.** `PRE = ["dowel","camScrew","pin","legScrew","plate"]` (29) are placed before the step's parts arrive. In a fittings-only step ("tap the dowels in") they are placed at the joints of parts that a later step adds, up to 3 steps ahead (`lookahead`, 457-463). A part that takes fittings but is joined later (`wait`) waits beside the build at its final height (`beside`, 446-454).
6. **Arrival direction.** `approach()` (471-487) flies a part in along the normal of its longest contact, from `min(520, max(240, 0.45·size))` mm away, or straight down in world terms when it has no contact (`unrotate([0,d,0], POSE_EULER[pose])`). Then `arrive()` (307-318) applies the **pin constraint**. If dowels or cam bolts already join this part to its neighbours, it must arrive *along* them:
   ```ts
   // a dowel in this part sticks out towards its mate, so the part moves against its direction; one in a part already there, the other way
   const ways = pins.flatMap(...); const axes = new Set(ways.map(major));
   if (axes.size !== 1) return off; ... return unit(k, Math.sign(ways[0][k]) * Math.hypot(...off));
   ```
   This is the in-generator fix for the "impossible move" that `docs/manual-sweep.md` describes (a part sliding across dowels).
7. **Emit with de-overlap.** `emit()` (658-688) nudges a fitting that would land within 22 mm of an earlier one by ±36 or ±72 mm along the joint, keeping it on its host. Washers, nuts, caps and clamps are exempt (`STACKS`) so they share their bolt's point.
8. **Inferred metadata.** The step kind comes from the first non-PRE fitting (`KIND_OF`, 224-242), or from a pose change ("standup" or "flip"). Tools come from fitting kinds (`TOOLS_OF`, 244-257). Brackets or straps imply `wall` and add pencil and screwdriver. `people: 2` adds the "two" warning.
9. **Normalisation.** `normalizeSteps` (691-707) adds each part exactly once. Leftovers go on the last step, or into a new "Fit the remaining parts" step. Recipes are capped at 80 steps, 24 `fix` entries per step (322) and 48 fittings per entry.

### 2.6 Family recipes (`plan/families/`)
`Family = { names; recipe?(s): CustomParams|null; build?(b,s): boolean; row?(b,s): boolean }` (`family.ts:10-16`). `index.ts` is generated by `scripts/families.mjs` and lists 522 families. The header comment of each file summarises how the manual goes together, in the repo's own words. `AGENTS.md` requires that the guides follow the manual's steps, order, parts and counts, without copying IKEA's drawings or text.

Patterns across the 528 files (grep counts):
- `recipe(...)`: 316 files. `build(...)`: 104. Both: 17. `row(...)`: 6 (BESTÅ, BILLY, BROR, PAX, PLATSA, SKRUVBY). 73 `build`s still call `buildCustom` internally, mixing a recipe for the carcass with `PlanBuilder` steps for wall fixings, drawers or underframes.
- Dispatch is by regexes on `s.variant` or `s.slug` (429 files test `s.slug`): for example `if (/^coffee table/.test(v)) return tableRecipe(s, "coffee")` (`lack.ts:412`).
- Most files define named fitting constants "sized so different ones stay apart in the list", for example `const BOLT: HwDef = { kind: "bolt", len: 80, dia: 7 }` (`kallax.ts:15`), plus local helpers `fx(kind, at, dir, o)` and `pair(x, y)`.
- Poses appear all through the recipes: `"+y"` 1062 times, `"-y"` 836, `"+x"` 492, `"+z"` 441, `"-z"` 328, `"-x"` 95. `people: 2` appears in 251 files and `check: "square"` in 119.
- Compound geometry: `pieces` in 460 files and `b.compound` in 64. POÄNG builds its bentwood frames as chains of rotated boxes along side-view paths (`poang.ts:37-46`, `path()`).
- Families reuse each other. UPPLAND is `sofaBuilder` from EKTORP with other sizes. UTMANING hands off to MITTZON (`utmaning.ts`).

Representative families:
- **KALLAX** (`kallax.ts`) is built lying on its back (`pose "+z"`): Allen bolts make an L, the inside goes in row by row on dowels, then the last side and the bottom. There are three patterns: `small`, `big` (4 or more columns, or a single row) and `cams` (1x4). Units sold lying down reuse the tall manual through coordinate swaps `P/Sz/Dir` (65-68). Underframe, inserts with a door, the desk and the TV bench each have their own procedures.
- **BILLY** (`billy.ts`) is built on one side with dowels and cam bolts. The back slides into grooves and is nailed along lines marked with a pencil. Door kits (OXBERG, HÖGADAL, HÖGBO), the height extension, the drawer on castors and the foldable table all follow. `combo()` builds wide sets as 40 and 80 cm units through `buildUnits` and then rewrites the step titles.
- **MALM** (`malm.ts`, 3.8k lines) uses only `build` and covers chests of 2 to 4 drawers, the chest of 6, the bed, the ottoman bed and the dressing table. The side panels are compounds that include their factory-fitted runners.
- **PAX** (`pax.ts`) covers the folding frame of 2024: it is stood up, untaped and opened, then gets feet, plinths, corner fittings, the top lifted in from below and the wall fixing. US frames hang on a wall rail. In a row the wall fixing moves to the end. It defines its own `RowJoint`.
- **LACK** (`lack.ts`) uses hanger bolts, angle brackets under the shelf, and a keyhole-plate wall step. **EKET** (`eket.ts`) uses click-together mitred panels, a back locked with clips and wedges, a suspension rail, and pivot doors. **POÄNG** (`poang.ts`) uses bentwood paths and barrel nuts. **HEMNES** spans 6.3k lines across `hemnes.ts` and four `_hemnes-*.ts` helpers, with a `Recipe` class wrapper.
- **SIGFINN** shows that even the smallest file follows the format: a 2-step "unpack it" guide for a product with no manual.

---

## 3. How three.js draws the paper-manual look (`src/engine`)

### 3.1 Architecture
`Stage` (`stage.ts:71`) owns one `WebGLRenderer` (alpha, antialias, pixel ratio capped at 2, at 166-168), an `OrthographicCamera` (75), a `root` group that carries the pose rotation, a soft floor shadow, and DOM overlays: an SVG layer, a label layer and an optional callout. `StageView.tsx` imports the engine with `import("@/engine/stage")` (StageView.tsx:54), so three.js stays out of the first page load, and passes in `plan`, `mode`, `highlight`, `paused` and `speed`. Modes (`stage.ts:10-15`):
- `intro`: parts stacked flat, then flying in on an arc.
- `assembled`: optional turntable, dimension lines and a fixed view.
- `layout`: the parts list laid out on the floor.
- `step`.
- `part`: one part on its own.

The loop runs on `requestAnimationFrame` with `dt` clamped to 0.05 s. It skips frames when an `IntersectionObserver` reports the stage off screen or the tab is hidden (211-220). A 40 ms `setInterval` keeps time in embedded webviews that pause rAF (221-229).

### 3.2 Materials and shading (`materials.ts`)
There are no `THREE.Light`s at all. Faces use a custom shader with a fixed light direction and four flat bands:
```glsl
vec3 L = normalize(vec3(-0.35, 1.0, 0.55));
float shade = d > 0.72 ? 1.0 : (d > 0.18 ? 0.968 : (d > -0.2 ? 0.938 : 0.915));
vec3 c = mix(uColor, uTint, uTintAmt) * shade;
```
(`materials.ts:37-40`). Base colours are near-white per material: board `#ffffff`, fibreboard `#f5f1e8`, wood `#fdfaf4`, metal `#eceef0`, glass a cool `#e9f1f4`, hardware wood `#f1e2c3` (`materials.ts:8-20`). Ink is `INK #141414` and older ink is `INK_OLD #94918b`. New parts are tinted toward `TINT_NEW #fff3c4` (4-6). Faces use `polygonOffset` so lines win the depth test (54-56), and are transparent so they can fade.

### 3.3 Edges and outlines (`drawable.ts`, `materials.ts`)
- **Creases.** Each geometry gets `new LineSegmentsGeometry().fromEdgesGeometry(new THREE.EdgesGeometry(geo, 30))` (`drawable.ts:30`), drawn with `LineSegments2` and `LineMaterial({ worldUnits: false })`. Lines are 1.6 px wide by default and stay the same width at any zoom (`materials.ts:94-103`).
- **Silhouettes of curved shapes** (cylinders, spheres, cushions) use an *inverted hull*: a `BackSide` copy of the mesh whose vertices are pushed outward in clip space by `uWidth` px along a projected `hullDir` attribute (`materials.ts:61-92`). `clip.xy += dir * uWidth * 2.0 / uRes * clip.w;` keeps the outline a constant number of pixels wide. There are three `hullDir` variants. `radial` points away from the centre. `cyl` is diagonal at the rims, `(rx, ±0.35, rz)`, so sides and caps both outline (123-142). `box` follows the gradient of a superellipsoid with k = 7, so the flat faces of a rounded cushion push straight out (145-164).
- **Soft parts** (cushions, mattresses) are extruded rounded boxes with `edges: false`, so they show only a silhouette and no crease lines. That is the upholstered look (`drawable.ts:114-115, 189-205`).
- **Holes** are drawn as 14-segment thin circles on the face, 0.35 mm proud of the surface, and only if they lie within the part's bounds plus 3 mm: "a hole recorded off it would float in the air" (`drawable.ts:119-151`).
- **Geometry cache.** `geoCache` is keyed by `box:${x}:${y}:${z}` and similar strings, so identical panels and fittings share one BufferGeometry and one edge set (`drawable.ts:24-35`).

### 3.4 Fitting models (`hwDrawable`, `drawable.ts:215-372`)
Every fitting is modelled along +Y with its origin on the surface it goes into, and "Everything below y = 0 ends up inside the panel" (211-214). At load the holder is turned so model −Y points along `dir` (`holder.quaternion.setFromUnitVectors(new THREE.Vector3(0,-1,0), dir)`, `stage.ts:315`), then rolled by `twist`. Examples:
- A dowel is a cylinder offset by `len/2 - 12`, "seated 12 mm deep, like real face-drilled holes, so it never shows through a 15 mm panel" (220-223).
- A cam bolt is a thread, a neck and a ball head.
- A cam lock is a body with a slot and a small cone arrow (229-233).
- A screw is a shank, a tip cone, a head and two boxes for the cross slot.
- A bolt is a shaft, a head and a hex socket.
- A hinge is a cup, a flange, an arm and a plate.
- Castors, gas lifts, rollers, hooks, clamps, angle brackets and the rest are simple stacks of primitives.

### 3.5 Camera, framing and drag-to-rotate
The camera is orthographic. The default view is az 0.62, el 0.46 radians (`stage.ts:106-107`). `layout` mode looks almost straight down (az 0.22, el 1.0) and `part` mode uses az 0.7, el 0.5. The turntable adds `sin(t/3.2)·0.32`, eased in so it starts from still (`camAngles`, 896-913).

Framing (`updateCamera`, 915-1041) projects every corner of the current scene's boxes onto the camera's right and up axes and fits them inside per-mode margins. In step mode it keeps space at the top for the step number and fittings box (sized from `cornerItems`), and on the right for the callout circle. It tries alternative layouts, such as starting below or to the right of the fittings box, or keeping clear under the circle, and picks the one with the biggest scale (985-1002). Target and size are damped with `1 - exp(-dt·4.2)`.

Pointer handling (`bindPointer`, 1371-1434):
- Dragging changes `userAz` (dx·0.0075) and `userEl` (dy·0.005, clamped to −0.4…0.95).
- Pinch zooms between 0.35 and 2.5. The wheel zooms only on ctrl-wheel (trackpad pinch) or larger deltas.
- Double-click resets the view. After a mode change, `autoReset` eases user offsets back to 0.
- Hovering raycasts against parts and shows a tooltip with the part's letter and name (1437-1455).

### 3.6 Poses and turning the model over
Each step's `pose` sets the root quaternion. On a change the root slerps from the current pose over `poseDur(angle) = clamp(0.45 + 0.32·angle, 0.6, 1.2)` seconds with ease-in-out (`stage.ts:35, 668-687`). The step's clock starts negative, at `-min(0.75, 0.7·poseDur)`, so parts wait until the turn is mostly done (`setMode`, 463-466). Every frame the root is **re-grounded** on the floor and centred on its rotated extents (689-701). Whether the model lies on its back, sits upside down or lies on its side for that step, it always rests on the floor with its shadow under it.

### 3.7 Animating a step
`prepareMode` (516-589) works out each visible part's start and end transforms once per step (`stepXf`). A part is visible only if its current state's scene equals the step's scene. That is how sub-assemblies replace the carcass on screen, and a scene change triggers a 460 ms opacity dip (`flash`, 505-509).

Inside `updateItems` (736-872):
- **New parts** take `pos = fin + from·(1 - easeLand(k))`, with `easeLand = 1-(1-x)^3` ("a long soft landing"). They fade in over 0.3 s and can spin about local Y while they approach (legs screwing in) (762-779). A part with an earlier state in the same scene lerps and slerps from that state instead (766-769).
- **Style.** New parts are drawn in black ink, tinted 0.34 toward yellow and fading to 0.24 after landing, with 2.2 px lines. Parts from earlier steps are drawn in grey `INK_OLD` with 1.5 px lines and no tint (779, 783). Hover or highlight raises the tint to about 0.7. This is the manual convention of "new part dark, old parts faint".
- **Fittings**: `inner.position = (0, travel·(1-e), 0)`. A fitting starts `travel` mm back along its axis and slides in while it rotates `spin·2π·e`. A cam then twists by `turn` (135°) over `CAM_TURN = 0.62 s` (847-855). A fitting is visible if its parent part is visible. In assembled mode the wall-step fittings are hidden (840-843).
- **Looping**: a step lasts `stepEnd + HOLD 2.4 s + FADE 0.35 s`. The new items fade out and the step replays (633-639). `replay()` resets the clock.
- **Carry-over.** On every mode change, each node's current transform is captured and blended into its new target over 0.42 s, so nothing caught mid-move snaps into place (454-459, 875-882).
- **Intro**: parts start in a stack, biggest at the bottom, each laid flat on its thinnest axis (`flatQuat`/`computeArrangements`, 392-447). They fly to their final positions in order of their final step, on an arc `y += sin(πe)·260` (796-798). When they land, the stage switches itself to the assembled turntable with dimension lines.

### 3.8 Overlays (SVG and DOM)
- **Arrows**: for a part flying in with an offset longer than 60 mm, a thick filled "IKEA style arrow" is drawn from `fin + 1.12·from` to `fin + 0.42·from`. It fades in and out with progress and is deduplicated by offset and delay (1103-1126). `arrowPath` (1493-1510) builds it as a polygon. The CSS fills it with ink and adds a 2.5 px white stroke halo (`globals.css:169-176`).
- **Letters**: when a part *type* first appears (`typeFirst === step`), a pill label with its letter (`stage-label`, a 30 px circle with a 1.6 px ink border) appears at the part's projected centre once 55% of its flight is done (1127-1135). In `layout` mode each label adds a count such as `2×` (1138-1149). Labels are escaped (`esc`, 8) because part names can come from shared scan links.
- **Counts per step** ("2×") come from the UI rather than the engine. `GuideApp.tsx:851-858` draws up to 4 `HwArt` icons with `{count}×` in the corner box, from `stepContents()` (`contents.ts:37-61`). The engine only reserves room for that box (`cornerItems`). The step number shows the `repeat` count when it is above 1. `PartsPanel` can draw fittings at actual size (`HwArt pxPerMm`, `canActualSize`).
- **Square check** (`check: "square"`): two dashed diagonals with double arrowheads grow from the middle across the back face, with an "=" in a circle at the centre (1194-1219).
- **Wall**: when `step.wall`, a grey 40 mm wall slab fades in behind the product (595-608, 866-871).
- **Dimensions** on the cover: three dimension lines with extension lines, arrowheads that grow in, and "77 cm" style labels from `spec.size`. The 9 SVG nodes are built once and only their attributes change (1222-1283).

### 3.9 The close-up callout ("how far it goes in")
With `callout: true` (the guide page), the stage builds a second `WebGLRenderer` inside a circular div with an ink ring (`makeCallout`, 240-262; `globals.css:251-261`). For each step it picks the **earliest fitting that travels** as the focus. The half-size is 55 mm for runners and hinges, 50 for brackets, knobs and handles, otherwise `clamp(max(len, 2·dia)·0.72, 17, 55)` (551-566). Each frame (`renderCallout`, 1285-1367):
- It renders the *same scene* with a second orthographic camera aimed at the fitting's world position. The view direction blends the fitting's axis with the main camera direction (`dirW·0.85 + camDir·0.55`).
- The camera sits 900 mm back with `near = 900 - max(120, 2.2·half)`. **The near plane works as a section cut**, dropping any geometry more than about 120 mm in front of the fitting so the panel being drilled is not hidden.
- The floor shadow is hidden for this render.
- It draws an insertion arrow along the axis and, for spinning or turning fittings, a curved `arcArrow` (1521-1536).
- A leader line with a dot links the spot on the main drawing to the edge of the circle.

Together with dowels modelled 12 mm deep and screws whose shank runs below the surface, this close-up shows how far a fitting goes in.

### 3.10 Two people and poses in the UI
The engine draws no human figures. Two-person handling lives in the plan data: `Step.people` and the `"two"` warning, set by builders for heavy lifts (for example `people: big ? 2 : 1` for units 1100 mm or larger, `kallax.ts:215-221`). The UI turns it into a "Grab a second person" callout with `TwoPeople` art, a "Heads up: step N needs a second pair of hands" note two steps ahead (`StepPanel.tsx:44, 162-165`), and the cover's "Ask someone to help with step …" (`CoverPanel.tsx:118-124`). Poses (lying down, upside down) show only through the model turning over (3.6) and the step's wording.

---

## 4. Thumbnails (`thumbs.ts`, `Thumb.tsx`, `Drawing.tsx`)
- **One shared offscreen Stage** is imported lazily (`thumbs.ts:16-25`). It lives in a hidden 10×10 div at `left:-9999px`, with `{ offscreen: true, loop: false, labels: false }` and `preserveDrawingBuffer` set so `toDataURL` works, at pixel ratio 2. One WebGL context renders every thumbnail on the site, which stays under the browser's limit on contexts.
- **Serial FIFO queue** (`pump`, 27-47): `setPlan` (a no-op when the plan is the same, so step thumbnails reuse the same drawables), then `setMode(mode, {instant:true})`, which ticks with dt = 0 so every animation is at its end state, then `snapshot(w,h)` returns a PNG data URL. After each job it yields for 8 ms. Results are cached by `id:JSON(mode):wxh`. Offscreen mode draws lines 1.15× wider (718) and uses margins of 7% of the image (960-962).
- **Cancelling.** `requestThumbnail` returns a function that removes the caller's callback and, if nobody else is waiting, takes the job off the queue, so "a long grid scrolled past quickly doesn't render every card" (`thumbs.ts:67-93`). `Thumb.tsx` uses an `IntersectionObserver` with `rootMargin: "200px"` for `lazy` thumbnails and reads the cache synchronously after mount (Thumb.tsx:32-56).
- **Catalog lists use no WebGL.** `Drawing.tsx` loads `/og/{slug}.png`, drawn ahead of time by `scripts/og/render.mjs`. That script runs the same engine in headless Chromium (SwiftShader) at `/dev/og`, then flattens each image onto white and quantises it to 48 colours with ffmpeg: "line art stays crisp at a sixth of the size". `HeroStage.tsx` cycles six catalog plans in `intro` mode and moves to the next 3.2 s after `onIntroDone` (HeroStage.tsx:12-45).

---

## 5. Validation, performance and notable algorithms

**Validation in the generator**
- `PlanBuilder.build` throws for parts that were never added. `step_` throws for an add or fit outside a step. `partItem` checks that a key is a part (`builder.ts:236, 291, 403`).
- `custom.ts` clamps AI-supplied fitting sizes (`len` 2-400, `dia` 0.8-60, at 208-210) and counts (1-48), guarantees every part is added exactly once (`normalizeSteps`), keeps parts arriving along their dowels (`arrive`), and nudges overlapping fittings apart (`emit`).
- Holes that fall off their part are not drawn.
- `scripts/ikea/check.ts` (the `ikea:check` script) builds every catalog product. It fails if a product throws, has no steps or parts, has a non-finite number, has a part outside the product size (`fits()`, 33-46), has a size out of range, or has a duplicate or changed slug. It also asserts search results (`expect("kallax", "kallax-2x2")`).
- `docs/manual-sweep.md` mentions a check for impossible moves, sliding across dowels or "screws or bolts that end in thin air", run on 29 Oct. That check script is not in the repo as far as I found. Only its fixes in `arrive()` and in the family files are.

**Performance**
- `buildPlan` is memoised by `JSON.stringify(spec)` in an unbounded Map. `stepContents` is memoised in a WeakMap.
- Geometry and edges are shared through `geoCache`. Per-step transforms are computed once in `stepXf`.
- Overlay DOM is reused, and innerHTML is compared before it is written (1183, 1365).
- The stage pauses when off screen or when the tab is hidden, and the engine is imported on demand.
- One shared thumbnail context. Pre-rendered PNGs for catalog lists.
- Weaknesses: the callout renders the whole scene a second time, in a second context, every frame. `setRes` walks every line material twice per frame when the callout is on. The family files sit in a client chunk of about 1.5 MB gzipped (`docs/manual-sweep.md`, "To do next").

**Clever pieces**
- Hardware is modelled from the surface inward, so the same item serves both the animation (slide `travel` mm along −dir) and the close-up "depth".
- Pose as "which axis is up", combined with automatic re-grounding.
- The `entry()` march places the mate's hole where the fitting actually enters it.
- The near-plane section cut in the callout.
- The superellipsoid `hullDir` for cushion outlines.
- Letters skip I, O and Q.
- Minutes are shared out from structural weights.
- Builders build at y = 0 and lift afterwards (underframes, castors).
- Row building turns one manual into N frames with preset fittings and a single anchor step at the end.

**Small code smells I noticed**
- The `stage()` doc comment sits above `entry()` instead (`builder.ts:319-320`).
- `kallax.ts:420` says "the custom builder takes ten fittings a step", but `custom.ts:322` slices to 24 entries.
- Leftover `void aspect; void dpr; void ns;` in `stage.ts`.
- In recipe steps where a part both takes PRE dowels and is added, the dowels are emitted *before* the part's arrival delay (`custom.ts:417-426`). The part is still at opacity 0 at its approach offset, so by my reading the dowels slide into an invisible part for about 0.75 s before it fades in and carries them home. I have not checked this at runtime.

---

## 6. Walk-through: KALLAX 2x2 (`kallax-2x2`)

### 6.1 Spec
The hand-checked entry is `src/lib/catalog.ts:25-40`:
```ts
{ slug: "kallax-2x2", name: "KALLAX", variant: "Shelving unit, 2 × 2", category: "Shelving unit", archetype: "shelf",
  size: { w: 77, h: 77, d: 39 }, minutes: 40, people: 1, difficulty: 1, material: "Particleboard",
  shelf: { style: "grid", cols: 2, rows: 2, outer: 40, inner: 16, back: false }, ... }
```
`toSpec` (catalog.ts:513-537) drops the catalog-only fields, keeps `slug`, and adds `source: "catalog"`, `variants` and `siblings`.

### 6.2 Dispatch
`buildPlan` has no `row`, so it calls `buildOne` and then `buildFamily`. `familyOf` gives "KALLAX", and `kallax.family.build` runs (`kallax.ts:738-760`). The slug is not desk or TV bench, so `gridOf(s)` runs (39-51) and gives:
- W = H = 770, D = 390, U = 0, T = 40, ti = 16.
- `lying = W > H + 50` is false, so ct = rt = 2.
- `pattern` is `"small"`: it is not a single column, has fewer than 4 columns and more than one row.

`frameRecipe` produces the recipe, `buildCustom` interprets it, and `wallStep` adds a final `PlanBuilder` step. There is no underframe, and there are no inserts (`/with doors/` does not match and `inserts` is unset).

### 6.3 Geometry and parts
cellW = cellH = (770 − 80 − 16)/2 = **337**. rowTop(1) = 730, rowTop(2) = 377, shelfY(1) = 385, divX(1) = 0. Bolts and dowels sit at z = ±(195 − 75) = ±120 (`zs`, 87).

| Recipe id | Name | Size (mm) | Position | Displayed letter |
|---|---|---|---|---|
| A | Top and bottom (top) | 770×40×390 | (0, 750, 0) | **A** |
| D | Top and bottom (bottom) | 770×40×390 | (0, 20, 0) | **A** |
| B | Side panel | 40×690×390 | (−365, 385, 0) | **B** |
| C | Side panel | 40×690×390 | (365, 385, 0) | **B** |
| V1_1 | Divider (upper row) | 16×337×390 | (0, 561.5, 0) | **C** |
| V2_1 | Divider (lower row) | 16×337×390 | (0, 208.5, 0) | **C** |
| S1 | Shelf | 690×16×390 | (0, 385, 0) | **D** |

Shared names and sizes collapse to 4 PartTypes (`custom.ts:276`). Letters follow first appearance: top and side in step 1, divider in step 2, shelf in step 3 (`builder.ts:413-421`). The recipe's internal ids are not the displayed letters. The recipe's "D" (bottom) shows as A, and its "C" (other side) shows as B.

### 6.4 The 11 steps as the code produces them
All steps are in scene `"main"` with 1 person. Poses come from the recipe and carry forward (`custom.ts:323`). Minutes come from the weights in `builder.ts:427-437`, which spread spec.minutes = 40 over the steps. "Kind" and "tools" are what `buildCustom` infers.

| # | Title (verbatim) | Pose | Parts added | Fittings | Kind / tools / extras | Min |
|---|---|---|---|---|---|---|
| 1 | Bolt the top to a side | +z (on its back) | top A, side B | 2× Allen bolt 7×80 on the top at (−365, 770, ±120), driven down into side B | bolts; allen; warning "floor" | 5 |
| 2 | Tap dowels into a divider and push it onto the top | +z | upper divider | 2× wooden dowel 8×30 in the divider's top edge (0, 730, ±120), mating with the top | dowels; hammer | 4 |
| 3 | Slide in a shelf | +z | shelf | 2× dowel in the shelf's left end (−345, 385, ±120), dir +x, mating with side B | dowels; hammer | 4 |
| 4 | Tap dowels into the shelf for the next row | +z | none | 2× dowel in the shelf underside (0, 377, ±120), dir +y | dowels; hammer | 2 |
| 5 | Push in the next divider | +z | lower divider | none | join | 3 |
| 6 | Tap dowels into the open ends | +z | none | 2× dowel in the shelf's right end (345, 385, ±120), mating with side C; 2× dowel in the lower divider's bottom (0, 40, ±120), mating with the bottom | dowels; hammer | 3 |
| 7 | Slide on the other side | +z | side C | none | join | 3 |
| 8 | Bolt on the bottom | +z | bottom D | 6× Allen bolt 7×80: 2 bottom-to-B, 2 bottom-to-C at y = 0, 2 top-to-C at y = 770 | bolts; allen; `check: "square"` diagonals | 5 |
| 9 | Stick the felt pads under it | +z | none | 4× felt pad Ø22 under the bottom at (±345, 0, ±155) | general | 3 |
| 10 | Stand it up | +y | none | none | standup; the model turns upright | 2 |
| 11 | Fix it to the wall | +y | none | 2× wall bracket under the top at (±285, 730, −179); 4× screw 3.5×14; 2× wall plug 8×35 (not incl.); 2× screw 5×50 (not incl.); 2× cover cap | anchor, `wall: true`; screwdriver, drill, pencil, level; warnings wall, tip | 5 |

The detail lines are verbatim from `kallax.ts`. For example, step 1 says "Stand both on their long edges on a rug, with the holes facing in. Turn the bolts in with the Allen key, not too tight yet." Step 8 says "Turn it up onto the dowels and bolt it on. Then bolt the other side to the first panel, and tighten everything." Step 11 says "Screw the brackets under the top at the back, hook them onto screws in the wall and snap the covers on. Wall screws aren't included: pick ones made for your wall."

**Arrival directions** in the model frame, worked out from `approach`/`arrive`:
- Step 1: the top drops from world-above. The code computes `unrotate([0,346.5,0], POSE_EULER["+z"]) = [0,0,346.5]`. Side B slides in from −y, toward the top.
- Steps 2 and 5: each divider arrives from −y, 240 mm out. The pin check confirms the upper divider moves along its dowels.
- Step 3: the shelf comes from +x, 310 mm out, so its dowelled end goes into side B.
- Step 7: side C *would* arrive from −y, because its longest contact is with the top. The shelf-end dowels from step 6 point along x, so `arrive()` re-routes it to **+x** along those dowels. This is the impossible-move rule at work.
- Step 8: the bottom comes from −y, 346 mm out, which agrees with the divider's bottom dowels.

**Plan totals:**
- Parts: A ×2, B ×2, C ×2, D ×1 (7 panels).
- Included fittings: Allen bolt 7×80 ×8, wooden dowel 8×30 ×10, felt pad ×4, wall bracket ×2, screw 3.5×14 ×4, cover cap ×2.
- Not included, listed last: wall plug ×2, wall screw ×2.
- Tools: Allen key (included), screwdriver, hammer, drill (optional), pencil (optional), level (optional), knife (optional).
- Step minutes add up to 39 because of rounding.

**On screen.** The model lies on its back for steps 1 to 9, drawn in grey ink with each new panel in black and yellow. Letters A and B appear in step 1, C in step 2 and D in step 3. Each step with fittings shows the circular close-up on its first moving fitting: bolt, dowel or felt pad, and the bracket in step 11. The corner box shows counts such as "2×" or "6×". Step 8 draws the dashed "measure the diagonals" overlay. Step 10 turns the model upright. Step 11 fades a wall in behind it, and plugs and screws come out of the wall plane. The home hero also plays this plan in `intro` mode, ending on the turntable with "77 cm" dimension lines.
