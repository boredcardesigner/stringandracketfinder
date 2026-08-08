// POST /api/upload  (raw image body, content-type image/*) — logged-in only.
// Stores the photo in Vercel Blob and returns its public URL for the post.
import { put } from "@vercel/blob";
import { requireUser } from "../lib/session.js";

export const config = { api: { bodyParser: false } };

const MAX = 6 * 1024 * 1024; // 6 MB

export default async function handler(req, res){
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const s = requireUser(req, res); if (!s) return;

  const type = req.headers["content-type"] || "";
  if (!/^image\/(jpeg|png|webp|avif)$/.test(type)) return res.status(415).json({ error: "jpeg, png, webp or avif" });

  const chunks = []; let size = 0;
  for await (const c of req){ size += c.length; if (size > MAX) return res.status(413).json({ error: "6 MB max" }); chunks.push(c); }

  const ext = type.split("/")[1].replace("jpeg", "jpg");
  const key = `setups/u${s.uid}-${Date.now()}.${ext}`;
  const blob = await put(key, Buffer.concat(chunks), { access: "public", contentType: type });
  res.status(201).json({ url: blob.url });
}
