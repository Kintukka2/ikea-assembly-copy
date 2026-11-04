import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, PartPiece, ProductSpec, Vec3 } from "../../types";
import { boxOf } from "../custom";

/**
 * Kmart's Linen Look fabric drawer chests (anko), read from their assembly manuals. Both are frames of square steel
 * tube bolted together with the hex key from the box, under a board top, with fabric drawers that fold out of a flat
 * sleeve and take a base board in the bottom. The drawers run on steel rails hooked into slots in the posts: rails of
 * one hand on the left wall of every bay, the other hand on the right wall. Both manuals say to leave the bolts loose
 * until the frame is finished.
 *
 * - 8 Drawer Chest, Beige (43706297): three ladder frames, each in two halves joined by a sleeve (H) in each post: the
 *   left end frame (A over B), the right end frame (C over D) and the middle frame (E over the loose posts L and M).
 *   Four rails (e) hook onto the left frame, four (f) onto the right one and four of each onto the middle frame. Two
 *   long rails (K) join the three frames at the floor, the top (I) bolts onto them, four feet screw into the end frames
 *   and a cross brace (J) bolts across the back of one bay. Each of the eight drawers (F) takes a base board (G), they
 *   slide in, and two straps tie the chest to the wall. Kmart's hardware: 16 short bolts M6 x 10 (a), 12 long bolts
 *   M6 x 22 (b), 4 adjustable feet (c), a hex key (d), 8 rails of each hand (e, f), 2 wall fixing sets of a plug, a
 *   washer and a screw (g) and 2 straps (h).
 * - 5 Drawer Chest, Beige (43705788): three drawers over two big ones. The two middle rails (D) and the two bottom rails
 *   (G) are joined by the short middle posts (E, F), two U-shaped divider frames (C) stand on the middle rails, the end
 *   frames (A, B) bolt onto the rails' ends, five rails of each hand (d, e) hook in, the top (H) bolts on and the feet
 *   screw in. Three small drawers (I, base board J) and two big ones (K, base board L). Kmart's hardware: 24 bolts
 *   M6 x 22 (a), 4 adjustable feet (b), 5 rails of each hand (d, e), 2 wall fixing sets (f), 2 straps (g), a hex key (h).
 *
 * Readings the drawings leave open, and the ones chosen:
 * - Left and right: both panel layouts draw A on the left, so A is the left end and its rails (e on both chests) are the
 *   hand for the left wall of a bay. The 8 drawer chest's middle frame takes four of each: the guide puts f on the side
 *   facing the left frame and e on the side facing the right one, like the end frame that looks the same way.
 * - The 8 drawer chest's panel layout draws post L behind M, so L is the middle frame's back post. The long rails (K)
 *   run under the middle frame's posts, and step 7 bolts up through each rail into a post.
 * - Its step 9 is drawn from behind, so the cross brace sits across the back of the right-hand bay, seen from the front.
 * - Sizes: neither manual prints one. The 5 drawer chest is Kmart's listing, 54 H x 100 W x 30 D. The 8 drawer chest's
 *   old row was 86 wide and 99 tall, but the manual draws it clearly wider than tall, so the row is 99 wide, 86 tall.
 *
 * Part numbers and hardware letters are Kmart's own, so the guide reads against the paper.
 */

type Fx = Omit<CustomFix, "count" | "at"> & { at: Vec3[] };
type Def = Omit<Fx, "at" | "dir" | "on" | "mate">;
const fx = (f: Fx): CustomFix => ({ ...f, count: f.at.length });
const SX = [-1, 1] as const;

const TU = 20; // square tube of the frames
const T = 15; // the top board
const FOOT = 15; // the adjustable feet under the end frames
const OUT = 600; // the drawers are folded out this far in front of the chest

const bolt = (len: number, name: string): Def => ({ kind: "bolt", len, dia: 6, name });
const foot = (): Def => ({ kind: "foot", len: FOOT, dia: 24, name: "Adjustable foot" });
// a bay's two drawer rails are mirror images: the left-hand one hooks onto the bay's left wall
const rail = (len: number, name: string): Def => ({ kind: "runner", len, dia: 20, name });

