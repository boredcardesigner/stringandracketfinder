// GET /api/auth/callback?token=...
// The click from the email: burn the token, create the user if new,
// set the session cookie, land on the site — logged in.
import { sql } from "../../lib/db.js";
import { sessionCookie } from "../../lib/session.js";

export default async function handler(req, res){
  const token = String(req.query.token || "");
  if (!token) return res.status(400).send("missing token");
  const db = sql();

  const rows = await db`update login_tokens set used = true
    where token = ${token} and not used and expires_at > now()
    returning email`;
  if (!rows.length) return res.status(400).send("This link is expired or already used — request a fresh one on the site.");

  const email = rows[0].email;
  const u = await db`insert into users (email) values (${email})
    on conflict (email) do update set email = excluded.email
    returning id, email`;
  await db`insert into profiles (user_id) values (${u[0].id}) on conflict do nothing`;

  res.setHeader("Set-Cookie", sessionCookie(u[0].id, u[0].email));
  res.writeHead(302, { Location: "/" });
  res.end();
}
