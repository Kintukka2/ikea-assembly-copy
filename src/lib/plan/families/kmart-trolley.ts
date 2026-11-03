import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, PartPiece, ProductSpec, Vec3 } from "../../types";

/**
 * Kmart's White 3 Tier Trolley, read from its assembly manual (keycode 43476046). Each end is a frame of steel tube in
 * two halves: a top half bent over in a loop (part 1) that pushes into a bottom half with a cross tube near the floor
 * (part 2). It is built lying down: one end frame flat on the floor, the middle tray (4) bolted to it first, then the
 * bottom (5) and top (3) trays, each with a bolt and a nut at every post. The second end frame goes on top with six more
 * bolts, then it stands up and the four castors push into the posts, the two with brakes on opposite corners, and are
 * tightened with the spanner. Kmart's hardware: 12 bolts (A), 12 nuts (B), a spanner (C), a hex key (D), two castors (E)
 * and two castors with brakes (F).
 *
 * Part numbers are Kmart's own, so the guide reads against the paper.
 */

const TD = 19; // frame tube
const BOLT = { kind: "bolt", len: 15, dia: 6, name: "Bolt" } as const;
const NUT = { kind: "nut", len: 5, dia: 6, name: "Nut" } as const;

type Fx = Omit<CustomFix, "count" | "at"> & { at: Vec3[] };
const fx = (f: Fx): CustomFix => ({ ...f, count: f.at.length });

/** A part drawn as pieces given where they sit in the finished trolley: centred on their bounding box. */
function compound(id: string, label: string, name: string, abs: PartPiece[], material: CustomPart["material"]): CustomPart {
  const lo: Vec3 = [Infinity, Infinity, Infinity], hi: Vec3 = [-Infinity, -Infinity, -Infinity];
  for (const p of abs) {
    const a = p.rot?.[0] ?? 0;
    // only turned about x here: a cylinder's ends swing in y and z
    const hy = (Math.abs(Math.cos(a)) * p.size[1] + Math.abs(Math.sin(a)) * p.size[2]) / 2;
    const hz = (Math.abs(Math.sin(a)) * p.size[1] + Math.abs(Math.cos(a)) * p.size[2]) / 2;
    const h: Vec3 = [p.size[0] / 2, hy, hz];
    for (let k = 0; k < 3; k++) {
      lo[k] = Math.min(lo[k], p.pos[k] - h[k]);
      hi[k] = Math.max(hi[k], p.pos[k] + h[k]);
    }
  }
  const pos: Vec3 = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2];
  const size: Vec3 = [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]];
  return { id, label, name, size, pos, material, pieces: abs.map((p) => ({ ...p, pos: [p.pos[0] - pos[0], p.pos[1] - pos[1], p.pos[2] - pos[2]] as Vec3 })) };
}

