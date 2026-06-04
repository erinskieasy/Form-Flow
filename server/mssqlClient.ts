import mssql from "mssql";
// @ts-ignore
import MessageIO from "tedious/lib/message-io";
import net from "net";

// Monkey-patch tedious MessageIO.prototype.startTls to bypass TLS IP SNI validation
const originalStartTls = MessageIO.prototype.startTls;
MessageIO.prototype.startTls = function (
  credentialsDetails: any,
  hostname: string,
  trustServerCertificate: boolean,
) {
  console.log("[DEBUG MONKEYPATCH] startTls args:", { hostname, trustServerCertificate });
  if (net.isIP(hostname)) {
    console.log("[DEBUG MONKEYPATCH] hostname is IP, overriding to mssql.local");
    hostname = "mssql.local";
  }
  return originalStartTls.call(
    this,
    credentialsDetails,
    hostname,
    trustServerCertificate,
  );
};

if (!process.env.MSSQL_CONNECTION) {
  console.warn("MSSQL: no MSSQL_CONNECTION env var set");
}

let pool: mssql.ConnectionPool | null = null;

function parseConnectionString(connStr: string): mssql.config {
  const parts: Record<string, string> = {};
  for (const segment of connStr.split(";")) {
    const idx = segment.indexOf("=");
    if (idx < 0) continue;
    const key = segment.slice(0, idx).trim().toLowerCase();
    const value = segment.slice(idx + 1).trim();
    parts[key] = value;
  }

  const server = parts["server"] || parts["data source"] || parts["datasource"] || "";
  const database = parts["database"] || parts["initial catalog"] || "";
  const user = parts["user id"] || parts["uid"] || parts["user"] || "";
  const password = parts["password"] || parts["pwd"] || "";
  const encrypt = (parts["encrypt"] || "true").toLowerCase() !== "false";
  const trustCert = (parts["trustservercertificate"] || "false").toLowerCase() === "true";

  // Handle instance names: Server=HOST\INSTANCE or Server=HOST,PORT
  let serverHost = server;
  let instanceName: string | undefined;
  let port = 1433;

  if (server.includes("\\")) {
    [serverHost, instanceName] = server.split("\\");
  } else if (server.includes(",")) {
    const [h, p] = server.split(",");
    serverHost = h;
    port = parseInt(p, 10) || 1433;
  }

  const config: mssql.config = {
    server: serverHost,
    database,
    user,
    password,
    options: {
      encrypt,
      trustServerCertificate: trustCert,
      instanceName,
    },
    port: instanceName ? undefined : port,
  };

  return config;
}

export async function getPool() {
  if (pool && pool.connected) return pool;
  if (!process.env.MSSQL_CONNECTION) throw new Error("MSSQL_CONNECTION must be set to connect to SQL Server");

  const config = parseConnectionString(process.env.MSSQL_CONNECTION);
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
