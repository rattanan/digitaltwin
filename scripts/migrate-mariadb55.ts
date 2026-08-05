import "dotenv/config";
import { spawn } from "node:child_process";
import { createPool } from "mariadb";

const migrationTableSql = `
CREATE TABLE IF NOT EXISTS \`_prisma_migrations\` (
  \`id\` VARCHAR(36) NOT NULL,
  \`checksum\` VARCHAR(64) NOT NULL,
  \`finished_at\` DATETIME NULL,
  \`migration_name\` VARCHAR(255) NOT NULL,
  \`logs\` LONGTEXT NULL,
  \`rolled_back_at\` DATETIME NULL,
  \`started_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`applied_steps_count\` INTEGER UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (\`id\`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
`;

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function runPrismaDeploy() {
  return new Promise<number>((resolve, reject) => {
    const command = process.platform === "win32" ? "npx.cmd" : "npx";
    const child = spawn(command, ["prisma", "migrate", "deploy"], {
      env: process.env,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`Prisma migrate deploy terminated by ${signal}`));
        return;
      }
      resolve(code ?? 1);
    });
  });
}

async function main() {
  const connectionString = requiredEnv("DATABASE_URL");
  const parsed = new URL(connectionString);
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  const pool = createPool({
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database,
    connectionLimit: 1,
    connectTimeout: Number(process.env.DATABASE_CONNECT_TIMEOUT ?? 10_000),
    acquireTimeout: Number(process.env.DATABASE_ACQUIRE_TIMEOUT ?? 15_000),
  });

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.query(migrationTableSql);
    console.log("Prepared MariaDB 5.5-compatible _prisma_migrations table.");
  } finally {
    connection?.release();
    await pool.end();
  }

  const exitCode = await runPrismaDeploy();
  if (exitCode !== 0) process.exitCode = exitCode;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