/** A part drawn as pieces placed where they sit in the finished chest, centred on their bounding box. */
function compound(id: string, label: string, name: string, abs: PartPiece[]): CustomPart {
  const boxes = abs.map((p) => boxOf(p));
  const lo = [0, 1, 2].map((k) => Math.min(...boxes.map((b) => b.min[k])));
  const hi = [0, 1, 2].map((k) => Math.max(...boxes.map((b) => b.max[k])));
  const pos: Vec3 = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2];
  const size: Vec3 = [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]];
  return { id, label, name, size, pos, material: "metal", pieces: abs.map((p) => ({ ...p, pos: [p.pos[0] - pos[0], p.pos[1] - pos[1], p.pos[2] - pos[2]] as Vec3 })) };
}

const post = (x: number, y0: number, y1: number, z: number): PartPiece => ({ shape: "box", size: [TU, y1 - y0, TU], pos: [x, (y0 + y1) / 2, z] });
const bar = (x: number, y: number, len: number): PartPiece => ({ shape: "box", size: [TU, TU, len], pos: [x, y, 0] });

/** A fabric drawer folded out: a floor and four walls of fabric, with the pull sewn on the front. */
function fabric(w: number, h: number, d: number): PartPiece[] {
  const t = 2;
  return [
    { shape: "box", size: [w, t, d], pos: [0, -h / 2 + t / 2, 0] },
    ...SX.map((s): PartPiece => ({ shape: "box", size: [w, h, t], pos: [0, 0, s * (d / 2 - t / 2)] })),
    ...SX.map((s): PartPiece => ({ shape: "box", size: [t, h, d - 2 * t], pos: [s * (w / 2 - t / 2), 0, 0] })),
    { shape: "box", size: [Math.min(120, w * 0.3), 16, 6], pos: [0, h * 0.18, d / 2 + 3] },
  ];
}

interface Drawer {
  f: CustomPart; // the fabric drawer
  g: CustomPart; // its base board
}

/** A drawer and its board, in a bay `w` wide centred on x, its bottom at y. */
function drawer(id: string, labels: [string, string], names: [string, string], x: number, y: number, w: number, h: number, D: number): Drawer {
  const d = D - 20;
  const z = D / 2 - 5 - d / 2;
  const dw = w - 4;
  return {
    f: { id: `${labels[0]}${id}`, label: labels[0], name: names[0], size: [dw, h, d], pos: [x, y + h / 2, z], material: "soft", pieces: fabric(dw, h, d) },
    g: { id: `${labels[1]}${id}`, label: labels[1], name: names[1], size: [dw - 8, 3, d - 8], pos: [x, y + 2 + 1.5, z], material: "fiber" },
  };
}

/** A strap round the top of each end frame's back post, screwed to the wall through a washer into a plug. */
function wallFix(xs: number, y: number, D: number, zWall: number, on: [string, string]): CustomFix[] {
  const x = SX.map((sx) => sx * xs);
  const yw = y + 40;
  return [
    ...SX.map((sx, i) => fx({ kind: "strap", len: 110, dia: 20, name: "Wall strap", at: [[x[i], y, -D / 2]], dir: [0, 0, 1], on: on[i] })),
    fx({ kind: "plug", len: 30, dia: 6, name: "Wall plug", included: true, at: x.map((xx): Vec3 => [xx, yw, zWall - 2]), dir: [0, 0, -1] }),
    fx({ kind: "washer", len: 1.5, dia: 12, name: "Washer", at: x.map((xx): Vec3 => [xx, yw, zWall + 4]), dir: [0, 0, -1] }),
    fx({ kind: "screw", len: 40, dia: 4, name: "Wall screw", included: true, at: x.map((xx): Vec3 => [xx, yw, zWall + 4]), dir: [0, 0, -1] }),
  ];
}

/* ---------- 8 Drawer Chest ---------- */

