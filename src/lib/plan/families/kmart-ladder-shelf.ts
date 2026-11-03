import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, PartPiece, ProductSpec, Vec3 } from "../../types";

/**
 * Kmart's 4 Tier Ladder Shelf (42561941), read from its assembly manual. It leans like a ladder: each side is two
 * flat frames (an upper triangle and a lower trapezoid) with a straight back leg, a front leg that slopes back to
 * meet it at the top, and rungs between them. The four shelves get deeper towards the floor, each with a rail
 * screwed along its back edge, and a short rail ties the backs of the sides together where the halves meet.
 *
 * - The rails go onto the shelves with three screws each, and two small angle brackets go under the top shelf.
 * - Each side's halves join end to end: a dowel, two barrel nuts and two long bolts up through the lower rung.
 * - Lying on its back, the left side goes onto the shelves' ends (dowels, then a bolt through each leg into a barrel
 *   nut in the shelf), then the right side the same way. Stood up, stickers cover the bolt heads, and the brackets
 *   under the top shelf are screwed to the wall.
 *
 * Kmart's letters are the labels: A to D the frame halves, E the back rails, F to I the shelves top to bottom, J the
 * short back rail. Each shelf end takes two bolts (front and back leg), the rail end two dowels, and the shelves that
 * sit on a rung one more dowel into it: 11 dowels a side plus one at each joint, 24 in all, as the box has.
 */

const T = 15; // frame and shelf thickness
const LEG = 30; // width of a leg
const RUNG = 30; // height of a rung
const RAIL = 50; // height of a back rail above its shelf
const SCREW_A = { kind: "screw", len: 35, dia: 4, name: "Screw" } as const; // a
const DOWEL_B = { kind: "dowel", len: 30, dia: 5.8 } as const; // b
const BOLT_D = { kind: "screw", len: 50, dia: 5, name: "Bolt" } as const; // d
const NUT_E = { kind: "cam", len: 9, dia: 9, name: "Barrel nut" } as const; // e
const BRACKET_F = { kind: "angle", len: 20, dia: 50, name: "Angle bracket" } as const; // f
const SCREW_G = { kind: "screw", len: 12, dia: 4, name: "Bracket screw" } as const; // g
const PLUG_H = { kind: "plug", len: 29, dia: 6, included: true } as const; // h
const WALL_I = { kind: "screw", len: 35, dia: 4, name: "Wall screw", included: true } as const; // i
const STICKER_J = { kind: "cap", len: 1, dia: 12, name: "Screw sticker" } as const; // j

type Def = { kind: CustomFix["kind"]; len: number; dia: number; name?: string; included?: boolean };
const fx = (def: Def, at: Vec3[], dir: Vec3, on?: string, mate?: string): CustomFix => ({
  ...def,
  count: at.length,
  at,
  dir,
  ...(on ? { on } : {}),
  ...(mate ? { mate } : {}),
});

