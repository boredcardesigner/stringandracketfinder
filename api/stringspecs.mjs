/* ============================================================================
   /api/stringspecs — live string lookup for the search bar
   ----------------------------------------------------------------------------
   Why this file exists
   --------------------
   The browser cannot crawl. If index.html fetched a retailer directly, CORS
   would kill the request before it left the page. So the crawl runs HERE, on
   Vercel's server, where there is no CORS — and the page just asks this
   endpoint. Same crawler logic as tools/crawl_strings.mjs, but on demand.

   Deploy
   ------
   Put this file at:  api/stringspecs.mjs   (repo root → api/ folder)

   The .mjs extension is deliberate and load-bearing. This file uses ESM
   (`export default`). A repo whose package.json has no "type":"module" — which
   is the default, and the case here alongside db.js/gear.js/posts.js — makes
   Node read .js as CommonJS, hit `export`, and die with FUNCTION_INVOCATION_FAILED
   before a single line runs. A .mjs file is ALWAYS treated as ESM, whatever
   package.json says, so this works either way.

   No config, no dependencies. Needs Node 18+ for built-in fetch (Vercel's
   default runtime is newer than that; the handler checks and says so if not).

   Call
   ----
   GET /api/stringspecs?q=restring%20slap
   →  { found:true, row:[model,BRAND,material,profile,gauges,stiffness,
                         tensionLoss,energyReturn,price,lifespan],
        source:"https://…", live:true }
   →  { found:false, reason:"…" }

   Honesty rule carried over from the offline crawler: it reads price, gauges,
   material and profile from the page. It does NOT invent stiffness. If the
   page does not state one, stiffness comes back null and the app marks the
   row derived — never a measurement that nobody measured.
   ========================================================================== */

const UA = "SRF-string-lookup/1.0 (+https://www.stringandracketfinder.com)";
const TIMEOUT_MS = 6000;

/* Where to look, per brand. Add a line to grow the crawler's reach — the
   search bar needs no change when you do. {slug} is the model, lower-kebab. */
const VENDORS = [
  { brand: "RESTRING",  host: "https://shoprestring.com",
    paths: ["/products/{slug}", "/products/{slug}-string", "/products/{slug}-single-set"] },
  { brand: "TOROLINE",  host: "https://toroline.com",     paths: ["/products/{slug}"] },
  { brand: "SOLINCO",   host: "https://solinco.com",      paths: ["/products/{slug}"] },
];

const slugify = (s) => String(s).toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function grab(url) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { headers: { "user-agent": UA }, signal: ctl.signal });
    return r.ok ? await r.text() : null;
  } catch { return null; } finally { clearTimeout(t); }
}

function jsonLd(html) {
  const out = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) { try { out.push(JSON.parse(m[1])); } catch {} }
  return out.flatMap((x) => (Array.isArray(x) ? x : [x]))
            .flatMap((x) => (x && x["@graph"] ? x["@graph"] : [x]));
}

function parse(html) {
  const text = html.replace(/<[^>]+>/g, " ");
  const out = { name: null, price: null, gauges: [], material: "poly",
                profile: "round", stiffness: null };

  for (const g of jsonLd(html)) {
    if (!g || !/Product/i.test(String(g["@type"] || ""))) continue;
    if (!out.name && g.name) out.name = String(g.name);
    for (const o of [].concat(g.offers || [])) {
      const p = parseFloat(o.price ?? o.lowPrice);
      if (isFinite(p) && out.price == null) out.price = Math.round(p);
    }
  }

  const seen = new Set();
  for (const g of text.matchAll(/1\.(1[5-9]|2[0-9]|3[0-5])\s?mm/g)) seen.add("1." + g[1]);
  out.gauges = [...seen].sort();

  if (/natural gut/i.test(text)) out.material = "gut";
  else if (/multifilament/i.test(text)) out.material = "multi";
  else if (/synthetic gut/i.test(text)) out.material = "syngut";

  if (/heptagonal|seven-sided|7-sided/i.test(text)) out.profile = "heptagonal";
  else if (/hexagonal|six-sided|6-sided/i.test(text)) out.profile = "hexagonal";
  else if (/square|four-sided/i.test(text)) out.profile = "square";
  else if (/pentagonal|five-sided/i.test(text)) out.profile = "pentagonal";
  else if (/textured|shaped|edges/i.test(text)) out.profile = "shaped";

  // only ever taken from a number the page itself prints
  const st = text.match(/(\d{3})\s*(?:lb\/in|lbs\/in|pounds per inch)/i);
  if (st) out.stiffness = parseInt(st[1], 10);

  return out;
}

export default async function handler(req, res) {
  /* Everything below is wrapped: a thrown error here would otherwise surface as
     Vercel's blank "This Serverless Function has crashed" page, which tells you
     nothing. This way the failure arrives as JSON you can actually read. */
  try {
    return await run(req, res);
  } catch (err) {
    return res.status(200).json({
      found: false, ok: false, error: String((err && err.message) || err),
      hint: "the function ran but threw — see the message above",
    });
  }
}

async function run(req, res) {
  res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");

  if (typeof fetch !== "function") {
    return res.status(200).json({
      found: false, ok: false,
      error: "no global fetch \u2014 this runtime is older than Node 18",
      hint: "Vercel \u2192 Project \u2192 Settings \u2192 General \u2192 Node.js Version \u2192 set 20.x or newer",
    });
  }

  const q = String((req.query && req.query.q) || "").trim();

  /* Health check. Ask for ?q=__ping and the function answers without touching the
     network — that single call proves the endpoint deployed, which is otherwise
     indistinguishable from "deployed but found nothing". */
  if (q === "__ping") {
    return res.status(200).json({
      ok: true, service: "stringspecs", version: 1,
      vendors: VENDORS.map((v) => v.brand),
      time: new Date().toISOString(),
    });
  }

  if (!q) return res.status(400).json({ found: false, reason: "no query" });
  if (q.length > 60) return res.status(400).json({ found: false, reason: "query too long" });

  const words = q.split(/\s+/);
  const guessBrand = words[0].toUpperCase();
  const model = words.slice(1).join(" ") || q;
  const slug = slugify(model);

  const vendors = VENDORS.filter((v) => v.brand === guessBrand);
  const list = vendors.length ? vendors : VENDORS;      // unknown brand: try all

  for (const v of list) {
    for (const p of v.paths) {
      const url = v.host + p.replace("{slug}", slug);
      const html = await grab(url);
      if (!html) continue;
      const d = parse(html);
      if (!d.name && d.price == null) continue;         // page exists but is not a product
      const title = d.name ? d.name.replace(new RegExp("^" + v.brand + "\\s*", "i"), "") : model;
      return res.status(200).json({
        found: true, live: true, source: url,
        row: [
          title.replace(/\s*[-–—]\s*(single set|set|reel).*$/i, "").trim(),
          v.brand,
          d.material === "poly" ? "co-poly" : d.material,
          d.profile,
          d.gauges.length ? d.gauges.join(" / ") : "",
          d.stiffness,                                   // null when the page never says
          "", "",
          d.price != null ? String(d.price) : "",
          "",
        ],
      });
    }
  }
  return res.status(200).json({ found: false, reason: "no vendor page matched" });
}