function eight(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const xs = W / 2 - 5 - TU / 2; // middle of an end frame
  const xi = xs - TU / 2; // its inside face
  const zp = D / 2 - TU / 2; // front and back posts
  const yT = H - T; // underside of the top, the top of every frame
  const yJ = Math.round(0.47 * H); // where the two halves of a frame meet
  const yK = FOOT + TU / 2; // the long bottom rails, level with the end frames' bottom bars
  const y0 = yK + TU / 2; // top of the bottom rails, where the middle frame's posts stand
  const pitch = (yT - TU - y0) / 4;
  const yRail = [0, 1, 2, 3].map((i) => y0 + 12 + i * pitch); // each level of drawer rails, from the bottom
  const BOLT_A = bolt(10, "Short bolt"), BOLT_B = bolt(22, "Long bolt"), FOOT_C = foot();
  const RAIL_E = rail(D - 2 * TU, "Left-hand drawer rail"), RAIL_F = rail(D - 2 * TU, "Right-hand drawer rail");

  const upper = (x: number) => [bar(x, yT - TU / 2, D), ...SX.map((sz) => post(x, yJ, yT - TU, sz * zp))];
  const lower = (x: number) => [...SX.map((sz) => post(x, FOOT, yJ, sz * zp)), bar(x, yK, D - 2 * TU)];
  const parts: CustomPart[] = [
    compound("A", "A", "Left frame, top half", upper(-xs)),
    compound("B", "B", "Left frame, bottom half", lower(-xs)),
    compound("C", "C", "Right frame, top half", upper(xs)),
    compound("D", "D", "Right frame, bottom half", lower(xs)),
    compound("E", "E", "Middle frame, top half", upper(0)),
    { id: "L", label: "L", name: "Back post of the middle frame", size: [TU, yJ - y0, TU], pos: [0, (yJ + y0) / 2, -zp], material: "metal" },
    { id: "M", label: "M", name: "Front post of the middle frame", size: [TU, yJ - y0, TU], pos: [0, (yJ + y0) / 2, zp], material: "metal" },
  ];
  // a joiner inside each post where its two halves meet
  const joints = [
    { h: "H1", x: -xs, z: -zp, up: "A", down: "B" },
    { h: "H2", x: -xs, z: zp, up: "A", down: "B" },
    { h: "H3", x: xs, z: -zp, up: "C", down: "D" },
    { h: "H4", x: xs, z: zp, up: "C", down: "D" },
    { h: "H5", x: 0, z: -zp, up: "E", down: "L" },
    { h: "H6", x: 0, z: zp, up: "E", down: "M" },
  ];
  for (const j of joints) parts.push({ id: j.h, label: "H", name: "Joiner", size: [TU - 6, 70, TU - 6], pos: [j.x, yJ, j.z], material: "metal" });
  parts.push(
    { id: "KB", label: "K", name: "Long bottom rail", size: [2 * xi, TU, TU], pos: [0, yK, -zp], material: "metal" },
    { id: "KF", label: "K", name: "Long bottom rail", size: [2 * xi, TU, TU], pos: [0, yK, zp], material: "metal" },
    { id: "I", label: "I", name: "Top", size: [W, T, D], pos: [0, yT + T / 2, 0], material: "board" },
  );
  // the cross brace: two flat bars across the back of the right-hand bay, from the middle frame to the right frame
  const yHi = yT - TU - 40, yLo = y0 + 40;
  const zJ = -D / 2 - 4;
  const ang = Math.atan2(xs, yHi - yLo), len = Math.hypot(xs, yHi - yLo);
  parts.push(compound("J", "J", "Cross brace", SX.map((k): PartPiece => ({ shape: "cyl", size: [8, len, 8], pos: [xs / 2, (yHi + yLo) / 2, zJ], rot: [0, 0, k * ang] }))));
  // the drawers: two bays of four
  const bay = xi - TU / 2;
  const dh = pitch - 25;
  const drawers = SX.flatMap((sx, c) => yRail.map((y, r) => drawer(`${c}${r}`, ["F", "G"], ["Fabric drawer", "Drawer base board"], (sx * (xi + TU / 2)) / 2, y + 10, bay, dh, D)));
  for (const d of drawers) parts.push(d.f, d.g);
  const fIds = drawers.map((d) => d.f.id), gIds = drawers.map((d) => d.g.id);
  const all = drawers.flatMap((d) => [d.f.id, d.g.id]);

  /* ---- fittings ---- */
  // a short bolt through each post either side of a joint, from the outside of the end frames (the left of the middle one)
  const jointBolts = (list: typeof joints) =>
    list.flatMap((j) => {
      const sd = j.x > 0 ? 1 : -1;
      const x = j.x + (sd * TU) / 2;
      return [fx({ ...BOLT_A, at: [[x, yJ + 25, j.z]], dir: [-sd, 0, 0], on: j.up, mate: j.h }), fx({ ...BOLT_A, at: [[x, yJ - 25, j.z]], dir: [-sd, 0, 0], on: j.down, mate: j.h })];
    });
  // four rails on a face that looks into a bay along `look`, on the half of the frame at each height; lip on top
  const rails = (def: Def, x: number, look: 1 | -1, up: string, down: string): CustomFix[] =>
    [down, up].map((on, k) => fx({ ...def, at: yRail.filter((y) => (y > yJ) === (k === 1)).map((y): Vec3 => [x, y, 0]), dir: [-look, 0, 0], ...(look < 0 ? { twist: Math.PI } : {}), on }));
  const kFix = [
    ...SX.flatMap((sx) => SX.map((sz) => fx({ ...BOLT_B, at: [[sx * (xs + TU / 2), yK, sz * zp]], dir: [-sx, 0, 0], on: sx < 0 ? "B" : "D", mate: sz < 0 ? "KB" : "KF" }))),
    ...SX.map((sz) => fx({ ...BOLT_B, at: [[0, yK - TU / 2, sz * zp]], dir: [0, 1, 0], on: sz < 0 ? "KB" : "KF", mate: sz < 0 ? "L" : "M" })),
  ];
  const topBolts = (
    [
      [-xs, "A"],
      [0, "E"],
      [xs, "C"],
    ] as const
  ).map(([x, on]) => fx({ ...BOLT_B, at: SX.map((sz): Vec3 => [x, yT - TU, sz * (zp - 70)]), dir: [0, 1, 0], on, mate: "I" }));
  const feet = SX.map((sx) => fx({ ...FOOT_C, at: SX.map((sz): Vec3 => [sx * xs, FOOT, sz * zp]), dir: [0, 1, 0], on: sx < 0 ? "B" : "D" }));
  const braceBolts = (
    [
      [0, yHi, "E"],
      [0, yLo, "L"],
      [xs, yHi, "C"],
      [xs, yLo, "D"],
    ] as const
  ).map(([x, y, mate]) => fx({ ...BOLT_A, at: [[x, y, zJ - 4]], dir: [0, 0, 1], on: "J", mate }));
  const out = (ids: string[], v: Vec3 = [0, 0, OUT]) => Object.fromEntries(ids.map((id) => [id, v]));

  const steps: CustomStep[] = [
    {
      title: "Join the two halves of the left frame",
      detail: "Push a joiner (H) into the top of each post of the bottom half (B) and press the top half (A) down over them. A short bolt (a) goes through the post either side of each joint. Leave every bolt loose for now.",
      add: ["B", "H1", "H2", "A"],
      from: { B: [-450, 0, 0], H1: [0, 240, 0], H2: [0, 240, 0], A: [0, 380, 0] },
      fix: jointBolts(joints.slice(0, 2)),
      tools: ["allen"],
      warnings: ["loose"],
    },
    {
      title: "Hook four rails onto the left frame",
      detail: "Rails (e) go on the inside of the frame, one at each level, the ledge facing in. Push the hook at each end into the slot in the post.",
      fix: rails(RAIL_E, -xi, 1, "A", "B"),
    },
    {
      title: "Join the two halves of the right frame",
      detail: "The same way: a joiner (H) into each post of the bottom half (D), the top half (C) over them, and four short bolts (a).",
      add: ["D", "H3", "H4", "C"],
      from: { D: [450, 0, 0], H3: [0, 240, 0], H4: [0, 240, 0], C: [0, 380, 0] },
      fix: jointBolts(joints.slice(2, 4)),
      tools: ["allen"],
      warnings: ["loose"],
    },
    {
      title: "Hook four rails onto the right frame",
      detail: "Rails (f) this time, on the inside of the frame, one at each level.",
      fix: rails(RAIL_F, xi, -1, "C", "D"),
    },
    {
      title: "Build the middle frame",
      detail: "Push a joiner (H) into the top of the two loose posts, L at the back and M at the front, press the top half (E) over them and fit four short bolts (a).",
      add: ["L", "M", "H5", "H6", "E"],
      from: { L: [0, 0, -420], M: [0, 0, 420], H5: [0, 240, 0], H6: [0, 240, 0], E: [0, 380, 0] },
      fix: jointBolts(joints.slice(4)),
      tools: ["allen"],
      warnings: ["loose"],
    },
    {
      title: "Hook rails onto both sides of the middle frame",
      detail: "Four rails (f) on the side that faces the left frame and four (e) on the side facing the right one, at the same four heights as on the end frames.",
      fix: [...rails(RAIL_F, -TU / 2, -1, "E", "L"), ...rails(RAIL_E, TU / 2, 1, "E", "L")],
    },
    {
      title: "Join the frames along the bottom",
      detail: "Stand the three frames in a row, the middle one between the others. A long rail (K) runs across the front and one across the back at the floor: a long bolt (b) through each end frame into the rail's end, and one up through each rail into the middle frame's post.",
      add: ["KB", "KF"],
      from: { KB: [0, -300, 0], KF: [0, -300, 0] },
      fix: kFix,
      tools: ["allen"],
      warnings: ["loose"],
    },
    {
      title: "Bolt on the top and screw in the feet",
      detail: "Lay the top (I) on the three frames and turn two long bolts (b) up through the top of each frame into it. Screw an adjustable foot (c) into the bottom of each end frame post.",
      add: ["I"],
      from: { I: [0, 400, 0] },
      fix: [...topBolts, ...feet],
      tools: ["allen"],
    },
    {
      title: "Bolt the cross brace across the back",
      detail: "Across the back of the right-hand bay: one end of the brace (J) at the top and bottom of the right frame's back post, the other two on the middle frame's, a short bolt (a) in each. Now tighten every bolt.",
      add: ["J"],
      from: { J: [0, 0, -400] },
      fix: braceBolts,
      tools: ["allen"],
    },
    {
      title: "Fold out the drawers",
      detail: "Open a fabric drawer (F) out into a box and lay a base board (G) flat in its bottom. Do the same for all eight.",
      wait: all,
      from: out(all),
      repeat: 8,
    },
    {
      title: "Slide the drawers in",
      detail: "Rest each drawer on its pair of rails and push it all the way in.",
      add: [...fIds, ...gIds],
      from: out(all, [0, 0, 420]),
    },
    {
      title: "Fix it to the wall",
      detail: "Loop a strap (h) round the top of each end frame's back post. Stand the chest against the wall, mark, drill and push in the plugs, then screw each strap to the wall through a washer (g). Check the wall for pipes and cables first.",
      fix: wallFix(xs, yT - TU - 70, D, zJ - 4, ["A", "C"]),
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    },
  ];
  return { parts, steps };
}

