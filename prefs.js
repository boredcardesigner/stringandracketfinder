// GET  /api/prefs → { prefs, updated_at }   (yours only)
// PUT  /api/prefs { prefs } → saves          (yours only)
import { sql } from "../lib/db.js";
import { requireUser } from "../lib/session.js";

export default async function handler(req, res){
  const s = requireUser(req, res); if (!s) return;
  const db = sql();

  if (req.method === "GET"){
    const rows = await db`select prefs, updated_at from profiles where user_id = ${s.uid}`;
    return res.status(200).json(rows[0] || { prefs: {}, updated_at: null });
  }
  if (req.method === "PUT"){
    const prefs = req.body?.prefs;
    if (typeof prefs !== "object" || prefs === null) return res.status(400).json({ error: "prefs must be an object" });
    if (JSON.stringify(prefs).length > 100_000) return res.status(413).json({ error: "prefs too large" });
    await db`insert into profiles (user_id, prefs, updated_at) values (${s.uid}, ${JSON.stringify(prefs)}::jsonb, now())
             on conflict (user_id) do update set prefs = excluded.prefs, updated_at = now()`;
    return res.status(200).json({ ok: true });
  }
  res.status(405).json({ error: "GET or PUT" });
}
