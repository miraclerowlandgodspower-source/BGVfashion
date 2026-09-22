const { Pool } = require("pg");

function normalizeDatabaseUrl(connectionString) {
  const url = new URL(connectionString);
  const sslMode = url.searchParams.get("sslmode");

  if (sslMode && ["prefer", "require", "verify-ca"].includes(sslMode.toLowerCase())) {
    url.searchParams.set("sslmode", "verify-full");
  }

  return url.toString();
}
const fs = require("fs");
const path = require("path");

function loadEnv() {
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf-8");
      content.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
          const idx = trimmed.indexOf("=");
          const key = trimmed.substring(0, idx).trim();
          const val = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, "");
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      });
    }
  }
}

loadEnv();

async function markOutOfStock() {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl && !databaseUrl.includes("user:password@localhost")) {
    console.log("Connecting to PostgreSQL at DATABASE_URL...");
    const normalizedDatabaseUrl = normalizeDatabaseUrl(databaseUrl);
    const pool = new Pool({
      connectionString: normalizedDatabaseUrl,
      ssl:
        normalizedDatabaseUrl.includes("localhost") || normalizedDatabaseUrl.includes("127.0.0.1")
          ? false
          : { rejectUnauthorized: false },
    });

    try {
      const client = await pool.connect();
      console.log("Connected to PostgreSQL successfully.");

      const result = await client.query(
        "UPDATE products SET in_stock = false, stock_quantity = 0"
      );

      console.log(`SUCCESS: Marked ${result.rowCount} products as OUT OF STOCK.`);

      client.release();
      await pool.end();
    } catch (err) {
      console.warn("PostgreSQL error occurred:", err.message);
    }
  } else {
    console.log("No valid DATABASE_URL detected. Skipping product update.");
  }
}

markOutOfStock().catch((err) => {
  console.error("Failed to update products:", err);
  process.exit(1);
});