/* ---------- 5 Drawer Chest ---------- */

function five(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const xs = W / 2 - 5 - TU / 2; // middle of an end frame
  const xi = xs - TU / 2; // its inside face
  const zp = D / 2 - TU / 2; // front and back posts
  const yT = H - T; // underside of the top, the top of every frame
  const yG = 50; // the bottom rails, level with the end frames' bottom bars
  const tier = (yT - TU - (yG + TU / 2) - TU) / 2;
  const yD = yG + TU / 2 + tier + TU / 2; // the middle rails
  const yRail = [yG + TU / 2 + 12, yD + TU / 2 + 12]; // drawer rails of the bottom and top tiers
  const bayU = (2 * xi - 2 * TU) / 3; // the three bays of the top tier
  const xC = xi - bayU - TU / 2; // the divider frames, at -xC and xC
  const BOLT_A = bolt(22, "Bolt"), FOOT_B = foot();
  const RAIL_D = rail(D - 2 * TU, "Right-hand drawer rail"), RAIL_E = rail(D - 2 * TU, "Left-hand drawer rail");

  const end = (x: number) => [...SX.map((sz) => post(x, FOOT, yT, sz * zp)), bar(x, yT - TU / 2, D - 2 * TU), bar(x, yG, D - 2 * TU)];
  const divider = (x: number) => [bar(x, yT - TU / 2, D), ...SX.map((sz) => post(x, yD + TU / 2, yT - TU, sz * zp))];
  const long = (id: string, label: string, name: string, y: number, z: number): CustomPart => ({ id, label, name, size: [2 * xi, TU, TU], pos: [0, y, z], material: "metal" });
  const midPost = (id: string, name: string, z: number): CustomPart => ({ id, label: id, name, size: [TU, yD - yG - TU, TU], pos: [0, (yD + yG) / 2, z], material: "metal" });
  const parts: CustomPart[] = [
    long("DB", "D", "Middle rail", yD, -zp),
    long("DF", "D", "Middle rail", yD, zp),
    midPost("E", "Back middle post", -zp),
    midPost("F", "Front middle post", zp),
    long("GB", "G", "Bottom rail", yG, -zp),
    long("GF", "G", "Bottom rail", yG, zp),
    compound("C1", "C", "Divider frame", divider(-xC)),
    compound("C2", "C", "Divider frame", divider(xC)),
    compound("A", "A", "Left end frame", end(-xs)),
    compound("B", "B", "Right end frame", end(xs)),
    { id: "H", label: "H", name: "Top", size: [W, T, D], pos: [0, yT + T / 2, 0], material: "board" },
  ];
  const dTop = tier - 27; // drawer height, the same in both tiers
  const small = [-1, 0, 1].map((k, i) => drawer(`${i}`, ["I", "J"], ["Small fabric drawer", "Small drawer base board"], k * (bayU + TU), yRail[1] + 10, bayU, dTop, D));
  const big = SX.map((sx, i) => drawer(`${i}`, ["K", "L"], ["Large fabric drawer", "Large drawer base board"], (sx * (xi + TU / 2)) / 2, yRail[0] + 10, xi - TU / 2, dTop, D));
  for (const d of [...small, ...big]) parts.push(d.f, d.g);
  const smallIds = small.flatMap((d) => [d.f.id, d.g.id]), bigIds = big.flatMap((d) => [d.f.id, d.g.id]);

  /* ---- fittings ---- */
  const rail2 = (def: Def, x: number, look: 1 | -1, y: number, on: string) => fx({ ...def, at: [[x, y, 0]], dir: [-look, 0, 0], ...(look < 0 ? { twist: Math.PI } : {}), on });
  const [yLo, yUp] = yRail;
  const railFix = [
    // the bottom tier: the end frames and the two sides of the middle posts
    rail2(RAIL_E, -xi, 1, yLo, "A"),
    rail2(RAIL_D, -TU / 2, -1, yLo, "E"),
    rail2(RAIL_E, TU / 2, 1, yLo, "E"),
    rail2(RAIL_D, xi, -1, yLo, "B"),
    // the top tier: the end frames and both sides of each divider frame
    rail2(RAIL_E, -xi, 1, yUp, "A"),
    rail2(RAIL_D, -xC - TU / 2, -1, yUp, "C1"),
    rail2(RAIL_E, -xC + TU / 2, 1, yUp, "C1"),
    rail2(RAIL_D, xC - TU / 2, -1, yUp, "C2"),
    rail2(RAIL_E, xC + TU / 2, 1, yUp, "C2"),
    rail2(RAIL_D, xi, -1, yUp, "B"),
  ];
  const postBolts = SX.flatMap((sz) => [
    fx({ ...BOLT_A, at: [[0, yD + TU / 2, sz * zp]], dir: [0, -1, 0], on: sz < 0 ? "DB" : "DF", mate: sz < 0 ? "E" : "F" }),
    fx({ ...BOLT_A, at: [[0, yG - TU / 2, sz * zp]], dir: [0, 1, 0], on: sz < 0 ? "GB" : "GF", mate: sz < 0 ? "E" : "F" }),
  ]);
  const dividerBolts = SX.flatMap((sx) => SX.map((sz) => fx({ ...BOLT_A, at: [[sx * xC, yD - TU / 2, sz * zp]], dir: [0, 1, 0], on: sz < 0 ? "DB" : "DF", mate: sx < 0 ? "C1" : "C2" })));
  const endBolts = SX.flatMap((sx) =>
    SX.flatMap((sz) =>
      [
        [yD, sz < 0 ? "DB" : "DF"],
        [yG, sz < 0 ? "GB" : "GF"],
      ].map(([y, mate]) => fx({ ...BOLT_A, at: [[sx * (xs + TU / 2), y as number, sz * zp]], dir: [-sx, 0, 0], on: sx < 0 ? "A" : "B", mate: mate as string })),
    ),
  );
  const topBolts = (
    [
      [-xs, "A"],
      [-xC, "C1"],
      [xC, "C2"],
      [xs, "B"],
    ] as const
  ).map(([x, on]) => fx({ ...BOLT_A, at: SX.map((sz): Vec3 => [x, yT - TU, sz * (zp - 70)]), dir: [0, 1, 0], on, mate: "H" }));
  const feet = SX.map((sx) => fx({ ...FOOT_B, at: SX.map((sz): Vec3 => [sx * xs, FOOT, sz * zp]), dir: [0, 1, 0], on: sx < 0 ? "A" : "B" }));
  const out = (ids: string[], v: Vec3 = [0, 0, OUT]) => Object.fromEntries(ids.map((id) => [id, v]));

  const steps: CustomStep[] = [
    {
      title: "Bolt the middle posts between the rails",
      detail: "The two short posts join a middle rail (D) to a bottom rail (G): E at the back, F at the front. A bolt (a) down through the middle rail into the top of each post and one up through the bottom rail into its foot. Leave every bolt loose for now.",
      add: ["DB", "DF", "E", "F", "GB", "GF"],
      from: { DB: [0, 300, 0], DF: [0, 300, 0], E: [0, 0, -380], F: [0, 0, 380], GB: [0, -300, 0], GF: [0, -300, 0] },
      fix: postBolts,
      tools: ["allen"],
      warnings: ["loose"],
    },
    {
      title: "Stand the divider frames on the middle rails",
      detail: "Set the two U-shaped frames (C) on the middle rails, a third of the way in from each end, one leg on each rail. A bolt (a) up through the rail into each leg.",
      add: ["C1", "C2"],
      from: { C1: [0, 380, 0], C2: [0, 380, 0] },
      fix: dividerBolts,
      tools: ["allen"],
      warnings: ["loose"],
    },
    {
      title: "Bolt on the end frames",
      detail: "Fit the left end frame (A) and the right one (B) over the ends of the four long rails, with a bolt (a) through the frame into each rail.",
      add: ["A", "B"],
      from: { A: [-450, 0, 0], B: [450, 0, 0] },
      fix: endBolts,
      tools: ["allen"],
      warnings: ["loose"],
    },
    {
      title: "Hook in the drawer rails",
      detail: "Each bay takes a pair of rails, the ledges facing in: the rail (e) on its left wall, the rail (d) on its right. Push the hooks at each end into the slots in the posts. Three bays on top, two below: five of each.",
      fix: railFix,
    },
    {
      title: "Bolt the top on",
      detail: "Lay the top (H) on the frames and turn two bolts (a) up through the top of each end frame and divider frame into it.",
      add: ["H"],
      from: { H: [0, 400, 0] },
      fix: topBolts,
      tools: ["allen"],
    },
    {
      title: "Screw in the feet",
      detail: "An adjustable foot (b) into the bottom of each end frame post. Now tighten every bolt.",
      fix: feet,
      tools: ["allen"],
    },
    {
      title: "Fold out the three small drawers",
      detail: "Open a small fabric drawer (I) out into a box and lay a small base board (J) flat in its bottom. Do the same for all three.",
      wait: smallIds,
      from: out(smallIds),
      repeat: 3,
    },
    {
      title: "Fold out the two big drawers",
      detail: "The same with the big drawers (K) and their base boards (L).",
      wait: bigIds,
      from: out(bigIds),
      repeat: 2,
    },
    {
      title: "Slide the drawers in",
      detail: "The small ones go in the top three bays, the big ones below. Rest each drawer on its pair of rails and push it all the way in.",
      add: [...smallIds, ...bigIds],
      from: out([...smallIds, ...bigIds], [0, 0, 420]),
    },
    {
      title: "Fix it to the wall",
      detail: "Loop a strap (g) round the top of each end frame's back post. Stand the chest against the wall, mark, drill and push in the plugs, then screw each strap to the wall through a washer (f). Check the wall for pipes and cables first.",
      fix: wallFix(xs, yT - 80, D, -D / 2, ["A", "B"]),
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    },
  ];
  return { parts, steps };
}

function recipe(s: ProductSpec): CustomParams | null {
  if (s.slug === "kmart-linen-look-8-drawer-chest") return eight(s);
  if (s.slug === "kmart-linen-look-5-drawer-chest") return five(s);
  return null;
}

const family: Family = { names: ["KMART:LINEN LOOK"], recipe };
export default family;
