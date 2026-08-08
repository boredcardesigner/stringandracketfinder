// One tiny database helper for every API function.
// Neon's serverless driver speaks Postgres over HTTP — perfect for functions
// that wake, run one query, and sleep again.
import { neon } from "@neondatabase/serverless";

let _sql = null;
export function sql(){
  if (!_sql){
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}
