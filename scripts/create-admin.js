/**
 * BGV Fashion - Admin Creation & Promotion Script
 * Usage:
 *   node scripts/create-admin.js [email] [password] [name]
 * Example:
 *   node scripts/create-admin.js admin@bgvfashion.shop AdminSecure2026! "BGV Head Admin"
 */

const { Pool } = require("pg");

function normalizeDatabaseUrl(connectionString) {
  const url = new URL(connectionString);
  const sslMode = url.searchParams.get("sslmode");

  if (sslMode && ["prefer", "require", "verify-ca"].includes(sslMode.toLowerCase())) {
    url.searchParams.set("sslmode", "verify-full");
  }

  return url.toString();
}
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

// Try to load .env.local or .env
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

async function createAdmin() {
  const args = process.argv.slice(2);
  const email = (args[0] || process.env.ADMIN_EMAIL || "admin@bgvfashion.shop").toLowerCase().trim();
  const password = args[1] || process.env.ADMIN_PASSWORD || "AdminSecure2026!";
  const name = args[2] || process.env.ADMIN_NAME || "BGV Chief Administrator";

  console.log("\n========================================================");
  console.log("👗 BGV FASHION - CREATING ADMINISTRATOR ACCOUNT");
  console.log("========================================================");
  console.log(`Admin Name:     ${name}`);
  console.log(`Admin Email:    ${email}`);
  console.log(`Admin Password: ${"*".repeat(password.length)}`);
  console.log("========================================================\n");

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

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
      console.log(" Connected to PostgreSQL successfully.");

      // Check if users table exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          phone TEXT,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'customer',
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);

      // Check if user exists
      const checkRes = await client.query("SELECT id, email, role FROM users WHERE email = $1", [email]);

      if (checkRes.rows.length > 0) {
        // Update user to admin and update password hash
        await client.query(
          "UPDATE users SET name = $1, password_hash = $2, role = 'admin', account_status = 'ACTIVE' WHERE email = $3",
          [name, passwordHash, email]
        );
        console.log(` SUCCESS: Existing user [${email}] has been upgraded to Administrator with new password!`);
      } else {
        // Insert new admin
        await client.query(
          "INSERT INTO users (name, email, password_hash, role, account_status) VALUES ($1, $2, $3, 'admin', 'ACTIVE')",
          [name, email, passwordHash]
        );
        console.log(` SUCCESS: New Administrator account created for [${email}]!`);
      }

      client.release();
      await pool.end();
    } catch (err) {
      console.warn("⚠️ PostgreSQL connection failed or error occurred:", err.message);
      console.log("Writing admin credentials to local runtime fallback cache...");
    }
  } else {
    console.log("ℹ️ No active PostgreSQL DATABASE_URL detected. Configured for local in-memory fallback.");
  }

  // Write a secure local seed record for in-memory store runtime initialization
  const fallbackPath = path.resolve(process.cwd(), "scripts", ".admin-seed.json");
  fs.writeFileSync(
    fallbackPath,
    JSON.stringify(
      {
        id: "admin-root-id",
        name,
        email,
        passwordHash,
        role: "admin",
        createdAt: new Date().toISOString(),
      },
      null,
      2
    )
  );

  console.log("\n========================================================");
  console.log("✅ Admin Setup Complete!");
  console.log(`🔗 Admin Login URL: http://localhost:3000/admin/login`);
  console.log(`📧 Email:           ${email}`);
  console.log(`🔑 Password:        ${password}`);
  console.log("========================================================\n");
}

createAdmin().catch((err) => {
  console.error("Failed to create admin:", err);
  process.exit(1);
});
