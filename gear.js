// GET /api/gear — the whole catalogue, public, cached for an hour at the edge.
import { sql } from "../lib/db.js";

export default async function handler(req, res){
  const db = sql();
  const [rackets, strings] = await Promise.all([
    db`select no, brand, name, grp, scores, difficulty, price, specs from rackets order by no`,
    db`select idx, mains, crosses, scores, tech from strings order by idx`,
  ]);
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.status(200).json({ rackets, strings });
}
