// GET /api/auth/me — who am I? (the page asks this at boot)
import { readSession } from "../../lib/session.js";

export default async function handler(req, res){
  const s = readSession(req);
  res.status(200).json(s ? { user: { id: s.uid, email: s.email } } : { user: null });
}
