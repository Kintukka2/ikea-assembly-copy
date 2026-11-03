import { chatText, extractJson, fromApp, ipOf, keyTrouble, MODELS, rateLimited, TogetherError, userKey } from "@/lib/together";

const PROMPT = `This photo shows a flat pack product from IKEA or Kmart, its box, its label or its assembly manual cover. Read the shop, the product name and the product number.
Reply with JSON only: {"shop": "ikea" | "kmart" | "", "name": "KALLAX", "variant": "2x4 shelving unit", "number": "802.758.87", "confidence": 0.0-1.0}.
IKEA: the name is one word in capitals (it may contain Å, Ä or Ö), the number is an article number like 802.758.87.
Kmart: the name says what the product is, like "8 Cube Storage Unit", and the number is the 8 digit keycode by the barcode, like 42633297.
Leave out anything you can't read. If you can't read a name, guess the kind of furniture in "variant" and set name to "".`;

export async function POST(req: Request) {
  if (!fromApp(req)) return Response.json({ error: "forbidden" }, { status: 403 });
  const key = userKey(req);
  if (!key) return Response.json({ error: "key" }, { status: 401 });
  if (rateLimited(ipOf(req) + ":identify", 8)) return Response.json({ error: "slow down" }, { status: 429 });
  const { image } = (await req.json().catch(() => ({}))) as { image?: string };
  if (typeof image !== "string" || !image.startsWith("data:image/") || image.length > 3_000_000) return Response.json({ error: "bad image" }, { status: 400 });
  try {
    const { text } = await chatText({
      key,
      models: MODELS.vision,
      // vision models think before they answer: a short budget comes back empty
      maxTokens: 1500,
      temperature: 0,
      messages: [{ role: "user", content: [{ type: "text", text: PROMPT }, { type: "image_url", image_url: { url: image } }] }],
    });
    const j = extractJson(text) as { shop?: string; name?: string; variant?: string; number?: string; confidence?: number } | null;
    const name = (j?.name ?? "").toString().trim().slice(0, 60);
    const variant = (j?.variant ?? "").toString().trim().slice(0, 60);
    const shop = j?.shop === "kmart" || j?.shop === "ikea" ? j.shop : "";
    // a number on the label finds the exact product: a Kmart keycode, or an IKEA article number
    const digits = (j?.number ?? "").toString().replace(/[^\d]/g, "");
    const number = digits.length === 8 ? digits : "";
    const query = number || [shop === "kmart" ? "kmart" : "", name, variant].filter(Boolean).join(" ").trim();
    return Response.json({ name, variant, shop, number, query, confidence: Number(j?.confidence ?? 0) });
  } catch (e) {
    console.error("[identify]", (e as Error).message);
    const trouble = e instanceof TogetherError ? keyTrouble(e.status) : null;
    return Response.json({ error: trouble ?? "failed" }, { status: trouble === "key" ? 401 : trouble === "credits" ? 402 : 502 });
  }
}
