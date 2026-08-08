// GET  /api/posts?before=<id>   — newest 30, public
// POST /api/posts { body, racket_ref?, string_ref?, photo_url? } — logged-in only
import { sql } from "../lib/db.js";
import { readSession, requireUser } from "../lib/session.js";

export default async function handler(req, res){
  const db = sql();

  if (req.method === "GET"){
    const before = Number(req.query.before) || null;
    const rows = before
      ? await db`select p.id, p.body, p.racket_ref, p.string_ref, p.photo_url, p.created_at,
                        u.email as author
                 from posts p join users u on u.id = p.user_id
                 where not p.hidden and p.id < ${before}
                 order by p.id desc limit 30`
      : await db`select p.id, p.body, p.racket_ref, p.string_ref, p.photo_url, p.created_at,
                        u.email as author
                 from posts p join users u on u.id = p.user_id
                 where not p.hidden
                 order by p.id desc limit 30`;
    // show only the part before the @ — the feed never leaks full addresses
    rows.forEach(r => r.author = r.author.split("@")[0]);
    return res.status(200).json({ posts: rows });
  }

  if (req.method === "POST"){
    const s = requireUser(req, res); if (!s) return;
    const body = String(req.body?.body || "").trim();
    if (!body) return res.status(400).json({ error: "say something about the build" });
    if (body.length > 2000) return res.status(413).json({ error: "keep it under 2000 characters" });
    const clean = v => { v = String(v || "").trim(); return v ? v.slice(0, 200) : null; };
    const row = await db`insert into posts (user_id, body, racket_ref, string_ref, photo_url)
      values (${s.uid}, ${body}, ${clean(req.body?.racket_ref)}, ${clean(req.body?.string_ref)}, ${clean(req.body?.photo_url)})
      returning id, created_at`;
    return res.status(201).json({ ok: true, id: row[0].id, created_at: row[0].created_at });
  }

  res.status(405).json({ error: "GET or POST" });
}