function ladder(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const k = H / 1500; // heights as the manual's drawing has them, for its 150 cm
  const xi = W / 2 - T; // inner face of a side
  const xs = W / 2 - T / 2; // middle of a side
  const lean = (D - 2 * LEG) / H; // the front leg comes back this much per mm of height
  const th = Math.atan(lean);
  const wh = LEG / Math.cos(th); // the front leg's width, measured level
  const zf = (y: number) => D / 2 - lean * y; // front face of the front leg
  const zc = (y: number) => zf(y) - wh / 2; // middle of the front leg
  const zb = -D / 2 + LEG / 2; // middle of the back leg
  const zbf = -D / 2 + LEG; // front face of the back leg
  const zr = -D / 2 + T / 2; // the back rails, flush with the back
  const YJ = Math.round(715 * k); // where each side's halves meet
  const shelfY = { F: 1175 * k, G: 795 * k, H: 380 * k, I: 75 * k }; // middle of each shelf
  const SH = ["F", "G", "H", "I"] as const;
  const rungOf: Record<string, boolean> = { F: false, G: true, H: true, I: true };

  // a frame half: back leg, sloping front leg and rungs, as pieces in one part
  const frame = (y0: number, y1: number, rungs: number[]) => {
    const zmin = -D / 2, zmax = zf(y0);
    const pos: Vec3 = [0, (y0 + y1) / 2, (zmin + zmax) / 2];
    const rel = (y: number, z: number): Vec3 => [0, y - pos[1], z - pos[2]];
    const ym = (y0 + y1) / 2;
    const pieces: PartPiece[] = [
      { shape: "box", size: [T, y1 - y0, LEG], pos: rel(ym, zb) },
      { shape: "box", size: [T, (y1 - y0) / Math.cos(th), LEG], pos: rel(ym, zc(ym)), rot: [-th, 0, 0] },
      ...rungs.map((yr): PartPiece => {
        const z1 = zc(yr) - wh / 2;
        return { shape: "box", size: [T, RUNG, z1 - zbf], pos: rel(yr, (z1 + zbf) / 2) };
      }),
    ];
    return { size: [T, y1 - y0, zmax - zmin] as Vec3, pos, pieces };
  };
  const upper = frame(YJ, H, [YJ + RUNG / 2, shelfY.G]);
  const lower = frame(0, YJ, [shelfY.I, shelfY.H, YJ - RUNG / 2]);

  const parts: CustomPart[] = [];
  const half = (id: string, label: string, name: string, f: ReturnType<typeof frame>, sx: number) =>
    parts.push({ id, label, name, size: f.size, pos: [sx * xs, f.pos[1], f.pos[2]], pieces: f.pieces, material: "board" });
  half("A", "A", "Left upper frame", upper, -1);
  half("B", "B", "Left lower frame", lower, -1);
  half("C", "C", "Right upper frame", upper, 1);
  half("D", "D", "Right lower frame", lower, 1);
  const top = (id: string) => shelfY[id as keyof typeof shelfY] + T / 2;
  const front = (id: string) => Math.round(zf(top(id))); // a shelf reaches the front of the legs
  const names: Record<string, string> = { F: "Top shelf", G: "Second shelf", H: "Third shelf", I: "Bottom shelf" };
  for (const id of SH) {
    const d = front(id) + D / 2;
    parts.push({ id, label: id, name: names[id], size: [W - 2 * T, T, d], pos: [0, shelfY[id], (front(id) - D / 2) / 2], material: "board" });
    parts.push({ id: `E${id}`, label: "E", name: "Back rail", size: [W - 2 * T, RAIL, T], pos: [0, top(id) + RAIL / 2, zr], material: "board" });
  }
  parts.push({ id: "J", label: "J", name: "Short back rail", size: [W - 2 * T, 70, T], pos: [0, YJ, zr], material: "board" });

  // where the bolts go through a side into a shelf: one through each leg
  const boltZ = (id: string) => [zb, zc(shelfY[id as keyof typeof shelfY])];
  const halfOf = (y: number, sx: number) => (sx < 0 ? (y > YJ ? "A" : "B") : y > YJ ? "C" : "D");
  const xr = [-W / 3, 0, W / 3].map(Math.round);

  // one side onto the shelves: dowels in the ends, bolts through the legs, barrel nuts in the shelves
  const sideFix = (sx: -1 | 1): CustomFix[] => {
    const out: CustomFix[] = [];
    for (const id of SH) {
      const y = shelfY[id];
      const railDowels: Vec3[] = [top(id) + 12, top(id) + 38].map((yy): Vec3 => [sx * xi, yy, zr]);
      out.push(fx(DOWEL_B, railDowels, [-sx, 0, 0], `E${id}`, halfOf(y, sx)));
      if (rungOf[id]) {
        const zm = (zbf + zc(y) - wh / 2) / 2;
        out.push(fx(DOWEL_B, [[sx * xi, y, zm]], [-sx, 0, 0], id, halfOf(y, sx)));
      }
    }
    for (const id of SH) out.push(fx(NUT_E, boltZ(id).map((z): Vec3 => [sx * (xi - 25), shelfY[id] - T / 2, z]), [0, 1, 0], id));
    out.push(fx(NUT_E, [YJ - 20, YJ + 20].map((y): Vec3 => [sx * (xi - 25), y, zr + T / 2]), [0, 0, -1], "J"));
    for (const id of SH) {
      const y = shelfY[id];
      out.push(fx(BOLT_D, boltZ(id).map((z): Vec3 => [sx * (W / 2), y, z]), [-sx, 0, 0], halfOf(y, sx), id));
    }
    out.push(fx(BOLT_D, [[sx * (W / 2), YJ - 20, zr]], [-sx, 0, 0], halfOf(YJ - 20, sx), "J"));
    out.push(fx(BOLT_D, [[sx * (W / 2), YJ + 20, zr]], [-sx, 0, 0], halfOf(YJ + 20, sx), "J"));
    return out;
  };
  const stickers = (sx: -1 | 1): CustomFix[] => [
    ...SH.map((id) => fx(STICKER_J, boltZ(id).map((z): Vec3 => [sx * (W / 2), shelfY[id], z]), [-sx, 0, 0], halfOf(shelfY[id], sx))),
    fx(STICKER_J, [[sx * (W / 2), YJ - 20, zr]], [-sx, 0, 0], halfOf(YJ - 20, sx)),
    fx(STICKER_J, [[sx * (W / 2), YJ + 20, zr]], [-sx, 0, 0], halfOf(YJ + 20, sx)),
  ];

  // the joint between the halves of a side: two bolts up through the lower rung into the upper one
  const jz = (() => {
    const z1 = zc(YJ) - wh / 2;
    return [zbf + 35, z1 - 35, (zbf + z1) / 2];
  })();
  const joint = (sx: -1 | 1, lo: string, up: string): CustomFix[] => [
    fx(DOWEL_B, [[sx * xs, YJ, jz[2]]], [0, -1, 0], lo, up),
    fx(NUT_E, jz.slice(0, 2).map((z): Vec3 => [sx * xi, YJ + RUNG / 2, z]), [sx, 0, 0], up),
    fx(BOLT_D, jz.slice(0, 2).map((z): Vec3 => [sx * xs, YJ - RUNG, z]), [0, 1, 0], lo, up),
    fx(STICKER_J, jz.slice(0, 2).map((z): Vec3 => [sx * xi, YJ + RUNG / 2, z]), [sx, 0, 0], up),
  ];

  const yF = shelfY.F - T / 2;
  const bx = [-W / 2 + 150, W / 2 - 150].map(Math.round);
  const steps: CustomStep[] = [
    {
      title: "Screw a back rail onto each shelf",
      detail: "Stand a rail on the back edge of each shelf and drive three screws up through the shelf into it. Screw the two small angle brackets under the top shelf at the back, for the wall.",
      add: ["F", "EF", "G", "EG", "H", "EH", "I", "EI"],
      fix: [
        ...SH.map((id) => fx(SCREW_A, xr.map((x): Vec3 => [x, shelfY[id] - T / 2, zr]), [0, 1, 0], id, `E${id}`)),
        fx(BRACKET_F, bx.map((x): Vec3 => [x, yF, -D / 2 + 10]), [0, 1, 0], "F"),
        fx(SCREW_G, bx.map((x): Vec3 => [x + 23, yF, -D / 2 + 12]), [0, 1, 0], "F"),
      ],
      tools: ["screwdriver"],
      pose: "+z",
    },
    {
      title: "Join the two halves of each side",
      detail: "Put a dowel in the joint and the two barrel nuts in the upper rung, then drive the long bolts up through the lower rung into them. Turn the nuts with a screwdriver until it pulls tight, then cover them with stickers.",
      wait: ["A", "B", "C", "D"],
      from: { A: [-420, 0, 0], B: [-420, 0, 0], C: [420, 0, 0], D: [420, 0, 0] },
      fix: [...joint(-1, "B", "A"), ...joint(1, "D", "C")],
      tools: ["screwdriver"],
      pose: "+z",
    },
    {
      title: "Fix the shelves to the left side",
      detail: "On a flat floor, with the shelves on their back edges, push dowels into the ends of the rails and the lower three shelves. Push the left side on with the short rail at the joint, drop a barrel nut into each shelf end and drive a bolt through each leg into it.",
      add: ["J", "A", "B"],
      from: { J: [0, 0, 380], A: [-420, 0, 0], B: [-420, 0, 0] },
      fix: sideFix(-1),
      tools: ["screwdriver"],
      pose: "+z",
      warnings: ["floor"],
    },
    {
      title: "Fix the right side on",
      detail: "The same at the other ends: dowels in, the right side pushed on, a barrel nut in each shelf and a bolt through each leg. Tighten every bolt before you lift it.",
      add: ["C", "D"],
      from: { C: [420, 0, 0], D: [420, 0, 0] },
      fix: sideFix(1),
      tools: ["screwdriver"],
      pose: "+z",
      check: "square",
    },
    {
      title: "Stand it up and cover the bolt heads",
      detail: "Lift it upright where it will stand, back legs to the wall, and press a sticker over each bolt head on the outside of both sides.",
      fix: [...stickers(-1), ...stickers(1)],
      pose: "+y",
    },
    {
      title: "Fix it to the wall",
      detail: "Mark through the two brackets under the top shelf, drill, push in the plugs and screw through the brackets into them. Check the wall for pipes and cables first.",
      fix: [
        fx(PLUG_H, bx.map((x): Vec3 => [x - 23, yF - 12, -D / 2 - 30]), [0, 0, -1]),
        fx(WALL_I, bx.map((x): Vec3 => [x - 23, yF - 12, -D / 2 + 2]), [0, 0, -1], "F"),
      ],
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    },
  ];
  return { parts, steps };
}

function recipe(s: ProductSpec): CustomParams | null {
  if (s.slug === "kmart-4-tier-ladder-shelf") return ladder(s);
  return null;
}

const family: Family = { names: ["KMART:LADDER SHELF"], recipe };
export default family;
