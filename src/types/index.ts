export interface Product {
  id: string;
  name: string;
  department: "Women" | "Men" | "Unisex";
  category: string;
  categoryId?: string | null;
  price: number; // in minor units or whole NGN
  salePrice?: number | null;
  sku?: string | null;
  stockQuantity?: number;
  sheet?: string; // image file in /images/
  quadrant?: 0 | 1 | 2 | 3;
  image?: string | null; // direct image url
  images?: string[];
  colors: string[];
  sizes: string[];
  description: string;
  inStock?: boolean;
  featured?: boolean;
  newArrival?: boolean;
  status?: "active" | "draft" | "archived";
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  department: string;
  description?: string | null;
  image?: string | null;
  createdAt?: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  altText?: string | null;
  isPrimary: boolean;
  displayOrder: number;
  createdAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role?: "customer" | "admin";
  createdAt?: string;
}

export interface CustomerAddress {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string | null;
  isDefault: boolean;
  createdAt?: string;
}

export interface CartItem {
  id?: string;
  productId: string;
  size: string;
  quantity: number;
  product?: Product;
}

export interface WishlistItem {
  id?: string;
  productId: string;
  product?: Product;
}

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
}

export interface OrderItem {
  id?: string;
  productId: string;
  productName: string;
  size: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product?: Product;
}

export type OrderStatus =
  | "pending"
  | "payment_confirmed"
  | "paid"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string | null;
  customerEmail: string;
  customerName: string;
  customerPhone?: string | null;
  status: OrderStatus;
  subtotal: number;
  shippingFee: number;
  taxFee: number;
  totalAmount: number;
  currency: string;
  shippingAddress: ShippingAddress;
  paymentMethod?: string | null;
  paymentStatus?: "pending" | "paid" | "failed" | null;
  paystackReference?: string;
  paystackAccessCode?: string;
  trackingCarrier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  trackingStatus?: string | null;
  estimatedDelivery?: string | null;
  notes?: string | null;
  paidAt?: string | null;
  createdAt: string;
  items: OrderItem[];
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  reference: string;
  provider: string;
  amount: number;
  currency: string;
  status: "pending" | "success" | "failed";
  channel?: string | null;
  cardType?: string | null;
  paidAt?: string | null;
  createdAt: string;
}

export interface ShippingRecord {
  id: string;
  orderId: string;
  carrier: string;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  status: "preparing" | "in_transit" | "out_for_delivery" | "delivered" | "delayed";
  shippingFee: number;
  estimatedDelivery?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
  order?: Order;
}

export interface ChatConversation {
  id: string;
  userId?: string | null;
  customerName: string;
  customerEmail: string;
  status: "open" | "pending" | "resolved";
  lastMessage?: string | null;
  unreadCount?: number;
  updatedAt: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderName: string;
  senderEmail: string;
  senderRole: "customer" | "admin";
  message: string;
  isRead?: boolean;
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
