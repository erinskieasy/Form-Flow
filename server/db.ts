import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

let pgPool: any = null;
let pgDb: any = null;

if (process.env.DATABASE_URL) {
  pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
  pgDb = drizzle(pgPool, { schema });
} else {
  console.warn("DATABASE_URL not set; skipping Postgres initialization (MSSQL mode possible)");
}

export const pool = pgPool;
export const db = pgDb;
