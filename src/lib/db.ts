import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema";
import { INITIAL_PRODUCTS } from "../db/initial-products";
import { Product, Category, ShippingRecord, PaymentRecord, Order } from "@/types";

let pool: Pool | null = null;
let dbInstance: NodePgDatabase<typeof schema> | null = null;
let dbConnectionFailed = false;

export function getDb(): NodePgDatabase<typeof schema> | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }

  if (dbConnectionFailed) {
    pool = null;
    dbInstance = null;
    dbConnectionFailed = false;
  }

  if (!dbInstance) {
    try {
      pool = new Pool({
        connectionString,
        ssl:
          connectionString.includes("localhost") || connectionString.includes("127.0.0.1")
            ? false
            : { rejectUnauthorized: false },
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      // Prevent unhandled error event on the pool from crashing the Node.js process
      pool.on("error", (err) => {
        console.warn("PostgreSQL pool connection notice (falling back to memory):", err?.message || err);
        dbConnectionFailed = true;
        dbInstance = null;
        pool = null;
      });

      dbInstance = drizzle(pool, { schema });
    } catch (err) {
      console.warn("PostgreSQL initialization notice:", err);
      dbConnectionFailed = true;
      return null;
    }
  }

  return dbInstance;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: "dresses", name: "Dresses", department: "Women", description: "Atelier couture and evening dresses" },
  { id: "tops", name: "Tops", department: "Women", description: "Bespoke blouses and tailored shirts" },
  { id: "denim", name: "Denim", department: "Unisex", description: "Premium wash selvedge and raw denim" },
  { id: "sets", name: "Sets", department: "Women", description: "Coordinated two-piece ensembles" },
  { id: "jackets", name: "Jackets", department: "Unisex", description: "Structured outerwear and bombers" },
  { id: "streetwear", name: "Streetwear", department: "Men", description: "Heavyweight hoodies and relaxed fits" },
  { id: "tailoring", name: "Tailoring", department: "Unisex", description: "Double-breasted and structured suiting" },
  { id: "accessories", name: "Accessories", department: "Unisex", description: "Silk scarves, leather belts, and eyewear" },
];

const enrichedInitialProducts: Product[] = INITIAL_PRODUCTS.map((p, idx) => ({
  ...p,
  salePrice: null,
  sku: `BGV-${p.department.substring(0, 1)}-${1000 + idx}`,
  stockQuantity: 0,
  inStock: false,
  status: "active" as const,
  newArrival: idx < 3,
  image: null,
}));

// In-memory runtime store with comprehensive support for products, orders, chat, otps, shipping, settings
export const inMemoryStore = {
  products: [...enrichedInitialProducts],
  categories: new Map<string, Category>(DEFAULT_CATEGORIES.map((c) => [c.id, c])),
  users: new Map<string, { id: string; name: string; email: string; phone?: string; passwordHash: string; role: string; accountStatus?: string; createdAt: Date }>([
    [
      "admin@bgvfashion.shop",
      {
        id: "admin-seed-id",
        name: "BGV Chief Administrator",
        email: "admin@bgvfashion.shop",
        phone: "+234 812 345 6789",
        passwordHash: "$2b$10$148I5y2eNqQHL2iKtnGoAu/Pe3YbpryrXdT84mmWgRHwLbLv7BsTi", // AdminSecure2026!
        role: "admin",
        accountStatus: "ACTIVE",
        createdAt: new Date(),
      },
    ],
  ]),
  cart: new Map<string, { id: string; userId?: string; productId: string; size: string; quantity: number }[]>(),
  wishlist: new Map<string, Set<string>>(),
  orders: new Map<string, Order>(),
  payments: new Map<string, PaymentRecord>(),
  shipping: new Map<string, ShippingRecord>(),
  chatConversations: new Map<string, any>(),
  chatMessages: new Map<string, any[]>(),
  customerAddresses: new Map<string, any[]>(),
  otps: new Map<string, { code: string; expiresAt: number; verified: boolean }>(),
  settings: new Map<string, string>([
    ["store_name", "BGV Fashion Atelier"],
    ["atelier_location", "Ojo, Lagos, Nigeria"],
    ["contact_email", "concierge@bgvfashion.com"],
    ["contact_phone", "+234 812 345 6789"],
    ["default_carrier", "GIG Logistics"],
    ["currency", "NGN"],
  ]),
};

// Check for local admin seed created by scripts/create-admin.js
try {
  const seedFile = path.resolve(process.cwd(), "scripts", ".admin-seed.json");
  if (fs.existsSync(seedFile)) {
    const seed = JSON.parse(fs.readFileSync(seedFile, "utf-8"));
    if (seed && seed.email) {
      inMemoryStore.users.set(seed.email.toLowerCase().trim(), {
        ...seed,
        createdAt: new Date(seed.createdAt || Date.now()),
      });
    }
  }
} catch {
  // Ignore in browser or restricted environments
}