function recipe(s: ProductSpec): CustomParams | null {
  if (s.slug !== "kmart-white-3-tier-trolley") return null;
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const CH = 70; // castors, floor to the bottom of the posts
  const xp = W / 2 - TD / 2; // end frames
  const xt = xp - TD / 2; // tray ends, against the frames
  const zp = D / 2 - 55; // the posts, front and back
  const yc = H - TD / 2 - zp; // centre of the loop at the top
  const yJoin = Math.round(0.6 * H); // where the two halves of a frame meet
  const yBar = CH + 25; // the bottom half's cross tube
  const th = Math.round(0.115 * H); // tray height
  const trayBottom = [0.15 * H, 0.44 * H, 0.72 * H].map(Math.round); // bottom (5), middle (4), top (3)
  const yBolt = trayBottom.map((y) => y + th / 2);

  const tube = (x: number, y0: number, y1: number, z: number): PartPiece => ({ shape: "cyl", size: [TD, y1 - y0, TD], pos: [x, (y0 + y1) / 2, z], material: "metal" });
  // the loop over the top: short straight tubes round a half circle in the frame's own plane
  const loop = (x: number): PartPiece[] => {
    const n = 7;
    return Array.from({ length: n }, (_, i) => {
      const a = (Math.PI * (i + 0.5)) / n; // from the front post (z = zp) over to the back one
      const half = Math.PI / (2 * n);
      const r = zp * Math.cos(half);
      return { shape: "cyl", size: [TD, 2 * zp * Math.sin(half) + TD * 0.4, TD], pos: [x, yc + r * Math.sin(a), r * Math.cos(a)], rot: [-a, 0, 0], material: "metal" } as PartPiece;
    });
  };
  const upper = (sx: number) => [tube(sx * xp, yJoin, yc, -zp), tube(sx * xp, yJoin, yc, zp), ...loop(sx * xp)];
  const lower = (sx: number): PartPiece[] => [
    tube(sx * xp, CH, yJoin, -zp),
    tube(sx * xp, CH, yJoin, zp),
    { shape: "cyl", size: [TD, 2 * zp, TD], pos: [sx * xp, yBar, 0], rot: [Math.PI / 2, 0, 0], material: "metal" },
  ];

  const parts: CustomPart[] = [];
  for (const [sx, side] of [[-1, "L"], [1, "R"]] as const) {
    parts.push(compound(`U${side}`, "1", "Top half of an end frame", upper(sx), "metal"));
    parts.push(compound(`B${side}`, "2", "Bottom half of an end frame", lower(sx), "metal"));
  }
  const Wt = 2 * xt;
  const tray: PartPiece[] = [
    { shape: "box", size: [Wt, 2, D - 6], pos: [0, -th / 2 + 1, 0] },
    ...[-1, 1].map((sz): PartPiece => ({ shape: "box", size: [Wt, th, 2], pos: [0, 0, sz * (D / 2 - 1)] })),
    ...[-1, 1].map((sx): PartPiece => ({ shape: "box", size: [2, th, D], pos: [sx * (xt - 1), 0, 0] })),
  ];
  const trays = [
    { id: "T5", label: "5", name: "Bottom tray" },
    { id: "T4", label: "4", name: "Middle tray" },
    { id: "T3", label: "3", name: "Top tray" },
  ];
  trays.forEach((t, i) => parts.push({ ...t, size: [Wt, th, D], pos: [0, trayBottom[i] + th / 2, 0], material: "metal", pieces: tray }));

  // a bolt through each post into the tray's end, a nut on it inside the tray
  const frameOf = (sx: number, i: number) => `${yBolt[i] > yJoin ? "U" : "B"}${sx < 0 ? "L" : "R"}`;
  const trayFix = (sx: number, i: number): CustomFix[] => [
    fx({ ...BOLT, at: [-zp, zp].map((z): Vec3 => [sx * (xp + TD / 2), yBolt[i], z]), dir: [-sx, 0, 0], on: frameOf(sx, i), mate: trays[i].id }),
    fx({ ...NUT, at: [-zp, zp].map((z): Vec3 => [sx * (xt - 2), yBolt[i], z]), dir: [sx, 0, 0], on: trays[i].id }),
  ];
  const castors = (name: string, corners: [number, number][]): CustomFix[] =>
    corners.map(([sx, sz]) => fx({ kind: "castor", name, len: CH, dia: 50, at: [[sx * xp, CH, sz * zp]], dir: [0, 1, 0], on: `B${sx < 0 ? "L" : "R"}` }));

  const steps: CustomStep[] = [
    {
      title: "Push the halves of an end frame together",
      detail: "Slide the narrow ends of the looped top half (1) into the bottom half (2). Join the other end frame the same way and keep it for later.",
      add: ["UL", "BL"],
      repeat: 2,
      pose: "+x",
      from: { UL: [0, 260, 0] },
    },
    {
      title: "Bolt the middle tray onto the frame",
      detail: "Lay the frame flat. Stand the middle tray (4) on it, push a bolt through each post into the tray and run a nut onto it inside.",
      add: ["T4"],
      fix: trayFix(-1, 1),
      tools: ["allen"],
    },
    {
      title: "Bolt on the bottom and top trays",
      detail: "The bottom tray (5) goes at the cross tube end, the top tray (3) at the loop. A bolt and a nut at each post, as before.",
      add: ["T5", "T3"],
      fix: [...trayFix(-1, 0), ...trayFix(-1, 2)],
      tools: ["allen"],
    },
    {
      title: "Lay the second end frame on top",
      detail: "Line its posts up with the holes in the three trays, then six bolts and nuts. Tighten all the bolts with the hex key.",
      add: ["UR", "BR"],
      fix: [0, 1, 2].flatMap((i) => trayFix(1, i)),
      tools: ["allen"],
    },
    {
      title: "Stand it up and push in the castors",
      detail: "One in the bottom of each post: the two with brakes on opposite corners. Tighten each one with the spanner.",
      fix: [
        ...castors("Castor", [
          [-1, 1],
          [1, -1],
        ]),
        ...castors("Castor with brake", [
          [-1, -1],
          [1, 1],
        ]),
      ],
      tools: ["wrench"],
      pose: "+y",
    },
    {
      title: "Check it over",
      detail: "Go round every bolt once more. Press a brake down to hold the trolley still, lift it to roll again.",
      tools: ["allen"],
    },
  ];
  return { parts, steps };
}

const family: Family = { names: ["KMART:TROLLEY"], recipe };
export default family;
