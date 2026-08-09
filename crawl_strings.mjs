#!/usr/bin/env node
/* ============================================================================
   String & Racket Finder — string spec crawler v1
   ----------------------------------------------------------------------------
   Run:      node tools/crawl_strings.mjs
   Output:   stringdb.json  (next to index.html, repo root)
   Node:     >= 18 (built-in fetch). No dependencies.

   What it does
   ------------
   1. Starts from SEED — the hand-curated lab rows below (same 10-column shape
      as the app's built-in NERD table).
   2. Visits each string's product page (SOURCES), politely, one request per
      second, and refreshes the *live* facts: price and gauge list, read from
      the page's schema.org JSON-LD when present, with a regex fallback.
   3. Writes stringdb.json. The app fetches it at boot (https only) and feeds
      every row it does not already know into the lab table — search autofill,
      the estimator and the NEEERDY table all read the same rows.

   What it deliberately does NOT do
   --------------------------------
   - It does not scrape stiffness numbers from third-party labs. Those columns
     stay curated by hand (or by you, in SEED) so every figure has a named
     origin. Add a parser under SOURCES when a source you trust allows it.
   - It does not hammer anyone: 1 req/s, a plain user agent, and it gives up
     quietly per-URL on any error. Respect robots.txt of anything you add.

   Row shape (identical to the app's NERD table)
   ---------------------------------------------
   [ model, BRAND, material, profile, "gauges", stiffness_lb_in,
     "tension loss", "energy return", "price €", "lifespan" ]
   ========================================================================== */

import { writeFileSync } from "node:fs";

/* ---- 1 · curated seed — figures with a named origin ---------------------- */
const SEED = [
  // ReString family: stiffness anchored to the bench's filed Zero (205) and
  // Sync (200); Slap softer per maker + reviews, Vivo firmer per maker copy.
  ["Slap", "RESTRING", "co-poly", "hexagonal", "1.23 / 1.28", 195,
   "very low (notch-resistant)", "low\u2013mid", "15\u201318", "12\u201316 h"],
  ["Vivo", "RESTRING", "co-poly (recycled)", "hexagonal", "1.23 / 1.28", 212,
   "very low (maker-rated)", "mid", "14\u201317", "10\u201314 h"],
];

/* ---- 2 · product pages to refresh price + gauges from -------------------- */
const SOURCES = [
  { model: "Slap", brand: "RESTRING", url: "https://shoprestring.com/products/slap-string" },
  { model: "Vivo", brand: "RESTRING", url: "https://shoprestring.com/products/vivo-single-set" },
  { model: "Zero", brand: "RESTRING", url: "https://shoprestring.com/products/zero" },
  { model: "Sync", brand: "RESTRING", url: "https://shoprestring.com/products/sync" },
  // add more: { model, brand, url } — JSON-LD (schema.org Product) preferred
];

const UA = "SRF-string-crawler/1.0 (+https://www.stringandracketfinder.com)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function jsonLd(html) {
  const out = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try { out.push(JSON.parse(m[1])); } catch { /* malformed block — skip */ }
  }
  return out.flatMap((x) => (Array.isArray(x) ? x : [x]));
}

function extract(html) {
  const found = { price: null, gauges: new Set() };
  for (const node of jsonLd(html)) {
    const graph = node["@graph"] ? node["@graph"] : [node];
    for (const g of graph) {
      if (!/Product/i.test(String(g["@type"] || ""))) continue;
      const offers = [].concat(g.offers || []);
      for (const o of offers) {
        const p = parseFloat(o.price ?? o.lowPrice);
        if (isFinite(p) && !found.price) found.price = p;
      }
    }
  }
  // gauge fallback: every "1.xx mm"-looking figure in the visible text
  for (const g of html.matchAll(/1\.(1[5-9]|2[0-9]|3[0-5])\s?mm/g)) {
    found.gauges.add("1." + g[1]);
  }
  return found;
}

async function main() {
  const rows = SEED.map((r) => r.slice());
  for (const s of SOURCES) {
    try {
      const res = await fetch(s.url, { headers: { "user-agent": UA } });
      if (!res.ok) { console.warn("skip", s.url, res.status); continue; }
      const { price, gauges } = extract(await res.text());
      const row = rows.find(
        (r) => r[0].toLowerCase() === s.model.toLowerCase()
            && r[1].toLowerCase() === s.brand.toLowerCase());
      if (row) {
        if (gauges.size) row[4] = [...gauges].sort().join(" / ");
        if (price != null) row[8] = String(Math.round(price));
        console.log("updated", s.brand, s.model,
          "\u2192 gauges", row[4], "\u00b7 price", row[8]);
      } else {
        console.log("fetched", s.brand, s.model,
          "(not in SEED \u2014 add a seed row to file it)");
      }
    } catch (e) { console.warn("skip", s.url, String(e).slice(0, 80)); }
    await sleep(1000);   // one request per second — we are guests
  }
  const out = { generated: new Date().toISOString(), source: "crawl_strings.mjs v1", rows };
  writeFileSync(new URL("../stringdb.json", import.meta.url), JSON.stringify(out, null, 1));
  console.log("\nwrote stringdb.json with", rows.length, "row(s)");
}

main();
