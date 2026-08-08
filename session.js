// Sessions without any framework: a signed value in an HttpOnly cookie.
// value = base64url(payload) + "." + HMAC(payload, SESSION_SECRET)
// The browser can't read it (HttpOnly), scripts can't forge it (HMAC),
// and every API function can verify it in microseconds.
import crypto from "node:crypto";

const COOKIE = "srf_session";
const MAX_AGE = 60 * 60 * 24 * 90; // 90 days

const b64u = (buf) => Buffer.from(buf).toString("base64url");

function sign(payload){
  const body = b64u(JSON.stringify(payload));
  const mac = crypto.createHmac("sha256", process.env.SESSION_SECRET).update(body).digest("base64url");
  return body + "." + mac;
}

export function verify(token){
  if (!token) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expect = crypto.createHmac("sha256", process.env.SESSION_SECRET).update(body).digest("base64url");
  const a = Buffer.from(mac), b = Buffer.from(expect);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString());
    if (!p.uid || !p.exp || p.exp < Date.now() / 1000) return null;
    return p;
  } catch { return null; }
}

export function readSession(req){
  const raw = req.headers.cookie || "";
  const hit = raw.split(/;\s*/).find(c => c.startsWith(COOKIE + "="));
  return verify(hit ? hit.slice(COOKIE.length + 1) : null);
}

export function sessionCookie(uid, email){
  const token = sign({ uid, email, exp: Math.floor(Date.now() / 1000) + MAX_AGE });
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`;
}

export function clearCookie(){
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function requireUser(req, res){
  const s = readSession(req);
  if (!s){ res.status(401).json({ error: "not logged in" }); return null; }
  return s;
}
