import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, ProductSpec, Vec3 } from "../../types";

/**
 * Kmart's Round Marble Look Side Table, read from its assembly manual (keycode 43746866). A round top (1) on a
 * pedestal of two boards that slot into each other as a cross (2 and 3). It is built upside down on the top: four
 * cam bolts (B) go into the top's underside, the two boards are slid together, four dowels (A) go into the top and
 * the cross is set on them, a cam lock (C) in each of its four wings. Then a small angle bracket (P) in each corner
 * where a wing meets the top, two screws (E) each, two brackets at a time (the manual turns the table round between
 * them), four felt pads (Q) on the wings' ends and it turns over (the manual's last picture, a step of its own
 * here, after its five numbered ones). Kmart's hardware: 4 dowels A (6 x 30 mm), 4 cam
 * bolts B (6 x 35 mm), 4 cam locks C (15 x 10 mm), 8 screws E (3 x 12 mm), 4 brackets P, 4 felt pads Q.
 *
 * The manual prints no sizes: the top is drawn 25 mm thick and the cross 0.75 of it across, as its pictures show.
 * Part numbers and hardware letters are Kmart's own, so the guide reads against the paper.
 */

type Fx = Omit<CustomFix, "count" | "at"> & { at: Vec3[] };
const fx = (f: Fx): CustomFix => ({ ...f, count: f.at.length });

const DOWEL_A = { kind: "dowel", len: 30, dia: 6, name: "Dowel" } as const;
const CAM_BOLT_B = { kind: "camScrew", len: 35, dia: 6, name: "Cam bolt" } as const;
const CAM_C = { kind: "cam", len: 10, dia: 15, name: "Cam lock" } as const;
const SCREW_E = { kind: "screw", len: 12, dia: 3, name: "Screw" } as const;
const BRACKET_P = { kind: "angle", len: 26, dia: 20, name: "Angle bracket" } as const;
const PAD_Q = { kind: "glide", len: 3, dia: 20, name: "Felt pad" } as const;

function recipe(s: ProductSpec): CustomParams | null {
  if (s.slug !== "kmart-round-marble-look-side-table") return null;
  const W = s.size.w * 10, H = s.size.h * 10;
  const TT = 25; // the top
  const yT = H - TT; // its underside
  const PT = 18; // the boards of the cross
  const PW = Math.round(W * 0.75); // each board, wing tip to wing tip
  const half = PW / 2;
  const parts: CustomPart[] = [
    { id: "T1", label: "1", name: "Round top", size: [W, TT, W], pos: [0, yT + TT / 2, 0], shape: "cyl", material: "board" },
    { id: "P3", label: "3", name: "Cross board", size: [PT, yT, PW], pos: [0, yT / 2, 0], material: "board" },
    { id: "P2", label: "2", name: "Cross board", size: [PW, yT, PT], pos: [0, yT / 2, 0], material: "board" },
  ];

  // the four wings: which board, the way out along it, and the face its bracket goes on (round like a pinwheel)
  const wings: { id: string; u: Vec3; n: Vec3 }[] = [
    { id: "P2", u: [1, 0, 0], n: [0, 0, 1] },
    { id: "P2", u: [-1, 0, 0], n: [0, 0, -1] },
    { id: "P3", u: [0, 0, 1], n: [-1, 0, 0] },
    { id: "P3", u: [0, 0, -1], n: [1, 0, 0] },
  ];
  const along = (u: Vec3, d: number, y: number, n: Vec3 = [0, 0, 0], e = 0): Vec3 => [u[0] * d + n[0] * e, y, u[2] * d + n[2] * e];
  const camBolts = wings.map((w) => fx({ ...CAM_BOLT_B, at: [along(w.u, half - 30, yT)], dir: [0, 1, 0], on: "T1", mate: w.id }));
  const dowels = wings.map((w) => fx({ ...DOWEL_A, at: [along(w.u, 60, yT)], dir: [0, 1, 0], on: "T1", mate: w.id }));
  // each cam lock in the wing's face opposite its bracket, level with its cam bolt
  const cams = wings.map((w) => fx({ ...CAM_C, at: [along(w.u, half - 30, yT - 22, w.n, -PT / 2)], dir: w.n, on: w.id }));
  // a bracket under the top against the wing's face: one screw up into the top, one into the wing
  const bracket = (w: (typeof wings)[number]): CustomFix[] => {
    const c = along(w.u, half - 70, yT, w.n, PT / 2 + 13);
    return [
      fx({ ...BRACKET_P, at: [c], dir: [0, 1, 0], on: "T1", twist: Math.atan2(w.n[0], w.n[2]) }),
      fx({ ...SCREW_E, at: [[c[0] + w.u[0] * 16 + w.n[0] * 16, yT, c[2] + w.u[2] * 16 + w.n[2] * 16]], dir: [0, 1, 0], on: "T1" }),
      fx({ ...SCREW_E, at: [along(w.u, half - 70, yT - 20, w.n, PT / 2)], dir: [-w.n[0], 0, -w.n[2]], on: w.id }),
    ];
  };
  const pads = wings.map((w) => fx({ ...PAD_Q, at: [along(w.u, half - 20, 0)], dir: [0, 1, 0], on: w.id }));

  const steps: CustomStep[] = [
    {
      title: "Turn the cam bolts into the top",
      detail: "Lay the top (1) face down on a rug and screw the four cam bolts (B) into the holes near its edge with a screwdriver.",
      // no add: a step's cam bolts go in before the parts it adds, so the top comes in as the part they go into instead
      fix: camBolts,
      tools: ["screwdriver"],
      pose: "-y",
      warnings: ["floor"],
    },
    {
      title: "Slot the boards together and set them on the top",
      detail: "Push the four dowels (A) into the top. Stand board 3 on its two dowels and cam bolts, slide board 2 down over it so their slots lock into a cross, and turn a cam lock (C) in each of the four wings to pull it down tight.",
      add: ["P3", "P2"],
      fix: [...dowels, ...cams],
      from: { P3: [0, -380, 0], P2: [0, -520, 0] },
      tools: ["screwdriver"],
      pose: "-y",
    },
    {
      title: "Screw in the first two brackets",
      detail: "Set a bracket (P) in the corner where a wing meets the top, and drive one screw (E) into the top and one into the wing. Do the same on the opposite wing.",
      fix: [...bracket(wings[0]), ...bracket(wings[1])],
      tools: ["screwdriver"],
      pose: "-y",
    },
    {
      title: "Turn it round for the other two",
      detail: "Turn the table round and fit the last two brackets on the other board's wings the same way.",
      fix: [...bracket(wings[2]), ...bracket(wings[3])],
      tools: ["screwdriver"],
      pose: "-y",
    },
    {
      title: "Stick on the felt pads",
      detail: "Press a felt pad (Q) onto the end of each of the four wings.",
      fix: pads,
      pose: "-y",
    },
    {
      title: "Turn it over",
      detail: "Stand it on its pads. The top takes up to 5 kg.",
      pose: "+y",
    },
  ];
  return { parts, steps };
}

const family: Family = { names: ["KMART:ROUND MARBLE LOOK"], recipe };
export default family;
