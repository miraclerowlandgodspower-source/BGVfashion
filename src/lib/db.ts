import { Pool } from "pg";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../db/schema";
import { INITIAL_PRODUCTS } from "../db/initial-products";
import { Product } from "@/types";

let pool: Pool | null = null;
let dbInstance: NodePgDatabase<typeof schema> | null = null;
let dbConnectionFailed = false;

export function getDb(): NodePgDatabase<typeof schema> | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || dbConnectionFailed) {
    return null;
  }

  if (!dbInstance) {
    try {
      pool = new Pool({
        connectionString,
        ssl: connectionString.includes("localhost") || connectionString.includes("127.0.0.1")
          ? false
          : { rejectUnauthorized: false },
        max: 5,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 3000,
      });

      // Prevent unhandled error event on the pool from crashing the Node.js process
      pool.on("error", (err) => {
        console.warn("PostgreSQL pool connection notice (falling back to memory):", err?.message || err);
        dbConnectionFailed = true;
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

// In-memory runtime store with support for products, orders, chat, otps
export const inMemoryStore = {
  products: [...INITIAL_PRODUCTS],
  users: new Map<string, { id: string; name: string; email: string; passwordHash: string; role: string; createdAt: Date }>(),
  cart: new Map<string, { id: string; userId?: string; productId: string; size: string; quantity: number }[]>(),
  wishlist: new Map<string, Set<string>>(),
  orders: new Map<string, any>(),
  chatConversations: new Map<string, any>(),
  chatMessages: new Map<string, any[]>(),
  otps: new Map<string, { code: string; expiresAt: number; verified: boolean }>(),
};

// Database helper functions with fallback
export async function getProducts(options?: {
  department?: string;
  category?: string;
  search?: string;
  sort?: string;
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
          price: p.price,
          sheet: p.sheet,
          quadrant: p.quadrant as 0 | 1 | 2 | 3,
          colors: p.colors as string[],
          sizes: p.sizes as string[],
          description: p.description,
          inStock: p.inStock,
          featured: p.featured,
        }));
      } else {
        await seedDatabase();
        list = [...INITIAL_PRODUCTS];
      }
    } catch (e) {
      dbConnectionFailed = true;
      list = [...inMemoryStore.products];
    }
  } else {
    list = [...inMemoryStore.products];
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
        p.description.toLowerCase().includes(q)
    );
  }

  // Sort
  if (options?.sort === "low") {
    list.sort((a, b) => a.price - b.price);
  } else if (options?.sort === "high") {
    list.sort((a, b) => b.price - a.price);
  }

  return list;
}

export async function getProductById(id: string): Promise<Product | null> {
  const all = await getProducts();
  return all.find((p) => p.id === id) || null;
}

export async function seedDatabase() {
  const db = getDb();
  if (!db) return;

  try {
    for (const prod of INITIAL_PRODUCTS) {
      await db
        .insert(schema.products)
        .values({
          id: prod.id,
          name: prod.name,
          department: prod.department,
          category: prod.category,
          price: prod.price,
          sheet: prod.sheet,
          quadrant: prod.quadrant,
          colors: prod.colors,
          sizes: prod.sizes,
          description: prod.description,
          inStock: prod.inStock ?? true,
          featured: prod.featured ?? false,
        })
        .onConflictDoNothing();
    }
  } catch (err) {
    dbConnectionFailed = true;
    console.warn("Database auto-seed notice (using fallback memory store):", (err as any)?.message || err);
  }
}