// Database helper functions with fallback
export async function getProducts(options?: {
  department?: string;
  category?: string;
  search?: string;
  sort?: string;
  status?: string;
  includeInactive?: boolean;
}): Promise<Product[]> {
  const db = getDb();
  let list: Product[] = [];

  if (db) {
    try {
      const dbProducts = await db.select().from(schema.products);
      if (dbProducts && dbProducts.length > 0) {
        list = dbProducts.map((p) => ({
          id: p.id,
          name: p.name,
          department: p.department as any,
          category: p.category,
          categoryId: p.categoryId,
          price: p.price,
          salePrice: p.salePrice,
          sku: p.sku,
          stockQuantity: p.stockQuantity ?? 10,
          sheet: p.sheet,
          quadrant: p.quadrant as 0 | 1 | 2 | 3,
          image: p.image,
          colors: (p.colors as string[]) || [],
          sizes: (p.sizes as string[]) || [],
          description: p.description,
          inStock: p.inStock,
          featured: p.featured,
          newArrival: p.newArrival,
          status: (p.status as any) || "active",
          createdAt: p.createdAt ? p.createdAt.toISOString() : undefined,
        }));
      } else {
        await seedDatabase();
        list = [...inMemoryStore.products];
      }
    } catch (e) {
      dbConnectionFailed = true;
      list = [...inMemoryStore.products];
    }
  } else {
    list = [...inMemoryStore.products];
  }

  // Filter by status for customer storefront (unless includeInactive is true)
  if (!options?.includeInactive) {
    list = list.filter((p) => (p.status || "active") === "active");
  } else if (options?.status) {
    list = list.filter((p) => p.status === options.status);
  }

  // Filter by department
  if (options?.department && ["Women", "Men", "Unisex"].includes(options.department)) {
    list = list.filter((p) => p.department.toLowerCase() === options.department?.toLowerCase());
  }

  // Filter by category
  if (options?.category && options.category !== "All categories") {
    list = list.filter((p) => p.category.toLowerCase() === options.category?.toLowerCase());
  }

  // Search query
  if (options?.search) {
    const q = options.search.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q))
    );
  }

  // Sort
  if (options?.sort === "low") {
    list.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
  } else if (options?.sort === "high") {
    list.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
  }

  return list;
}

export async function getProductById(id: string): Promise<Product | null> {
  const all = await getProducts({ includeInactive: true });
  return all.find((p) => p.id === id) || null;
}

export async function seedDatabase() {
  const db = getDb();
  if (!db) return;

  try {
    // Seed Categories
    for (const cat of DEFAULT_CATEGORIES) {
      await db
        .insert(schema.categories)
        .values({
          id: cat.id,
          name: cat.name,
          department: cat.department,
          description: cat.description,
        })
        .onConflictDoNothing();
    }

    // Seed Products
    for (const prod of enrichedInitialProducts) {
      await db
        .insert(schema.products)
        .values({
          id: prod.id,
          name: prod.name,
          department: prod.department,
          category: prod.category,
          price: prod.price,
          salePrice: prod.salePrice,
          sku: prod.sku,
          stockQuantity: prod.stockQuantity ?? 10,
          sheet: prod.sheet || "women.png",
          quadrant: prod.quadrant ?? 0,
          image: prod.image,
          colors: prod.colors,
          sizes: prod.sizes,
          description: prod.description,
          inStock: prod.inStock ?? true,
          featured: prod.featured ?? false,
          newArrival: prod.newArrival ?? false,
          status: prod.status || "active",
        })
        .onConflictDoNothing();
    }

    // Seed Default Store Settings
    for (const [key, value] of inMemoryStore.settings.entries()) {
      await db
        .insert(schema.storeSettings)
        .values({ key, value })
        .onConflictDoNothing();
    }

    // Seed default admin if no admin exists
    const adminRows = await db.select().from(schema.users).where(eq(schema.users.role, "admin")).limit(1);
    if (adminRows.length === 0) {
      await db
        .insert(schema.users)
        .values({
          name: "BGV Chief Administrator",
          email: "admin@bgvfashion.com",
          phone: "+234 812 345 6789",
          passwordHash: "$2b$10$148I5y2eNqQHL2iKtnGoAu/Pe3YbpryrXdT84mmWgRHwLbLv7BsTi",
          role: "admin",
        })
        .onConflictDoNothing();
    }
  } catch (err) {
    dbConnectionFailed = true;
    console.warn("Database auto-seed notice (using fallback memory store):", (err as any)?.message || err);
  }
}
