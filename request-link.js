// POST /api/auth/request-link  { email }
// Creates a one-time token and emails the magic link.
import crypto from "node:crypto";
import { sql } from "../../lib/db.js";
import { sendLoginLink } from "../../lib/mail.js";

export default async function handler(req, res){
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: "that is not an email address" });

  const db = sql();
  const token = crypto.randomBytes(48).toString("hex");
  await db`insert into login_tokens (token, email, expires_at)
           values (${token}, ${email}, now() + interval '15 minutes')`;
  const link = `${process.env.SITE_ORIGIN}/api/auth/callback?token=${token}`;
  await sendLoginLink(email, link);
  // Always the same answer — the endpoint never reveals whether an email is known.
  res.status(200).json({ ok: true, message: "check your inbox" });
}
