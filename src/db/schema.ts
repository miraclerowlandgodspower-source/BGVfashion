import { pgTable, text, integer, timestamp, boolean, jsonb, uuid, index } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  passwordHash: text("password_hash").notNull(),
  role: text("role").default("customer").notNull(), // 'customer', 'admin'
  accountStatus: text("account_status").default("EMAIL_UNVERIFIED").notNull(), // EMAIL_UNVERIFIED, PENDING_ADMIN_APPROVAL, ACTIVE, SUSPENDED, REJECTED
  emailVerifiedAt: timestamp("email_verified_at"),
  lastLoginAt: timestamp("last_login_at"),
  failedLoginAttempts: integer("failed_login_attempts").default(0).notNull(),
  lockUntil: timestamp("lock_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("users_email_idx").on(table.email),
  index("users_role_idx").on(table.role),
  index("users_account_status_idx").on(table.accountStatus),
]);

export const categories = pgTable("categories", {
  id: text("id").primaryKey(), // slug e.g. 'dresses'
  name: text("name").notNull().unique(),
  department: text("department").notNull().default("Women"), // Women, Men, Unisex
  description: text("description"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: text("id").primaryKey(), // slug
  name: text("name").notNull(),
  department: text("department").notNull(), // Women, Men, Unisex
  category: text("category").notNull(), // Dresses, Tops, Denim, Jackets, Sets, Skirts, Tailoring, Streetwear, Accessories
  categoryId: text("category_id").references(() => categories.id, { onDelete: "set null" }),
  price: integer("price").notNull(), // In NGN integer
  salePrice: integer("sale_price"), // Optional promotional sale price
  sku: text("sku"), // Stock keeping unit
  stockQuantity: integer("stock_quantity").notNull().default(10), // Inventory count
  sheet: text("sheet").notNull().default("women.png"), // 'women.png', 'men.png' or custom
  quadrant: integer("quadrant").notNull().default(0), // 0, 1, 2, 3
  image: text("image"), // Direct image URL for non-sprite uploaded images
  colors: jsonb("colors").$type<string[]>().notNull().default([]),
  sizes: jsonb("sizes").$type<string[]>().notNull().default([]),
  description: text("description").notNull(),
  inStock: boolean("in_stock").notNull().default(true),
  featured: boolean("featured").notNull().default(false),
  newArrival: boolean("new_arrival").notNull().default(false),
  status: text("status").notNull().default("active"), // 'active', 'draft', 'archived'
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("products_category_idx").on(table.category),
  index("products_department_idx").on(table.department),
  index("products_status_idx").on(table.status),
]);

export const productImages = pgTable("product_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: text("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  url: text("url").notNull(),
  altText: text("alt_text"),
  isPrimary: boolean("is_primary").default(false).notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("product_images_product_idx").on(table.productId),
]);

export const customerAddresses = pgTable("customer_addresses", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  addressLine: text("address_line").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  country: text("country").notNull().default("Nigeria"),
  postalCode: text("postal_code"),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("customer_addresses_user_idx").on(table.userId),
]);

export const cartItems = pgTable("cart_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  productId: text("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  size: text("size").notNull(),
  quantity: integer("quantity").notNull().default(1),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const wishlistItems = pgTable("wishlist_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  productId: text("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  customerEmail: text("customer_email").notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  status: text("status").notNull().default("pending"), 
  // 'pending', 'payment_confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'
  subtotal: integer("subtotal").notNull(),
  shippingFee: integer("shipping_fee").notNull().default(0),
  taxFee: integer("tax_fee").notNull().default(0),
  totalAmount: integer("total_amount").notNull(),
  currency: text("currency").notNull().default("NGN"),
  shippingAddress: jsonb("shipping_address").notNull(),
  paymentMethod: text("payment_method").default("Paystack"),
  paymentStatus: text("payment_status").default("pending"), // 'pending', 'paid', 'failed'
  paystackReference: text("paystack_reference"),
  paystackAccessCode: text("paystack_access_code"),
  trackingCarrier: text("tracking_carrier").default("GIG Logistics"),
  trackingNumber: text("tracking_number"),
  trackingUrl: text("tracking_url"),
  trackingStatus: text("tracking_status").default("Order Confirmed"),
  estimatedDelivery: text("estimated_delivery"),
  notes: text("notes"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("orders_customer_email_idx").on(table.customerEmail),
  index("orders_status_idx").on(table.status),
  index("orders_created_at_idx").on(table.createdAt),
]);

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
  productId: text("product_id").notNull(),
  productName: text("product_name").notNull(),
  size: text("size").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  totalPrice: integer("total_price").notNull(),
}, (table) => [
  index("order_items_order_idx").on(table.orderId),
]);

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
  reference: text("reference").notNull().unique(),
  provider: text("provider").notNull().default("Paystack"),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("NGN"),
  status: text("status").notNull().default("pending"), // 'pending', 'success', 'failed'
  channel: text("channel"), // 'card', 'bank', 'apple_pay', 'google_pay', 'ussd'
  cardType: text("card_type"), // 'visa', 'mastercard', 'verve'
  paidAt: timestamp("paid_at"),
  rawResponse: jsonb("raw_response"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("payments_order_idx").on(table.orderId),
  index("payments_reference_idx").on(table.reference),
]);

export const shipping = pgTable("shipping", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
  carrier: text("carrier").notNull().default("GIG Logistics"),
  trackingNumber: text("tracking_number"),
  trackingUrl: text("tracking_url"),
  status: text("status").notNull().default("preparing"), // 'preparing', 'in_transit', 'out_for_delivery', 'delivered', 'delayed'
  shippingFee: integer("shipping_fee").notNull().default(0),
  estimatedDelivery: text("estimated_delivery"),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("shipping_order_idx").on(table.orderId),
]);

export const chatConversations = pgTable("chat_conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  status: text("status").notNull().default("open"), // 'open', 'pending', 'resolved'
  lastMessage: text("last_message"),
  unreadCount: integer("unread_count").default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("chat_conversations_status_idx").on(table.status),
  index("chat_conversations_email_idx").on(table.customerEmail),
]);

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id").references(() => chatConversations.id, { onDelete: "cascade" }).notNull(),
  senderName: text("sender_name").notNull(),
  senderEmail: text("sender_email").notNull(),
  senderRole: text("sender_role").notNull().default("customer"), // 'customer', 'admin'
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("chat_messages_conv_idx").on(table.conversationId),
]);

export const emailOtps = pgTable("email_otps", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const storeSettings = pgTable("store_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
