// Seeds the rackets and strings tables from gear_dump.json —
// the data extracted 1:1 from the app. Run once, locally:
//   DATABASE_URL=postgres://...  npm run seed
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";

const sql = neon(process.env.DATABASE_URL);
const gear = JSON.parse(readFileSync(new URL("./gear_dump.json", import.meta.url)));

for (const r of gear.rackets){
  await sql`insert into rackets (no, brand, name, grp, scores, difficulty, price, specs)
    values (${r.no}, ${r.brand}, ${r.name}, ${r.grp}, ${JSON.stringify(r.scores)}::jsonb,
            ${r.difficulty}, ${r.price}, ${JSON.stringify(r.specs)}::jsonb)
    on conflict (no) do update set brand=excluded.brand, name=excluded.name, grp=excluded.grp,
      scores=excluded.scores, difficulty=excluded.difficulty, price=excluded.price, specs=excluded.specs`;
}
for (const b of gear.beds){
  await sql`insert into strings (idx, mains, crosses, scores, tech)
    values (${b.i}, ${b.mains}, ${b.crosses}, ${JSON.stringify(b.scores)}::jsonb, ${JSON.stringify(b.tech)}::jsonb)
    on conflict (idx) do update set mains=excluded.mains, crosses=excluded.crosses,
      scores=excluded.scores, tech=excluded.tech`;
}
console.log(`seeded ${gear.rackets.length} rackets, ${gear.beds.length} string beds`);
