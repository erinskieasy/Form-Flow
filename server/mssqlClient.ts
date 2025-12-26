import mssql from "mssql";

if (!process.env.MSSQL_CONNECTION) {
  // don't throw here so the app can still run against Postgres when not configured
  console.warn("MSSQL: no MSSQL_CONNECTION env var set");
}

let pool: mssql.ConnectionPool | null = null;

export async function getPool() {
  if (pool && pool.connected) return pool;
  if (!process.env.MSSQL_CONNECTION) throw new Error("MSSQL_CONNECTION must be set to connect to SQL Server");

  const config = process.env.MSSQL_CONNECTION;

  pool = await mssql.connect(config);
  return pool;
}

export { mssql };

export function snakeToCamel(s: string) {
  return s.replace(/_([a-z])/g, (_m, p1) => p1.toUpperCase());
}

export function camelToSnake(s: string) {
  return s.replace(/([A-Z])/g, (m) => `_${m.toLowerCase()}`);
}

export function mapRowToCamel(row: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const key of Object.keys(row)) {
    out[snakeToCamel(key)] = row[key];
  }
  return out;
}

export function mapRowsToCamel(rows: Record<string, any>[]) {
  return rows.map(mapRowToCamel);
}
